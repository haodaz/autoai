'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, FileSearch, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { AuditReport } from './AuditReport';
import { TalentAuditReportData, ValueEvaluationData } from './types';
import { ValueEvaluationReport } from './ValueEvaluationReport';
import AIScanReport from './AIScanReport';
import TalentPanorama from './TalentPanorama';

export default function AuditReportPage({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<TalentAuditReportData | null>(null);
  const [dbCreatedAt, setDbCreatedAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [showEvalReport, setShowEvalReport] = useState(searchParams?.get('tab') === 'eval');
  const [showScanReport, setShowScanReport] = useState(searchParams?.get('tab') === 'scan');
  const [showPanorama, setShowPanorama] = useState(searchParams?.get('tab') === 'panorama');
  const scanReportRef = useRef<{ rescan: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: any;

    const loadReport = async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        const data = await res.json();
        if (cancelled) return;
        if (data.ok && data.data?.content) {
          try {
            const parsedData = JSON.parse(data.data.content);
            setReportData(parsedData);
            setDbCreatedAt(data.data.createdAt || data.data.updatedAt);

            // 如果报告还在 RUNNING 中，或者看起来不完整（stats全0+factItems空），继续轮询
            const isRunning = parsedData.overallEvaluation?.level === 'RUNNING' ||
                parsedData.overallEvaluation?.text?.includes('验真中');
            const isIncomplete = (!parsedData.factItems || parsedData.factItems.length === 0) &&
                parsedData.stats?.match === 0 && parsedData.stats?.mismatch === 0 && parsedData.stats?.manual_review === 0;
            if (isRunning || isIncomplete) {
              pollTimer = setTimeout(loadReport, 3000);
            }
          } catch { /* ignore */ }
        }
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    loadReport();

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [id]);

  const handleGenerateEval = async (unverifiedMode: boolean = false) => {
    if (!reportData) return;
    setEvaluating(true);
    try {
      const res = await fetch('/api/talent-audit/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: reportData.resume,
          factItems: reportData.factItems,
          unverifiedMode
        }),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        const newData = { ...reportData, valueEvaluation: data.data };
        setReportData(newData);
        
        // Save back to server
        await fetch('/api/reports/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: id,
            title: `人才验真报告: ${(newData.resume?.name || '未知候选人').replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim()}`,
            summary: newData.overallEvaluation?.text || '验真完成',
            content: JSON.stringify(newData),
            format: 'json',
          })
        });

        setShowEvalReport(true);
      } else {
        if (!data.ok && data.error === 'No verified facts found to evaluate') {
          if (window.confirm("验真过程中未找到任何成功核实的真实记录。\n\n是否使用原始未经验真的经历强行生成价值评估报告？\n（注：生成结果仅供参考，请注意甄别经历真伪）")) {
            setEvaluating(false);
            return handleGenerateEval(true);
          }
        } else {
          alert('生成真值报告失败: ' + (data.error || 'Unknown error'));
        }
      }
    } catch (e: any) {
      alert('生成出错: ' + e.message);
    }
    setEvaluating(false);
  };

  useEffect(() => {
    // If the URL intended to show eval, but data is missing it, auto-generate
    if (showEvalReport && reportData && !reportData.valueEvaluation && !evaluating) {
      handleGenerateEval(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEvalReport, reportData, evaluating]);

  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "提取核心教育与经历要素...",
    "在平方数据底座对教育要素实体进行核验...",
    "评估科研与学术影响力权重...",
    "综合推演产业与实践价值...",
    "生成多维 AI 真值测算报告..."
  ];

  useEffect(() => {
    let interval: any;
    if (evaluating) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => Math.min(prev + 1, loadingSteps.length - 1));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [evaluating]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Back header */}
      <div className="shrink-0 p-3 md:py-3 md:px-6 bg-white border-b border-[#dfe3f5] flex flex-row items-center gap-3 justify-between">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push(`/talent-audit/resume/${id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: 8, color: '#64748b', fontSize: 13, fontWeight: 500 }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = '#1e293b'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
          >
            <ArrowLeft size={15} /> <span className="hidden md:inline">返回验真空间</span>
          </button>
          <div className="hidden md:block" style={{ width: 1, height: 16, background: '#e2e8f0' }} />
          <span className="hidden md:inline" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
            {reportData?.resume?.name
              ? `${reportData.resume.name} — ${showScanReport ? '人才扫描报告' : showPanorama ? '全景信息' : showEvalReport ? '真值评价报告' : '验真报告'}`
              : '核查报告详情'}
          </span>
        </div>
        
        {reportData && !loading && (
          <div className="flex gap-2 items-center">
            {reportData.valueEvaluation && showEvalReport ? (
              <>
                <button
                  onClick={() => handleGenerateEval()}
                  disabled={evaluating}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: '#fff', color: '#64748b',
                    fontSize: 12, fontWeight: 600, cursor: evaluating ? 'not-allowed' : 'pointer',
                    opacity: evaluating ? 0.7 : 1
                  }}
                  onMouseEnter={e => { if (!evaluating) { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.color = '#0f172a'; } }}
                  onMouseLeave={e => { if (!evaluating) { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#64748b'; } }}
                >
                  {evaluating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  重新测算
                </button>
                {searchParams?.get('sourceConvId') && (
                  <button
                    onClick={() => router.push(`/chat?id=${searchParams.get('sourceConvId')}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: '#374151', color: '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    返回对话讨论报告
                  </button>
                )}
              </>
            ) : showScanReport ? (
              /* 扫描报告模式：只显示"重新扫描"按钮 */
              <>
                <button
                  onClick={() => scanReportRef.current?.rescan()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: '#fff', color: '#64748b',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.color = '#0f172a'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                >
                  <RefreshCw size={14} />
                  重新扫描
                </button>
              </>
            ) : (
              /* 默认模式（验真报告 / 全景） */
              <>
                {!reportData.valueEvaluation && (
                  <button
                    onClick={() => handleGenerateEval(reportData?.overallEvaluation?.level === 'PENDING')}
                    disabled={evaluating}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 16px', borderRadius: 8, border: 'none',
                      background: 'linear-gradient(135deg, #d946ef, #a21caf)', color: '#fff',
                      fontSize: 13, fontWeight: 600, cursor: evaluating ? 'not-allowed' : 'pointer',
                      opacity: evaluating ? 0.7 : 1, boxShadow: '0 2px 8px rgba(217,70,239,0.3)'
                    }}
                  >
                    {evaluating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    测算深维真值
                  </button>
                )}
                <button
                  onClick={() => router.push(`/talent-audit/new?resumeId=${id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, border: '1px solid #e2e8f0',
                    background: '#fff', color: '#64748b',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto'
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc'; (e.currentTarget as HTMLElement).style.color = '#0f172a'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
                >
                  <FileSearch size={14} />
                  重新验真
                </button>
                {searchParams?.get('sourceConvId') && (
                  <button
                    onClick={() => router.push(`/chat?id=${searchParams.get('sourceConvId')}`)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8, border: 'none',
                      background: '#374151', color: '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    返回对话讨论报告
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: showScanReport ? 'hidden' : 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>加载中…</div>
        ) : !reportData ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
            <FileSearch size={48} color="#c4c4c4" />
            <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>报告不存在或已被删除</div>
            <button
              onClick={() => router.push('/talent-audit')}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#427759', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              返回列表
            </button>
          </div>
        ) : (
          <div className={(showScanReport || showPanorama) ? 'w-full h-full' : 'w-full max-w-[1200px] mx-auto px-[14px] md:px-10 pb-24 md:pb-10'}>
            {showScanReport ? (
              <AIScanReport
                reportData={reportData}
                onReportGenerated={async (scanResult) => {
                  // 保存扫描结果到服务端
                  const newData = { ...reportData, aiScan: scanResult };
                  setReportData(newData);
                  try {
                    await fetch('/api/reports/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id,
                        title: `人才验真报告: ${(newData.resume?.name || '未知候选人').replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim()}`,
                        summary: newData.overallEvaluation?.text || '验真完成',
                        content: JSON.stringify(newData),
                        format: 'json',
                      })
                    });

                    // 顺便保存到人才日志
                    const institution = newData.resume?.experience?.[0]?.company || newData.resume?.education?.[0]?.school || '';
                    const candidateName = (newData.resume as any)?.name_cn || newData.resume?.name || '未知';
                    await fetch('/api/talent-audit/journal-save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        candidateName,
                        institution,
                        sourceData: newData.sourceData,
                        aiReport: newData.overallEvaluation?.text || scanResult?.overall?.comment || '',
                      })
                    });
                  } catch (e) {
                    console.error('Failed to save report or journal:', e);
                  }
                }}
                ref={scanReportRef}
              />
            ) : showPanorama ? (
              <div className="w-full max-w-[900px] mx-auto py-6">
                <TalentPanorama reportData={reportData} />
              </div>
            ) : evaluating ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: 'linear-gradient(135deg, #ede9ff, #d4ccff)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: '0 8px 32px rgba(96,85,245,0.2)' }}>
                  <Sparkles size={32} color="#427759" className="animate-pulse" />
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>AI 正在生成真值报告</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}>
                  {loadingSteps.map((step, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex', alignItems: 'center', gap: 12, 
                      opacity: idx <= loadingStep ? 1 : 0.3,
                      transition: 'opacity 0.3s ease',
                    }}>
                      {idx < loadingStep ? (
                        <div style={{ width: 20, height: 20, borderRadius: 10, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      ) : idx === loadingStep ? (
                        <Loader2 size={20} className="animate-spin text-primary" style={{ flexShrink: 0, color: '#427759' }} />
                      ) : (
                        <div style={{ width: 20, height: 20, borderRadius: 10, border: '2px solid #cbd5e1', flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 14, color: idx <= loadingStep ? '#334155' : '#94a3b8', fontWeight: idx === loadingStep ? 600 : 400 }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : showEvalReport && reportData.valueEvaluation ? (
              <ValueEvaluationReport data={reportData.valueEvaluation} resume={reportData.resume} />
            ) : (
              <AuditReport reportData={reportData} reportId={id} auditDate={dbCreatedAt} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
