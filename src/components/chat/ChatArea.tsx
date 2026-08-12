'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Tooltip, message as antMsg } from 'antd';
import { SendOutlined, AudioOutlined, AudioMutedOutlined, ArrowLeftOutlined, ShareAltOutlined, LinkOutlined } from '@ant-design/icons';
import { useSearchParams, useRouter } from 'next/navigation';
import { Upload, FileText, ShieldCheck, Zap, UserSquare2, Keyboard, Search, Library, MessageSquare, Edit3, BarChart2, Globe, Sparkles, User, PenTool, Database, Activity, Calendar } from 'lucide-react';
import { ReportRecord } from '@/lib/mcp/crm';
import { Character, Message, AIStatus } from '@/lib/ai/types';
import { useChat } from '@/hooks/useChat';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useAuth } from '@/hooks/useAuth';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { getConversation, createConversation, updateConversation } from '@/lib/conversations';
import dynamic from 'next/dynamic';
import { goBackSafe } from '@/lib/navigation';
import { CAT_ASSESSMENT_TYPES, parseDashTags, parseModuleTags, reportToMarkdown } from '@/lib/assessment/config';
import type { AssessmentIntroResponse } from '@/lib/assessment/types';
import AssessmentIntroCard from '@/components/chat/AssessmentIntroCard';
import AssessmentReportCard from '@/components/chat/AssessmentReportCard';
import LeadFormModal, { LeadFormData } from '@/components/chat/LeadFormModal';
import RecommendCard from '@/components/chat/RecommendCard';
import s from './ChatArea.module.css';
const MobileCharProfile = dynamic(() => import('@/components/character/MobileCharProfile'), { ssr: false });
const ShareModal = dynamic(() => import('@/components/share/ShareModal'), { ssr: false });

const AssessmentPicker = dynamic(() => import('@/components/chat/AssessmentPicker'), { ssr: false });
import { TalentModal } from './TalentModal';
import { InstituteModal } from './InstituteModal';
import { CaseModal } from './CaseModal';
import { ProjectModal } from './ProjectModal';
import { TalentCardFetcher } from './TalentCardFetcher';
import { TalentListFetcher } from './TalentListFetcher';
import { InstituteBubbleFetcher } from './InstituteBubbleFetcher';
import { EntityBubbleFetcher } from './EntityBubbleFetcher';
import { CaseBubbleFetcher } from './CaseBubbleFetcher';
import { ProjectBubbleFetcher } from './ProjectBubbleFetcher';
import { CompanyModal } from './CompanyModal';
import { CompanyBubbleFetcher } from './CompanyBubbleFetcher';
import { AuditReport } from '@/components/talent-audit/AuditReport';
import './YidaChat.css';

const PRIMARY = '#427759';
const ZHIJI_HOST = process.env.NEXT_PUBLIC_ZHIJI_HOST || '';
const MODELS = [
  { id: 'deepseek',                   label: 'DeepSeek V3', color: '#1677ff', bg: '#e6f4ff' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5',  color: '#8b5cf6', bg: '#f3e8ff' },
  { id: 'gemini-2.0-flash',           label: 'Gemini 2.0',  color: '#16a34a', bg: '#f0fdf4' },
];

const MOCK_CATEGORIES = [
  { id: 'talents', name: '查人才',   icon: <User size={16} />, colorClass: 'cat-talents', role: '全球人才与智库检索引擎',          greeting: '你好！我是您的人才发现引擎，可以为您挖掘全球顶尖学者、产业领军人物并进行多维竞争力评估。', tags: ['人才挖掘', '背景背调', '团队评估'], quickPrompts: ['帮我查找人工智能领域的顶尖科学家', '帮我评估这位候选人在新能源领域的产研转化潜力', '推荐几位国内数字经济方向的青年骨干学者'] },
  { id: 'audit',   name: '人才检测', icon: <ShieldCheck size={16} />, colorClass: 'cat-audit',   role: '智查查-人才验真引擎',       greeting: '您好！我是智查查-人才验真引擎。请上传候选人的简历（PDF/Word），或在对话内直接发送候选人履历内容。我将为您完成多层级人才被调与成果核验等。',    tags: ['简历核实', '背景背调', '能力审计'], action: 'upload' },
  { id: 'analysis', name: '产学研分析', icon: <Activity size={16} />, colorClass: 'cat-analysis', role: '', greeting: '', tags: [], quickPrompts: [] },
  { id: 'policy',  name: '查政策',   icon: <Globe size={16} />, colorClass: 'cat-policy',  role: '宏观政策分析与解读中枢',           greeting: '您好！我实时追踪国家部委与各省市最新政策文件，为您深度剖析产业红利与战略导向。',                   tags: ['政策追踪', '文件解读', '战略规划'], quickPrompts: ['国家最新关于低空经济产业扶持的政策核心要点是什么？', '对比分析长三角各市针对高层次人才引进的补贴与落户政策差异', '发改委最新的"人工智能+"行动计划对实体经济有哪些影响？'] },
  { id: 'data',    name: '找数据',   icon: <Database size={16} />, colorClass: 'cat-data',    role: '宏观经济与产业数据情报中心',       greeting: '您好！我掌握海量宏观经济、产业及机构发展关键数据，能为您进行跨区域、跨领域的数据追踪与精准对比。', tags: ['数据图谱', '横向对比', '趋势追踪'], quickPrompts: ['调取本市近三年人工智能产业重点企业的营收增长及人才流入趋势', '对比本地三所重点高校与两家科研院所在算力领域的专利转化率', '全国各省市年度科技研发(R&D)经费投入突破百亿的有哪些？'] },
  { id: 'write',   name: '写材料',   icon: <PenTool size={16} />, colorClass: 'cat-write',   role: '政务主笔与专业公文撰写助理',       greeting: '您好！我可以根据核心要点，极速为您生成高质量的总结报告、政务公文和发言稿大纲。',                   tags: ['公文生成', '政务调研', '大纲撰写'], quickPrompts: ['起草一份关于促进全市战略性新兴产业发展的调研报告提纲', '撰写一份面向海外高层次人才引进洽谈会的市长推介发言稿', '拟定一份关于加强全市算力基础设施建设的指导意见草案'] },
  { id: 'resources', name: '找资源', icon: <Library size={16} />, colorClass: 'cat-resources', role: '全域资源对接与供应商智能匹配中心', greeting: '您好！我是您的专属资源对接助手。请告诉我您的组织类型以及具体的使用场景，我将为您寻找最匹配的试剂耗材、软硬件厂商或智库服务。', tags: ['资源匹配', '供应商优选', '服务对接'], quickPrompts: ['我需要科研仪器试剂资源', '我需要软件供应商', '我需要硬件商', '我需要培训服务', '我想查供应商信息'] },
  { id: 'conference_invite', name: '会议邀约', icon: <Calendar size={16} />, colorClass: 'cat-write', role: '会议专家邀约与策划助理', greeting: '您好！欢迎使用一答会议专家邀约助手 🎯 我已开启「会议专家邀约」模式，请告诉我您想筹办的会议主题或方向是什么？', tags: ['专家邀约', '会议策划', '匹配推荐'], quickPrompts: ['筹办人工智能与高等教育高质量发展论坛', '策划一场关于新能源材料的学术研讨会'] },
];

// Safari audio/mp4 (AAC) sometimes causes DecodeFailed in DashScope.
// We decode the blob natively using Web Audio API and encode it to PCM WAV.
const convertBlobToWav = async (blob: Blob): Promise<Blob> => {
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const result = new Float32Array(audioBuffer.length * numChannels);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < audioBuffer.length; i++) {
      result[i * numChannels + channel] = channelData[i];
    }
  }
  
  const dataLength = result.length * (bitDepth / 8);
  const bufferLength = 44 + dataLength;
  const wavBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(wavBuffer);
  
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return new Blob([view], { type: 'audio/wav' });
};

interface AssessmentIntroState {
  typeId: string;
  typeName: string;
  typeIcon: string;
  openingIntro: string;
}

interface ReportCard {
  afterMsgId: string;
  data: Record<string, unknown>;
  saved: boolean;
}

