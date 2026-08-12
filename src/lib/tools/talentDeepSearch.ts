import { TalentAuditService } from '@/lib/mcp/talent';
import { searchWeb } from '@/lib/search';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from "openai";
import pinyin from 'pinyin';

const talentService = new TalentAuditService();

function getOpenAIClient() {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('DASHSCOPE_API_KEY 未配置');
  return new OpenAI({
    apiKey,
    baseURL: process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  });
}


// --- ORCID Functions Copied from verify/route.ts ---
let _orcidTokenCache: { token: string; expiresAt: number } | null = null;

async function getOrcidToken(): Promise<string | null> {
  // 检查缓存（Token 有效期 ~20 年，基本永不过期）
  if (_orcidTokenCache && Date.now() < _orcidTokenCache.expiresAt) {
    return _orcidTokenCache.token;
  }

  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://orcid.org/oauth/token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials&scope=/read-public`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    _orcidTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 600000) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * ORCID 三步降级搜索：精准 → 去机构 → 全文
 * 每步正序 + 反序都搜一遍，取合集去重
 */
async function orcidSearch(
  token: string,
  givenNames: string,
  familyName: string,
  institution?: string
): Promise<Array<{ path: string }>> {
  const BASE = 'https://pub.orcid.org/v3.0/search/';
  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

  const doSearch = async (q: string): Promise<Array<{ path: string }>> => {
    try {
      const res = await fetch(`${BASE}?q=${encodeURIComponent(q)}&rows=5`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.result || []).map((r: any) => ({ path: r['orcid-identifier']?.path })).filter((r: any) => r.path);
    } catch { return []; }
  };

  const dedupe = (arr: Array<{ path: string }>): Array<{ path: string }> => {
    const seen = new Set<string>();
    return arr.filter(r => { if (seen.has(r.path)) return false; seen.add(r.path); return true; });
  };

  // Step 1: 精准搜（正序 + 反序 + 机构）
  if (institution) {
    const q1 = `given-names:${givenNames} AND family-name:${familyName} AND affiliation-org-name:${institution}`;
    const q2 = `given-names:${familyName} AND family-name:${givenNames} AND affiliation-org-name:${institution}`;
    const [r1, r2] = await Promise.all([doSearch(q1), doSearch(q2)]);
    const results = dedupe([...r1, ...r2]);
    if (results.length > 0) return results;
  }

  // Step 2: 去掉机构（正序 + 反序）
  const q3 = `given-names:${givenNames} AND family-name:${familyName}`;
  const q4 = `given-names:${familyName} AND family-name:${givenNames}`;
  const [r3, r4] = await Promise.all([doSearch(q3), doSearch(q4)]);
  const step2 = dedupe([...r3, ...r4]);
  if (step2.length > 0 && step2.length <= 20) return step2.slice(0, 5);

  // Step 3: 全文搜索（杀手锏）
  const fullName = `${givenNames} ${familyName}`;
  const q5 = institution
    ? `text:"${fullName}" AND text:${institution}`
    : `text:"${fullName}"`;
  const r5 = await doSearch(q5);
  if (r5.length > 0) return r5;

  // Step 2 结果太多但 Step 3 没结果，返回 Step 2 前 5 个
  return step2.slice(0, 5);
}

/**
 * 从 ORCID 拉取学者的 employments，用于消歧
 */
async function orcidGetEmployments(token: string, orcidId: string): Promise<Array<{ org: string; role: string; dept: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/employments`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data['affiliation-group'] || []).map((g: any) => {
      const s = g.summaries?.[0]?.['employment-summary'] || {};
      return {
        org: s.organization?.name || '',
        role: s['role-title'] || '',
        dept: s['department-name'] || '',
      };
    });
  } catch { return []; }
}

/**
 * 从 ORCID 拉取教育经历
 */
async function orcidGetEducations(token: string, orcidId: string): Promise<Array<{ org: string; role: string; dept: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/educations`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data['affiliation-group'] || []).map((g: any) => {
      const s = g.summaries?.[0]?.['education-summary'] || {};
      return {
        org: s.organization?.name || '',
        role: s['role-title'] || '',
        dept: s['department-name'] || '',
      };
    });
  } catch { return []; }
}

