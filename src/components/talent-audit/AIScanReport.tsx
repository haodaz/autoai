'use client';

import { useCallback, useState, useRef, useEffect, forwardRef, useImperativeHandle, type CSSProperties } from 'react';
import {
  ArrowLeft, RefreshCw, Loader2, TrendingUp, AlertTriangle, CheckCircle2,
  Sparkles, FileText, Building, Crosshair, Handshake, GraduationCap,
  Trophy, Briefcase, Users, Rocket, Globe, Search, Info,
} from 'lucide-react';
import TalentPanorama from './TalentPanorama';
import './AIScanReport.css';

// ─── 人才池说明 ────────────────────────────────────────────────────────────────
const POOL_DESCRIPTIONS: Record<string, { label: string; desc: string }> = {
  '潜力人才': { label: '潜力人才', desc: '本硕博在读或刚毕业，以学术潜力和教育背景为主' },
  '青年人才': { label: '青年人才', desc: '博士后/早期科研人员，已有独立科研产出' },
  '优秀人才': { label: '优秀人才', desc: '获省部级奖项/海外高层次青年人才认可' },
  '杰出人才': { label: '杰出人才', desc: '获国家级基金/顶级学会奖项，领域内有显著贡献' },
  '领军人才': { label: '领军人才', desc: '院士/学会会士/国际顶层荣誉持有者，定义了一个领域' },
};
const POOL_ORDER = ['潜力人才', '青年人才', '优秀人才', '杰出人才', '领军人才'];

// ─── Types ────────────────────────────────────────────────────────────────
type Dimension = {
  key: string;
  title: string;
  icon: string;
  score: number;
  grade: string;
  strength: string;
  weakness: string;
  detail: string;
  // 杰出/领军人才的定性视角（可选）
  positioning?: string;
  peerBenchmark?: string;
  fieldImpact?: string;
};

type AIScanReportData = {
  pool: string;
  poolReason: string;
  overall: {
    score: number;
    grade: string;
    headline: string;
    summary: string[];
    tags: string[];
  };
  dimensions: Dimension[];
  topStrengths: string[];
  keyRisks: string[];
  cooperationSuggestions: string[];
  industryImpacts: { industry: string; match: number; reason: string }[];
  suitableRoles: { name: string; match: number; reason: string }[];
  hasVerifiedData: boolean;
  generatedAt: string;
};

interface AIScanReportProps {
  reportData: any;       // 整个 audit report 数据
  onBack?: () => void;
  onReportGenerated?: (report: AIScanReportData) => void;  // 扫描完成后回调，用于外部保存
}

function gradeClass(score: number) {
  if (score >= 90) return 'scan-grade-excellent';
  if (score >= 80) return 'scan-grade-good';
  if (score >= 70) return 'scan-grade-fair';
  if (score >= 60) return 'scan-grade-pass';
  return 'scan-grade-poor';
}

function DimIcon({ dimKey }: { dimKey: string }) {
  const size = 20;
  const cls = 'scan-dim-icon';
  if (dimKey === 'education') return <GraduationCap size={size} className={cls} />;
  if (dimKey === 'research') return <Trophy size={size} className={cls} />;
  if (dimKey === 'industry') return <Briefcase size={size} className={cls} />;
  if (dimKey === 'leadership') return <Users size={size} className={cls} />;
  if (dimKey === 'innovation') return <Rocket size={size} className={cls} />;
  if (dimKey === 'social') return <Globe size={size} className={cls} />;
  return <Sparkles size={size} className={cls} />;
}

