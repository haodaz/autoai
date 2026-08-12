'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Upload, FileText, ArrowRight, ArrowLeft, Search, ChevronRight, Loader2, CheckCircle, AlertTriangle, Sparkles, Eye, Zap } from 'lucide-react';
import { AuditReport } from './AuditReport';
import { TalentAuditReportData } from './types';

import { getConversation, updateConversation } from '@/lib/conversations';

// ── 状态机类型 ────────────────────────────────────────────────────────────
type AppState =
  | 'upload'
  | 'parsing'
  | 'confirm_resume'
  | 'verify_pingfang_talent'
  | 'verify_pingfang_papers'
  | 'verify_pingfang_patents'
  | 'verify_partner'
  | 'verify_osint_wikipedia'
  | 'verify_osint_scholar'
  | 'verify_osint_institution'
  | 'verify_targeted'
  | 'verify_cross'
  | 'verify_async_live'
  | 'result';

interface TargetedItem {
  type: 'paper' | 'patent' | 'award' | 'position';
  value: string;
  claim: string;
  done: boolean;
}

const STEP_LABELS: Record<AppState, string> = {
  upload: '上传简历',
  parsing: '解析中...',
  confirm_resume: '确认简历结构',
  verify_pingfang_talent: '平方学者库核查',
  verify_pingfang_papers: '平方论文库核查',
  verify_pingfang_patents: '平方专利与成果核查',
  verify_partner: '合作方数据库',
  verify_osint_wikipedia: 'Wikipedia 检索',
  verify_osint_scholar: 'Google Scholar 检索',
  verify_osint_institution: '院校官网检索',
  verify_targeted: '定点突破',
  verify_cross: 'AI 终局推演',
  verify_async_live: '异步后台检验 (围观中...)',
  result: '审计报告',
};

const STEP_ORDER: AppState[] = [
  'verify_pingfang_talent',
  'verify_pingfang_papers',
  'verify_pingfang_patents',
  'verify_partner',
  'verify_osint_wikipedia',
  'verify_osint_scholar',
  'verify_osint_institution',
  'verify_targeted',
  'verify_cross',
];