/**
 * 从 ORCID 拉取论文（前 N 篇）
 */
async function orcidGetWorks(token: string, orcidId: string, limit = 10): Promise<Array<{ title: string; type: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.group || []).slice(0, limit).map((g: any) => {
      const s = g['work-summary']?.[0] || {};
      return {
        title: s.title?.title?.value || 'N/A',
        type: s.type || '',
      };
    });
  } catch { return []; }
}

// ------------------------------------------------

export async function runTalentDeepSearchStream(query: string, institution: string, en_name?: string, cn_name?: string) {
    if (!query) {
      throw new Error('Missing query');
    }

    let cleanQuery = query.trim().replace(/(教授|博士|研究员|院士|先生|女士|同学|老师)$/g, '').trim();
    let searchName = cn_name || en_name || cleanQuery;

    return new ReadableStream({
      async start(controller) {
        const sendEvent = (type: string, data: any) => {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type, data })}\n\n`));
        };

        try {
          const allGatheredData: Record<string, any> = {};

          // Stage 1: Pingfang
          sendEvent('log', { step: 'pingfang', message: `🔍 [第一阶段] 正在检索平方数据底座: ${searchName}...` });
          let pingfangCandidates: any[] = [];
          try {
            pingfangCandidates = await talentService.searchTalents(searchName, 5);
            if (pingfangCandidates.length > 1 && institution) {
              const filtered = pingfangCandidates.filter(t => 
                (t.workplace_current && (t.workplace_current as string).includes(institution)) || 
                (t.school_current && (t.school_current as string).includes(institution))
              );
              if (filtered.length > 0) pingfangCandidates = filtered;
            }
          } catch (e) {
             sendEvent('log', { step: 'pingfang', message: `⚠️ 平方检索失败: ${e}` });
          }

          let topPingfangRecord: any = null;
          if (pingfangCandidates.length > 1) {
            sendEvent('log', { step: 'pingfang', message: `⚠️ 发现 ${pingfangCandidates.length} 位同名学者，需要消歧。提取第一位作为示例。` });
            topPingfangRecord = pingfangCandidates[0];
          } else if (pingfangCandidates.length === 1) {
            sendEvent('log', { step: 'pingfang', message: `✅ 在平方库找到唯一匹配记录！` });
            topPingfangRecord = pingfangCandidates[0];
          } else {
            sendEvent('log', { step: 'pingfang', message: `❌ 未找到匹配结果。` });
          }

          if (topPingfangRecord) {
            allGatheredData['pingfang'] = topPingfangRecord;
          }

          // Stage 2: Scholar
          const scholarQuery = topPingfangRecord?.name_en || en_name || searchName;
          sendEvent('log', { step: 'scholar', message: `🔍 [第二阶段] 正在检索权威学术主页 (Google Scholar/OpenAlex): ${scholarQuery}...` });
          try {
            const scholarRes = await fetch(`https://api.openalex.org/authors?search=${encodeURIComponent(scholarQuery)}`);
            if (scholarRes.ok) {
              const scholarData = await scholarRes.json();
              if (scholarData.results && scholarData.results.length > 0) {
                 const author = scholarData.results[0];
                 sendEvent('log', { step: 'scholar', message: `✅ 成功定位学术档案 (H-index: ${author.summary_stats?.h_index || '未知'})` });
                 allGatheredData['scholar'] = author;
              } else {
                 sendEvent('log', { step: 'scholar', message: `❌ 未找到匹配结果。` });
              }
            }
          } catch (e) {
            sendEvent('log', { step: 'scholar', message: `⚠️ 学术检索失败: ${e}` });
          }

          // Stage 2.5: ORCID
          let orcidQuery = topPingfangRecord?.name_en || allGatheredData['scholar']?.display_name || en_name || searchName;
          let isEnglish = /^[a-zA-Z\s\-]+$/.test(orcidQuery);
          
          if (!isEnglish && /^[a-zA-Z\s\-]+$/.test(searchName)) {
            orcidQuery = searchName;
            isEnglish = true;
          }

          if (!isEnglish) {
             // Convert Chinese to Pinyin using pinyin library
             const pyArray = pinyin(orcidQuery, { style: 'normal' });
             if (pyArray && pyArray.length > 0) {
               // Assuming format like "Shi Yigong" or "Yigong Shi". We'll just construct a generic English name
               // Last character(s) are usually the given name, first is family name in Chinese, but pinyin returns in order.
               // Let's just join them as the query.
               const flatPinyin = pyArray.map((p: any) => p[0]);
               const family = flatPinyin[0];
               const given = flatPinyin.slice(1).join('');
               orcidQuery = given ? `${given} ${family}` : family;
               sendEvent('log', { step: 'orcid', message: `⚠️ [第二阶段.5] 未提供英文名，自动转换为拼音进行检索: ${orcidQuery}` });
             } else {
               sendEvent('log', { step: 'orcid', message: `⚠️ [第二阶段.5] 无法将名字转换为拼音，尝试直接检索: ${orcidQuery}` });
             }
          }
          
          sendEvent('log', { step: 'orcid', message: `🔍 [第二阶段.5] 正在检索 ORCID 国际学者库: ${orcidQuery}...` });
          try {
            let englishName = orcidQuery.replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').trim();
            englishName = englishName.replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim();
            const nameParts = englishName.split(/\s+/);
            const givenNames = nameParts.slice(0, -1).join(' ') || nameParts[0];
            const familyName = nameParts[nameParts.length - 1];
            
            let fallbackInst = institution || topPingfangRecord?.workplace_current || topPingfangRecord?.school_current || '';
            if (!fallbackInst && allGatheredData['scholar']?.last_known_institutions?.[0]?.display_name) {
              fallbackInst = allGatheredData['scholar'].last_known_institutions[0].display_name;
            }
            const instKeyword = fallbackInst ? (fallbackInst.split(/\s+/).find((w: string) => w.length > 3 && /^[A-Z]/.test(w)) || fallbackInst.split(' ')[0] || '') : '';

            const orcidToken = await getOrcidToken();
            if (orcidToken) {
              const candidates = await orcidSearch(orcidToken, givenNames, familyName, instKeyword || undefined);
              if (candidates.length > 0) {
                let bestOrcidId = candidates[0].path;
                let bestEmployments: any[] = [];
                
                if (candidates.length > 1 && instKeyword) {
                  const empResults = await Promise.all(
                    candidates.slice(0, 3).map(async (c: any) => ({
                      path: c.path,
                      employments: await orcidGetEmployments(orcidToken, c.path),
                    }))
                  );
                  const instLower = instKeyword.toLowerCase();
                  for (const r of empResults) {
                    if (r.employments.some((e: any) => e.org.toLowerCase().includes(instLower))) {
                      bestOrcidId = r.path;
                      bestEmployments = r.employments;
                      break;
                    }
                  }
                  if (bestEmployments.length === 0) bestEmployments = await orcidGetEmployments(orcidToken, bestOrcidId);
                } else {
                  bestEmployments = await orcidGetEmployments(orcidToken, bestOrcidId);
                }
                
                sendEvent('log', { step: 'orcid', message: `✅ 成功定位 ORCID 档案: ${bestOrcidId}` });
                const [educations, works] = await Promise.all([
                  orcidGetEducations(orcidToken, bestOrcidId),
                  orcidGetWorks(orcidToken, bestOrcidId, 10)
                ]);
                
                allGatheredData['orcid'] = {
                  orcid_id: bestOrcidId,
                  employments: bestEmployments,
                  educations,
                  works,
                  url: `https://orcid.org/${bestOrcidId}`
                };
              } else {
                sendEvent('log', { step: 'orcid', message: `❌ 未找到匹配的 ORCID 记录。` });
              }
            } else {
              sendEvent('log', { step: 'orcid', message: `⚠️ 未配置 ORCID API 密钥。` });
            }
          } catch (e) {
            sendEvent('log', { step: 'orcid', message: `⚠️ ORCID 检索失败: ${e}` });
          }


          // Stage 3: Wikipedia
          let osintQuery = topPingfangRecord?.name_en || en_name || searchName;
          sendEvent('log', { step: 'wikipedia', message: `🔍 [第三阶段] 正在检索维基百科 (Wikipedia): ${osintQuery}...` });
          let foundWiki = false;
          try {
            const wikiQueryUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(osintQuery)}&srlimit=1&utf8=&format=json&origin=*`;
            const wikiRes = await fetch(wikiQueryUrl);
            if (wikiRes.ok) {
              const wikiData = await wikiRes.json();
              if (wikiData.query?.search?.length > 0) {
                const topWiki = wikiData.query.search[0];
                const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&pageids=${topWiki.pageid}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;
                const contentRes = await fetch(contentUrl);
                if (contentRes.ok) {
                  const contentData = await contentRes.json();
                  const pageObj = contentData.query?.pages?.[topWiki.pageid];
                  if (pageObj && pageObj.extract) {
                    sendEvent('log', { step: 'wikipedia', message: `✅ 成功提取维基百科词条。` });
                    allGatheredData['wikipedia'] = {
                      biography: pageObj.extract.substring(0, 1500),
                      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(topWiki.title.replace(/ /g, '_'))}`
                    };
                    foundWiki = true;
                  }
                }
              }
            }
          } catch (e) {
            sendEvent('log', { step: 'wikipedia', message: `⚠️ Wiki检索失败: ${e}` });
          }

          if (!foundWiki) {
            sendEvent('log', { step: 'wikipedia', message: `⚠️ Wikipedia 未找到，降级检索百度百科...` });
            try {
              const bkQuery = cn_name || searchName;
              const bkUrl = `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key=${encodeURIComponent(bkQuery)}&bk_length=1500`;
              const bkRes = await fetch(bkUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
              const bkData = await bkRes.json();
              if (bkData && bkData.id && bkData.abstract) {
                sendEvent('log', { step: 'wikipedia', message: `✅ 成功提取百度百科词条。` });
                allGatheredData['baike'] = {
                  biography: bkData.abstract.replace(/<[^>]+>/g, '').substring(0, 1500),
                  url: bkData.url || `https://baike.baidu.com/item/${encodeURIComponent(bkQuery)}`
                };
              } else {
                 sendEvent('log', { step: 'wikipedia', message: `❌ 百度百科亦未找到匹配词条。` });
              }
            } catch (e) {
               sendEvent('log', { step: 'wikipedia', message: `⚠️ 百度百科检索失败: ${e}` });
            }
          }

          // Stage 4: Internet
          sendEvent('log', { step: 'internet', message: `🔍 [第四阶段] 正在执行全网深度检索 (Search Internet)...` });
          const queryCN = cn_name || searchName;
          const queryEN = en_name || topPingfangRecord?.name_en || '';
          try {
            const searchQueries = [queryCN, queryEN].filter(Boolean);
            let internetFound = false;

            const geminiKey = process.env.GEMINI_API_KEY;
            if (geminiKey) {
              sendEvent('log', { step: 'internet', message: `🚀 启动 Gemini Search Grounding (Google 搜索直连)...` });
              const genAI = new GoogleGenerativeAI(geminiKey);
              const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', tools: [{ googleSearch: {} }] as any });
              const query = `Please use Google Search to find detailed biography and academic achievements for "${searchQueries.join(' OR ')}" ${institution ? 'at ' + institution : ''}. Provide a detailed summary in Chinese.`;
              
              const result = await model.generateContent(query);
              const text = result.response.text();
              if (text && text.length > 50) {
                 sendEvent('log', { step: 'internet', message: `✅ Gemini 全网检索成功。` });
                 allGatheredData['internet'] = text;
                 internetFound = true;
              }
            }
            
            if (!internetFound) {
              sendEvent('log', { step: 'internet', message: `⚠️ ${geminiKey ? 'Gemini 结果不足' : '未配置 Gemini'}，降级使用 阿里云/Bocha 综合检索...` });
              const query1 = queryEN ? `${queryCN} OR ${queryEN}` : queryCN;
              const webRes = await searchWeb(`${query1} ${institution || ''}`.trim());
              if (webRes && webRes.AbstractText && webRes.AbstractText.length > 20) {
                 sendEvent('log', { step: 'internet', message: `✅ 综合全网检索获得数据补充。` });
                 allGatheredData['internet'] = webRes.AbstractText;
              } else {
                 sendEvent('log', { step: 'internet', message: `❌ 全网检索无有效信息。` });
                 allGatheredData['internet'] = '无额外有效信息';
              }
            }
          } catch (e) {
            sendEvent('log', { step: 'internet', message: `⚠️ 全网检索失败: ${e}` });
            sendEvent('log', { step: 'internet', message: `⚠️ Gemini 检索异常，降级使用 阿里云/Bocha 综合检索...` });
            try {
              const query1 = queryEN ? `${queryCN} OR ${queryEN}` : queryCN;
              const webRes = await searchWeb(`${query1} ${institution || ''}`.trim());
              if (webRes && webRes.AbstractText && webRes.AbstractText.length > 20) {
                 sendEvent('log', { step: 'internet', message: `✅ 综合全网检索获得数据补充。` });
                 allGatheredData['internet'] = webRes.AbstractText;
              } else {
                 sendEvent('log', { step: 'internet', message: `❌ 全网检索无有效信息。` });
                 allGatheredData['internet'] = '无额外有效信息';
              }
            } catch (fallbackError) {
               sendEvent('log', { step: 'internet', message: `⚠️ Bocha 降级检索也失败: ${fallbackError}` });
               allGatheredData['internet'] = '检索异常';
            }
          }

          // ── Stage 4.5: 人名纠错回退 ──────────────────────────────────────
          // 当平方和 Scholar 都未找到记录时，极有可能是用户打错了名字（真正存在的学者通常至少在这两个库之一）。
          // 此时暂缓采信 Wiki 或 Internet 返回的杂讯或“未找到”提示，先复用 searchWeb + DashScope 尝试人名纠错。
          const hasHighConfidenceData = !!(allGatheredData['pingfang'] || allGatheredData['scholar']);

          if (!hasHighConfidenceData) {
            sendEvent('log', { step: 'name_correction', message: `🔎 [纠错阶段] 核心学术库未找到"${searchName}"的记录，正在尝试人名纠错...` });
            try {
              // 1. 用 searchWeb（阿里云 qwen-plus + enable_search）搜一次纠错
              const correctionQuery = `"${searchName}" ${institution || ''} 教授 学者 "你是不是要找"`.trim();
              const correctionRes = await searchWeb(correctionQuery);
              const correctionText = correctionRes?.AbstractText || '';

              // 2. 用已有的 DashScope AI 从搜索结果中提取可能的正确人名
              if (correctionText.length > 20) {
                const correctionClient = getOpenAIClient();
                const correctionAIRes = await correctionClient.chat.completions.create({
                  model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
                  messages: [{
                    role: 'user',
                    content: `用户搜索了学者"${searchName}"${institution ? `（${institution}相关）` : ''}，但在平方数据库、Google Scholar、Wikipedia、百度百科和全网搜索中均未找到此人。

以下是全网搜索返回的参考信息：
${correctionText.substring(0, 2000)}

请判断：是否存在一位姓名与"${searchName}"非常相似（同音不同字、少一个字、错别字等）且确实存在的知名学者/教授？

回答规则：
- 如果找到了姓名相似且其他要素（研究领域、所属机构等）也吻合的学者，请只返回纠正后的正确姓名（纯文本，不加任何多余解释）
- 如果没有找到、或找到的人其他要素完全不同（比如不是同一领域、不是同一类型的人），请只返回空字符串
- 绝对不要为了给出答案而胡乱推荐名字仅仅相似但完全不相关的人`
                  }],
                  max_tokens: 50,
                });

                const correctedName = (correctionAIRes.choices[0]?.message?.content || '').trim();
                
                // 3. 如果 AI 给出了纠正后的人名，且确实和原名不同，用纠正后的人名重跑四阶段
                if (correctedName && correctedName.length >= 2 && correctedName.length <= 20 && correctedName !== searchName) {
                  sendEvent('log', { step: 'name_correction', message: `✅ 系统推测您可能要找的是「${correctedName}」，正在重新检索...` });
                  
                  // 标记纠错信息，供 AI Assemble 在报告开头提示用户
                  allGatheredData['_name_correction'] = {
                    original: searchName,
                    corrected: correctedName,
                  };
                  
                  // 用纠正后的名字重新执行 Stage 1-4（精简版，不重复发所有日志）
                  const correctedClean = correctedName.trim().replace(/(教授|博士|研究员|院士|先生|女士|同学|老师)$/g, '').trim();
                  
                  // Stage 1 再查平方
                  try {
                    let corrPingfang = await talentService.searchTalents(correctedClean, 5);
                    if (corrPingfang.length > 1 && institution) {
                      const filtered = corrPingfang.filter(t =>
                        (t.workplace_current && (t.workplace_current as string).includes(institution)) ||
                        (t.school_current && (t.school_current as string).includes(institution))
                      );
                      if (filtered.length > 0) corrPingfang = filtered;
                    }
                    if (corrPingfang.length > 0) {
                      allGatheredData['pingfang'] = corrPingfang[0];
                      sendEvent('log', { step: 'name_correction', message: `✅ 在平方库找到「${correctedName}」的记录！` });
                    }
                  } catch { /* skip */ }

                  // Stage 2 再查 Scholar
                  try {
                    const corrScholarQuery = allGatheredData['pingfang']?.name_en || correctedClean;
                    const corrScholarRes = await fetch(`https://api.openalex.org/authors?search=${encodeURIComponent(corrScholarQuery)}`);
                    if (corrScholarRes.ok) {
                      const corrScholarData = await corrScholarRes.json();
                      if (corrScholarData.results?.length > 0) {
                        allGatheredData['scholar'] = corrScholarData.results[0];
                        sendEvent('log', { step: 'name_correction', message: `✅ 成功定位「${correctedName}」的学术档案！` });
                      }
                    }
                  } catch { /* skip */ }

                  // Stage 3 再查百科
                  try {
                    const corrBkUrl = `https://baike.baidu.com/api/openapi/BaikeLemmaCardApi?scope=103&format=json&appid=379020&bk_key=${encodeURIComponent(correctedClean)}&bk_length=1500`;
                    const corrBkRes = await fetch(corrBkUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
                    const corrBkData = await corrBkRes.json();
                    if (corrBkData?.id && corrBkData.abstract) {
                      allGatheredData['baike'] = {
                        biography: corrBkData.abstract.replace(/<[^>]+>/g, '').substring(0, 1500),
                        url: corrBkData.url || `https://baike.baidu.com/item/${encodeURIComponent(correctedClean)}`
                      };
                      sendEvent('log', { step: 'name_correction', message: `✅ 成功提取「${correctedName}」的百度百科词条！` });
                    }
                  } catch { /* skip */ }

                  // Stage 4 再联网
                  try {
                    const corrWebRes = await searchWeb(`${correctedClean} ${institution || ''} 教授 学者 简历`.trim());
                    if (corrWebRes?.AbstractText && corrWebRes.AbstractText.length > 50) {
                      allGatheredData['internet'] = corrWebRes.AbstractText;
                      sendEvent('log', { step: 'name_correction', message: `✅ 全网检索到「${correctedName}」的补充信息！` });
                    }
                  } catch { /* skip */ }

                  // 更新 searchName 以便 AI Assemble 使用纠正后的名字
                  searchName = correctedClean;
                } else {
                  sendEvent('log', { step: 'name_correction', message: `❌ 未找到可信的近似学者，保持原始结果。` });
                }
              } else {
                sendEvent('log', { step: 'name_correction', message: `❌ 联网纠错也无有效信息。` });
              }
            } catch (corrErr) {
              sendEvent('log', { step: 'name_correction', message: `⚠️ 纠错阶段异常: ${corrErr}` });
            }
          }

          // Stage +1: AI Assemble
          sendEvent('log', { step: 'ai_assemble', message: `🧠 [最终整合] 数据收集完毕，开始交由大模型组装合并报告...` });

          const client = getOpenAIClient();
          const sourcesFound = Object.keys(allGatheredData).filter(k => !k.startsWith('_')).join('、') || '暂无结构化数据';
          const nameCorrectionNote = allGatheredData['_name_correction']
            ? `\n\n【⚠️ 人名纠错提示】用户原始搜索的是"${allGatheredData['_name_correction'].original}"，但未找到此人。系统根据多渠道数据推测用户可能要找的是"${allGatheredData['_name_correction'].corrected}"。请在报告最开头用一句话自然地提示用户（例如："您搜索的'${allGatheredData['_name_correction'].original}'未找到精确匹配，根据检索结果，为您匹配到相似学者**${allGatheredData['_name_correction'].corrected}**，以下是相关信息："），然后正常输出报告。`
            : '';
          const assemblePrompt = `
你是一个专门整理学者和高端人才简历信息的智能报告引擎。
我已经通过多种独立的检索渠道拿到了关于学者 "${searchName}" 的碎片化数据（实际获取到数据的渠道：${sourcesFound}）。
请你不要去浓缩、删减这些信息，而是把它们**有条理地合并与组装**成一份 Markdown 报告，供用户直接阅读。
${nameCorrectionNote}

【整合规则】
1. **冲突处理**：如果不同来源的数据有冲突（如就职机构），请以「平方学者库」或「权威API (Scholar/Wiki)」为准。如果某一项内容为空，则谁有信息就用谁的。
2. **标明来源**：对于你在报告中呈现的每一块核心信息（如每段教育经历、荣誉、H-index等），都必须在括号里加上真实的数据来源标注，类似 footnote，例如：(来源：pingfang) 或 (来源：scholar)。🚨 如果原始JSON中没有 pingfang 数据，你**绝对禁止**伪造或标注“平方数据”或“平方学者库”的来源角标！
3. **结构化呈现**：请包括以下部分：
   - 核心档案（姓名、现任职位、学术指标等）
   - 百科简介（如果有）
   - 教育经历
   - 工作经历
   - 重点学术成果（论文、专利等）
   - 荣誉与基金

【以下是各渠道返回的原始数据JSON】：
${JSON.stringify(allGatheredData, null, 2)}

🚨 特别注意：你只需输出纯 Markdown 文本，**绝对禁止**将内容包裹在 <zj_report> 或任何其他 XML 标签中。不需要写标题，直接从正文开始。
`;

          const aiStream = await client.chat.completions.create({
            model: process.env.DEEPSEEK_MODEL || 'deepseek-v3.2-exp',
            messages: [{ role: 'user', content: assemblePrompt }],
            stream: true,
          });

          for await (const chunk of aiStream) {
            const text = chunk.choices[0]?.delta?.content || "";
            if (text) {
              sendEvent('ai_chunk', text);
            }
          }

          // 将四阶段原始数据传给 route.ts，供人才日志 (Talent Journal) 保存
          sendEvent('raw_data', { gatheredData: allGatheredData, talentName: searchName, institution: institution || '' });

          sendEvent('done', { message: '报告生成完毕' });
          controller.close();
        } catch (e) {
          sendEvent('error', { message: String(e) });
          controller.close();
        }
      }
    });
}