const AIScanReport = forwardRef<{ rescan: () => void }, AIScanReportProps>(function AIScanReport({ reportData, onReportGenerated }, ref) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [report, setReport] = useState<AIScanReportData | null>(
    reportData?.aiScan || null
  );
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState('');
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [recTab, setRecTab] = useState<'industry' | 'roles'>('industry');
  const [centerTab, setCenterTab] = useState<'dimensions' | 'panorama'>('dimensions');
  const [poolInfoOpen, setPoolInfoOpen] = useState(false);
  const poolInfoRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭气泡
  useEffect(() => {
    if (!poolInfoOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (poolInfoRef.current && !poolInfoRef.current.contains(e.target as Node)) {
        setPoolInfoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [poolInfoOpen]);

  const runScan = useCallback(async () => {
    setStatus('loading');
    setReport(null);
    setError('');

    try {
      const resumeData = reportData?.resumeData || reportData?.resume;
      const factItems = reportData?.factItems || [];

      // 只传验真正确的 factItems，排除 mismatch
      const verifiedItems = factItems.filter(
        (f: any) => f.status === 'match' || f.status === 'manual_review'
      );

      if (!resumeData) {
        setError('没有简历数据可供分析');
        setStatus('error');
        return;
      }

      if (verifiedItems.length === 0) {
        setError('没有已验真的数据，请先完成人才验真');
        setStatus('error');
        return;
      }

      const res = await fetch('/api/talent-audit/ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, factItems: verifiedItems, sourceData: reportData.sourceData }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'status') setStatusMsg(ev.message);
            if (ev.type === 'report') {
              setReport(ev.data);
              setStatus('done');
              // 通知外部保存
              onReportGenerated?.(ev.data);
            }
            if (ev.type === 'error') {
              setError(ev.message);
              setStatus('error');
            }
          } catch { /* skip */ }
        }
      }
    } catch (e: any) {
      setError(e?.message || '分析失败');
      setStatus('error');
    }
  }, [reportData]);

  // 暴露 rescan 方法给父组件
  useImperativeHandle(ref, () => ({ rescan: () => runScan() }), [runScan]);

  // 自动开始扫描（如果没有缓存结果）
  const [autoStarted, setAutoStarted] = useState(false);
  if (!autoStarted && !report && status === 'idle') {
    setAutoStarted(true);
    setTimeout(() => runScan(), 100);
  }

  const arcLen = Math.PI * 90;
  const isLoading = status === 'loading';

  return (
    <div className="scan-page">
      <div className="scan-body">
        <div className="scan-inner">

          {/* Loading */}
          {isLoading && (
            <div className="scan-center-state">
              <div className="scan-loading-ring">
                <Loader2 size={40} className="scan-spin" />
              </div>
              <p className="scan-loading-title">AI 正在深度分析...</p>
              <div className="scan-status-pill">
                <p className="scan-status-text">{statusMsg || '准备中...'}</p>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="scan-error-box">
              <AlertTriangle size={40} className="scan-error-icon" />
              <p className="scan-error-title">分析失败</p>
              <p className="scan-error-msg">{error}</p>
              <button type="button" onClick={runScan} className="scan-retry-btn">
                重试
              </button>
            </div>
          )}

          {/* Report */}
          {(status === 'done' || (status === 'idle' && report)) && report && (
            <div className="scan-layout">
              {/* ── LEFT COLUMN ── */}
              <div className="scan-left">
                <div className="scan-score-dashboard">
                  <div className="scan-score-ring-wrap">
                    <svg width="220" height="130" viewBox="0 0 220 130" aria-hidden>
                      <defs>
                        <linearGradient id="scan-score-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#786cff" />
                          <stop offset="100%" stopColor="#427759" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 20 110 A 90 90 0 0 1 200 110"
                        fill="none" stroke="#f1f5f9" strokeWidth="14" strokeLinecap="round"
                      />
                      <path
                        d="M 20 110 A 90 90 0 0 1 200 110"
                        fill="none" stroke="url(#scan-score-grad)" strokeWidth="14" strokeLinecap="round"
                        strokeDasharray={arcLen}
                        strokeDashoffset={arcLen - ((report.overall.score / 100) * arcLen)}
                      />
                    </svg>
                    <div className="scan-score-value">
                      <div className="scan-score-num">{report.overall.score}</div>
                      <div className="scan-score-label">综合竞争力指数 / 100</div>
                    </div>
                  </div>

                  <div>
                    {/* 人才池级别（单独一行）+ info 气泡 */}
                    <div className="scan-pool-line" ref={poolInfoRef}>
                      <span className="scan-pool-badge">{report.pool}</span>
                      <button
                        type="button"
                        className="scan-pool-info-btn"
                        onClick={() => setPoolInfoOpen(!poolInfoOpen)}
                        aria-label="查看人才分级说明"
                      >
                        <Info size={14} />
                      </button>
                      {poolInfoOpen && (
                        <div className="scan-pool-info-card">
                          <div className="scan-pool-info-title">人才分级说明</div>
                          {POOL_ORDER.map(p => (
                            <div
                              key={p}
                              className={`scan-pool-info-row ${p === report.pool ? 'scan-pool-info-row-active' : ''}`}
                            >
                              <span className="scan-pool-info-label">{p}</span>
                              <span className="scan-pool-info-desc">{POOL_DESCRIPTIONS[p]?.desc}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Headline */}
                    <h3 className="scan-headline">{report.overall.headline}</h3>
                    
                    {/* Tags: 默认只显示3行，可展开 */}
                    {report.overall.tags?.length > 0 && (
                      <div className={`scan-tag-row ${!tagsExpanded ? 'scan-tag-row-collapsed' : ''}`}>
                        <span className="scan-tag scan-tag-pool">{report.pool}</span>
                        {report.overall.tags.map((tag, i) => (
                          <span key={i} className="scan-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    {report.overall.tags && report.overall.tags.length > 6 && (
                      <button
                        type="button"
                        className="scan-tag-toggle"
                        onClick={() => setTagsExpanded(!tagsExpanded)}
                      >
                        {tagsExpanded ? '收起标签' : `展开全部 ${report.overall.tags.length + 1} 个标签`}
                      </button>
                    )}

                    <div className="scan-summary-box">
                      {report.overall.summary.length > 0 ? (
                        <ul className="scan-summary-list">
                          {report.overall.summary.map((point, idx) => (
                            <li key={idx} className="scan-summary-item">{point}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <p className="scan-ts">
                      上次扫描：{new Date(report.generatedAt).toLocaleString()}
                      {report.hasVerifiedData && (
                        <span className="scan-verified-badge">🔒 基于全景数据</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="scan-divider" />

                {/* Strengths */}
                <div className="scan-section-pad">
                  <div className="scan-section-head">
                    <TrendingUp size={18} className="scan-icon-green" />
                    <span className="scan-section-title">核心优势</span>
                  </div>
                  <div className="scan-list-col">
                    {report.topStrengths.map((s, i) => (
                      <div key={i} className="scan-list-row">
                        <span className="scan-list-mark-green">✓</span>
                        <span className="scan-list-text">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="scan-divider" />

                {/* Risks */}
                <div className="scan-section-pad">
                  <div className="scan-section-head">
                    <AlertTriangle size={18} className="scan-icon-amber" />
                    <span className="scan-section-title">风险提示</span>
                  </div>
                  <div className="scan-list-col">
                    {report.keyRisks.map((r, i) => (
                      <div key={i} className="scan-list-row">
                        <span className="scan-list-mark-amber">!</span>
                        <span className="scan-list-text">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── CENTER COLUMN ── */}
              <div className="scan-center">
                {/* Tab bar: 明细分析 / 全景信息 */}
                <div className="scan-tab-bar">
                  <button
                    type="button"
                    className={`scan-tab-btn ${centerTab === 'dimensions' ? 'scan-tab-btn-active' : ''}`}
                    onClick={() => setCenterTab('dimensions')}
                  >
                    <FileText size={14} /> 明细分析
                  </button>
                  <button
                    type="button"
                    className={`scan-tab-btn ${centerTab === 'panorama' ? 'scan-tab-btn-active' : ''}`}
                    onClick={() => setCenterTab('panorama')}
                  >
                    <Search size={14} /> 全景信息
                  </button>
                </div>

                {centerTab === 'dimensions' && (
                <div className="scan-card">
                  <div className="scan-card-head">
                    <FileText size={20} className="scan-icon-blue" />
                    <span className="scan-card-head-title">明细分析</span>
                  </div>

                  <div className="scan-dim-grid">
                    {report.dimensions.map((dim, i) => (
                      <div
                        key={dim.key}
                        className={`scan-dim-card ${gradeClass(dim.score)}`}
                        style={{ '--delay': `${i * 0.07}s` } as CSSProperties}
                      >
                        <div className="scan-dim-header">
                          <div className="scan-dim-title-row">
                            <DimIcon dimKey={dim.key} />
                            <div className="scan-dim-title">{dim.title}</div>
                          </div>
                          <div className="scan-dim-score-row">
                            <div className="scan-dim-score">{dim.score}</div>
                            <div className="scan-dim-grade">{dim.grade}</div>
                          </div>
                        </div>

                        <div className="scan-bar-track">
                          <div
                            className="scan-bar-fill"
                            style={{ '--pct': `${dim.score}%` } as CSSProperties}
                          />
                        </div>

                        <div className="scan-dim-points">
                          <div className="scan-dim-point">
                            <CheckCircle2 size={12} className="scan-dim-point-icon-green" />
                            <span className="scan-dim-point-text">{dim.strength}</span>
                          </div>
                          <div className="scan-dim-point">
                            <AlertTriangle size={12} className="scan-dim-point-icon-amber" />
                            <span className="scan-dim-point-text">{dim.weakness}</span>
                          </div>
                        </div>
                        <p className="scan-dim-detail">{dim.detail}</p>
                        {/* 杰出/领军人才的定性视角标签 */}
                        {(dim.positioning || dim.peerBenchmark || dim.fieldImpact) && (
                          <div className="scan-dim-qualitative">
                            {dim.positioning && (
                              <div className="scan-dim-qual-tag">
                                <span className="scan-dim-qual-label">🏷️ 定位</span>
                                <span className="scan-dim-qual-value">{dim.positioning}</span>
                              </div>
                            )}
                            {dim.peerBenchmark && (
                              <div className="scan-dim-qual-tag">
                                <span className="scan-dim-qual-label">📐 对标</span>
                                <span className="scan-dim-qual-value">{dim.peerBenchmark}</span>
                              </div>
                            )}
                            {dim.fieldImpact && (
                              <div className="scan-dim-qual-tag">
                                <span className="scan-dim-qual-label">🌟 影响</span>
                                <span className="scan-dim-qual-value">{dim.fieldImpact}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {centerTab === 'panorama' && (
                  <TalentPanorama reportData={reportData} />
                )}
              </div>

              {/* ── RIGHT COLUMN ── */}
              <div className="scan-side">
                <div className="scan-side-head">
                  <Handshake size={20} className="scan-icon-brand" />
                  <span className="scan-side-head-title">接触与合作建议</span>
                </div>
                <div className="scan-coop-container">
                  {report.cooperationSuggestions.map((suggestion, i) => (
                    <div key={i} className="scan-coop-item">
                      <div className="scan-coop-num">{i + 1}</div>
                      <div className="scan-coop-text">{suggestion}</div>
                    </div>
                  ))}
                </div>

                {/* 推荐合作领域 / 角色 — tab 切换 */}
                {((report.industryImpacts?.length > 0) || (report.suitableRoles?.length > 0)) && (
                  <div className="scan-card scan-card-compact" style={{ marginTop: 8 }}>
                    <div className="scan-tab-bar">
                      <button
                        type="button"
                        className={`scan-tab-btn ${recTab === 'industry' ? 'scan-tab-btn-active' : ''}`}
                        onClick={() => setRecTab('industry')}
                      >
                        <Building size={14} /> 合作领域
                      </button>
                      <button
                        type="button"
                        className={`scan-tab-btn ${recTab === 'roles' ? 'scan-tab-btn-active' : ''}`}
                        onClick={() => setRecTab('roles')}
                      >
                        <Crosshair size={14} /> 合作角色
                      </button>
                    </div>

                    {recTab === 'industry' && report.industryImpacts?.length > 0 && (
                      <div className="scan-rank-list">
                        {report.industryImpacts.map((r, i) => (
                          <div key={i} className="scan-rank-row">
                            <div className={`scan-rank-badge${i < 3 ? ' scan-rank-badge-top' : ''}`}>{i + 1}</div>
                            <div className={`scan-rank-body${i === report.industryImpacts.length - 1 ? ' scan-rank-body-last' : ''}`}>
                              <div className="scan-rank-meta">
                                <span className="scan-rank-name">{r.industry}</span>
                                <span className="scan-rank-match">{r.match}% 匹配</span>
                              </div>
                              <div className="scan-rank-reason">{r.reason}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {recTab === 'roles' && report.suitableRoles?.length > 0 && (
                      <div className="scan-rank-list">
                        {report.suitableRoles.map((r, i) => (
                          <div key={i} className="scan-rank-row">
                            <div className={`scan-rank-badge${i < 3 ? ' scan-rank-badge-top' : ''}`}>{i + 1}</div>
                            <div className={`scan-rank-body${i === report.suitableRoles.length - 1 ? ' scan-rank-body-last' : ''}`}>
                              <div className="scan-rank-meta">
                                <span className="scan-rank-name">{r.name}</span>
                                <span className="scan-rank-match">{r.match}% 匹配</span>
                              </div>
                              <div className="scan-rank-reason">{r.reason}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AIScanReport;