export default function TalentAuditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [appState, setAppState] = useState<AppState>('upload');
  const [reportData, setReportData] = useState<TalentAuditReportData | null>(null);
  const [reportId, setReportIdState] = useState<string | null>(null);
  const reportIdRef = useRef<string | null>(null);
  const setReportId = (id: string | null) => {
    setReportIdState(id);
    reportIdRef.current = id;
  };
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [stepLoading, setStepLoading] = useState(false);

  // 多列 Agent 日志（并行验真时用）
  type AgentId = 'pingfang' | 'osint' | 'targeted' | 'system';
  const AGENT_META: Record<AgentId, { label: string; icon: string; color: string }> = {
    pingfang: { label: '平方底座', icon: '🏛', color: '#a78bfa' },
    osint:    { label: 'OSINT 情报', icon: '🌐', color: '#22d3ee' },
    targeted: { label: '定点突破', icon: '🎯', color: '#f59e0b' },
    system:   { label: '终局推演', icon: '🧠', color: '#60a5fa' },
  };
  const [agentLogs, setAgentLogs] = useState<Record<AgentId, string[]>>({
    pingfang: [], osint: [], targeted: [], system: []
  });
  const [agentStatus, setAgentStatus] = useState<Record<AgentId, 'idle' | 'running' | 'done' | 'error'>>({
    pingfang: 'idle', osint: 'idle', targeted: 'idle', system: 'idle'
  });
  const [activeAgentTab, setActiveAgentTab] = useState<AgentId>('pingfang');
  const agentRefs = useRef<Record<AgentId, HTMLDivElement | null>>({ pingfang: null, osint: null, targeted: null, system: null });
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<string>('');
  const [stepDone, setStepDone] = useState(false);
  const [cumulativeLogs, setCumulativeLogs] = useState<string>('');
  const [paperQueue, setPaperQueue] = useState<string[]>([]);
  const [currentPaperIdx, setCurrentPaperIdx] = useState(0);
  const [achievementQueue, setAchievementQueue] = useState<Array<{type: 'patent' | 'project', name: string}>>([]);
  const [currentAchievementIdx, setCurrentAchievementIdx] = useState(0);
  const [targetedItems, setTargetedItems] = useState<TargetedItem[]>([]);
  const [currentTargetedIdx, setCurrentTargetedIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // 自动滚动终端到底部
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // 从 URL 获取 resumeId 和 sourceConvId
  useEffect(() => {
    const resumeId = searchParams.get('resumeId');
    if (resumeId) {
      const id = resumeId.replace('talent_audit_report_', '');
      fetch(`/api/reports/${id}`)
        .then(r => r.json())
        .then(res => {
          if (res.ok && res.data?.content) {
            try {
              const parsedData = JSON.parse(res.data.content) as any;
              if (parsedData.resume) {
                setReportData(parsedData);
              } else {
                setReportData({ 
                  resume: parsedData,
                  stats: { match: 0, mismatch: 0, manual_review: 0 },
                  overallEvaluation: { level: 'PENDING', text: '等待执行深度审计引擎。' },
                  factItems: []
                });
              }
              setReportId(id);
              setAppState('confirm_resume');
            } catch(e) {}
          }
        });
    }
  }, [searchParams]);

  const routeLogToAgent = useCallback((msg: string): AgentId => {
    if (msg.includes('[MCP::Pingfang') || msg.includes('平方')) return 'pingfang';
    if (msg.includes('[OSINT::ORCID') || msg.includes('[OSINT::Wikipedia') ||
        msg.includes('[OSINT::Scholar') || msg.includes('[OSINT::Institution') ||
        msg.includes('ORCID') || msg.includes('Wikipedia') || msg.includes('Scholar') || msg.includes('osint_')) return 'osint';
    if (msg.includes('[OSINT::Targeted') || msg.includes('[INFO::Targeted') ||
        msg.includes('定点突破') || msg.includes('targeted')) return 'targeted';
    if (msg.includes('[CrossVerify') || msg.includes('交叉推演') || msg.includes('终局')) return 'system';
    if (msg.includes('[SYSTEM]')) {
      // SYSTEM messages about specific agents
      if (msg.includes('平方')) return 'pingfang';
      if (msg.includes('OSINT') || msg.includes('情报')) return 'osint';
      if (msg.includes('定点')) return 'targeted';
      return 'system';
    }
    if (msg.includes('[PARTNER') || msg.includes('合作方')) return 'system';
    return 'system';
  }, []);

  const appendLog = useCallback((msg: string) => {
    setTerminalLogs(prev => [...prev, msg]);
    setCumulativeLogs(prev => prev + '\n' + msg);
    // 路由到对应 Agent 列
    const agentId = routeLogToAgent(msg);
    setAgentLogs(prev => ({ ...prev, [agentId]: [...prev[agentId], msg] }));
    // 更新 Agent 状态
    if (msg.includes('完成') && !msg.includes('并行分包')) {
      setAgentStatus(prev => ({ ...prev, [agentId]: 'done' }));
    } else {
      setAgentStatus(prev => prev[agentId] === 'done' ? prev : { ...prev, [agentId]: 'running' });
    }
    // 自动滚动对应列
    setTimeout(() => {
      const ref = agentRefs.current[agentId];
      if (ref) ref.scrollTop = ref.scrollHeight;
    }, 50);
  }, [routeLogToAgent]);

  // 统一流式处理函数
  const runStep = useCallback(async (body: Record<string, unknown>, onDone?: (data: Record<string, unknown>) => void) => {
    setStepLoading(true);
    setStepDone(false);

    try {
      const res = await fetch('/api/talent-audit/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.body) throw new Error('No stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'log') {
              appendLog(parsed.content);
            } else if (parsed.type === 'step_done') {
              if (parsed.data?.factItems?.length) {
                setReportData(prev => ({
                  ...prev!,
                  factItems: [...(prev?.factItems || []), ...parsed.data.factItems]
                }));
              }
              // ── 收集各渠道原始数据到 sourceData ──
              const d = parsed.data;
              if (d?.pingfang_talent_raw || d?.orcid_profile || d?.scholar_raw || d?.wikipedia_text || d?.source_text) {
                setReportData(prev => {
                  const prevSource = prev?.sourceData || {};
                  const newSource = { ...prevSource };
                  if (d.pingfang_talent_raw) newSource.pingfang = d.pingfang_talent_raw;
                  if (d.orcid_profile) { newSource.orcid = d.orcid_profile; }
                  if (d.orcid_url) newSource.orcid_url = d.orcid_url;
                  if (d.scholar_raw) newSource.scholar = d.scholar_raw;
                  if (d.scholar_url) newSource.scholar_url = d.scholar_url;
                  if (d.wikipedia_text) {
                    newSource.wikipedia = { biography: d.wikipedia_text, url: d.wikipedia_url, source_type: d.wikipedia_source_type || 'wikipedia' };
                  }
                  // ★ 追加原始文本 — 不做结构化映射，append-only，永不丢失
                  if (d.source_text) {
                    newSource.texts = [...(newSource.texts || []), d.source_text];
                  }
                  return { ...prev!, sourceData: newSource };
                });
              }
              onDone?.(parsed.data || {});
            } else if (parsed.type === 'result') {
              setReportData(prev => {
                const merged: TalentAuditReportData = { ...prev!, ...parsed.data };
                // 使用已存在的 reportId，否则生成新 ID
                const id = reportIdRef.current || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                if (!reportIdRef.current) setReportId(id);

                // 将完整结果持久化到服务器 (CRM)
                fetch('/api/reports/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: id,
                    title: `人才验真报告: ${(merged.resume?.name || '未知候选人').replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim()}`,
                    summary: merged.overallEvaluation?.text || '验真完成',
                    content: JSON.stringify(merged),
                    format: 'json',
                  })
                }).catch(err => console.error('Failed to save report to server:', err));
                
                // 将验真结果同步存入人才日志
                const institution = merged.resume?.experience?.[0]?.company || merged.resume?.education?.[0]?.school || '';
                const candidateName = (merged.resume as any)?.name_cn || merged.resume?.name || '未知';
                
                fetch('/api/talent-audit/journal-save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    candidateName,
                    institution,
                    sourceData: merged.sourceData,
                    aiReport: merged.overallEvaluation?.text || '',
                  })
                }).catch(err => console.error('Failed to save journal:', err));

                // 将验真结果回写到来源对话中
                const sourceConvId = searchParams.get('sourceConvId');
                if (sourceConvId) {
                  const followUpData = {
                    role: 'ai',
                    content: `人才验真已完成，我已为您生成了深度审计报告。\n\n[TALENT_AUDIT_RESULT:${id}]\n\n<zj_report style="display:none">\n${JSON.stringify(merged)}\n</zj_report>\n您可以围绕报告结论与我进行深入探讨，例如提问：“3项不符的内容是哪些？”、“某某真正的大学是哪一所”等。`
                  };
                  fetch('/api/conversations/mock-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      convId: sourceConvId,
                      charId: 'yida_main',
                      charName: '一答',
                      ask: '',
                      ai_data: followUpData
                    })
                  }).catch(e => console.error(e));
                }
                
                return merged;
              });
              setTimeout(() => setAppState('result'), 800);
            }
          } catch { /* 解析单行失败，跳过 */ }
        }
      }
    } catch (err) {
      appendLog(`[ERROR] 网络请求失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStepLoading(false);
      setStepDone(true);
    }
  }, [appendLog]);

  // 各步骤触发
  const triggerStep = useCallback(async (state: AppState) => {
    if (!reportData?.resume) return;

    switch (state) {
      case 'verify_pingfang_talent':
        await runStep({ step: 'pingfang_talent', resume: reportData.resume });
        break;

      case 'verify_pingfang_papers': {
        const publications = (reportData.resume as any)?.publications as Array<{title: string}> | undefined;
        if (!publications?.length) {
          appendLog('[SYSTEM] 简历无出版物声明，跳过平方论文库核查。');
          setStepDone(true);
          setStepLoading(false);
          break;
        }
        setPaperQueue(publications.map(p => p.title));
        setCurrentPaperIdx(0);
        // 只执行第一篇
        await runStep({ step: 'pingfang_paper', paperTitle: publications[0].title, paperIdx: 0 });
        break;
      }

      case 'verify_pingfang_patents': {
        const resume = reportData.resume as any;
        const patents = resume.patents as Array<{name: string}> | undefined;
        const projects = resume.projects as Array<{name: string}> | undefined;
        
        const queue: Array<{type: 'patent' | 'project', name: string}> = [];
        patents?.forEach(p => queue.push({ type: 'patent', name: p.name }));
        projects?.forEach(p => queue.push({ type: 'project', name: p.name }));

        if (!queue.length) {
          appendLog('[SYSTEM] 简历无专利与项目声明，跳过平方专利与成果核查。');
          setStepDone(true);
          setStepLoading(false);
          break;
        }
        setAchievementQueue(queue);
        setCurrentAchievementIdx(0);
        // 执行第一项成果
        await runStep({ step: 'pingfang_achievement', itemType: queue[0].type, itemTitle: queue[0].name, itemIdx: 0, candidateName: resume.name });
        break;
      }

      case 'verify_partner':
        await runStep({ step: 'partner' });
        break;

      case 'verify_osint_wikipedia':
        await runStep({ step: 'osint_wikipedia', resume: reportData.resume });
        break;

      case 'verify_osint_scholar':
        await runStep({ step: 'osint_scholar', resume: reportData.resume });
        break;

      case 'verify_osint_institution':
        await runStep({ step: 'osint_institution', resume: reportData.resume });
        break;

      case 'verify_targeted':
        // 构建待突破列表
        if (targetedItems.length === 0) {
          const resume = reportData.resume as any;
          const items: TargetedItem[] = [];
          const publications = resume.publications as Array<{title: string}> | undefined;
          publications?.forEach(p => items.push({ type: 'paper', value: p.title, claim: p.title, done: false }));
          const awards = resume.awards as Array<{name: string}> | undefined;
          awards?.forEach(a => items.push({ type: 'award', value: a.name, claim: a.name, done: false }));
          setTargetedItems(items);
          setStepLoading(false); // 修复：初始化完成必须关闭 loading，按钮才能激活
          if (items.length === 0) {
            appendLog('[SYSTEM] 无需定点突破的字段，直接进入终局推演。');
            setStepDone(true);
          } else {
            appendLog(`[SYSTEM] 共 ${items.length} 条字段进入定点突破队列。点击列表中每条右侧的「点击突破」按钮逐条执行！`);
            setStepDone(true);
          }
        }
        break;

      case 'verify_cross':
        await runStep({ step: 'cross_verify', resume: reportData.resume, cumulativeLogs });
        break;
    }
  }, [reportData, runStep, appendLog, targetedItems, cumulativeLogs]);

  // 触发定点突破单条
  const triggerTargeted = useCallback(async () => {
    const item = targetedItems[currentTargetedIdx];
    if (!item) return;
    setStepLoading(true);
    setStepDone(false);
    await runStep({
      step: 'targeted',
      resume: reportData?.resume,  // 传候选人简历，后端用于提取姓名做人+奖项交叉验证
      targetField: { type: item.type, value: item.value, claim: item.claim },
    });
    setTargetedItems(prev => prev.map((t, i) => i === currentTargetedIdx ? { ...t, done: true } : t));
    setCurrentTargetedIdx(prev => prev + 1);
  }, [targetedItems, currentTargetedIdx, runStep, reportData]);

  // 触发下一篇论文
  const triggerNextPaper = useCallback(async () => {
    const nextIdx = currentPaperIdx + 1;
    if (nextIdx >= paperQueue.length) {
      appendLog('[SYSTEM] 所有论文核查完成。');
      return;
    }
    setCurrentPaperIdx(nextIdx);
    setStepDone(false);
    await runStep({ step: 'pingfang_paper', paperTitle: paperQueue[nextIdx], paperIdx: nextIdx });
  }, [currentPaperIdx, paperQueue, runStep, appendLog]);

  // 触发下一项成果
  const triggerNextAchievement = useCallback(async () => {
    const nextIdx = currentAchievementIdx + 1;
    if (nextIdx >= achievementQueue.length) {
      appendLog('[SYSTEM] 所有专利与项目核查完成。');
      return;
    }
    setCurrentAchievementIdx(nextIdx);
    setStepDone(false);
    const item = achievementQueue[nextIdx];
    await runStep({ step: 'pingfang_achievement', itemType: item.type, itemTitle: item.name, itemIdx: nextIdx, candidateName: reportData?.resume?.name });
  }, [currentAchievementIdx, achievementQueue, runStep, appendLog]);

  // 触发异步验真 (后台或围观)
  const startAsyncVerify = useCallback(async (mode: 'background' | 'live') => {
    if (!reportData?.resume) return;
    try {
      setStepLoading(true);
      const id = reportIdRef.current || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      if (!reportIdRef.current) setReportId(id);

      const res = await fetch('/api/talent-audit/async-verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: reportData.resume, reportId: id }),
      });
      const data = await res.json();
      if (!res.ok || !data.taskId) throw new Error(data.error || 'Failed to start async verify');

      if (mode === 'background') {
        alert('任务已提交后台。即将返回列表页。');
        router.push('/talent-audit');
      } else {
        // Live mode
        setAppState('verify_async_live');
        setTerminalLogs([]);
        setStepLoading(false);
        const eventSource = new EventSource(`/api/talent-audit/async-verify/stream?taskId=${data.taskId}`);
        eventSource.onmessage = (event) => {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'log') {
            appendLog(parsed.content);
          } else if (parsed.type === 'step_done') {
            if (parsed.data?.factItems?.length) {
              setReportData(prev => ({
                ...prev!,
                factItems: [...(prev?.factItems || []), ...parsed.data.factItems]
              }));
            }
            // ── 收集各渠道原始数据到 sourceData ──
            const d = parsed.data;
            if (d?.pingfang_talent_raw || d?.orcid_profile || d?.scholar_raw || d?.wikipedia_text || d?.source_text) {
              setReportData(prev => {
                const prevSource = prev?.sourceData || {};
                const newSource = { ...prevSource };
                if (d.pingfang_talent_raw) newSource.pingfang = d.pingfang_talent_raw;
                if (d.orcid_profile) newSource.orcid = d.orcid_profile;
                if (d.orcid_url) newSource.orcid_url = d.orcid_url;
                if (d.scholar_raw) newSource.scholar = d.scholar_raw;
                if (d.scholar_url) newSource.scholar_url = d.scholar_url;
                if (d.wikipedia_text) {
                  newSource.wikipedia = { biography: d.wikipedia_text, url: d.wikipedia_url, source_type: d.wikipedia_source_type || 'wikipedia' };
                }
                // ★ 追加原始文本 — append-only
                if (d.source_text) {
                  newSource.texts = [...(newSource.texts || []), d.source_text];
                }
                return { ...prev!, sourceData: newSource };
              });
            }
          } else if (parsed.type === 'result') {
            const mergedData = parsed.data;
            setReportData(prev => ({ ...prev!, ...mergedData }));
            const finalId = reportIdRef.current;
            if (finalId) {
              setReportData(prev => {
                const merged = { ...prev!, ...mergedData };
                fetch('/api/reports/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    id: finalId,
                    title: `人才验真报告: ${(merged.resume?.name || '未知候选人').replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim()}`,
                    summary: merged.overallEvaluation?.text || '验真完成',
                    content: JSON.stringify(merged),
                    format: 'json',
                  })
                }).catch(err => console.error('Failed to save async report:', err));

                // 将验真结果同步存入人才日志
                const institution = merged.resume?.experience?.[0]?.company || merged.resume?.education?.[0]?.school || '';
                const candidateName = (merged.resume as any)?.name_cn || merged.resume?.name || '未知';
                
                fetch('/api/talent-audit/journal-save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    candidateName,
                    institution,
                    sourceData: merged.sourceData,
                    aiReport: merged.overallEvaluation?.text || '',
                  })
                }).catch(err => console.error('Failed to save journal:', err));

                return merged;
              });
            }
            eventSource.close();
            // 跳转到统一报告页，与同步路径一致
            const currentParams = new URLSearchParams(window.location.search);
            const sourceConvId = currentParams.get('sourceConvId');
            const targetUrl = `/talent-audit/${finalId}` + (sourceConvId ? `?sourceConvId=${sourceConvId}` : '');
            setTimeout(() => router.push(targetUrl), 800);
          } else if (parsed.type === 'error') {
            appendLog(`[ERROR] 异步任务执行失败: ${parsed.error}`);
            eventSource.close();
          }
        };
        eventSource.onerror = () => {
          appendLog(`[ERROR] SSE 连接断开。`);
          eventSource.close();
        };
      }
    } catch (err: any) {
      alert(err.message);
      setStepLoading(false);
    }
  }, [reportData, appendLog, router]);

  // 获取下一步 state
  const getNextState = (current: AppState): AppState | null => {
    const idx = STEP_ORDER.indexOf(current);
    if (idx === -1 || idx >= STEP_ORDER.length - 1) return null;
    return STEP_ORDER[idx + 1];
  };

  // 进入下一步
  const advanceToNextStep = async () => {
    const next = getNextState(appState);
    if (!next) return;
    setAppState(next);
    setStepDone(false);
    setStepLoading(true);
    setTimeout(() => triggerStep(next), 100);
  };

  // 解析简历
  useEffect(() => {
    if (appState !== 'parsing') return;

    const doParse = async () => {
      setParseError(null);
      try {
        let res: Response;
        if (fileToUpload) {
          setParseStatus(`正在上传并解析文件「${fileToUpload.name}」（${(fileToUpload.size / 1024).toFixed(1)} KB），调用 DeepSeek-V3 结构化中...`);
          const formData = new FormData();
          formData.append('file', fileToUpload);
          res = await fetch('/api/talent-audit/parse', {
            method: 'POST',
            body: formData,
          });
        } else {
          setParseError(`未找到文件，请重新上传。`);
          setAppState('upload');
          return;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(errData?.error || `API 返回错误：HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data?.error) {
          throw new Error(`解析服务报错：${data.error}`);
        }

        if (!data?.resume) {
          throw new Error(`AI 返回格式异常，缺少 resume 字段。原文：${JSON.stringify(data).substring(0, 150)}`);
        }

        setParseStatus(`✅ 解析完成，识别到候选人：${data.resume.name || '（姓名未识别）'}`);
        const id = reportIdRef.current || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (!reportIdRef.current) setReportId(id);
        const newReport = { 
          resume: data.resume,
          stats: { match: 0, mismatch: 0, manual_review: 0 },
          overallEvaluation: { level: 'PENDING', text: '等待执行深度审计引擎。' },
          factItems: []
        };
        setReportData(newReport);
        
        // 存为草稿
        const saveRes = await fetch('/api/reports/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: id,
            title: `人才验真报告: ${(data.resume.name || '未知候选人').replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim()}`,
            summary: '等待执行深度审计引擎。',
            content: JSON.stringify(newReport),
            format: 'json',
          })
        });

        if (!saveRes.ok) {
          console.warn('[TalentAudit] Failed to save draft report, proceeding anyway.');
        }

        setAppState('confirm_resume');
        
        // 更新 URL 防止刷新丢失
        window.history.replaceState(null, '', `?resumeId=talent_audit_report_${id}`);

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[TalentAudit] Parse failed:', msg);
        setParseError(msg);
        setAppState('upload');
      }
    };
    doParse();
  }, [appState, fileToUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFileToUpload(e.target.files[0]);
      setAppState('parsing');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setFileToUpload(e.dataTransfer.files[0]);
      setAppState('parsing');
    }
  };

  // 判断当前步骤的"进入下一步"按钮状态
  const nextState = getNextState(appState);
  const isVerifying = STEP_ORDER.includes(appState) || appState === 'verify_async_live';

  return (
    <div className="h-full overflow-y-auto bg-[#f9fafb] p-4 md:p-10" style={{ paddingBottom: isVerifying ? 100 : undefined }}>

      {/* 上传页 */}
      {appState === 'upload' && (
        <div className="w-full max-w-[800px] mx-auto text-center relative pt-8 md:pt-0">
          <button
            onClick={() => router.push('/talent-audit')}
            style={{
              position: 'absolute', top: 0, left: 0,
              background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500
            }}
            className="md:hidden"
          >
            <ArrowLeft size={16} /> 取消
          </button>
          <h1 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">人才背景数字化审计引擎</h1>
          <p className="text-gray-500 mb-6 md:mb-10">三层信源 + AI 交叉推演，分步透明，每步可控</p>

          {/* 错误展示 */}
          {parseError && (
            <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '16px 20px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>❌ 解析失败，请查看原因：</div>
              <div style={{ fontSize: 13, color: '#7f1d1d', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{parseError}</div>
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.txt" />
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center gap-4 cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 md:p-12 transition-all hover:bg-gray-50"
          >
            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={28} color="#6b7280" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#374151' }}>点击上传候选人简历</div>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>支持 TXT、PDF（TXT 推荐，解析最稳定）</div>
            <button style={{ marginTop: 12, padding: '10px 24px', backgroundColor: '#427759', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
              选择文件
            </button>
          </div>

          {/* 文本粘贴区 */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 12 }}>或直接粘贴简历文本：</div>
            <textarea
              id="resume-paste-input"
              placeholder="将简历文本粘贴到此处，然后点击「开始解析」..."
              style={{ width: '100%', height: 160, padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#374151', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            <button
              onClick={() => {
                const textarea = document.getElementById('resume-paste-input') as HTMLTextAreaElement;
                const text = textarea?.value?.trim();
                if (!text || text.length < 20) {
                  setParseError('请先粘贴简历文本（至少20字符）再点击解析。');
                  return;
                }
                // 用 Blob 模拟文件
                const blob = new Blob([text], { type: 'text/plain' });
                const file = new File([blob], 'pasted-resume.txt', { type: 'text/plain' });
                setFileToUpload(file);
                setAppState('parsing');
              }}
              style={{ marginTop: 10, padding: '10px 24px', backgroundColor: '#374151', color: '#fff', borderRadius: 8, border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              开始解析粘贴内容
            </button>
          </div>
        </div>
      )}

      {/* 解析中 */}
      {appState === 'parsing' && (
        <div style={{ maxWidth: 600, margin: '60px auto 0', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: '#eef2ff', margin: '0 auto 30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={40} color="#427759" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 10 }}>AI 正在读取与结构化简历...</h2>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 16 }}>使用 DeepSeek-V3 (阿里云百炼) 提取核心履历结构</div>
          {parseStatus && (
            <div style={{ fontSize: 13, color: '#427759', backgroundColor: '#eef2ff', borderRadius: 8, padding: '10px 16px', display: 'inline-block' }}>
              {parseStatus}
            </div>
          )}
        </div>
      )}

      {/* 确认简历 */}
      {appState === 'confirm_resume' && (
        <div style={{ animation: 'fadeIn 0.5s ease', maxWidth: 1400, margin: '0 auto', width: '100%', position: 'relative' }}>
          {/* 右上角按钮区 - 上下排列 */}
          <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>
            <button
              onClick={() => startAsyncVerify('live')}
              disabled={stepLoading}
              style={{ padding: '10px 20px', backgroundColor: '#427759', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: stepLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: stepLoading ? 0.7 : 1, fontSize: 14, whiteSpace: 'nowrap', minWidth: 140 }}
            >
              <Eye size={16} /> 围观检验 <ArrowRight size={14} />
            </button>
            <button
              onClick={() => startAsyncVerify('background')}
              disabled={stepLoading}
              style={{ padding: '10px 20px', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontWeight: 600, cursor: stepLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: stepLoading ? 0.7 : 1, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: 14, whiteSpace: 'nowrap', minWidth: 140 }}
            >
              <Zap size={16} className="text-amber-500" /> 后台检验 <ArrowRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-4 mb-6" style={{ paddingRight: 180 }}>
            <div style={{ fontSize: 16, color: '#6b7280', fontWeight: 500 }}>阶段 1：结构化履历确认</div>
            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.7 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={14} /> 请仔细确认下方履历信息是否准确无误，确认后可选择右上角的检验方式开始自动核查
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#9ca3af' }}>
                <span style={{ color: '#427759', fontWeight: 500 }}>围观检验</span> - 实时查看检验进度 &nbsp;|&nbsp;
                <span style={{ color: '#f59e0b', fontWeight: 500 }}>后台检验</span> - 后台静默检验，完成后通过报告记录查看
              </div>
            </div>
          </div>

          <div style={{ width: '100%' }}>
            <AuditReport reportData={reportData} isConfirming={true} />
          </div>
        </div>
      )}

      {/* 验证阶段：终端 + 右侧结果 */}
      {isVerifying && (
        <div className="mx-auto animate-[fadeIn_0.5s_ease] flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-180px)] w-full" style={{ maxWidth: appState === 'verify_targeted' ? 1200 : appState === 'verify_async_live' ? 1400 : 900 }}>
          {/* 标题栏 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexShrink: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Search size={24} color="#427759" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{STEP_LABELS[appState]}</h2>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                {appState === 'verify_async_live' ? (
                  <span style={{ color: '#10b981' }}>正在全网并行检索分析中...</span>
                ) : (
                  <span>步骤 {STEP_ORDER.indexOf(appState) + 1} / {STEP_ORDER.length}</span>
                )}
              </div>
            </div>
          </div>

          {/* 主体区域 */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">

            {/* ═══ 异步并行：多列 Agent 显示 ═══ */}
            {appState === 'verify_async_live' ? (
              <>
                {/* 移动端 Tab 切换 */}
                <div className="md:hidden flex gap-1 mb-2 flex-shrink-0">
                  {(Object.keys(AGENT_META) as AgentId[]).map(aid => (
                    <button key={aid} onClick={() => setActiveAgentTab(aid)}
                      style={{
                        flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                        backgroundColor: activeAgentTab === aid ? '#1e293b' : 'transparent',
                        color: activeAgentTab === aid ? AGENT_META[aid].color : '#64748b',
                      }}
                    >
                      <span style={{ marginRight: 4 }}>{AGENT_META[aid].icon}</span>
                      {AGENT_META[aid].label}
                      {agentStatus[aid] === 'done' && ' ✅'}
                      {agentLogs[aid].length > 0 && agentStatus[aid] === 'running' && (
                        <span style={{ marginLeft: 4, display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 10 }}>⏳</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* 桌面端 4 列并排 / 移动端单列 */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3 min-h-0">
                  {(Object.keys(AGENT_META) as AgentId[]).map(aid => (
                    <div key={aid}
                      className={`flex flex-col min-h-0 md:!flex`}
                      style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                    >
                      {/* Agent 头部 */}
                      <div style={{
                        padding: '10px 14px', backgroundColor: '#fff',
                        borderBottom: `2px solid ${AGENT_META[aid].color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>{AGENT_META[aid].icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: AGENT_META[aid].color }}>{AGENT_META[aid].label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {agentStatus[aid] === 'running' && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: AGENT_META[aid].color, animation: 'pulse 1.5s ease-in-out infinite' }} />
                          )}
                          {agentStatus[aid] === 'done' && <span style={{ fontSize: 12 }}>✅</span>}
                          {agentStatus[aid] === 'idle' && <span style={{ fontSize: 11, color: '#475569' }}>等待中</span>}
                          <span style={{ fontSize: 11, color: '#475569' }}>{agentLogs[aid].length}</span>
                        </div>
                      </div>
                      {/* Agent 日志 */}
                      <div
                        ref={el => { agentRefs.current[aid] = el; }}
                        className="font-mono text-[12px] leading-relaxed"
                        style={{
                          flex: 1, overflowY: 'auto', backgroundColor: '#fafbfc', padding: '12px 14px',
                          minHeight: 0,
                        }}
                      >
                        {agentLogs[aid].length === 0 ? (
                          <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11 }}>
                            {agentStatus[aid] === 'idle' ? '等待启动...' : '暂无日志'}
                          </div>
                        ) : (
                          agentLogs[aid].map((log, idx) => {
                            let color = '#334155';
                            if (log.includes('[WARN')) color = '#d97706';
                            if (log.includes('[ERROR')) color = '#dc2626';
                            if (log.includes('✅') || log.includes('匹配')) color = '#059669';
                            if (log.includes('❌') || log.includes('MISMATCH')) color = '#dc2626';
                            if (log.includes('━━━━')) color = '#427759';
                            // 简化日志：去掉重复的前缀
                            const cleanLog = log.replace(/\[(MCP|OSINT|INFO|SYSTEM|CrossVerify|PARTNER)::\w+\]\s*/g, '').replace(/\[SYSTEM\]\s*/g, '');
                            return (
                              <div key={idx} style={{ color, marginBottom: 4, wordBreak: 'break-all', fontSize: 11, lineHeight: 1.5 }}>
                                {cleanLog || log}
                              </div>
                            );
                          })
                        )}
                        {agentStatus[aid] === 'running' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', marginTop: 8, fontSize: 11 }}>
                            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                            检索中...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              </>
            ) : (
            /* ═══ 其他步骤：原始单列终端 ═══ */
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto font-mono text-[#10b981] text-[13px] leading-relaxed shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] border border-[#1e293b]"
              style={{
                backgroundColor: '#0f172a',
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div style={{ color: '#64748b', marginBottom: 16 }}>$ init_verification_engine --target &quot;talent_diligence&quot; --mode &quot;deep_audit&quot;</div>
              {terminalLogs.map((log, idx) => {
                let color = '#10b981';
                if (log.includes('[WARN')) color = '#f59e0b';
                if (log.includes('[ERROR')) color = '#ef4444';
                if (log.includes('[SYSTEM')) color = '#60a5fa';
                if (log.includes('[OSINT')) color = '#22d3ee';
                if (log.includes('━━━━━━')) color = '#427759';
                return (
                  <div key={idx} style={{ color, marginBottom: 6, wordBreak: 'break-all' }}>
                    <span style={{ color: '#64748b', marginRight: 8 }}>[{new Date().toTimeString().substring(0, 8)}]</span>
                    {log}
                  </div>
                );
              })}
              {stepLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  正在检索中...
                </div>
              )}
            </div>
            )}

            {/* 定点突破任务列表（右侧面板，仅在 verify_targeted 时显示） */}
            {appState === 'verify_targeted' && targetedItems.length > 0 && (
              <div className="w-full md:w-[360px] flex-shrink-0 bg-[#1e293b] rounded-xl p-5 flex flex-col overflow-hidden max-h-[300px] md:max-h-full">
                {/* 列表头 */}
                <div style={{ flexShrink: 0, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>🎯 定点突破任务</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{currentTargetedIdx}/{targetedItems.length}</div>
                  </div>
                  <div style={{ width: '100%', height: 4, backgroundColor: '#334155', borderRadius: 2 }}>
                    <div style={{ width: `${(currentTargetedIdx / targetedItems.length) * 100}%`, height: '100%', backgroundColor: '#427759', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* 可滚动列表 */}
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {targetedItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '10px 12px', borderRadius: 8, backgroundColor: i === currentTargetedIdx ? 'rgba(96,85,245,0.12)' : 'transparent', border: i === currentTargetedIdx ? '1px solid rgba(96,85,245,0.3)' : '1px solid transparent', opacity: i < currentTargetedIdx ? 0.4 : 1 }}>
                      {/* 状态图标 */}
                      {item.done
                        ? <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0 }} />
                        : i === currentTargetedIdx
                          ? <ChevronRight size={15} color="#427759" style={{ flexShrink: 0 }} />
                          : <div style={{ width: 15, height: 15, borderRadius: '50%', border: '1px solid #475569', flexShrink: 0 }} />
                      }
                      {/* 内容 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: item.done ? '#64748b' : '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.value}
                        </div>
                        <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{item.type === 'paper' ? '📜 论文' : item.type === 'award' ? '🏆 奖项' : item.type === 'patent' ? '🔍 专利' : '🏢 职位'}</div>
                      </div>
                      {/* 当前条的突破按钮 */}
                      {i === currentTargetedIdx && !item.done && (
                        <button
                          onClick={triggerTargeted}
                          disabled={stepLoading}
                          style={{ flexShrink: 0, padding: '5px 10px', backgroundColor: stepLoading ? '#334155' : '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: stepLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          {stepLoading ? <><Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> 检索中</> : '突破 →'}
                        </button>
                      )}
                      {i === currentTargetedIdx && item.done && (
                        <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, flexShrink: 0 }}>✓</span>
                      )}
                    </div>
                  ))}
                  {currentTargetedIdx >= targetedItems.length && (
                    <div style={{ marginTop: 12, fontSize: 12, color: '#10b981', textAlign: 'center', padding: '8px 0' }}>
                      ✅ 全部完成！请点击底部按钮进入终局推演。
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 最终报告 */}
      {appState === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* 顶部操作栏 */}
          <div style={{
            flexShrink: 0, padding: '12px 24px', background: '#fff',
            borderBottom: '1px solid rgba(223,227,245,1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                ✅ {reportData?.resume?.name || '候选人'} 核查完成，报告已自动保存
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => router.push(`/talent-audit/${reportId}`)}
                style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 13, fontWeight: 500, color: '#475569', cursor: 'pointer' }}
              >
                返回验真空间
              </button>
              <button
                onClick={() => {
                  router.push(`/talent-audit/new?resumeId=${reportId}`);
                }}
                style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #d946ef, #a21caf)', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Sparkles size={14} /> 重新验真
              </button>
              {searchParams.get('sourceConvId') && (
                <button
                  onClick={() => router.push(`/chat?id=${searchParams.get('sourceConvId')}`)}
                  style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#374151', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                >
                  返回对话讨论报告
                </button>
              )}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <AuditReport reportData={reportData} isConfirming={false} />
          </div>
        </div>
      )}

      {/* ── 底部固定操作栏 ─────────────────────────────────────────────── */}
      {isVerifying && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid #e5e7eb',
          padding: '16px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 100,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ fontSize: 14, color: '#6b7280' }}>
            {stepLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} color="#427759" />
                {STEP_LABELS[appState]} 进行中...
              </span>
            ) : stepDone ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981' }}>
                <CheckCircle size={16} /> {STEP_LABELS[appState]} 已完成
              </span>
            ) : (
              <span style={{ color: '#9ca3af' }}>等待当前步骤完成...</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* 论文逐篇触发按钮 */}
            {appState === 'verify_pingfang_papers' && currentPaperIdx + 1 < paperQueue.length && stepDone && (
              <button
                onClick={triggerNextPaper}
                disabled={stepLoading}
                style={{ padding: '10px 20px', backgroundColor: '#427759', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: stepLoading ? 'not-allowed' : 'pointer', opacity: stepLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                核查下一篇论文 ({currentPaperIdx + 2}/{paperQueue.length}) <ChevronRight size={16} />
              </button>
            )}

            {/* 专利与成果逐项触发按钮 */}
            {appState === 'verify_pingfang_patents' && currentAchievementIdx + 1 < achievementQueue.length && stepDone && (
              <button
                onClick={triggerNextAchievement}
                disabled={stepLoading}
                style={{ padding: '10px 20px', backgroundColor: '#427759', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: stepLoading ? 'not-allowed' : 'pointer', opacity: stepLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
              >
                核查下一项成果 ({currentAchievementIdx + 2}/{achievementQueue.length}) <ChevronRight size={16} />
              </button>
            )}

            {/* 定点突破触发按钮 */}
            {appState === 'verify_targeted' && currentTargetedIdx < targetedItems.length && stepDone && !stepLoading && (
              <button
                onClick={triggerTargeted}
                style={{ padding: '10px 20px', backgroundColor: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <AlertTriangle size={16} /> 突破第 {currentTargetedIdx + 1} 条
              </button>
            )}

            {/* 进入下一步按钮 */}
            {nextState && stepDone && !stepLoading && (
              // 论文步骤：只有全部完成才显示"下一步"
              (appState !== 'verify_pingfang_papers' || currentPaperIdx + 1 >= paperQueue.length) &&
              // 成果步骤：只有全部完成才显示"下一步"
              (appState !== 'verify_pingfang_patents' || currentAchievementIdx + 1 >= achievementQueue.length) &&
              // 定点突破：只有全部完成才显示"下一步"
              (appState !== 'verify_targeted' || currentTargetedIdx >= targetedItems.length) && (
                <button
                  onClick={advanceToNextStep}
                  style={{ padding: '10px 24px', backgroundColor: '#427759', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(96,85,245,0.3)' }}
                >
                  下一步：{STEP_LABELS[nextState]} <ArrowRight size={16} />
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