function ThinkingDots({ text }: { text?: string }) {
  return (
    <div className={s.dotWrap} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map(i => (
          <span key={i} className={s.dot} style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
      {text && <span style={{ fontSize: 13, color: '#9ca3af' }}>{text}</span>}
    </div>
  );
}

// 提取文本中的链接（支持 https?:// 和纯 www. 开头两种形式）
function extractLinks(text: string): string[] {
  // 完整 URL：https://xxx 或 http://xxx
  const fullUrlReg = /https?:\/\/[^\s\u3000\uff01-\uff60\u3001-\u303f<>"'()（）、，。]+/g;
  // 纯域名：www.xxx.yyy（前面不能是字母/数字/@/. 避免误匹配邮箱或已有协议的URL）
  const wwwReg = /(?<![\w/@.])(www\.[a-zA-Z0-9][a-zA-Z0-9-]*(?:\.[a-zA-Z]{2,})+(?:\/[^\s<>"'（）、，。]*)?)/g;
  const full = text.match(fullUrlReg) || [];
  const www  = text.match(wwwReg)  || [];
  return [...new Set([...full, ...www])];
}

/** 将多轮测评模块组合成一份完整 Markdown 报告（存报告记录用）
 * @param isFinal true = 测评结束时追加联系方式尾注 */
function buildAssessmentReport(
  modules: Array<{ title: string; content: string }>,
  charName: string,
  isFinal = false
): string {
  const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const header = `*由 ${charName} 为您持续整理 · 共 ${modules.length} 个分析模块*\n\n---\n`;
  const body = modules
    .map((m, i) => `## ${CN_NUM[i] ?? (i + 1)}、${m.title}\n\n${m.content}`)
    .join('\n\n---\n\n');
  const footer = isFinal
    ? `\n\n---\n\n> 💼 **如需深度产研转化支持及战略咨询**，欢迎联系方略研究院执行院长胡博士\n> 📧 **huwanqi@squareedu.com**`
    : '';
  return header + '\n\n' + body + footer;
}

// 注意：这里命名 parseStreamTags（而非 parseDashTags），避免遮蔽上方从 @/lib/assessment/config 导入的同名函数。
// 导入版负责解析 <zj_report> 并返回 reportData；本版仅用于流式渲染时的展示过滤。
function parseStreamTags(raw: string): { cleanText: string; hasDashSource: boolean; entities: string[]; thinkText?: string; workingNodes?: string[]; isThinking?: boolean; pingfangNums: Set<number>; webNums: Set<number>; refMap: Map<number, { title: string; url: string; source: string }>; webUrls: Array<{ title: string; url: string }> } {
  let text = raw;
  let hasDashSource = false;
  let entities: string[] = [];
  let thinkText: string | undefined;
  let workingNodes: string[] = [];
  let isThinking = false;
  let pingfangNums = new Set<number>();
  let webNums = new Set<number>();

  // 提取 <think> 或 $think% 标签内容
  const thinkMatch = /(?:<think>|\$think%?)([\s\S]*?)(?:<\/think>|\$\/think%?|$)/i.exec(text);
  if (thinkMatch) {
    thinkText = thinkMatch[1].trim();
    isThinking = !/(?:<\/think>|\$\/think%?)/i.test(text);
    text = text.replace(/(?:<think>|\$think%?)[\s\S]*?(?:<\/think>|\$\/think%?|$)/i, '');
  }

  // 提取 <zj_sources pingfang="1,2,4" web="3,5,6" /> 来源标注标签
  const zjSourcesMatch = /<zj_sources[^>]*pingfang=["']([^"']*)["'][^>]*web=["']([^"']*)["'][^>]*\/?>|<zj_sources[^>]*web=["']([^"']*)["'][^>]*pingfang=["']([^"']*)["'][^>]*\/?>/i.exec(text);
  if (zjSourcesMatch) {
    const pfStr = zjSourcesMatch[1] || zjSourcesMatch[4] || '';
    const webStr = zjSourcesMatch[2] || zjSourcesMatch[3] || '';
    pfStr.split(',').forEach(n => { const v = parseInt(n.trim()); if (!isNaN(v)) pingfangNums.add(v); });
    webStr.split(',').forEach(n => { const v = parseInt(n.trim()); if (!isNaN(v)) webNums.add(v); });
    if (pingfangNums.size > 0) hasDashSource = true;
    text = text.replace(/<zj_sources[^>]*\/?>/gi, '');
  }

  // 提取 <zj_ref_list>[...]</zj_ref_list> 引用明细列表 → 编号到URL/标题的映射（AI 生成，不一定稳定）
  const refMap = new Map<number, { title: string; url: string; source: string }>();
  const refListMatch = /<zj_ref_list>([\s\S]*?)<\/zj_ref_list>/i.exec(text);
  if (refListMatch) {
    try {
      const refs = JSON.parse(refListMatch[1].trim());
      if (Array.isArray(refs)) {
        refs.forEach((r: any) => {
          if (r.n && r.url) refMap.set(Number(r.n), { title: r.title || '', url: r.url, source: r.source || 'web' });
        });
      }
    } catch {}
    text = text.replace(/<zj_ref_list>[\s\S]*?<\/zj_ref_list>/gi, '');
  }
  // 同时清理可能未闭合的 zj_ref_list
  text = text.replace(/<zj_ref_list>[\s\S]*$/i, '');

  // 提取 <zj_web_urls>[...]</zj_web_urls> — 由服务端从工具结果中直接提取的完整 URL 列表（稳定可靠）
  const webUrls: Array<{ title: string; url: string }> = [];
  const webUrlsMatch = /<zj_web_urls>([\s\S]*?)<\/zj_web_urls>/i.exec(text);
  if (webUrlsMatch) {
    try {
      const urls = JSON.parse(webUrlsMatch[1].trim());
      if (Array.isArray(urls)) {
        urls.forEach((u: any) => { if (u.url) webUrls.push({ title: u.title || '', url: u.url }); });
      }
    } catch {}
    text = text.replace(/<zj_web_urls>[\s\S]*?<\/zj_web_urls>/gi, '');
  }
  text = text.replace(/<zj_web_urls>[\s\S]*$/i, '');

  // 隐藏正在调用的工具作为 Work 节点 (已被 backend 截断，但为了兼容性仍清理)
  const tools = ['dash_search', 'talent_deep_search', 'search_internet'];
  tools.forEach(tool => {
    text = text.replace(new RegExp(`<${tool}\\b[^>]*>[\\s\\S]*?(?:<\\/${tool}>|$)`, 'gi'), '');
    text = text.replace(new RegExp(`<${tool}[\\s\\S]*$`, 'gi'), '');
  });

  // 隐藏 <call function="..."> 工具调用标记（不应暴露给用户）
  text = text.replace(/<call\s+function="[^"]*"\s*\/>/gi, '');
  text = text.replace(/<call\b[^>]*>[\s\S]*?<\/call>/gi, '');

  // 隐藏 <zj_report> XML
  text = text.replace(/<zj_report[^>]*>[\s\S]*?<\/zj_report>/gi, '');
  text = text.replace(/<zj_report[\s\S]*$/i, '');
  // 隐藏 <zj_module> 模块积累标签（前端展示不需要它）
  text = text.replace(/<zj_module[^>]*>[\s\S]*?<\/zj_module>/gi, '');
  text = text.replace(/<zj_module[\s\S]*$/i, '');
  // 隐藏 [ASSESSMENT_END_SUGGEST] 结束建议标签
  text = text.replace(/\[ASSESSMENT_END_SUGGEST\]/gi, '');
  
  // 隐藏 <student_profile ...> 档案操作 XML
  text = text.replace(/<student_profile[^>]*>[\s\S]*?<\/student_profile[^>]*>/gi, '');
  text = text.replace(/<student_profile[^>]*\/>/gi, '');
  text = text.replace(/<student_profile[^>]*>/gi, '');

  // 隐藏人才查询的交互卡片标签
  text = text.replace(/<zj_talent_card[^>]*>[\s\S]*?<\/zj_talent_card>/gi, '');
  text = text.replace(/<zj_talent_card[^>]*\/>/gi, '');
  text = text.replace(/<zj_talent_list[^>]*>[\s\S]*?<\/zj_talent_list>/gi, '');
  text = text.replace(/<zj_talent_list[^>]*\/>/gi, '');
  text = text.replace(/<zj_company_card[^>]*>[\s\S]*?<\/zj_company_card>/gi, '');
  text = text.replace(/<zj_company_card[^>]*\/>/gi, '');
  if (/<dash_source/i.test(text)) {
    hasDashSource = true;
    text = text.replace(/<dash_source[\s\S]*?<\/dash_source>/gi, '');
    text = text.replace(/<dash_source[^>]*>/gi, '');
  }

  // 提取 <dash_entities>实体1,实体2</dash_entities>（支持多个/不完整标签）
  const allEntities: string[] = [];
  const entRegex = /<dash_entities>([\s\S]*?)<\/dash_entities>/gi;
  let m: RegExpExecArray | null;
  while ((m = entRegex.exec(text)) !== null) {
    m[1].split(',').forEach(e => { const t = e.trim(); if (t) allEntities.push(t); });
  }
  // 也兼容流式场景中尚未闭合的 <dash_entities>xxx（无闭合标签）
  const openEntMatch = /<dash_entities>(?![\s\S]*?<\/dash_entities>)([\s\S]*?)$/i.exec(text);
  if (openEntMatch) {
    openEntMatch[1].split(',').forEach(e => { const t = e.trim(); if (t) allEntities.push(t); });
  }
  if (allEntities.length > 0) {
    entities = [...new Set(allEntities)];
    text = text.replace(/<dash_entities>[\s\S]*?<\/dash_entities>/gi, '');
    text = text.replace(/<dash_entities>[\s\S]*$/i, '');
  }

  return { cleanText: text.replace(/\n{3,}/g, '\n\n').trim(), hasDashSource, entities, thinkText, isThinking, pingfangNums, webNums, refMap, webUrls };
}

function MsgContent({ text, isUser, message, excludedEntities, onEntityClick, onTalentClick, onCompanyClick }: { text: string; isUser?: boolean; message?: import('@/lib/ai/types').Message; excludedEntities?: string[]; onEntityClick?: (inst: any) => void; onTalentClick?: (talent: any) => void; onCompanyClick?: (company: any) => void }) {
  const [thinkTime, setThinkTime] = useState(0);
  const [workTime, setWorkTime] = useState(0);
  const [isWorkExpanded, setIsWorkExpanded] = useState(false);
  const [refDrawerOpen, setRefDrawerOpen] = useState(false);
  const { cleanText, hasDashSource, entities: rawEntities, thinkText, isThinking, pingfangNums, webNums, refMap, webUrls } = !isUser
    ? parseStreamTags(text)   // 展示层用 parseStreamTags，不是导入的 parseDashTags
    : { cleanText: text, hasDashSource: false, entities: [], thinkText: undefined, isThinking: false, pingfangNums: new Set<number>(), webNums: new Set<number>(), refMap: new Map(), webUrls: [] as Array<{ title: string; url: string }> };

  // 过滤：dash_entities 中已被 zj_institute_card / zj_talent_card / zj_talent_list 渲染过的实体，避免重复气泡
  const entities = !isUser && excludedEntities && excludedEntities.length > 0
    ? rawEntities.filter(e => !excludedEntities.includes(e))
    : rawEntities;

  let finalThinkText = thinkText;
  let finalIsThinking = isThinking;
  if (!finalThinkText && message?.isWorking) {
    finalThinkText = '正在解析用户意图并制定多路检索策略...';
    finalIsThinking = false;
  }

  const links = !isUser ? extractLinks(cleanText) : [];

  // 先做基础转义和 inline markdown，不含 \n→<br>（表格处理需要整行）
  let html = cleanText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    // 引用编号：把 [N] 渲染为彩色上标（纯展示，不可点击；点击来源气泡可查看信源清单）
    .replace(/\[(\d+)\]/g, (_, n) => {
      const num = parseInt(n);
      if (pingfangNums.has(num)) {
        return `<sup style="font-size:9px;font-weight:700;color:#427759;background:rgba(96,85,245,0.1);border-radius:3px;padding:0 2px;margin-left:1px;vertical-align:super;line-height:1">${num}</sup>`;
      } else if (webNums.has(num)) {
        return `<sup style="font-size:9px;font-weight:700;color:#0ea5e9;background:rgba(14,165,233,0.1);border-radius:3px;padding:0 2px;margin-left:1px;vertical-align:super;line-height:1">${num}</sup>`;
      }
      // 如果 AI 输出了数字但 zj_sources 标签还没到，用默认灰色
      return `<sup style="font-size:9px;font-weight:600;color:rgba(0,0,0,0.35);vertical-align:super;line-height:1;margin-left:1px">${num}</sup>`;
    })
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:rgba(0,0,0,0.85)">$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="font-size:12.5px;background:#f1f3f4;padding:1px 6px;border-radius:4px;font-family:\'SF Mono\',\'Fira Code\',monospace">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:14px;font-weight:700;color:#427759;margin:12px 0 6px">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:700;color:#427759;margin:14px 0 6px">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:18px;font-weight:700;color:#427759;margin:16px 0 8px">$1</h1>')
    .replace(/^&gt; (.+)$/gm, '<blockquote style="border-left:2px solid #427759;padding-left:12px;color:rgba(128,128,128,1);font-style:italic;margin:8px 0">$1</blockquote>');

  // 表格处理：把连续 | 行组合成真正的 <table>（与 MarkdownMsg 保持一致）
  // 此时 < > 已被转义，AI 输出的 <br> 已变为 &lt;br&gt;，在单元格内还原
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, (block) => {
    const rows = block.trim().split('\n');
    let hasHeader = false;
    let thead = '';
    let tbody = '';
    rows.forEach((row, idx) => {
      const rawCells = row.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      if (rawCells.every(c => /^[-: ]+$/.test(c))) { hasHeader = true; return; }
      const cells = rawCells.map(c => c.replace(/&lt;br\s*\/?&gt;/gi, '<br/>'));
      if (idx === 0 && hasHeader) {
        thead = `<thead><tr>${cells.map(c =>
          `<th style="padding:7px 12px;border:1px solid rgba(0,0,0,0.08);background:rgba(96,85,245,0.07);font-size:12.5px;font-weight:700;text-align:left;white-space:nowrap">${c}</th>`
        ).join('')}</tr></thead>`;
      } else {
        tbody += `<tr>${cells.map(c =>
          `<td style="padding:6px 12px;border:1px solid rgba(0,0,0,0.08);font-size:13px;line-height:1.5;vertical-align:top">${c}</td>`
        ).join('')}</tr>`;
      }
    });
    return `<div style="overflow-x:auto;margin:8px 0"><table style="border-collapse:collapse;width:100%;font-size:13px">${thead}<tbody>${tbody}</tbody></table></div>`;
  });

  html = html.replace(/\n{2,}/g, '<div style="height:8px"></div>').replace(/\n/g, '<br/>');


  const [isThinkExpanded, setIsThinkExpanded] = useState(false);

  useEffect(() => {
    setIsThinkExpanded(!!finalIsThinking);
  }, [finalIsThinking]);

  useEffect(() => {
    if (finalIsThinking) {
      const timer = setInterval(() => setThinkTime(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [finalIsThinking]);

  useEffect(() => {
    setIsWorkExpanded(!!message?.isWorking);
    if (message?.isWorking) {
      const timer = setInterval(() => setWorkTime(t => t + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [message?.isWorking]);

  return (
    <>
      {/* 渲染 <think> 模块 */}
      {finalThinkText !== undefined && (
        <div style={{
          marginBottom: 10,
          borderRadius: 8,
          border: isThinkExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none',
          background: isThinkExpanded ? '#fcfcfc' : 'transparent',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => setIsThinkExpanded(!isThinkExpanded)}
            style={{
              padding: isThinkExpanded ? '8px 12px' : '4px 0',
              fontSize: 13,
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isThinkExpanded ? 'rgba(0,0,0,0.02)' : 'transparent',
              userSelect: 'none'
            }}
          >
            <span style={{ transform: isThinkExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 10 }}>▶</span>
            {finalIsThinking ? '正在深入思考...' : `已完成思考，耗时 ${thinkTime}s >`}
          </div>
          {isThinkExpanded && finalThinkText && (
            <div style={{
              padding: '10px 12px',
              fontSize: 13,
              color: '#333333',
              lineHeight: 1.6,
              borderTop: '1px solid rgba(0,0,0,0.04)',
              whiteSpace: 'pre-wrap',
              fontStyle: 'italic'
            }}>
              {finalThinkText}
            </div>
          )}
        </div>
      )}

      {/* 渲染 Working 模块 (Multiplexed Tools) */}
      {message?.toolCalls && Object.keys(message.toolCalls).length > 0 && (
        <div style={{
          marginBottom: 10,
          borderRadius: 8,
          border: isWorkExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none',
          background: isWorkExpanded ? '#fcfcfc' : 'transparent',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => setIsWorkExpanded(!isWorkExpanded)}
            style={{
              padding: isWorkExpanded ? '8px 12px' : '4px 0',
              fontSize: 13,
              color: '#666',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isWorkExpanded ? 'rgba(0,0,0,0.02)' : 'transparent',
              userSelect: 'none'
            }}
          >
            <span style={{ transform: isWorkExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: 10 }}>▶</span>
            {message.isWorking ? '正在并发调度工具...' : `工具调度完毕，耗时 ${workTime}s >`}
          </div>
          {isWorkExpanded && (
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid rgba(0,0,0,0.04)',
              background: '#fff'
            }}>
              {Object.values(message.toolCalls).map(tool => (
                <div key={tool.id} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 4 }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: tool.status === 'running' ? '#f59e0b' : (tool.status === 'error' ? '#ef4444' : '#10b981'), marginRight: 6 }}></span>
                    {tool.name}
                  </div>
                  <div style={{ paddingLeft: 12, borderLeft: '2px solid rgba(0,0,0,0.06)' }}>
                    {tool.logs.map((log, i) => (
                      <div key={i} style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                        {log.includes('发生错误') || log.includes('失败') ? '⚠️ ' : (log.includes('完成') || log.includes('成功') ? '✅ ' : '⏳ ')}
                        {log.replace(/^> ⏳ |^> ❌ /g, '')}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <span dangerouslySetInnerHTML={{ __html: html }} />
      
      {links.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
          {links.map((url, i) => {
            const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
            let host = '';
            try { host = new URL(href).hostname.replace(/^www\./, ''); } catch { host = url.replace(/^www\./, '').split('/')[0]; }
            return (
              <a key={i} href={href} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px',
                  background: 'rgba(96,85,245,0.06)', borderRadius: 10, textDecoration: 'none',
                  border: '1px solid rgba(96,85,245,0.15)', transition: 'background 0.15s',
                  maxWidth: '100%', overflow: 'hidden' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,85,245,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,85,245,0.06)')}>
                <LinkOutlined style={{ fontSize: 11, color: '#427759', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#427759', fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {host || url}
                </span>
              </a>
            );
          })}
        </div>
      )}

      {/* 📎 引用来源条 — 有 zj_sources 时展示精细编号版，否则退回老的 hasDashSource 徽章 */}
      {(pingfangNums.size > 0 || webNums.size > 0) ? (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* 来源行 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', flexShrink: 0 }}>来源：</span>
            {pingfangNums.size > 0 && (
              <div onClick={() => setRefDrawerOpen(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(96,85,245,0.07)',
                border: '1px solid rgba(96,85,245,0.18)',
                fontSize: 11, color: '#427759', fontWeight: 500, whiteSpace: 'nowrap',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.07)'; }}
              >
                🛡️
                <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>
                  {Array.from(pingfangNums).sort((a, b) => a - b).join(',')}
                </span>
                <span style={{ opacity: 0.7 }}>平方数据</span>
              </div>
            )}
            {webNums.size > 0 && (
              <div onClick={() => setRefDrawerOpen(true)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(14,165,233,0.07)',
                border: '1px solid rgba(14,165,233,0.18)',
                fontSize: 11, color: '#0ea5e9', fontWeight: 500, whiteSpace: 'nowrap',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.07)'; }}
              >
                🌐
                <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>
                  {Array.from(webNums).sort((a, b) => a - b).join(',')}
                </span>
                <span style={{ opacity: 0.7 }}>互联网·请甄别</span>
              </div>
            )}
          </div>
          {/* 实体气泡行 */}
          {entities.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {entities.map((ent, i) => (
                (onEntityClick || onTalentClick) ? (
                  <EntityBubbleFetcher
                    key={i}
                    query={ent}
                    onSelectTalent={onTalentClick || (() => {})}
                    onSelectInstitute={onEntityClick || (() => {})}
                  />
                ) : (
                  <span key={i} style={{
                    display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                    background: 'rgba(96,85,245,0.04)',
                    border: '1px solid rgba(96,85,245,0.12)',
                    fontSize: 11, color: 'rgba(0,0,0,0.50)',
                  }}>
                    {ent}
                  </span>
                )
              ))}
            </div>
          )}
        </div>
      ) : hasDashSource && (
        /* 老版：没有 zj_sources 但有 dash_source 标签时的降级展示 */
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 20,
            background: 'rgba(96,85,245,0.07)',
            border: '1px solid rgba(96,85,245,0.18)',
            fontSize: 11, color: '#427759', fontWeight: 500, flexShrink: 0,
          }}>
            🛡️ 来源·平方数据
          </div>
          {entities.map((ent, i) => (
            (onEntityClick || onTalentClick) ? (
              <EntityBubbleFetcher
                key={i}
                query={ent}
                onSelectTalent={onTalentClick || (() => {})}
                onSelectInstitute={onEntityClick || (() => {})}
              />
            ) : (
              <span key={i} style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                background: 'rgba(96,85,245,0.04)',
                border: '1px solid rgba(96,85,245,0.12)',
                fontSize: 11, color: 'rgba(0,0,0,0.50)',
              }}>
                {ent}
              </span>
            )
          ))}
        </div>
      )}

      {/* 📖 信源清单抽屉 — Portal 到 body 以彻底避免 z-index 层叠问题 */}
      {refDrawerOpen && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.35)', zIndex: 2147483647,
          display: 'flex', justifyContent: 'flex-end',
          animation: 'fadeIn 0.15s ease',
        }} onClick={() => setRefDrawerOpen(false)}>
          <div style={{
            width: '100%', maxWidth: 480, height: '100%',
            background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideInRight 0.2s ease',
          }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.85)' }}>
                📖 信源清单
              </h3>
              <button onClick={() => setRefDrawerOpen(false)} style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
                color: '#999', padding: '4px 8px', borderRadius: 6,
              }}>✕</button>
            </div>
            {/* Body */}
            <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>

              {/* ── 平方数据库 ── */}
              {pingfangNums.size > 0 && (() => {
                const pfRefs = Array.from(pingfangNums).sort((a, b) => a - b).map(n => ({ n, ref: refMap.get(n) }));
                const hasDetail = pfRefs.some(r => r.ref?.title);
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 12, background: 'rgba(96,85,245,0.08)', color: '#427759', fontSize: 12, fontWeight: 600 }}>🛡️ 平方数据库</span>
                      <span style={{ fontSize: 11, color: '#bbb' }}>共 {pingfangNums.size} 条</span>
                    </div>
                    {hasDetail ? pfRefs.map(r => (
                      <div key={r.n} style={{ display: 'flex', gap: 8, padding: '8px 12px', marginBottom: 6, background: '#fafafe', borderRadius: 8, border: '1px solid rgba(96,85,245,0.1)', alignItems: 'flex-start' }}>
                        <sup style={{ fontSize: 10, fontWeight: 700, color: '#427759', background: 'rgba(96,85,245,0.12)', borderRadius: 3, padding: '1px 4px', flexShrink: 0, marginTop: 2 }}>{r.n}</sup>
                        <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.75)', lineHeight: 1.5 }}>{r.ref?.title || `引用 #${r.n}`}</div>
                      </div>
                    )) : (
                      <div style={{ padding: '10px 14px', background: '#fafafe', borderRadius: 8, border: '1px solid rgba(96,85,245,0.1)', fontSize: 13, color: '#888' }}>
                        引用编号 {Array.from(pingfangNums).sort((a, b) => a - b).join('、')} 来自平方数据库结构化数据，已通过核验。
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── 互联网来源（优先使用 webUrls — 服务端工具直出，URL 完整可靠）── */}
              {(webNums.size > 0 || webUrls.length > 0) && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 12, background: 'rgba(14,165,233,0.08)', color: '#0ea5e9', fontSize: 12, fontWeight: 600 }}>🌐 互联网来源</span>
                    <span style={{ fontSize: 11, color: '#bbb' }}>共 {webUrls.length || webNums.size} 条 · 请注意甄别</span>
                  </div>
                  {webUrls.length > 0 ? (
                    webUrls.map((u, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 12px', marginBottom: 6, background: '#fafcfe', borderRadius: 8, border: '1px solid rgba(14,165,233,0.1)', alignItems: 'flex-start' }}>
                        <sup style={{ fontSize: 10, fontWeight: 700, color: '#0ea5e9', background: 'rgba(14,165,233,0.12)', borderRadius: 3, padding: '1px 4px', flexShrink: 0, marginTop: 2 }}>{i + 1}</sup>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.75)', lineHeight: 1.5, fontWeight: 500 }}>{u.title}</div>
                          <a href={u.url} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: '#0ea5e9', wordBreak: 'break-all', lineHeight: 1.4, display: 'block', marginTop: 2 }}>
                            {u.url}
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '10px 14px', background: '#fafcfe', borderRadius: 8, border: '1px solid rgba(14,165,233,0.1)', fontSize: 13, color: '#888' }}>
                      引用编号 {Array.from(webNums).sort((a, b) => a - b).join('、')} 来自互联网公开信息检索。请注意甄别。
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
}

// 分享底部弹层
function ShareSheet({ open, onClose, charName, onCopyLink, onCopyMsg, lastMsg }: {
  open: boolean; onClose: () => void;
  charName?: string; onCopyLink: () => void; onCopyMsg: () => void; lastMsg?: string;
}) {
  if (!open) return null;
  const items = [
    { icon: '🔗', label: '复制对话链接', action: onCopyLink },
    { icon: '📝', label: '复制最新回复', action: onCopyMsg, disabled: !lastMsg },
    ...(typeof navigator !== 'undefined' && 'share' in navigator
      ? [{ icon: '↗️', label: '分享到其他应用', action: () => {
          navigator.share({ title: `与${charName || 'AI'}的对话`, url: window.location.href }).catch(() => {});
          onClose();
        }}]
      : []),
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', background: '#fff', borderRadius: '20px 20px 0 0',
          padding: '0 0 calc(20px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
          animation: 'shareIn 0.28s cubic-bezier(.4,0,.2,1)' }}>
        {/* Handle */}
        <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e5e7eb', display: 'inline-block' }} />
        </div>
        <div style={{ padding: '4px 20px 16px', borderBottom: '1px solid #f0f0f5', marginBottom: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#14151f' }}>分享对话</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>与{charName || 'AI'}的聊天</div>
        </div>
        {items.map(item => (
          <button key={item.label} onClick={item.action}
            disabled={item.disabled}
            style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 24px',
              border: 'none', background: 'none', cursor: item.disabled ? 'default' : 'pointer',
              opacity: item.disabled ? 0.4 : 1, fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent' }}
            onTouchStart={e => !item.disabled && (e.currentTarget.style.background = '#f7f5ff')}
            onTouchEnd={e => (e.currentTarget.style.background = 'transparent')}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{item.label}</span>
          </button>
        ))}
      </div>
      <style>{`@keyframes shareIn { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}

// 手机端顶部导航栏
function MobileChatTopBar({ character, avatarUrl, onBack, onShare, onProfileClick }: {
  character: Character;
  avatarUrl: string | null;
  onBack: () => void;
  onShare: () => void;
  onProfileClick: () => void;
}) {
  return (
    <div style={{
      height: 52, flexShrink: 0,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(223,227,245,0.8)',
      display: 'flex', alignItems: 'center',
      padding: '0 4px 0 0',
      gap: 0, zIndex: 10,
      paddingTop: 'env(safe-area-inset-top, 0px)',
    }}>
      {/* 后退按鈕 */}
      <button onClick={onBack} style={{
        width: 44, height: 44, border: 'none', background: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#374151', borderRadius: 10, flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}>
        <ArrowLeftOutlined style={{ fontSize: 18 }} />
      </button>

      {/* 点击头像和名称区域打开详情页 */}
      <div 
        onClick={onProfileClick}
        style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        {/* 头像 */}
        <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
          background: 'linear-gradient(135deg, #ede9ff, #c7d2fe)', flexShrink: 0 }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            : <span style={{ fontSize: 15, fontWeight: 700, color: '#427759', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{character.name?.[0]}</span>}
        </div>

        {/* 名称 + tagline */}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#14151f',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{character.name}</div>
          {character.tagline && (
            <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{character.tagline}</div>
          )}
        </div>
      </div>

      {/* 分享按鈕 */}
      <button onClick={onShare} style={{
        width: 40, height: 40, border: 'none', background: 'none',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af', borderRadius: 10, flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}>
        <ShareAltOutlined style={{ fontSize: 17 }} />
      </button>
    </div>
  );
}

function WelcomeCard({
  character, onPromptClick, username, isMobile, isFirstVisit, profileFragments,
}: {
  character: Character;
  onPromptClick: (prompt: string) => void;
  username: string;
  isMobile?: boolean;
  isFirstVisit: boolean;
  profileFragments: string[];
}) {
  const portraitUrl = (() => {
    const src = character.assets?.idle || character.assets?.hero || (character.avatar && character.avatar !== '/assets/default-ai-robot.png' ? character.avatar : null);
    if (!src) return '/assets/default-ai-robot.png';
    return src.startsWith('http') || src.startsWith('/') ? src : `/characters/${character.id}/${src}`;
  })();

  const prompts: string[] = (character.quick_prompts as string[] | undefined)?.slice(0, 7) || [];

  // Build the AI bubble text
  const aiBubbleText = (() => {
    if (isFirstVisit) {
      return character.intro || character.description || character.tagline || '';
    }
    // Return visit
    if (profileFragments.length === 0) {
      return '目前你在"知己"的信息还很少，随着交流，我们所有AI都会更加了解你的情况，给你更适合的建议。';
    }
    const milestoneText = profileFragments.length === 1
      ? `「${profileFragments[0]}」`
      : `「${profileFragments[0]}」和「${profileFragments[1]}」`;
    return `我翻了翻你的档案，有些新记录引起了我的注意：${milestoneText}。想从这里聊起，还是探索些新的方向？——我这边正好备着一些话题。`;
  })();

  const greetingText = isFirstVisit
    ? `你好，${username}，\n初次见面，很高兴认识你！`
    : `欢迎回来，${username}！`;

  return (
    <div className={s.wcWrapper} style={{ padding: isMobile ? '0 12px' : '0 22px' }}>
      {/* 1. Image + Greeting Card */}
      <div className={s.wcCard}>
        <div className={s.wcBannerWrap}>
          <img
            src={portraitUrl}
            alt={character.name}
            onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
            className={s.wcBannerImg}
          />
          <div className={s.wcBannerMask} />
        </div>
        <div className={s.wcGreetingBlock}>
          <div className={s.wcGreetingMain}>{greetingText}</div>
        </div>
      </div>

      {/* 2. AI Bubble */}
      {aiBubbleText && (
        <div className={s.wcAiBubble}>
          <div className={s.wcAiAvatar}>
            <img src={portraitUrl} alt="" className={s.wcAiAvatarImg}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
          <div className={s.wcAiBubbleText}>{aiBubbleText}</div>
        </div>
      )}

      {/* 3. Chips */}
      {prompts.length > 0 && (
        <div className={s.wcInterestSection}>
          <div className={s.wcDividerRow}>
            <div className={s.wcDividerLine} />
            <span className={s.wcDividerText}>你可能感兴趣</span>
            <div className={s.wcDividerLine} />
          </div>
          <div className={s.wcChips}>
            {prompts.map(p => (
              <button
                key={p}
                onClick={() => onPromptClick(p)}
                className={s.wcChip}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(156,142,191,0.2), inset 0 2px 4px rgba(255,255,255,0.8)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(156,142,191,0.1), inset 0 2px 4px rgba(255,255,255,0.8)';
                }}
              >
                <span className={s.wcChipHash}>#</span>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const ChatArea: React.FC<{
  skillInput?: string;
  onStatusChange?: (status: AIStatus) => void;
}> = ({ skillInput, onStatusChange }) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const convId = searchParams.get('id');
  const initialCharId = searchParams.get('charId');
  const handoffFrom = searchParams.get('hf_from');       // 上一个角色的名字
  const handoffCtx  = searchParams.get('hf_ctx');        // 上一个角色整理的前情摘要
  const handoffPrevConvId = searchParams.get('hf_prev_conv_id'); // A 的 convId（供 B 返回用）
  const handoffPrevCharId = searchParams.get('hf_prev_char_id'); // A 的 charId
  const returnFrom  = searchParams.get('return_from');   // B 的名字（A 接话时）
  const returnKey   = searchParams.get('return_key');    // sessionStorage key（不走 URL 传全文）
  // 从 sessionStorage 读取交班摘要 + 目标名字（URL 只传 key，保持整洁）
  const { returnCtx, returnToName } = (() => {
    if (typeof window === 'undefined' || !returnKey) {
      return { returnCtx: searchParams.get('return_ctx') || '', returnToName: '' };
    }
    try {
      const stored = sessionStorage.getItem(returnKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { returnCtx: parsed.briefing || '', returnToName: parsed.toName || '' };
      }
    } catch { /* ignore */ }
    return { returnCtx: '', returnToName: '' };
  })();


  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitializing = useRef(false);
  const lastLoadedConvId = useRef<string | null>(null);

  const [character, setCharacter] = useState<Character | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [modelIdx, setModelIdx] = useState(0);
  const [username, setUsername] = useState('同学');
  const [userStats, setUserStats] = useState<{ chats: number; reports: number; fragments: number }>({ chats: 0, reports: 0, fragments: 0 });

  const { messages, loading, sendMessage, setMessages } = useChat([]);
  const [showYidaGreeting, setShowYidaGreeting] = useState(false);
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { user, isGuest, isLoading } = useAuth();
  
  // 优先使用从本地缓存解析出的真实昵称（如果已经加载且不是默认值'同学'）
  const displayUsername = (username && username !== '同学') 
    ? username 
    : (user?.displayName || user?.username || '同学');

  // ── 根据 loading + streaming 推导 AI 当前状态 ─────────────────────
  const lastMsgForStatus = messages[messages.length - 1];
  const isStreamingContent = loading && lastMsgForStatus?.role === 'assistant' && !!lastMsgForStatus?.content?.trim();
  const aiStatus: AIStatus = loading
    ? (isStreamingContent ? 'talking' : 'thinking')
    : 'idle';

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);
  const [showShare, setShowShare] = useState(false);
  
  // Yida Agent Mock Modals
  const [selectedTalent, setSelectedTalent] = useState<any>(null);
  const [selectedInstitute, setSelectedInstitute] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  const prevLoadingForAssessRef = useRef(loading);
  const prevCharNameRef = useRef<string>('');  // 避免 convId 变化时重复触发 character-name-updated

  const [showPicker, setShowPicker] = useState(false);
  const [introCard, setIntroCard] = useState<AssessmentIntroState | null>(null);
  const [reportCards, setReportCards] = useState<ReportCard[]>([]);
  // 用户手动点击“存为报告”的消息 ID集合
  const [manualSavedMsgIds, setManualSavedMsgIds] = useState<Set<string>>(new Set());
  const [savingMsgId, setSavingMsgId] = useState<string | null>(null);
  // 测评模块积累激活标志（首次 zj_module 保存后 → true，按钮换为"已存入报告模块"）
  const [assessmentModuleActive, setAssessmentModuleActive] = useState(false);
  // AI 建议结束测评（检测到 [ASSESSMENT_END_SUGGEST] 时 → true，展示结束建议条）
  const [assessmentEndSuggested, setAssessmentEndSuggested] = useState(false);

  const handoffTriggered = useRef(false); // 防止重复触发交接
  const returnTriggered = useRef(false);  // 防止重复触发返回接话

  // 测评会话报告积累：追踪当前测评的 reportId 和已收集的模块
  const assessmentSessionRef = useRef<{
    reportId: string | null;
    typeId: string | null;
    reportTitle: string | null;
    modules: Array<{ title: string; content: string }>;
  }>({ reportId: null, typeId: null, reportTitle: null, modules: [] });

  // URL 关键参数变化时重置防重复 ref（SPA 导航不会卸载组件，所以要手动重置）
  useEffect(() => {
    handoffTriggered.current = false;
    returnTriggered.current = false;
  }, [handoffFrom, returnFrom, initialCharId]);

  // 会话切换时清空测评会话状态（避免跨对话残留）
  // ⚠️ 注意：如果刚刚触发了测评开始，typeId 刚被设置，此时 convId 因第一条消息而更新
  // 不能把 typeId 清掉！只有当 typeId 为空，或者已经有了 reportId（说明是旧对话的状态）才重置
  useEffect(() => {
    const session = assessmentSessionRef.current;
    if (!session.typeId || session.reportId) {
      // 没有测评进行中，或者是切换到另一个已有报告的老对话 → 完全重置
      assessmentSessionRef.current = { reportId: null, typeId: null, reportTitle: null, modules: [] };
      setAssessmentModuleActive(false);
      setAssessmentEndSuggested(false);
    }
    // 如果 typeId 有值但 reportId 为 null：刚刚开始测评，convId 刚因第一条消息而生成 → 保留 typeId，什么都不做
  }, [convId]);
  // Handoff 来源 bar（B 侧常驻）
  const [hfFromBar, setHfFromBar] = useState<{ name: string; charId: string; convId: string } | null>(null);
  const [showHfFromBar, setShowHfFromBar] = useState(false);
  // 被用户关闭的 Handoff Bar 消息 ID
  const [dismissedHandoffIds, setDismissedHandoffIds] = useState<Set<string>>(new Set());
  // 全量角色列表（用于 Handoff Bar 显示目标名字）
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  // HANDOFF 目标角色按需拉取的补充列表（slug -> Character）
  const [extraChars, setExtraChars] = useState<Record<string, Character>>({});

  // Lead CRM 状态
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadMsgIds, setLeadMsgIds] = useState<Set<string>>(new Set()); // 触发过表单的消息 ID

  // 首次/回访状态 + 档案摘要
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [profileFragments, setProfileFragments] = useState<string[]>([]);

  // 对话消息里有 [HANDOFF target="slug"]，自动按需拉取缺失的角色
  useEffect(() => {
    if (!messages.length) return;
    const slugSet = new Set<string>();
    for (const m of messages) {
      const matches = (m.content || '').matchAll(/\[HANDOFF\b[^\]]*target="([^"]+)"/g);
      for (const match of matches) slugSet.add(match[1]);
    }
    if (!slugSet.size) return;
    
    const ID_ALIASES: Record<string, string> = {
      'westlake_mr': 'xihu',
      'principal_shi_yigong': 'xihu'
    };

    slugSet.forEach(async (slug) => {
      const mappedSlug = ID_ALIASES[slug] || slug;
      // 已在 allCharacters 或 extraChars 里的跳过
      const inAll = allCharacters.find(c => c.slug === mappedSlug || String(c.id) === mappedSlug);
      if (inAll || extraChars[mappedSlug]) return;
      try {
        const res = await fetch(`/api/public/char/${encodeURIComponent(mappedSlug)}`);
        if (!res.ok) return;
        const char: Character = await res.json();
        if (char?.id) setExtraChars(prev => ({ ...prev, [mappedSlug]: char }));
      } catch { /* silent */ }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, allCharacters]);

  const [rrCatalog, setRrCatalog] = useState<{
    pages: Array<{ id: string; name: string; description?: string; url: string; icon?: string }>;
    apps:  Array<{ id: string; name: string; description?: string; url: string; icon?: string }>;
  }>({ pages: [], apps: [] });

  // 监听打开手机端档案的全局事件（来自右侧悬浮气泡）
  useEffect(() => {
    const handler = () => setShowMobileProfile(true);
    window.addEventListener('open-mobile-profile', handler);
    return () => window.removeEventListener('open-mobile-profile', handler);
  }, []);

  // 角色加载完成后：判断首次/回访，并拉取档案最近 2 条 fragment
  useEffect(() => {
    if (!character) return;
    // 重置（切换角色时重置）
    setIsFirstVisit(true);
    setProfileFragments([]);

    // 并行请求：历史对话列表 + 用户档案
    Promise.all([
      fetch('/api/conversations').then(r => r.ok ? r.json() : []),
      fetch('/api/profile').then(r => r.ok ? r.json() : {}),
    ]).then(([convs, pData]) => {
      // 判断是否曾和这个 AI 聊过
      const chatted = Array.isArray(convs) && convs.some(
        (c: { charId?: string }) => c.charId === character.id || c.charId === character.slug
      );
      setIsFirstVisit(!chatted);

      // 提取最近 2 条 fragment 的文本摘要
      const frags = pData?.fragments as Array<Record<string, unknown>> | undefined;
      if (frags && frags.length > 0) {
        const snippets = frags
          .slice(0, 2)
          .map(f => {
            let text = String(f.content || f.text || f.summary || '');
            text = text.replace(/^(?:[^-\n]+)?(记录|分析|特征|评估|意向|档案)(?:[^-\n]+)?-\s*/, '')
                       .replace(/[#*📝📋💡📌]/g, '')
                       .replace(/^-\s*/g, '')
                       .trim();
            return text.slice(0, 40).trim();
          })
          .filter(Boolean);
        setProfileFragments(snippets);
      }
    }).catch(() => {});
  }, [character?.id]);

  // 挂载时拉取推荐资源目录
  useEffect(() => {
    fetch('/api/recommend-resources').then(r => r.json()).then(d => {
      if (d.ok) setRrCatalog({ pages: d.pages || [], apps: d.apps || [] });
    }).catch(() => {});
  }, []);

  const fetchAssessmentIntro = useCallback(async (typeId: string): Promise<string> => {
    try {
      const res = await fetch(`/api/assessment-intro/${typeId}`);
      if (res.ok) {
        const d: AssessmentIntroResponse = await res.json();
        return d.openingIntro || '';
      }
    } catch { /* ignore */ }
    return '';
  }, []);


  const sendRef = useRef<((val?: string) => void) | null>(null);

  const handleAssessmentSelect = useCallback(async (typeId: string) => {
    setShowPicker(false);
    const lookupSlug = (s: string) => s.replace(/_mcp$/, '');
    const charTypes = character ? (
      CAT_ASSESSMENT_TYPES[character.id] ||
      CAT_ASSESSMENT_TYPES[character.slug || ''] ||
      CAT_ASSESSMENT_TYPES[lookupSlug(character.slug || '')] ||
      []
    ) : [];
    const typeInfo = charTypes.find(t => t.id === typeId);
    const openingIntro = await fetchAssessmentIntro(typeId);
    if (!openingIntro) {
      // 新测评开始，重置模块积累会话
      assessmentSessionRef.current = { reportId: null, typeId, reportTitle: null, modules: [] };
      sendRef.current?.(`[ASSESSMENT_START:${typeId}]`);
      return;
    }
    setIntroCard({
      typeId,
      typeName: typeInfo?.name || typeId,
      typeIcon: typeInfo?.icon || '🧪',
      openingIntro,
    });
  }, [character, fetchAssessmentIntro]);

  useEffect(() => {
    if (skillInput) { setInputValue(skillInput.replace(/\n$/, '')); inputRef.current?.focus(); }
  }, [skillInput]);

  useEffect(() => {
    onStatusChange?.(aiStatus);
    window.dispatchEvent(new CustomEvent('ai-status-change', { detail: aiStatus }));
  }, [aiStatus, onStatusChange]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const loadCharacterAndConv = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;
      const savedId = initialCharId ?? null;
      
      try {
        // ── Handoff 跳转到新 AI：立刻清空旧消息，防止恐怖谷 ──────────────
        if (handoffFrom && !convId) {
          setMessages([]);
        }

        const [charRes, profileRes] = await Promise.all([
          fetch('/api/public/chars'),
          fetch('/api/profile')
        ]);
        
        const data = await charRes.json();
        let char = data.find((c: Character) => String(c.id) === savedId || c.slug === savedId);

        if (convId) {
          const conv = await getConversation(convId);
          if (conv) {
            if (lastLoadedConvId.current !== convId) {
              setMessages(conv.history);
              lastLoadedConvId.current = convId;

              // ── 从对话历史恢复测评会话状态 ────────────────────────────────
              // 扫描消息里是否有 [ASSESSMENT_START:xxx]，有就恢复 typeId
              const startMsg = conv.history.find((m: any) =>
                m.role === 'user' && /^\[ASSESSMENT_START:/.test(m.content || '')
              );
              if (startMsg) {
                const match = (startMsg.content || '').match(/\[ASSESSMENT_START:([^\]]+)\]/);
                const restoredTypeId = match?.[1] || null;
                if (restoredTypeId) {
                  // 只在当前没有进行中的测评时才恢复（避免覆盖刚刚开始的新测评）
                  if (!assessmentSessionRef.current.typeId) {
                    assessmentSessionRef.current.typeId = restoredTypeId;
                    // 尝试从报告列表里找到对应的 reportId，让后续保存能 append
                    fetch('/api/reports').then(r => r.ok ? r.json() : []).then((rpts: any[]) => {
                      if (!Array.isArray(rpts)) return;
                      // 找最近一条同角色的同类测评报告（标题含 typeId 关键词）
                      const keyword = restoredTypeId.replace(/_/g, ' ');
                      const matched = rpts.find(r =>
                        r.convId === convId || (
                          (r.charId === (conv.charId || '') || r.charName === (conv.charName || '')) &&
                          ((r.title || '').toLowerCase().includes(keyword) || (r.title || '').includes(restoredTypeId))
                        )
                      );
                      if (matched && !assessmentSessionRef.current.reportId) {
                        assessmentSessionRef.current.reportId = matched.id;
                        setAssessmentModuleActive(true);
                      }
                    }).catch(() => {});
                  }
                }
              }
            }
            setUserStats(prev => ({ ...prev, chats: Math.floor(conv.history.length / 2) }));

            const convCharId = conv.charId || savedId;
            if (!char || convCharId !== savedId) {
              const convChar = data.find((c: Character) => String(c.id) === convCharId || c.slug === convCharId);
              if (convChar) {
                char = convChar;
              } else if (convCharId) {
                try {
                  const cloudRes = await fetch(`/api/public/char/${convCharId}`);
                  if (cloudRes.ok) {
                    char = await cloudRes.json();
                  }
                } catch (e) {
                }
                if (!char) {
                  char = { id: convCharId, name: conv.charName || convCharId, assets: {} };
                }
              }
            }
          }
        }

        // 若在列表中未找到，直接用云端接口单独拉取（ID 格式可能与列表不完全一致）
        if (!char && savedId) {
          try {
            const cloudRes = await fetch(`/api/public/char/${savedId}`);
            if (cloudRes.ok) char = await cloudRes.json();
          } catch (e) { console.warn('[ChatArea] cloud fallback failed', e); }
        }
        // 仍然找不到：显示空状态，不替换成其他角色
        if (!char) {
          console.warn(`[ChatArea] Character not found: ${savedId}`);
        }
        setCharacter(char);
        setAllCharacters(data);
        if (char?.id) localStorage.setItem('selected_character_id', char.id);
        // 恢复本 convId 已发起过的 handoff dismissed 状态
        if (convId) {
          try {
            const key = `zhiji_dismissed_hf_${convId}`;
            const saved = JSON.parse(localStorage.getItem(key) || '[]') as string[];
            if (saved.length > 0) setDismissedHandoffIds(new Set(saved));
          } catch { /* ignore */ }
        }

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          if (profileData.username) {
            setUsername(profileData.username);
          }
        }

        if (char?.name && char.name !== prevCharNameRef.current) {
          prevCharNameRef.current = char.name;
          window.dispatchEvent(new CustomEvent('character-name-updated', { detail: { name: char.name } }));
        }

        fetch('/api/reports').then(r => r.ok ? r.json() : []).then((rpts: ReportRecord[]) => {
          setUserStats(prev => ({ ...prev, reports: Array.isArray(rpts) ? rpts.length : 0 }));
        }).catch(() => {});
        fetch('/api/profile').then(r => r.ok ? r.json() : {}).then((pData: Record<string, unknown>) => {
          const frags = (pData?.fragments as unknown[])?.length ?? (pData?.totalFragments as number) ?? 0;
          setUserStats(prev => ({ ...prev, fragments: frags }));
        }).catch(() => {});

      } catch (err) { console.error(err); }
      finally { isInitializing.current = false; }
    };

    loadCharacterAndConv();
    const onCharChange = (e: Event) => {
      const charId = (e as CustomEvent).detail?.charId as string | undefined;
      isInitializing.current = false;
      lastLoadedConvId.current = null;
      // 如果事件里有 charId，带着参数跳转（URL 变化会自动触发 useEffect 重新加载）
      if (charId) {
        router.push(`/chat?charId=${encodeURIComponent(charId)}`);
      } else {
        router.replace('/chat');
        loadCharacterAndConv();
      }
    };
    window.addEventListener('characterChanged', onCharChange);
    return () => window.removeEventListener('characterChanged', onCharChange);
  }, [convId, router, setMessages, initialCharId]);

  // ── 从 sessionStorage 恢复 Handoff 来源 bar ──────────────────────────────
  // 严格正向条件：当且仅当 convId + charId 都与 sessionStorage 里存的 handoff 目标完全一致，才显示 bar。
  // 任何其他情况（新对话、其他对话、其他角色）一律不显示并清理 React state。
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hfName         = sessionStorage.getItem('zhiji_hf_from_name');
    const hfTargetCharId = sessionStorage.getItem('zhiji_hf_target_char_id');
    const hfTargetConvId = sessionStorage.getItem('zhiji_hf_target_conv_id');

    const shouldShow = !!(
      hfName &&
      convId &&                           // 必须有真实 convId（排除新对话）
      initialCharId &&
      hfTargetCharId === initialCharId && // charId 精确匹配
      hfTargetConvId &&                   // 必须已记录目标 convId
      hfTargetConvId === convId           // convId 精确匹配
    );

    if (shouldShow) {
      setHfFromBar({
        name: hfName!,
        charId: sessionStorage.getItem('zhiji_hf_from_char_id') || '',
        convId: sessionStorage.getItem('zhiji_hf_from_conv_id') || '',
      });
      setShowHfFromBar(true);
    } else {
      // 不满足显示条件时，收起 bar（React state 层面隐藏，不清理 sessionStorage，
      // 因为 handoff 对话本身可能还需要它）
      setShowHfFromBar(false);
      setHfFromBar(null);
    }
  }, [initialCharId, convId]);

  // ── Handoff 自动触发：从交接跳转过来时，自动发送 [handoff_trigger] ──────
  useEffect(() => {
    if (!character || !handoffFrom || handoffTriggered.current) return;
    // 关键：等 B 的角色数据真正加载完再触发（防止用 A 的 charId 发请求）
    if (initialCharId && String(character.id) !== initialCharId && character.slug !== initialCharId) return;
    handoffTriggered.current = true;
    // 持久化到 sessionStorage（URL replace 后参数消失，但 bar 还需显示）
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('zhiji_hf_from_name', handoffFrom);
      sessionStorage.setItem('zhiji_hf_from_char_id', handoffPrevCharId || '');
      sessionStorage.setItem('zhiji_hf_from_conv_id', handoffPrevConvId || '');
      sessionStorage.setItem('zhiji_hf_target_char_id', character.id); // 记录目标角色，防止跳到其他页面时 bar 误恢复
      setHfFromBar({ name: handoffFrom, charId: handoffPrevCharId || '', convId: handoffPrevConvId || '' });
      setShowHfFromBar(true);
    }
    // 再次确保清空旧消息（双保险），让 B 从空白开始
    setMessages([]);
    // 由于已有 force_clear_history，不需要 setTimeout 等待 setMessages 渲染
    sendMessage(
      '[handoff_trigger]',
      character.id,
      undefined,
      (newId: string) => {
        // B 的对话创建后：URL replace + 通知侧边栏刷新
        // 存储目标 convId，防止 bar 在其他对话里残留
        sessionStorage.setItem('zhiji_hf_target_conv_id', newId);
        lastLoadedConvId.current = newId;
        router.replace(`/chat?id=${newId}&charId=${character?.id || ''}`);
        window.dispatchEvent(new CustomEvent('conversationsUpdated'));
      },
      { 
        handoff_from: handoffFrom, 
        handoff_context: handoffCtx || '',
        force_clear_history: true, // 强制服务端忽略旧历史
        model: MODELS[modelIdx].id
      }
    );
  }, [character, handoffFrom, handoffCtx, handoffPrevCharId, handoffPrevConvId, setMessages, sendMessage, router, modelIdx]);

  // ── 返回触发：从 B 返回 A 时，A 发 [return_trigger] 接话 ──────────────
  useEffect(() => {
    if (!character || !returnFrom || returnTriggered.current) return;
    // 等 A 的角色数据真正加载完再触发（防止用 B 的 charId/name）
    if (initialCharId && String(character.id) !== initialCharId && character.slug !== initialCharId) return;
    returnTriggered.current = true;
    // 删除 sessionStorage key（用完即删）
    if (returnKey) sessionStorage.removeItem(returnKey);
    // A 的名字优先用 sessionStorage 里存的 toName，其次 character.name
    const aName = returnToName || character.name;
    // 插入系统事件消息（显示为对话流里的标题胶囊）
    const systemMsg: Message = {
      id: `sys_return_${Date.now()}`,
      role: 'system' as const,
      content: `__RETURN_EVENT__${returnFrom}__已完成任务，对话已回到__${aName}`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, systemMsg]);
    // 由于已有 force_clear_history，不需要 setTimeout 等待 setMessages 渲染
    // 在发送 API 时附带参数
    sendMessage(
      '[return_trigger]',
      character.id,
      convId || undefined,
      (newId: string) => {
        lastLoadedConvId.current = newId;
        if (newId !== convId) {
           router.replace(`/chat?id=${newId}&charId=${character?.id || ''}`);
        } else {
           // 如果 ID 不变，我们仍然可以用 replace 去除 URL 中的 return_from 等参数
           router.replace(`/chat?id=${newId}&charId=${character?.id || ''}`);
        }
      },
      { 
        return_from_name: returnFrom, 
        return_context: returnCtx || '',
        force_clear_history: true, // 返回接话的触发器也不要带之前的长记录，避免混淆指令
        model: MODELS[modelIdx].id
      }
    );
  }, [character, returnFrom, returnCtx, returnKey, returnToName, initialCharId, convId, setMessages, sendMessage, router, modelIdx]);

  useEffect(() => {
    if (messages.length === 0) return;
    const wasLoading = prevLoadingForAssessRef.current;
    prevLoadingForAssessRef.current = loading;
    if (!wasLoading || loading) return;

    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') {
      // 非 AI 消息时也要保存对话（如用户消息）
      if (convId) {
        (async () => {
          const conv = await getConversation(convId);
          if (conv) {
            conv.history = messages;
            conv.lastMsg = lastMsg.content;
            conv.updatedAt = new Date().toISOString();
            await updateConversation(conv);
          }
        })();
      }
      return;
    }

    // ── 线索收集：检测并处理 [SHOW_LEAD_FORM] / [SAVE_LEAD] 标签 ────────────
    const rawContent = lastMsg.content || '';
    const hasLeadForm = /\[SHOW_LEAD_FORM\]/i.test(rawContent);
    const savLeadMatch = /\[SAVE_LEAD\]([\s\S]*?)\[\/SAVE_LEAD\]/i.exec(rawContent)
                      || /\[SAVE_LEAD\]([\s\S]+)$/i.exec(rawContent);

    if (hasLeadForm && lastMsg.id) {
      setLeadMsgIds(prev => new Set([...prev, lastMsg.id!]));
    }

    if (savLeadMatch) {
      // AI 自动调用 [SAVE_LEAD] → 后台静默保存
      try {
        const leadData = JSON.parse(savLeadMatch[1].trim());
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...leadData, sourceCharId: character?.id, sourceCharName: character?.name, sourceConvId: convId }),
        }).catch(() => {});
      } catch { /* 解析失败忽略 */ }
    }

    // 清除 lead 标签
    const cleanLeadTags = (t: string) => t
      .replace(/\[SAVE_LEAD\][\s\S]*?\[\/SAVE_LEAD\]/gi, '')
      .replace(/\[SAVE_LEAD\][\s\S]*/gi, '')
      .replace(/\[SHOW_LEAD_FORM\]/gi, '')
      .trim();

    const cleanedLeadContent = cleanLeadTags(rawContent);
    const { cleanText: textAfterReport, reportData } = parseDashTags(cleanedLeadContent);
    // 链式调用：再从 zj_report 清理后的文本里解析 zj_module 标签
    let { cleanText, moduleData } = parseModuleTags(textAfterReport);
    
    // 核心诉求实现：如果查到人才，不要去存后面的结构化tag，直接把回答存进去！
    const isTalent = /<zj_talent_list/i.test(textAfterReport) || /<zj_talent_card/i.test(textAfterReport) || (cleanText.length > 100 && /专家|教授|研究员|人才/i.test(cleanText));
    if (!!assessmentSessionRef.current.typeId && isTalent) {
      moduleData = {
        title: moduleData?.title || "专家匹配与分析",
        content: cleanText
      };
    } else if (!moduleData && !!assessmentSessionRef.current.typeId && cleanText.trim().length > 0) {
      // 绝对兜底：只要是在测评中，哪怕 AI 违背指令没写结构化 tag，哪怕字数很短，也必须强行存入模块，保证“每一轮都存”
      moduleData = {
        title: "阶段性进展",
        content: cleanText
      };
    }

    const needsUpdate = hasLeadForm || !!savLeadMatch || !!reportData || !!moduleData;

    // 计算最终要写入消息的内容（含 [ZJ_REPORT_DONE:] 标记，且已剥离 zj_module）
    const finalContent = needsUpdate ? cleanText : rawContent;

    if (needsUpdate) {
      setMessages(prev => prev.map(m =>
        m.id === lastMsg.id ? { ...m, content: cleanText } : m
      ));
    }

    // ── 保存对话：使用处理后的内容（含 [ZJ_REPORT_DONE:] 标记），避免云端存入原始 <zj_report> XML ──
    if (convId) {
      (async () => {
        const conv = await getConversation(convId);
        if (conv) {
          // 用 finalContent 替换最后一条 AI 消息，确保存入的是 cleanText + [ZJ_REPORT_DONE:]
          conv.history = messages.map(m =>
            m.id === lastMsg.id ? { ...m, content: finalContent } : m
          );
          conv.lastMsg = finalContent.replace(/\[ZJ_REPORT_DONE:[^\]]*\]/g, '').trim().slice(0, 120);
          conv.updatedAt = new Date().toISOString();
          await updateConversation(conv);
        }
      })();
    }

    // ── 处理 zj_module：累积到测评会话报告 ───────────────────────────────────
    if (moduleData && character) {
      const session = assessmentSessionRef.current;
      const newModules = [...session.modules, moduleData];
      session.modules = newModules;
      // 激活"已存入报告模块"标签（替换"存为报告"按钮）
      setAssessmentModuleActive(true);

      (async () => {
        try {
          const fullContent = buildAssessmentReport(newModules, character.name || '');
          const reportTitle = session.reportTitle ||
            `${character.name} · ${session.typeId?.replace(/_/g, ' ') || '分析'} 报告`;

          const resp = await fetch('/api/reports/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // 若已有报告 ID，则追加更新；否则新建
              ...(session.reportId ? { id: session.reportId } : {}),
              title: reportTitle,
              summary: `共 ${newModules.length} 个分析模块，最新：${moduleData.title}`,
              content: fullContent,
              charId: character.id,
              charName: character.name,
              format: 'markdown',
            }),
          });
          const result = await resp.json();
          // 第一次新建时，保存返回的 ID，后续轮次复用
          if (!session.reportId && result.data?.id) {
            session.reportId = result.data.id;
          }
        } catch { /* ignore */ }
      })();
    }

    // 检测 AI 建议结束测评标签
    if (/\[ASSESSMENT_END_SUGGEST\]/i.test(rawContent) && assessmentModuleActive) {
      setAssessmentEndSuggested(true);
    }

    if (!reportData) return;
    const cardEntry: ReportCard = { afterMsgId: lastMsg.id ?? '', data: reportData, saved: false };
    setReportCards(prev => {
      // 去重：如果已经有这条消息的卡片，不重复添加
      if (prev.some(c => c.afterMsgId === (lastMsg.id ?? ''))) return prev;
      return [...prev, cardEntry];
    });

    if (character) {
      (async () => {
        try {
          // 优先使用 _raw（Markdown 报告），否则用结构化 JSON 转换
          const rawContent = reportData._raw as string | undefined;
          const markdown = rawContent || reportToMarkdown(reportData);

          // 若当前测评会话已有积累报告，则把 zj_report 也追加进去（而非新建）
          const session = assessmentSessionRef.current;
          await fetch(`/api/reports/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...(session.reportId ? { id: session.reportId } : {}),
              title: (reportData.title as string) || '成长报告',
              summary: (reportData.summary as string) || '',
              content: markdown,
              charId: character.id,
              charName: character.name,
              format: 'markdown',
              convId: convId,
            }),
          });
          setReportCards(prev => prev.map(c =>
            c.afterMsgId === lastMsg.id ? { ...c, saved: true } : c
          ));
        } catch { /* ignore */ }
      })();
    }
  }, [loading, convId, messages, character, setMessages]);




  const saveMockInteraction = async (ask: string, aiData: any, currentConvId?: string) => {
    try {
      const res = await fetch('/api/conversations/mock-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convId: currentConvId,
          charId: character?.id || '',
          charName: character?.name || '',
          ask,
          ai_data: aiData
        })
      });
      const data = await res.json();
      if (data.ok && data.convId) {
        if (!currentConvId || currentConvId !== data.convId) {
          router.replace(`/chat?id=${data.convId}&charId=${character?.id || ''}`);
        }
        return data.convId;
      }
    } catch (e) {
      console.error('saveMockInteraction failed', e);
    }
    return currentConvId;
  };

  // 解析文本类简历（TXT 直接传文本）
  const processResumeText = async (textContent: string, sourceName?: string, userAskContext?: string) => {
    let currentConvId = convId || undefined;
    if (!currentConvId && character) {
      const newConv = await createConversation(character.id, character.name || 'AI 助手');
      currentConvId = newConv.id;
      router.replace(`/chat?id=${currentConvId}&charId=${character.id}`);
    }

    const loadingId = 'ai-'+Date.now();
    setMessages(prev => [...prev, { id: loadingId, role: 'assistant', content: `正在调用智查查引擎解析${sourceName ? `「${sourceName}」` : '简历文本'}...` }]);
    
    try {
      const res = await fetch('/api/talent-audit/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textContent }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.resume) throw new Error('AI 返回格式异常，缺少 resume 字段');
      
      await _finishResumeProcess(data.resume, sourceName, userAskContext, loadingId, currentConvId);
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        content: `解析失败：${err instanceof Error ? err.message : String(err)}`
      } : m));
    }
  };

  // 解析文件类简历（PDF 用 FormData，由服务端 pdf-parse 解析）
  const processResumeFile = async (file: File, userAskContext?: string) => {
    let currentConvId = convId || undefined;
    if (!currentConvId && character) {
      const newConv = await createConversation(character.id, character.name || 'AI 助手');
      currentConvId = newConv.id;
      router.replace(`/chat?id=${currentConvId}&charId=${character.id}`);
    }

    const loadingId = 'ai-'+Date.now();
    setMessages(prev => [...prev, { id: loadingId, role: 'assistant', content: `正在调用智查查引擎解析「${file.name}」...` }]);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const res = await fetch('/api/talent-audit/parse', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data?.resume) throw new Error('AI 返回格式异常，缺少 resume 字段');

      await _finishResumeProcess(data.resume, file.name, userAskContext, loadingId, currentConvId);
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === loadingId ? {
        ...m,
        content: `解析失败：${err instanceof Error ? err.message : String(err)}`
      } : m));
    }
  };

  // 解析完成后的公共逻辑：存云端报告 + 更新卡片消息
  const _finishResumeProcess = async (
    resumeObj: any, 
    sourceName: string | undefined, 
    userAskContext: string | undefined,
    loadingId: string,
    currentConvId: string | undefined
  ) => {
    const eduCount = (resumeObj.education || []).length;
    const expCount = (resumeObj.experience || []).length;
    const paperCount = (resumeObj.publications || resumeObj.papers || []).length;
    const statsStr = `教育经历 ${eduCount} 项 · 工作经历 ${expCount} 项 · 论文专著 ${paperCount} 项`;

    // 存到云端报告（这样 TalentAuditPage 才能通过 /api/reports/:id 加载）
    let cloudResumeId: string | null = null;
    try {
      const saveRes = await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `人才验真报告: ${(resumeObj.name || '未知候选人').substring(0, 20)}`,
          summary: resumeObj.summary || '简历解析完成',
          content: JSON.stringify({
            resume: resumeObj,
            stats: { match: 0, mismatch: 0, manual_review: 0 },
            overallEvaluation: { level: 'PENDING', text: '等待执行深度审计引擎。' },
            factItems: []
          }),
          format: 'json',
        }),
      });
      if (saveRes.ok) {
        const saveData = await saveRes.json();
        cloudResumeId = saveData.id || saveData.data?.id || null;
      }
    } catch (e) {
      console.error('存云端报告失败', e);
    }

    // 如果云端存储失败，备用 localStorage
    const resumeId = cloudResumeId || `resume_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    if (!cloudResumeId) {
      localStorage.setItem(resumeId, JSON.stringify(resumeObj));
    }

    setMessages(prev => prev.map(m => m.id === loadingId ? {
      ...m,
      content: '',
      yidaAuditOverview: true,
      yidaResumeId: resumeId,
      // @ts-ignore
      yidaResumeStats: statsStr
    } : m));

    setTimeout(() => {
      setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '为您生成了这份简历的初步审查概览。点击前往智查查界面查看详细的验真进程，获取报告。\n\n验真结束后您可以回到对话围绕报告进行交流。' }]);
    }, 500);

    const aiData = {
      role: 'ai',
      content: '',
      yidaAuditOverview: true,
      yidaResumeId: resumeId,
      yidaResumeStats: statsStr
    };
    const updatedConvId = await saveMockInteraction(userAskContext || `[上传文件: ${sourceName || '简历'}]`, aiData, currentConvId);

    setTimeout(async () => {
       const followUpData = {
         role: 'ai',
         content: '为您生成了这份简历的初步审查概览。点击前往智查查界面查看详细的验真进程，获取报告。\n\n验真结束后您可以回到对话围绕报告进行交流。'
       };
       await saveMockInteraction('', followUpData, updatedConvId);
    }, 500);
  };

  const handleActualFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const userContext = `[上传文件: ${file.name}]`;
    setMessages(prev => [...prev, { id: 'user-'+Date.now(), role: 'user', content: userContext, yidaFilename: file.name, yidaFileSize: file.size }]);
    
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        // PDF 必须用 FormData 发给服务端用 pdf-parse 解析，不能用 file.text()（二进制文件会乱码）
        await processResumeFile(file, userContext);
      } else {
        const text = await file.text();
        await processResumeText(text, file.name, userContext);
      }
    } catch(err) {
      setMessages(prev => [...prev, { id: 'ai-'+Date.now(), role: 'assistant', content: `无法读取文件：${err instanceof Error ? err.message : String(err)}` }]);
    }
    e.target.value = '';
  };

  const startRecording = async (e?: React.TouchEvent | React.MouseEvent) => {
    if (e && e.cancelable) e.preventDefault();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4'; // fallback for iOS Safari
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // Let browser choose
        }
      }
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      // Request data every 200ms to avoid iOS Safari empty chunk bug
      mediaRecorder.start(200);
      setIsRecording(true);
      setIsRecognizing(false);
    } catch (err) {
      console.error('Mic access denied:', err);
      alert('无法访问麦克风，请检查浏览器权限设置。');
    }
  };

  const stopRecording = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e && e.cancelable) e.preventDefault();
    if (mediaRecorderRef.current && isRecording) {
      setIsRecording(false);
      setIsRecognizing(true);
      
      mediaRecorderRef.current.onstop = async () => {
        // Find correct type from recorder, fallback to webm
        const type = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        
        // Clean up tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(t => t.stop());

        if (audioBlob.size === 0) {
          antMsg.info('录音时间太短，请长按再说一遍');
          setIsRecognizing(false);
          setInputMode('text');
          return;
        }
        
        try {
          let finalBlob = audioBlob;
          let finalType = type;
          
          try {
            finalBlob = await convertBlobToWav(audioBlob);
            finalType = 'audio/wav';
          } catch (convErr) {
            console.warn('WAV conversion failed, using original blob', convErr);
          }

          const formData = new FormData();
          formData.append('file', finalBlob, finalType === 'audio/wav' ? 'voice_record.wav' : 'voice_record');
          formData.append('mimeType', finalType);
          const res = await fetch('/api/stt', { method: 'POST', body: formData });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${res.status}`);
          }
          const data = await res.json();
          if (data.text) {
            handleSend(data.text);
          } else {
            antMsg.info('未检测到有效的语音内容，请长按再说一遍');
          }
        } catch (err: any) {
          console.error(err);
          alert('语音识别失败：' + (err.message || '请重试'));
        } finally {
          setIsRecognizing(false);
          setInputMode('text');
        }
      };
      
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        // Ignore if not supported
      }
      mediaRecorderRef.current.stop();
    }
  };

  const handleSend = async (val?: string) => {
    const text = val || inputValue;
    if (!text.trim() || loading) return;
    


    setInputValue('');
    let currentConvId = convId || undefined;
    if (!currentConvId && character) {
      const newConv = await createConversation(character.id, character.name || 'AI 助手');
      currentConvId = newConv.id;
      router.replace(`/chat?id=${currentConvId}&charId=${character.id}`);
    }
    await sendMessage(text, character?.id, currentConvId, (newId: string) => {
      lastLoadedConvId.current = newId;
      router.replace(`/chat?id=${newId}&charId=${character?.id || ''}`);
    }, { model: MODELS[modelIdx].id, activeMode: activeMode || undefined });
  };
  sendRef.current = handleSend;

  const avatarUrl = (() => {
    if (!character) return null;
    if (character.id === 'yida_main') return '/assets/characters/yida_main/avatar_cropped.jpeg';
    const isValidAvatar = character.avatar && character.avatar !== '/assets/default-ai-robot.png';
    const src = isValidAvatar ? character.avatar : (character.assets?.avatar || character.assets?.idle || character.avatar);
    if (!src) return null;
    return src.startsWith('http') || src.startsWith('/') ? src : `/characters/${character.id}/${src}`;
  })();

  const isWelcomeState = messages.length <= 1 && !messages.find(m => m.role === 'user');
  // 新对话开场：没有 convId 说明是全新对话，用这个来控制虚拟消息是否显示
  const isNewChat = !convId;

  const lookupSlug = (s: string) => s.replace(/_mcp$/, '');
  const assessmentTypes = character ? (
    CAT_ASSESSMENT_TYPES[character.id] ||
    CAT_ASSESSMENT_TYPES[character.slug || ''] ||
    CAT_ASSESSMENT_TYPES[lookupSlug(character.slug || '')] ||
    []
  ) : [];
  const hasAssessment = assessmentTypes.length > 0;

  // ── 从 B 返回 A ──────────────────────────────────────────────────────────
  const handleReturnToA = () => {
    if (!hfFromBar) return;
    const { name: fromName, charId: prevCharId, convId: prevConvId } = hfFromBar;
    const myName = character?.name || 'AI';
    // 生成摘要（取最近6条非系统消息）
    const briefing = messages
      .filter(m => m.role !== 'system' && (m.content || '').trim() &&
        !(m.content || '').startsWith('__RETURN_EVENT__'))
      .slice(-6)
      .map(m => `${m.role === 'user' ? '用户' : myName}：${(m.content || '').slice(0, 100)}`)
      .join('；');
    // 把摘要存入 sessionStorage，URL 只传 key（保持 URL 整洁）
    // 同时存 A 的名字（toName），避免跳回后 character 还没加载时名字错误
    const returnKey = `zhiji_return_ctx_${Date.now()}`;
    sessionStorage.setItem(returnKey, JSON.stringify({
      fromName: myName,       // B 的名字
      toName: fromName,       // A 的名字（来自 hfFromBar.name）
      briefing
    }));
    // 清除 handoff 来源记录
    sessionStorage.removeItem('zhiji_hf_from_name');
    sessionStorage.removeItem('zhiji_hf_from_char_id');
    sessionStorage.removeItem('zhiji_hf_from_conv_id');
    sessionStorage.removeItem('zhiji_hf_target_char_id');
    sessionStorage.removeItem('zhiji_hf_target_conv_id');
    setShowHfFromBar(false);
    setHfFromBar(null);
    // URL 只传 return_from 和 session key，不放全文
    const queryStr = prevConvId
      ? `id=${prevConvId}&charId=${encodeURIComponent(prevCharId)}&return_from=${encodeURIComponent(myName)}&return_key=${returnKey}`
      : `charId=${encodeURIComponent(prevCharId)}&return_from=${encodeURIComponent(myName)}&return_key=${returnKey}`;
    // 使用 window.location.href 强制浏览器跳转，保证组件卸载/数据清理干净
    window.location.href = `/chat?${queryStr}`;
  };

  const handleShare = () => setShowShare(true);

  // 结束本轮测评，生成最终报告（带尾注）并清除状态
  const handleEndAssessment = async () => {
    const session = assessmentSessionRef.current;
    if (!session.reportId) return;

    let finalContent: string;
    if (session.modules.length > 0) {
      finalContent = buildAssessmentReport(session.modules, character?.name || '', true);
    } else {
      const res = await fetch(`/api/reports/${session.reportId}`);
      const report = await res.json();
      finalContent = report.content || buildAssessmentReport([], character?.name || '', true);
    }
    try {
      // 用包含尾注的内容覆盖更新当前报告
      await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.reportId,
          title: session.reportTitle || `${character?.name || 'AI'} 测评报告`,
          content: finalContent,
          charId: character?.id,
          charName: character?.name,
          format: 'markdown',
        }),
      });
      
      setAssessmentModuleActive(false);
      setAssessmentEndSuggested(false);
      assessmentSessionRef.current = { reportId: null, typeId: null, reportTitle: null, modules: [] };

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `测评已圆满结束，完整的报告已经保存在您的报告中心啦！如果需要更深度的咨询，可以随时通过报告底部的联系方式与我们团队沟通 😊`
      }]);
    } catch (e) {
      console.error(e);
    }
  };

  // 手动将 AI 消息内容存为报告
  const handleManualSaveReport = async (msg: { id?: string; content?: string }) => {
    if (!msg.id || !character) return;
    setSavingMsgId(msg.id);
    try {
      // 过滤掉 $think% 思考块，防止内部思考过程进入报告
      const rawContent = (msg.content || '')
        .replace(/\$think%[\s\S]*?\$\/think%/g, '')
        .trim();
      
      // 调用大模型生成简短标题
      let title = '';
      try {
        const titleRes = await fetch('/api/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'assistant', content: rawContent }] })
        });
        if (titleRes.ok) {
          const titleData = await titleRes.json();
          if (titleData.title) title = titleData.title;
        }
      } catch (e) {
        console.error('Failed to generate title', e);
      }
      
      if (!title) {
        // Fallback: 取前 20 字作标题（去掉 Markdown 标记）
        const titlePreview = rawContent
          .replace(/<[^>]+>/g, '')
          .replace(/[#*>`\-]/g, '')
          .slice(0, 22).trim();
        title = titlePreview || 'AI 成长建议';
      }

      await fetch('/api/reports/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          summary: '',
          content: rawContent,
          charId: character.id,
          charName: character.name,
          format: 'markdown',
        }),
      });
      setManualSavedMsgIds(prev => new Set([...prev, msg.id!]));
      antMsg.success('已保存到报告记录');
    } catch {
      antMsg.error('保存失败，请稍后重试');
    } finally {
      setSavingMsgId(null);
    }
  };

  return (
    <>
    <div className={s.main}>

      {isMobile && character && (
        <MobileCharProfile
          open={showMobileProfile}
          onClose={() => setShowMobileProfile(false)}
          character={character}
          aiStatus={aiStatus}
          onSkillClick={(skill) => {
            setInputValue(skill);
            inputRef.current?.focus();
          }}
        />
      )}

      {/* 手机端顶部导航栏：yida_main 已经使用了全局的精简透明顶导，这里隐藏以防重复 */}
      {isMobile && character && character.id !== 'yida_main' && !showMobileProfile && (
        <MobileChatTopBar
          character={character}
          avatarUrl={avatarUrl}
          onBack={() => goBackSafe(router)}
          onShare={handleShare}
          onProfileClick={() => setShowMobileProfile(true)}
        />
      )}

      {/* 全功能分享 Modal（含海报 + 一键下载）*/}
      {character && (
        <ShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          character={character}
        />
      )}

      {showPicker && hasAssessment && (
        <AssessmentPicker
          charId={character!.id}
          types={assessmentTypes}
          onSelect={handleAssessmentSelect}
          onClose={() => setShowPicker(false)}
          subtitle={character?.id === 'cat_research'
            ? '输入企业信息，AI分析科研需求与团队匹配度，生成产研转化分析报告'
            : undefined}
        />
      )}

      <div className={s.messages}>

        {/* ── 欢迎屏：3 条虚拟"AI消息"，新对话时置顶，随对话上滚不消失 ── */}
        {messages.length === 0 && character && (() => {
          const isWebLanding = !isMobile && character.id === 'yida_main' && !showYidaGreeting;
          
          if (isMobile && character.id === 'yida_main' && !showYidaGreeting) {
            return (
              <div className="flex flex-col items-center justify-start w-full px-4 pt-[8vh] animate-fade-in" style={{ flex: 1, minHeight: '100%', paddingBottom: '12px' }}>
                <h1 className="text-[28px] font-bold text-[#1e293b] mb-2 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>
                  你好，{displayUsername} 👋
                </h1>
                <p className="text-[16px] text-[#64748b] mb-10 text-center">
                  需要我做些什么？
                </p>
                
                <div className="relative w-[110px] h-[110px] rounded-full flex items-center justify-center animate-float">
                  <div className="absolute inset-0 bg-[#427759]/20 blur-[24px] rounded-full pointer-events-none mix-blend-overlay opacity-80"></div>
                  <div className="relative z-10 w-full h-full rounded-full bg-white shadow-[0_8px_32px_rgba(96,85,245,0.15)] flex items-center justify-center overflow-hidden border border-white/60">
                     <img src="/assets/cute_ai_orb_home.png" alt="yida" className="w-[180%] h-[180%] max-w-none object-center" />
                  </div>
                </div>

                {/* 移动端卡片入口（缩小版，图标和标题同一行） */}
                <div className="grid grid-cols-2 gap-2.5 w-full mt-4 mb-auto max-w-[500px]">
                  {[
                    { label: '查人才', desc: '挖掘全球学者', icon: <User size={16} />, bg: '#eff6ff', iconBg: '#3b82f6', iconColor: '#fff', action: () => { setActiveMode('talents'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'talents') }]); setShowYidaGreeting(true); } },
                    { label: '人才检测', desc: '多维背景核验', icon: <ShieldCheck size={16} />, bg: '#eef2ff', iconBg: '#6366f1', iconColor: '#fff', action: () => { setActiveMode('audit'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'audit') }]); setShowYidaGreeting(true); } },
                    { label: '找资源', desc: '智能匹配供应商', icon: <Library size={16} />, bg: '#f3e8ff', iconBg: '#a855f7', iconColor: '#fff', action: () => { setActiveMode('resources'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'resources') }]); setShowYidaGreeting(true); } },
                    { label: '产学研分析', desc: '企业需求洞察', icon: <Activity size={16} />, bg: '#f5f3ff', iconBg: '#8b5cf6', iconColor: '#fff', action: () => { setActiveMode('analysis'); setShowPicker(true); setShowYidaGreeting(true); } },
                  ].map(btn => (
                    <button 
                      key={btn.label}
                      onClick={btn.action}
                      className="flex flex-row items-center p-3 rounded-2xl transition-transform active:scale-95 text-left border border-white/40 shadow-sm"
                      style={{ background: btn.bg }}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 shadow-sm flex-shrink-0" style={{ background: btn.iconBg, color: btn.iconColor }}>
                        {btn.icon}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-[14px] text-[#1e293b] leading-tight mb-0.5 truncate">{btn.label}</span>
                        <span className="text-[11px] text-[#475569] leading-tight truncate">{btn.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* 移动端下方的小气泡（放在提问框的正上方，支持横向滚动） */}
                <div 
                  className="flex mt-auto overflow-x-auto pb-1 snap-x w-full" 
                  style={{ 
                    scrollbarWidth: 'none', 
                    msOverflowStyle: 'none', 
                    WebkitOverflowScrolling: 'touch', 
                    marginBottom: '-12px'
                  }}
                >
                  <div className="flex gap-2.5 w-max items-center">
                    {[
                      { label: '聊点什么？', icon: <Sparkles size={14} />, action: () => setShowYidaGreeting(true), highlight: true },
                      { label: '政策查询', icon: <Globe size={14} />, action: () => { setActiveMode('policy'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'policy') }]); setShowYidaGreeting(true); } },
                      { label: '找数据', icon: <Database size={14} />, action: () => { setActiveMode('data'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'data') }]); setShowYidaGreeting(true); } },
                      { label: '写材料', icon: <PenTool size={14} />, action: () => { setActiveMode('write'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'write') }]); setShowYidaGreeting(true); } },
                      { label: '会议邀约', icon: <Calendar size={14} />, action: () => { setActiveMode('conference_invite'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'conference_invite') }]); setShowYidaGreeting(true); } },
                    ].map(btn => (
                      <button 
                        key={btn.label}
                        onClick={btn.action}
                        className={`py-2 px-3.5 rounded-full text-[13px] font-medium transition-transform active:scale-95 flex items-center justify-center shadow-sm border whitespace-nowrap snap-start flex-shrink-0 ${
                          btn.highlight 
                            ? 'bg-[#f4f3ff] text-[#427759] border-[#e2e8f0]'
                            : 'bg-white/90 backdrop-blur-md text-[#334155] border-[#f1f5f9] hover:bg-white'
                        }`}
                      >
                        <span className={`flex items-center justify-center mr-1.5 ${btn.highlight ? 'text-[#427759]' : 'text-[#64748b]'}`}>{btn.icon}</span>
                        <span>{btn.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          
          if (isWebLanding) {
            // Web landing UI is rendered in the .composer area to position everything centrally.
            return null;
          }

          const portraitUrl = (() => {
            if (character.id === 'yida_main') return '/assets/characters/yida_main/avatar_cropped.jpeg';
            const src = character.assets?.idle || character.assets?.hero || (character.avatar && character.avatar !== '/assets/default-ai-robot.png' ? character.avatar : null);
            if (!src) return '/assets/default-ai-robot.png';
            return src.startsWith('http') || src.startsWith('/') ? src : `/characters/${character.id}/${src}`;
          })();

          const greetingText = isFirstVisit
            ? `你好，${displayUsername}，\n初次见面，很高兴认识你！`
            : `欢迎回来，${displayUsername}！`;

          const introBubbleText = (() => {
            if (isFirstVisit) {
              return character.intro || character.description || character.tagline || '';
            }
            if (profileFragments.length === 0) {
              return '目前你在"知己"的信息还很少，随着交流，我们所有AI都会更加了解你的情况，给你更适合的建议。';
            }
            const milestoneText = profileFragments.length === 1
              ? `「${profileFragments[0]}」`
              : `「${profileFragments[0]}」和「${profileFragments[1]}」`;
            return `我翻了翻你的档案，有些新记录引起了我的注意：${milestoneText}。想从这里聊起，还是探索些新的方向？——我这边正好备着一些话题。`;
          })();

          const quickPrompts = (character.quick_prompts as string[] | undefined)?.slice(0, 7) || [];

          const handlePromptClick = (p: string) => {
            const matchedType = assessmentTypes.find(t => p.includes(t.name) || p.includes(t.id));
            if (matchedType) handleAssessmentSelect(matchedType.id);
            else handleSend(p);
          };

          return (
            <>
              {/* 消息 1：形象大图 + 招呼卡 */}
              {!(isMobile && character.id === 'yida_main') && (
              <div className={s.assistantMsgWrap} style={{ padding: isMobile ? '0 5px' : '0 22px', marginTop: 28, animation: 'msg-in 0.22s ease-out' }}>
                <div style={{
                  borderRadius: 22,
                  overflow: 'hidden',
                  maxWidth: 360,
                  boxShadow: '0 8px 32px rgba(91,64,232,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255,255,255,0.7)',
                }}>
                  {/* 图片区 */}
                  <div style={{ width: '100%', height: isMobile ? 200 : 230, position: 'relative', background: '#1a1a2e' }}>
                    <img src={portraitUrl} alt={character.name}
                      onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                    {/* 图片底部渐变过渡 */}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(20,20,40,0.85) 100%)', pointerEvents: 'none' }} />
                    {/* 图片内叠加的 AI 名字 */}
                    <div style={{ position: 'absolute', bottom: 16, left: 20, right: 20, zIndex: 2 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>
                        {character.tagline || 'AI 助手'}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{character.name}</div>
                    </div>
                  </div>
                  {/* 招呼文字区：毛玻璃底色 */}
                  <div style={{
                    padding: '18px 22px 20px',
                    background: 'rgba(245,246,252,0.92)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                  }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.45, whiteSpace: 'pre-line' }}>{greetingText}</div>
                  </div>
                </div>
              </div>
              )}

              {/* 消息 2：普通 AI 气泡（自我介绍 / 回访摘要） */}
              {introBubbleText && (
                <div className={s.assistantMsgWrap} style={{ padding: isMobile ? '0 5px' : '0 22px', marginTop: 8 }}>
                  <div className={s.assistantHeader}>
                    <div className={s.assistantAvatar}>
                      {portraitUrl ? <img src={portraitUrl} alt="" className={s.assistantAvatarImg} /> : <div className={s.assistantAvatarFallback}>AI</div>}
                    </div>
                    <span className={s.assistantName}>{character.name}</span>
                  </div>
                  <div className={s.assistantContent}>{introBubbleText}</div>
                </div>
              )}

              {/* 消息 3：你可能感兴趣 — 毛玻璃气泡，宽度跟文字走 */}
              {quickPrompts.length > 0 && (
                <div className={s.assistantMsgWrap} style={{ padding: isMobile ? '0 5px' : '0 22px', marginTop: 8 }}>
                  <div className={s.assistantHeader}>
                    <div className={s.assistantAvatar}>
                      {portraitUrl ? <img src={portraitUrl} alt="" className={s.assistantAvatarImg} /> : <div className={s.assistantAvatarFallback}>AI</div>}
                    </div>
                    <span className={s.assistantName}>{character.name}</span>
                  </div>
                  <div className={s.assistantContent}>
                    <div style={{ marginBottom: 10, color: 'rgba(0,0,0,0.4)', fontSize: 12, fontWeight: 500, letterSpacing: '0.04em' }}>你可能感兴趣</div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 7 }}>
                      {quickPrompts.map(p => (
                        <button key={p} onClick={() => handlePromptClick(p)}
                          style={{
                            display: 'inline-flex', alignItems: 'flex-start', gap: 7,
                            padding: '9px 16px', borderRadius: 18,
                            background: 'rgba(255,255,255,0.72)',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            border: '1px solid rgba(91,64,232,0.15)',
                            boxShadow: '0 2px 10px rgba(91,64,232,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
                            color: '#1a1a2e', fontSize: 14, fontWeight: 500,
                            cursor: 'pointer', whiteSpace: 'normal', textAlign: 'left', wordBreak: 'break-word',
                            transition: 'all 0.15s', userSelect: 'none',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(91,64,232,0.08)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,64,232,0.3)';
                            (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.72)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,64,232,0.15)';
                            (e.currentTarget as HTMLElement).style.transform = '';
                          }}
                        >
                          <span style={{ color: 'rgba(91,64,232,0.8)', fontWeight: 700, fontSize: 13, marginTop: 2 }}>#</span>
                          <span style={{ lineHeight: 1.4 }}>{p}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}


        {/* ── 来源胶囊（B 侧顶部，点击可返回）─────────────────────────── */}
        {showHfFromBar && hfFromBar && (
          <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
            <span
              onClick={handleReturnToA}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'linear-gradient(135deg, rgba(96,85,245,0.1), rgba(120,108,255,0.08))',
                border: '1px solid rgba(96,85,245,0.22)',
                borderRadius: 20, padding: '5px 14px',
                fontSize: 12, color: '#5b4fe0', fontWeight: 500,
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              来自 {hfFromBar.name} 的转介 · 返回{hfFromBar.name}
            </span>
          </div>
        )}

        {messages
          // 隐藏系统内部触发消息，不作为对话气泡展示给用户
          .filter(msg => {
            const c = (msg.content || '').trim();
            return c !== '[handoff_trigger]' && 
                   c !== '[return_trigger]' &&
                   !c.startsWith('[系统：') &&
                   !c.startsWith('[系统指令]');
          })
          .map((msg, index, arr) => {
            const isLastAndLoading = loading && index === arr.length - 1;
            // ── 系统事件消息：显示为对话流里的标题胶囊 ──
            if ((msg.content || '').startsWith('__RETURN_EVENT__')) {
              const parts = (msg.content || '').split('__');
              const fromName = parts[2] || '';
              const toName = parts[4] || '';
              return (
                <div key={msg.id} style={{ textAlign: 'center', padding: '14px 0 8px', userSelect: 'none' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 16px',
                    borderRadius: 20,
                    background: 'rgba(96,85,245,0.08)',
                    border: '1px solid rgba(96,85,245,0.18)',
                    fontSize: 12,
                    color: '#6b7280',
                  }}>
                    {fromName} 已完成任务，对话已回到 {toName}
                  </span>
                </div>
              );
            }
          // 跳过 loading 期间内容为空的 assistant 占位消息（避免和 ThinkingDots 同时出现）
          if (msg.role === 'assistant' && !msg.content?.trim() && loading) return null;
          return msg.role === 'user' ? (
            <div key={msg.id} className={s.userMsgWrap} style={{ padding: isMobile ? '0 5px' : '0 22px' }}>
              <div>
                <div className={s.userBubble}>
                  {msg.yidaFilename ? (
                    <div className="file-attachment">
                      <div className="file-icon-box"><FileText size={24} /></div>
                      <div className="file-info">
                        <div className="file-name">{msg.yidaFilename}</div>
                        <div className="file-size">{(msg.yidaFileSize || 0) / 1024 / 1024} MB • 已成功上传</div>
                      </div>
                    </div>
                  ) : (msg.content || '').startsWith('[ASSESSMENT_START:')
                    ? (() => {
                        const typeId = (msg.content || '').match(/\[ASSESSMENT_START:([^\]]+)\]/)?.[1] || '';
                        const typeInfo = assessmentTypes.find(t => t.id === typeId);
                        return `${typeInfo?.icon ?? '🧪'} 开始${typeInfo?.name ?? '测评'}`;
                      })()
                    : msg.content
                  }
                </div>
                <div className={s.userTimestamp}>
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>
              </div>
            </div>
          ) : (
            <React.Fragment key={msg.id}>
              <div className={s.assistantMsgWrap} style={{ padding: isMobile ? '0 5px' : '0 22px' }}>
                <div className={s.assistantHeader}>
                  <div className={s.assistantAvatar}>
                    {avatarUrl ? <img src={avatarUrl} alt="" className={s.assistantAvatarImg} /> : <div className={s.assistantAvatarFallback}>AI</div>}
                  </div>
                  <span className={s.assistantName}>{character?.name || 'AI 助手'}</span>
                  <span className={s.assistantTime}>
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              <div className={s.assistantContent}>
                {msg.yidaToolCard ? (
                  <div className="inline-tool-card">
                    <div className="inline-tool-header">
                       <span className="inline-tool-role">{msg.yidaToolCard.role}</span>
                    </div>
                    <p className="inline-tool-greeting">{msg.yidaToolCard.greeting}</p>
                    
                    {msg.yidaToolCard.action === 'upload' ? (
                      <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={24} color="#5d5fef" />
                        <span className="upload-text">点击上传候选人简历</span>
                        <span className="upload-subtext">支持 PDF / Word / TXT 格式，最大 10MB</span>
                      </div>
                    ) : (
                      <div className="suggestions-list" style={{ marginTop: '16px' }}>
                        {msg.yidaToolCard.quickPrompts?.map((sug: any, i: number) => (
                          <button 
                            key={i} 
                            className="suggestion-pill"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSend(sug); }}
                            style={{ background: '#fff', border: '1px solid #eee', cursor: 'pointer' }}
                          >
                            <span className="hashtag" style={{ color: 'var(--primary)' }}>#</span>
                            <span className="suggestion-text">{sug}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : msg.yidaAuditOverview ? (
                  <div className="audit-overview-card">
                    <div className="overview-header">
                      <ShieldCheck size={18} className="text-success" />
                      <span style={{ fontWeight: 600 }}>数字化人才深度审计概览</span>
                    </div>
                    {/* @ts-ignore */}
                    {msg.yidaResumeStats ? (
                      <div style={{ padding: '16px 0 8px 0', fontSize: 13, color: '#475569', lineHeight: 1.6, borderBottom: '1px solid #f1f5f9' }}>
                        <div><strong>已提取实体数据：</strong></div>
                        {/* @ts-ignore */}
                        <div style={{ color: '#427759', fontWeight: 500, marginTop: 4 }}>{msg.yidaResumeStats}</div>
                      </div>
                    ) : (
                      <div className="overview-stats">
                        <div className="overview-stat"><span>匹配</span> <strong className="text-success">9</strong></div>
                        <div className="overview-stat"><span>异常</span> <strong className="text-danger">0</strong></div>
                        <div className="overview-stat"><span>人工核验</span> <strong className="text-warning">0</strong></div>
                      </div>
                    )}
                    <div className="overview-eval">
                      <Zap size={14} className="text-warning" /> 
                      <span>AI初筛状态：</span>
                      <span className="eval-badge" style={{ background: 'rgba(217,119,6,0.1)', color: '#d97706' }}>待开始深度比对</span>
                    </div>
                    <button className="view-detail-btn" onClick={() => {
                      if (msg.yidaResumeId) {
                        router.push(`/talent-audit/new?resumeId=${msg.yidaResumeId}&sourceConvId=${convId || ''}`);
                      } else {
                        setShowAuditModal(true);
                      }
                    }}>
                      查看完整逐条核查底稿
                    </button>
                  </div>
                ) : (
                  (() => {
                    const rawContent = msg.content || '';
                    // 收集已通过 zj_institute_card / zj_talent_card / zj_talent_list 渲染的实体名称，
                    // 避免 dash_entities 在底部再渲染一遍造成重复气泡
                    const excludedEntities = [
                      ...[...rawContent.matchAll(/<zj_institute_card\s+query="([^"]+)"\s*\/>/gi)].map(m => m[1]),
                      ...[...rawContent.matchAll(/<zj_talent_card\s+query="([^"]+)"\s*\/>/gi)].map(m => m[1]),
                      ...[...rawContent.matchAll(/<zj_talent_list\s+query="([^"]+)"\s*\/>/gi)].map(m => m[1]),
                    ];
                    return (
                      <MsgContent
                        message={msg}
                        text={rawContent
                          .replace(/\n?\[HANDOFF\b[^\]]*\](?:[\s\S]*?\[\/HANDOFF\])?/g, '')
                          .replace(/\n?\[TALENT_AUDIT\b[^\]]*\](?:[\s\S]*?\[\/TALENT_AUDIT\])?/gi, '')
                          .replace(/\n?\[ZJ_REPORT_DONE:[^\]]*\]/g, '')
                          .replace(/\[SAVE_LEAD\][\s\S]*?\[\/SAVE_LEAD\]/gi, '')
                          .replace(/\[SAVE_LEAD\][\s\S]*/gi, '')
                          .replace(/\[SHOW_LEAD_FORM\]/gi, '')
                          .replace(/<zj_recommend[^>]*>[\s\S]*?<\/zj_recommend>/gi, '')
                          .replace(/<zj_institute_card[^>]*\/>/gi, '')
                          .replace(/<zj_case_card[^>]*\/>/gi, '')
                          .replace(/<zj_project_card[^>]*\/>/gi, '')
                          .replace(/<zj_company_card[^>]*\/>/gi, '')
                          .replace(/<call\s+function="[^"]*"\s*\/>/gi, '')
                          .replace(/<call\b[^>]*>[\s\S]*?<\/call>/gi, '')
                          .replace(/<zj_report\b[^>]*>[\s\S]*?<\/zj_report>/gi, '')
                          .replace(/<student_profile[^>]*>[\s\S]*?<\/student_profile[^>]*>/gi, '')
                          .replace(/<student_profile[^>]*>/gi, '')}
                        excludedEntities={excludedEntities}
                        onEntityClick={setSelectedInstitute}
                        onTalentClick={setSelectedTalent}
                        onCompanyClick={setSelectedCompany}
                      />
                    );
                  })()
                )}
                
                {msg.yidaTalents && (
                  <div className="talent-tags-container animate-fade-in">
                    {msg.yidaTalents.map((talent: any) => (
                      <button 
                        key={talent.id} 
                        className="talent-tag"
                        onClick={() => setSelectedTalent(talent)}
                      >
                        <UserSquare2 size={14} />
                        {talent.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* zj_institute_card, zj_case_card, zj_project_card, zj_company_card 解析 */}
                {(() => {
                  const content = msg.content || '';
                  const instMatches = [...content.matchAll(/<zj_institute_card\s+query="([^"]+)"\s*\/>/gi)];
                  const caseMatches = [...content.matchAll(/<zj_case_card\s+query="([^"]+)"\s*\/>/gi)];
                  const projMatches = [...content.matchAll(/<zj_project_card\s+query="([^"]+)"\s*\/>/gi)];
                  const compMatches = [...content.matchAll(/<zj_company_card\s+query="([^"]+)"\s*\/>/gi)];
                  
                  if (instMatches.length === 0 && caseMatches.length === 0 && projMatches.length === 0 && compMatches.length === 0) return null;
                  
                  return (
                    <div className="talent-tags-container animate-fade-in" style={{ marginTop: 6 }}>
                      {instMatches.map((m, i) => (
                        <InstituteBubbleFetcher 
                          key={`inst-${i}`} 
                          query={m[1]} 
                          onSelectInstitute={setSelectedInstitute} 
                        />
                      ))}
                      {caseMatches.map((m, i) => (
                        <CaseBubbleFetcher 
                          key={`case-${i}`} 
                          query={m[1]} 
                          onSelectCase={setSelectedCase} 
                        />
                      ))}
                      {projMatches.map((m, i) => (
                        <ProjectBubbleFetcher 
                          key={`proj-${i}`} 
                          query={m[1]} 
                          onSelectProject={setSelectedProject} 
                        />
                      ))}
                      {compMatches.map((m, i) => (
                        <CompanyBubbleFetcher 
                          key={`comp-${i}`} 
                          query={m[1]} 
                          onSelectCompany={setSelectedCompany} 
                        />
                      ))}
                    </div>
                  );
                })()}

                {/* zj_recommend 推荐卡片 */}
                {(() => {
                  const recMatches: Array<{ type: string; id: string; reason: string }> = [];
                  const recRe = /<zj_recommend\s+type="([^"]+)"\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/zj_recommend>/gi;
                  let m: RegExpExecArray | null;
                  while ((m = recRe.exec(msg.content || '')) !== null) {
                    recMatches.push({ type: m[1], id: m[2], reason: m[3].trim() });
                  }
                  if (!recMatches.length) return null;
                  if (character?.id === 'yida_main') return null; // 一答Pro不展示推荐应用卡片
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {recMatches.map((rec, ri) => {
                        const catalog = rec.type === 'page' ? rrCatalog.pages : rrCatalog.apps;
                        const item = catalog.find(x => x.id === rec.id);
                        if (!item) return null;
                        return (
                          <RecommendCard
                            key={ri}
                            type={rec.type as 'page' | 'app'}
                            name={item.name}
                            description={item.description}
                            url={item.url}
                            icon={item.icon}
                            reason={rec.reason}
                          />
                        );
                      })}
                    </div>
                  );
                })()}

                {/* zj_talent_card & zj_talent_list */}
                {(() => {
                  const content = msg.content || '';
                  const cardMatches = [...content.matchAll(/<zj_talent_card\s+query="([^"]+)"\s*\/>/gi)];
                  const listMatches = [...content.matchAll(/<zj_talent_list\s+query="([^"]+)"\s*\/>/gi)];
                  
                  return (
                    <>
                      {cardMatches.map((m, i) => (
                        <TalentCardFetcher key={`card-${i}`} query={m[1]} onSelectTalent={setSelectedTalent} />
                      ))}
                      {listMatches.map((m, i) => (
                        <TalentListFetcher key={`list-${i}`} query={m[1]} onSelectTalent={setSelectedTalent} />
                      ))}
                    </>
                  );
                })()}
              </div>
              {!isLastAndLoading && (
                <div className={s.assistantActions}>
                  {/* 平方数据信源徽章 */}
                {msg.entity_used && (
                  <span title="本回复引用了平方数据库实时数据" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, color: '#427759', fontWeight: 500,
                    background: 'rgba(96,85,245,0.07)',
                    border: '1px solid rgba(96,85,245,0.18)',
                    borderRadius: 20, padding: '2px 9px',
                    marginRight: 6, cursor: 'default', userSelect: 'none',
                  }}>
                    🗄️ 平方数据
                  </span>
                )}
                <button onClick={() => { navigator.clipboard.writeText(msg.content || ''); antMsg.success('已复制'); }}
                  className={s.copyBtn}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
                  <span style={{ fontSize: 12 }}>⎘</span>复制
                </button>

                {/* 存为报告 / 已存入报告模块 */}
                {(msg.content || '').length > 10 && (
                  assessmentModuleActive ? (
                    // 猫猫秘书团测评进行中：自动积累模块，无需手动操作
                    <span style={{
                      marginLeft: 4,
                      padding: '3px 10px',
                      borderRadius: 20,
                      border: '1px solid rgba(96,85,245,0.2)',
                      background: 'rgba(96,85,245,0.06)',
                      color: '#427759',
                      fontSize: 12,
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      userSelect: 'none',
                    }}>
                      ✓ 已存入报告模块
                    </span>
                  ) : (
                    <button
                      onClick={() => handleManualSaveReport(msg)}
                      disabled={savingMsgId === msg.id || manualSavedMsgIds.has(msg.id ?? '')}
                      style={{
                        marginLeft: 4,
                        padding: '3px 10px',
                        borderRadius: 20,
                        border: '1px solid rgba(96,85,245,0.25)',
                        background: manualSavedMsgIds.has(msg.id ?? '')
                          ? 'rgba(96,85,245,0.08)'
                          : 'none',
                        color: manualSavedMsgIds.has(msg.id ?? '') ? '#427759' : '#9ca3af',
                        cursor: savingMsgId === msg.id || manualSavedMsgIds.has(msg.id ?? '') ? 'default' : 'pointer',
                        fontSize: 12,
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!manualSavedMsgIds.has(msg.id ?? '') && savingMsgId !== msg.id)
                          (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.06)';
                      }}
                      onMouseLeave={e => {
                        if (!manualSavedMsgIds.has(msg.id ?? ''))
                          (e.currentTarget as HTMLElement).style.background = 'none';
                      }}
                    >
                      {savingMsgId === msg.id ? '保存中…' :
                        manualSavedMsgIds.has(msg.id ?? '') ? '✓ 已存档' : '📋 存为报告'}
                    </button>
                  )
                )}

                {/* Lead 表单按鈕 */}
                {leadMsgIds.has(msg.id ?? '') && (
                  <button
                    onClick={() => setShowLeadModal(true)}
                    style={{
                      marginLeft: 8, padding: '4px 14px', borderRadius: 20,
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    📋 快速填写联系方式
                  </button>
                )}
                </div>
              )}
              </div>
              {/* ── Handoff 转介卡：在 assistantMsgWrap 结构里，对齐聊天流 ── */}
              {(() => {
                const raw = msg.content || '';
                const targetMatch = raw.match(/\[HANDOFF\b[^\]]*target="([^"]+)"/);
                const reasonMatch = raw.match(/\[HANDOFF\b[^\]]*reason="([^"]+)"/);
                const bodyMatch  = raw.match(/\[HANDOFF\b[^\]]*\]([\s\S]*?)\[\/HANDOFF\]/);
                if (!targetMatch || dismissedHandoffIds.has(msg.id ?? '')) return null;
                const targetId = targetMatch[1];
                const reason   = reasonMatch?.[1] || bodyMatch?.[1]?.trim() || '';
                const ctx      = bodyMatch?.[1]?.trim() || reason;

                const mappedTargetId = targetId;

                // 官方秘书团硬编码数据（不在 allCharacters 里）
                const BUTLER_CATALOG: Record<string, { name: string; idle: string; desc: string }> = {
                  cat_butler:   { name: '猫管家·生涯报考', idle: '/assets/characters/cat_butler/idle.png',   desc: '不知道填什么志愿？来找我帮你规划生涯方向。' },
                  cat_career:   { name: '猫管家·校招实习', idle: '/assets/characters/cat_career/idle.png',   desc: '求职没方向？我帮你准备好再出发。' },
                  cat_intl:     { name: '猫管家·国际教育', idle: '/assets/characters/cat_intl/idle.png',     desc: '出国留学没思路？从这里开始选校规划。' },
                  cat_research: { name: '猫管家·产研转化', idle: '/assets/characters/cat_research/idle.png', desc: '联接企业与科研，为你分析产业需求、推荐科研团队、评估匹配度。' },
                  yida_main:    { name: '一答智能体', idle: '/assets/characters/yida_main/handoff_card.png', desc: '平方数据驱动的综合 AI 平台，提供人才核验、产业研究、科研评估等真实权威数据支持。' },
                };
                const butlerEntry = BUTLER_CATALOG[mappedTargetId];
                // slug 查找：先 allCharacters（slug 字段 = flora_external_id），再查 extraChars
                const targetChar  = allCharacters.find(c => c.slug === mappedTargetId)
                  || allCharacters.find(c => String(c.id) === mappedTargetId)
                  || extraChars[mappedTargetId];
                
                const targetName = butlerEntry?.name || targetChar?.name || mappedTargetId;
                
                const targetIdle    = butlerEntry?.idle || (() => {
                  if (!targetChar) return '';
                  const idleSrc = (targetChar.assets as any)?.idle;
                  if (idleSrc) return idleSrc.startsWith('http') || idleSrc.startsWith('/') ? idleSrc : `/assets/characters/${targetChar.slug || targetChar.id}/${idleSrc}`;
                  return (targetChar.avatar && targetChar.avatar !== '/assets/default-ai-robot.png') ? targetChar.avatar : '';
                })();
                const targetDesc    = butlerEntry?.desc
                  || (targetChar as any)?.tagline
                  || targetChar?.description
                  || (targetChar as any)?.intro
                  || '';

                const handleGo = () => {
                  const key = `yida_dismissed_hf_${convId || 'local'}`;
                  const existing = JSON.parse(localStorage.getItem(key) || '[]');
                  localStorage.setItem(key, JSON.stringify([...existing, msg.id]));
                  setDismissedHandoffIds(prev => new Set([...prev, msg.id ?? '']));

                  router.push(
                    `/chat?charId=${encodeURIComponent(mappedTargetId)}` +
                    `&hf_from=${encodeURIComponent(character?.name || '')}` +
                    `&hf_ctx=${encodeURIComponent(ctx)}` +
                    `&hf_prev_conv_id=${encodeURIComponent(convId || '')}` +
                    `&hf_prev_char_id=${encodeURIComponent(character?.id || '')}`
                  );
                };
                const handleDismiss = () => setDismissedHandoffIds(prev => new Set([...prev, msg.id ?? '']));

                return (
                  <div className={s.assistantMsgWrap} style={{ padding: isMobile ? '0 5px' : '0 22px' }}>
                    <div className={s.assistantContent}>
                      <div style={{
                        width: 350, maxWidth: '100%',
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      }}>
                        {/* ① 向你推荐了 + AI名字 */}
                        <div style={{ padding: '14px 16px 10px' }}>
                          <span style={{ fontSize: 13, color: '#9ca3af' }}>向你推荐了 </span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#5b40e8' }}>【{targetName}】</span>
                        </div>

                        {/* ② 推荐理由（原文保留，不可删）*/}
                        {reason && (
                          <div style={{ padding: '0 16px 14px', fontSize: 13, color: '#374151', lineHeight: 1.65 }}>
                            {reason}
                          </div>
                        )}

                        {/* ③ AI 角色子卡：横版 idle 图 + 介绍 (只有当有内容时才渲染，避免套娃空状态) */}
                        {(targetIdle || targetDesc) && (
                          <div style={{
                            margin: '0 12px 12px',
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '1px solid rgba(0,0,0,0.06)',
                            background: '#f8f7ff',
                          }}>
                            {targetIdle && (
                              <div style={{ position: 'relative', width: '100%', height: 150, overflow: 'hidden', background: '#e8e0ff' }}>
                                <img src={targetIdle} alt={targetName}
                                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />
                              </div>
                            )}
                            {targetDesc && (
                              <div style={{ padding: '10px 12px 12px', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                                {targetDesc}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ④ 按钮 */}
                        <div style={{ display: 'flex', gap: 8, padding: '4px 12px 14px' }}>
                          <button onClick={handleGo} style={{
                            flex: 1, height: 40, borderRadius: 10,
                            background: 'linear-gradient(135deg, #786cff, #427759)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: 14, fontWeight: 600,
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                          >去聊一聊</button>
                          <button onClick={handleDismiss} style={{
                            height: 40, padding: '0 16px', borderRadius: 10,
                            background: 'none', color: '#9ca3af',
                            border: 'none', cursor: 'pointer', fontSize: 13,
                          }}>不用了</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── 人才核验交互卡：[TALENT_AUDIT name="..." context="..."] ── */}
              {(() => {
                const raw = msg.content || '';
                const taMatch = raw.match(/\[TALENT_AUDIT\b([^\]]*)\]/i);
                if (!taMatch || dismissedHandoffIds.has(`ta_${msg.id ?? ''}`)) return null;
                const taAttrs = taMatch[1];
                const taName = taAttrs.match(/name="([^"]+)"/i)?.[1] || '';
                const taCtx  = taAttrs.match(/context="([^"]+)"/i)?.[1] || '严肃人才数据核验';
                const handleTaGo = () => {
                  const params = new URLSearchParams();
                  if (taName) params.set('name', taName);
                  if (taCtx)  params.set('ctx', taCtx);
                  setDismissedHandoffIds(prev => new Set([...prev, `ta_${msg.id ?? ''}`]));
                  router.push(`/talent-audit/new?${params.toString()}`);
                };
                const handleTaDismiss = () => setDismissedHandoffIds(prev => new Set([...prev, `ta_${msg.id ?? ''}`]));
                return (
                  <div className={s.assistantMsgWrap} style={{ padding: isMobile ? '0 5px' : '0 22px' }}>
                    <div className={s.assistantContent}>
                      <div style={{
                        width: 350, maxWidth: '100%',
                        borderRadius: 16,
                        overflow: 'hidden',
                        background: '#fff',
                        border: '1px solid rgba(0,0,0,0.08)',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      }}>
                        {/* 标题行 */}
                        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 18 }}>🔍</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1c1e' }}>人才核验</span>
                        </div>

                        {/* 核验对象 */}
                        {taName && (
                          <div style={{ padding: '0 16px 8px', fontSize: 13, color: '#374151' }}>
                            正在为您核验：<span style={{ fontWeight: 600, color: '#5b40e8' }}>{taName}</span>
                          </div>
                        )}

                        {/* 需求描述 */}
                        <div style={{ padding: '0 16px 14px', fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
                          {taCtx}
                        </div>

                        {/* 核验能力说明 */}
                        <div style={{
                          margin: '0 12px 12px',
                          padding: '12px',
                          borderRadius: 10,
                          background: '#f8f7ff',
                          border: '1px solid rgba(91,64,232,0.12)',
                        }}>
                          <div style={{ fontSize: 11, color: '#7c6ee6', fontWeight: 600, marginBottom: 6 }}>智查查 · 人才验真引擎</div>
                          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.7 }}>
                            上传候选人简历（PDF/Word），系统将自动对接平方数据工作台，完成多层次学术成果、专利、荣誉核验。
                          </div>
                        </div>

                        {/* 按钮 */}
                        <div style={{ display: 'flex', gap: 8, padding: '4px 12px 14px' }}>
                          <button onClick={handleTaGo} style={{
                            flex: 1, height: 40, borderRadius: 10,
                            background: 'linear-gradient(135deg, #786cff, #427759)',
                            color: '#fff', border: 'none', cursor: 'pointer',
                            fontSize: 14, fontWeight: 600,
                          }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                          >开始核验</button>
                          <button onClick={handleTaDismiss} style={{
                            height: 40, padding: '0 16px', borderRadius: 10,
                            background: 'none', color: '#9ca3af',
                            border: 'none', cursor: 'pointer', fontSize: 13,
                          }}>不用了</button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 流式期间生成的报告卡片（内存态） */}
              {reportCards.filter(c => c.afterMsgId === msg.id).map((rc, ri) => (
                <div key={`rc-${ri}`} className={s.reportCardWrap} style={{ padding: isMobile ? '0 5px 16px' : '0 22px 16px' }}>
                  <div className={s.reportCardInner}>
                    <AssessmentReportCard
                      title={(rc.data.title as string) || '报告'}
                      summary={rc.data.summary as string | undefined}
                      dimensions={rc.data.dimensions as []}
                      top_matches={rc.data.top_matches as []}
                      recommendations={rc.data.recommendations as string[]}
                      next_steps={rc.data.next_steps as string[]}
                      cooperation_roadmap={rc.data.cooperation_roadmap as string[] | undefined}
                      contact_note={rc.data.contact_note as string | undefined}
                      _raw={rc.data._raw as string | undefined}
                      saved={rc.saved}
                    />
                  </div>
                </div>
              ))}
              {/* 刷新/重进后的持久化报告标记——内存态 reportCards 为空时从消息内容恢复显示 */}
              {!reportCards.some(c => c.afterMsgId === msg.id) &&
               /\[ZJ_REPORT_DONE:[^\]]+\]/.test(msg.content || '') && (
                <div style={{ padding: isMobile ? '0 5px 16px' : '0 22px 16px' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: 'rgba(96,85,245,0.06)',
                    border: '1px solid rgba(96,85,245,0.18)',
                  }}>
                    <span style={{ fontSize: 16 }}>📊</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#5b40e8' }}>报告已存档</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>内容已保存，前往「报告记录」查看</div>
                    </div>
                    <a href="/reports"
                      style={{
                        marginLeft: 4, padding: '5px 12px',
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #786cff, #427759)',
                        color: '#fff', fontSize: 12, fontWeight: 600,
                        textDecoration: 'none',
                      }}
                    >查看报告</a>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {introCard && (
        <AssessmentIntroCard
            typeName={introCard.typeName}
            typeIcon={introCard.typeIcon}
            openingIntro={introCard.openingIntro}
            avatarUrl={avatarUrl}
            charName={character?.name}
            confirmLabel={['industry_needs_analysis', 'match_analysis'].includes(introCard.typeId)
              ? '🔍 开始分析' : '✨ 开始测评'}
            dismissLabel={['industry_needs_analysis', 'match_analysis'].includes(introCard.typeId)
              ? '暂不需要' : '聊点别的'}
            onConfirm={() => {
              const typeId = introCard.typeId;
              setIntroCard(null);
              // 新测评开始，重置模块积累会话
              assessmentSessionRef.current = { reportId: null, typeId, reportTitle: null, modules: [] };
              handleSend(`[ASSESSMENT_START:${typeId}]`);
            }}
            onDismiss={() => setIntroCard(null)}
          />
        )}

        {/* ThinkingDots：仅在没有流式内容时才显示（防双 loading）*/}
        {(() => {
          if (!loading || isStreamingContent) return null;
          return (
            <div className={s.thinkingWrap}>
              <div className={s.assistantHeader}>
                <div className={s.thinkingAvatar}>
                  {avatarUrl ? <img src={avatarUrl} alt="" className={s.thinkingAvatarImg} /> : <div className={s.thinkingAvatarFallback}>AI</div>}
                </div>
                <span className={s.assistantName}>{character?.name}</span>
              </div>
              <ThinkingDots text={(hfFromBar?.name && messages.filter(m => m.role === 'assistant').length === 0) ? `正在同步 ${hfFromBar.name} 整理的前情提要...` : '查阅资料，思考中...'} />
            </div>
          );
        })()}
        <div ref={messagesEndRef} />
      </div>

      {/* AI 建议结束测评提示条 */}
      {assessmentEndSuggested && assessmentModuleActive && !loading && (
        <div style={{ padding: isMobile ? '0 5px 8px' : '0 22px 10px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 'calc(800px - 44px)', padding: '12px 16px', background: 'rgba(96,85,245,0.04)', border: '1px solid rgba(96,85,245,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ fontSize: 13, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💡</span> <span>{character?.name || 'AI'} 认为当前信息已经收集充分，可以结束本次测评了。</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => setAssessmentEndSuggested(false)} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #d1d5db', borderRadius: 20, fontSize: 13, color: '#4b5563', cursor: 'pointer' }}>继续补充</button>
              <button onClick={handleEndAssessment} style={{ padding: '6px 12px', background: '#427759', border: 'none', borderRadius: 20, fontSize: 13, color: '#fff', cursor: 'pointer' }}>结束本轮测评</button>
            </div>
          </div>
        </div>
      )}

      {hasAssessment && !loading && (
        <div className={s.assessBtnArea} style={{ padding: isMobile ? '4px 5px 0' : '4px 22px 0' }}>
          <div className={s.assessBtnWrap}>
            {assessmentModuleActive ? (
              <button
                onClick={handleEndAssessment}
                className={s.assessBtn}
                style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}
              >
                ⏹ 结束本轮测评
              </button>
            ) : (
              <>
                {character?.id !== 'yida_main' && (
                  <button
                    onClick={() => setShowPicker(true)}
                    className={s.assessBtn}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,85,245,0.5)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.06)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,85,245,0.25)'; }}
                  >
                    {character?.id === 'cat_research' ? '🏭 开始分析' : '🧪 开始测评'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 常驻「返回A」条（B 侧，输入框正上方）────────────────────── */}
      {showHfFromBar && hfFromBar && (
        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: isMobile ? '0 5px 8px' : '0 22px 10px',
        }}>
          <div style={{
            width: '100%', maxWidth: 'calc(800px - 44px)',
            padding: '10px 16px',
            background: 'rgba(250,249,255,0.95)',
            border: '1px solid rgba(96,85,245,0.15)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(96,85,245,0.06)',
            backdropFilter: 'blur(10px)'
          }}>
            <span style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: 500 }}>问题已解决？</span>
            <button
              onClick={handleReturnToA}
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: 'linear-gradient(135deg, #786cff, #427759)',
                color: '#fff', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
              }}
            >
              返回 {hfFromBar.name}
            </button>
            <button
              onClick={() => setShowHfFromBar(false)}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '1px solid #e5e7eb', background: '#fff',
                cursor: 'pointer', fontSize: 14, color: '#9ca3af',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >×</button>
          </div>
        </div>
      )}

      {/* 游客态输入框：正常显示，点击时弹登录 modal */}
      {(activeMode || (!isMobile && !loading)) && character?.id === 'yida_main' && messages.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="quick-actions" style={{ width: '100%', maxWidth: 800, padding: '0 22px' }}>
            {activeMode ? (
              // 选中态：只显示当前模式标签
              (() => {
                const cat = MOCK_CATEGORIES.find(c => c.id === activeMode);
                if (!cat) return null;
                return (
                  <div className="active-mode-chip">
                    <span className={`tab-icon ${cat.colorClass}`}>{cat.icon}</span>
                    <span>{cat.name}模式</span>
                    <button className="mode-close" onClick={() => { setActiveMode(null); setIntroCard(null); }} title="退出模式">✕</button>
                  </div>
                );
              })()
            ) : (
              // 默认态：全部按钮
              MOCK_CATEGORIES.map(cat => (
                <button key={cat.id} className="quick-action-tab"
                  onClick={() => {
                    setActiveMode(cat.id);
                    if (cat.id === 'analysis') {
                      setShowPicker(true);
                      return;
                    }
                    setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: cat }]);
                    setTimeout(() => {
                      if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
                      }
                    }, 100);
                  }}>
                  <span className={`tab-icon ${cat.colorClass}`}>{cat.icon}</span>
                  <span className="tab-label">{cat.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      
      {(() => {
        const isYidaMobile = isMobile && character?.id === 'yida_main';
        const isWebLanding = !isMobile && character?.id === 'yida_main' && messages.length === 0 && !showYidaGreeting;
        const usePillComposer = isYidaMobile || isWebLanding;
        
        return (
          <div
            className={s.composer}
            style={isWebLanding ? {
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              borderTop: 'none',
              padding: '0 20px',
              zIndex: 10,
            } : isYidaMobile ? {
              background: 'transparent',
              borderTop: 'none',
              padding: '0 16px',
              paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
              pointerEvents: 'none',
            } : {
              paddingLeft: isMobile ? 5 : 22,
              paddingRight: isMobile ? 5 : 22,
              paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom, 0px))' : 14,
            }}
          >
            {isWebLanding && (
              <>
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-[#e0f2fe] via-[#dbeafe] to-[#e0e7ff] opacity-[0.85] blur-[100px] rounded-[100%] pointer-events-none mix-blend-multiply" style={{ zIndex: -1 }}></div>
                
                {/* 悬浮小家伙 */}
                <div className="relative w-[130px] h-[130px] mb-8 animate-float">
                  <div className="absolute inset-0 bg-[#427759]/20 blur-[28px] rounded-full pointer-events-none mix-blend-overlay opacity-80"></div>
                  <div className="relative z-10 w-full h-full rounded-full bg-white shadow-[0_8px_32px_rgba(96,85,245,0.15)] flex items-center justify-center overflow-hidden border border-white/60">
                     <img src="/assets/cute_ai_orb_home.png" alt="yida" className="w-[180%] h-[180%] max-w-none object-center" />
                  </div>
                </div>

                <h1 className="text-[32px] font-normal text-[#1e293b] mb-6 text-center animate-fade-in" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Hi {displayUsername}，有什么我可以帮忙的？
                </h1>
                
                {/* 桌面端大卡片 */}
                <div className="grid grid-cols-4 gap-4 w-full mb-8 max-w-[800px] animate-fade-in">
                  {[
                    { label: '查人才', desc: '挖掘全球学者', icon: <User size={20} />, bg: '#eff6ff', iconBg: '#3b82f6', iconColor: '#fff', action: () => { setActiveMode('talents'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'talents') }]); setShowYidaGreeting(true); } },
                    { label: '人才检测', desc: '多维背景核验', icon: <ShieldCheck size={20} />, bg: '#eef2ff', iconBg: '#6366f1', iconColor: '#fff', action: () => { setActiveMode('audit'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'audit') }]); setShowYidaGreeting(true); } },
                    { label: '找资源', desc: '智能匹配供应商', icon: <Library size={20} />, bg: '#f3e8ff', iconBg: '#a855f7', iconColor: '#fff', action: () => { setActiveMode('resources'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'resources') }]); setShowYidaGreeting(true); } },
                    { label: '产学研分析', desc: '企业需求洞察', icon: <Activity size={20} />, bg: '#f5f3ff', iconBg: '#8b5cf6', iconColor: '#fff', action: () => { setActiveMode('analysis'); setShowPicker(true); setShowYidaGreeting(true); } },
                  ].map(btn => (
                    <button 
                      key={btn.label}
                      onClick={btn.action}
                      className="flex flex-col items-start p-5 rounded-3xl transition-transform hover:-translate-y-1 active:scale-95 text-left border border-white/40 shadow-sm"
                      style={{ background: btn.bg }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3 shadow-sm" style={{ background: btn.iconBg, color: btn.iconColor }}>
                        {btn.icon}
                      </div>
                      <span className="font-bold text-[16px] text-[#1e293b] mb-1">{btn.label}</span>
                      <span className="text-[13px] text-[#475569]">{btn.desc}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            <div 
              className={`${s.composerInner} ${inputValue ? s.composerInnerActive : ''} animate-fade-in`}
              style={usePillComposer ? {
                borderRadius: '24px',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: '0 4px 20px rgba(96,85,245,0.12), 0 1px 3px rgba(0,0,0,0.05)',
                border: '1px solid rgba(255,255,255,0.6)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                pointerEvents: 'auto',
                width: '100%',
                maxWidth: isWebLanding ? 760 : 'none',
              } : { pointerEvents: 'auto' }}
            >
              {usePillComposer ? (
                <div className="flex items-center w-full">
                  {inputMode === 'text' ? (
                    <>
                      <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={isWebLanding ? "你的问题必有一答" : "你的问题必有一答"}
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none px-4 py-1.5 text-[16px] resize-none"
                        style={{ maxHeight: 80, color: '#334155' }}
                        onClick={() => { if (isGuest) { (document.activeElement as HTMLElement)?.blur(); setShowLoginModal(true); } }}
                        onInput={e => {
                          const el = e.currentTarget;
                          el.style.height = 'auto';
                          el.style.height = Math.min(el.scrollHeight, 80) + 'px';
                        }}
                      />
                      {inputValue.trim() ? (
                        <button onClick={() => handleSend()} disabled={loading} className="w-[36px] h-[36px] rounded-full bg-[#427759] text-white flex items-center justify-center flex-shrink-0 mr-0.5 shadow-md active:scale-95 transition-transform">
                          <SendOutlined style={{ fontSize: 14 }} />
                        </button>
                      ) : (
                        <button onClick={() => setInputMode('voice')} className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#427759] text-white flex items-center justify-center flex-shrink-0 mr-0.5 shadow-md active:scale-95 transition-transform">
                          <AudioOutlined style={{ fontSize: 16 }} />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button onClick={() => setInputMode('text')} className="w-[36px] h-[36px] rounded-full bg-[#f4f3ff] text-[#427759] flex items-center justify-center flex-shrink-0 ml-1">
                        <Keyboard size={18} />
                      </button>
                      
                      <button
                        onPointerDown={startRecording}
                        onPointerUp={stopRecording}
                        onPointerLeave={stopRecording}
                        className={`flex-1 mx-2 h-[42px] rounded-full text-[15px] font-bold select-none transition-colors ${
                          isRecording ? 'bg-[#e2e8f0] text-[#475569]' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]'
                        }`}
                        style={{ WebkitUserSelect: 'none', touchAction: 'none' }}
                      >
                        {isRecording ? '松开 发送' : '按住 说话'}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={character ? `告诉${character.name}你的情况，描述出你的问题。` : '你的问题必有一答'}
                    rows={1}
                    className={`${s.textarea} ${inputValue.split('\n').length > 4 ? s.textareaOverflow : ''}`}
                    onClick={() => { if (isGuest) { (document.activeElement as HTMLElement)?.blur(); setShowLoginModal(true); } }}
                    onInput={e => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 140) + 'px';
                    }}
                  />
                  <div className={s.composerFooter}>
                    <Tooltip title={isRecording ? '点击停止录音' : '点击开始录音'}>
                      <button
                        onClick={() => {
                          if (isRecording) {
                            stopRecording();
                          } else {
                            setIsRecognizing(false);
                            startRecording();
                          }
                        }}
                        className={s.audioBtn}
                        style={isRecording ? { color: '#ef4444' } : undefined}
                      >
                        {isRecording ? <AudioMutedOutlined style={{ fontSize: 15 }} /> : <AudioOutlined style={{ fontSize: 15 }} />}
                      </button>
                    </Tooltip>
                    <Tooltip title="点击切换模型">
                      <button onClick={() => setModelIdx(i => (i + 1) % MODELS.length)}
                        className={s.modelBtn}
                        style={{ display: 'none' }}>
                      </button>
                    </Tooltip>
                    <div style={{ flex: 1 }} />
                    {!isMobile && <span className={s.shiftHint}>Shift+Enter 换行</span>}
                    <button onClick={() => handleSend()}
                      disabled={!inputValue.trim() || loading}
                      className={s.sendBtn}
                      style={{
                        cursor: inputValue.trim() && !loading ? 'pointer' : 'default',
                        opacity: inputValue.trim() && !loading ? 1 : 0.35,
                      }}>
                      <SendOutlined style={{ fontSize: 12 }} />发送
                    </button>
                  </div>
                </>
              )}
            </div>
            
            {isWebLanding && (
              <div className="flex justify-center flex-wrap gap-3 w-full mt-6 max-w-[800px] animate-fade-in">
                {[
                  { label: '政策查询', icon: <Globe size={16} />, action: () => { setActiveMode('policy'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'policy') }]); setShowYidaGreeting(true); } },
                  { label: '找数据', icon: <Database size={16} />, action: () => { setActiveMode('data'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'data') }]); setShowYidaGreeting(true); } },
                  { label: '写材料', icon: <PenTool size={16} />, action: () => { setActiveMode('write'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'write') }]); setShowYidaGreeting(true); } },
                  { label: '会议邀约', icon: <Calendar size={16} />, action: () => { setActiveMode('conference_invite'); setMessages(prev => [...prev, { id: 'mock-'+Date.now(), role: 'assistant', content: '', yidaToolCard: MOCK_CATEGORIES.find(c => c.id === 'conference_invite') }]); setShowYidaGreeting(true); } },
                  { label: '聊点什么？', icon: <Sparkles size={16} />, action: () => setShowYidaGreeting(true), highlight: true },
                ].map(btn => (
                  <button 
                    key={btn.label}
                    onClick={btn.action}
                    className={`py-2 px-4 rounded-full text-[14px] transition-all hover:-translate-y-0.5 flex items-center shadow-sm border ${
                      btn.highlight 
                        ? 'bg-[#f4f3ff] text-[#427759] border-[#e2e8f0]'
                        : 'bg-white/80 backdrop-blur-md text-[#475569] border-[#e2e8f0] hover:bg-white hover:shadow-md'
                    }`}
                  >
                    <span className="mr-2 text-[16px]">{btn.icon}</span>
                    {btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <LoginPromptModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
        reason={`与${character?.name ?? 'AI'}对话`}
      />

    </div>

    {/* Lead 收集表单 Modal */}
    <LeadFormModal
      open={showLeadModal}
      onClose={() => setShowLeadModal(false)}
      charName={character?.name}
      onSubmit={async (formData: LeadFormData) => {
        const payload = {
          ...formData,
          sourceCharId: character?.id,
          sourceCharName: character?.name,
          sourceConvId: convId,
        };
        const v1Url = (process.env.NEXT_PUBLIC_V1_API || 'http://localhost:8000') + '/api/leads';
        let ok = false;
        try {
          const r = await fetch(v1Url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          ok = (await r.json()).ok;
        } catch { /* v1 不可达，降级到本地 */ }

        if (!ok) {
          await fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        setShowLeadModal(false);
      }}
    />

    {/* 弹窗区 */}
    <CompanyModal selectedCompany={selectedCompany} onClose={() => setSelectedCompany(null)} />
    <TalentModal selectedTalent={selectedTalent} onClose={() => setSelectedTalent(null)} />

    {selectedInstitute && (
      <InstituteModal 
        selectedInstitute={selectedInstitute} 
        onClose={() => setSelectedInstitute(null)} 
      />
    )}

    {selectedCase && (
      <CaseModal 
        selectedCase={selectedCase} 
        onClose={() => setSelectedCase(null)} 
      />
    )}

    {selectedProject && (
      <ProjectModal 
        selectedProject={selectedProject} 
        onClose={() => setSelectedProject(null)} 
      />
    )}

    {showAuditModal && (
      <AuditReport onClose={() => setShowAuditModal(false)} />
    )}

    {/* 全局录音遮罩 (Voice Recording Mask) */}
    {(isRecording || isRecognizing) && (
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in select-none ${isRecognizing ? 'pointer-events-auto' : 'pointer-events-none'}`} style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}>
        <div className="w-[160px] h-[160px] bg-black/60 rounded-[32px] flex flex-col items-center justify-center shadow-2xl backdrop-blur-md border border-white/10 relative overflow-hidden">
          {/* 动态波纹气泡 */}
          <div className={`w-[70px] h-[70px] rounded-[22px] bg-[#427759] flex items-center justify-center mb-3 relative ${isRecording ? 'animate-pulse' : ''} shadow-[0_0_24px_rgba(96,85,245,0.8)]`}>
            {isRecording ? (
              <div className="flex items-center justify-center gap-1.5 h-6">
                <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_0.1s]"></div>
                <div className="w-1.5 h-3/4 bg-white rounded-full animate-[bounce_1s_infinite_0.3s]"></div>
                <div className="w-1.5 h-full bg-white rounded-full animate-[bounce_1s_infinite_0.5s]"></div>
                <div className="w-1.5 h-1/2 bg-white rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
              </div>
            ) : (
              <div className="w-6 h-6 border-4 border-t-white border-white/30 rounded-full animate-spin"></div>
            )}
            {/* 气泡小尾巴 */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#427759] rotate-45 pointer-events-none"></div>
          </div>
          <span className="text-white/90 text-[14px] font-bold tracking-wide mt-2">
            {isRecording ? '松开手指发送' : '一答在听...'}
          </span>
        </div>
      </div>
    )}
    
    <input 
      type="file" 
      ref={fileInputRef} 
      style={{ display: 'none' }} 
      accept=".txt,.md,.pdf,.doc,.docx"
      onChange={handleActualFileUpload} 
    />
    </>
  );
};

export default ChatArea;
