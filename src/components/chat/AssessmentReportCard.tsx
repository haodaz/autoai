'use client';
import React from 'react';

const PRIMARY = '#427759';

interface Dimension {
  name: string;
  score?: number;
  analysis?: string;
}
interface TopMatch {
  name: string;
  match?: number;
  reason?: string;
  representative_talents?: string[];
  key_institutions?: string[];
  expected_outputs?: string;
  verified_outputs?: string;
  cooperation_mode?: string;
}

interface AssessmentReportCardProps {
  title: string;
  summary?: string;
  dimensions?: Dimension[];
  top_matches?: TopMatch[];
  recommendations?: string[];
  next_steps?: string[];
  cooperation_roadmap?: string[];
  contact_note?: string;
  _raw?: string;
  saved?: boolean;
}

const RANK_COLORS = [
  { bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)', text: '#92400e', border: '#fbbf24', badge: '#fef3c7' },
  { bg: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', text: '#475569', border: '#cbd5e1', badge: '#f1f5f9' },
  { bg: 'linear-gradient(135deg, #fff7f5, #fdf2ee)', text: '#7c3a22', border: '#fdba74', badge: '#fdf2ee' },
];
const RANK_DEFAULT = { bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', text: '#4c1d95', border: '#c4b5fd', badge: '#ede9fe' };

export default function AssessmentReportCard({
  title, summary,
  dimensions = [], top_matches = [],
  recommendations = [], next_steps = [],
  cooperation_roadmap = [],
  contact_note,
  _raw,
  saved = false,
}: AssessmentReportCardProps) {
  const dims = dimensions.filter(d => d.name);
  const matches = top_matches.filter(m => m.name);
  const recs = recommendations.filter(Boolean);
  const steps = next_steps.filter(Boolean);
  const roadmap = cooperation_roadmap.filter(Boolean);
  const hasStructured = dims.length > 0 || matches.length > 0 || recs.length > 0 || steps.length > 0;
  const isIndustryReport = !!(contact_note || roadmap.length > 0 ||
    matches.some(m => m.representative_talents || m.key_institutions));

  return (
    <div className="rounded-2xl border overflow-hidden" style={{
      background: '#fff',
      borderColor: 'rgba(96,85,245,0.15)',
      boxShadow: '0 8px 32px rgba(96,85,245,.10), inset 0 2px 0 rgba(255,255,255,1)',
    }}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4" style={{
        background: isIndustryReport
          ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 40%, #ede9fe 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #ede9fe 100%)',
      }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm" style={{
            background: isIndustryReport ? 'linear-gradient(135deg, #0ea5e9, #427759)' : 'linear-gradient(135deg, #786cff, #427759)',
            border: '2px solid rgba(255,255,255,0.8)',
          }}>
            {isIndustryReport ? '🏭' : '📋'}
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight" style={{ color: '#1e1b4b' }}>{title}</div>
            <div className="text-[11px] mt-0.5 font-semibold" style={{ color: isIndustryReport ? '#0369a1' : '#7c3aed' }}>
              {isIndustryReport ? '产研转化分析报告 · 方略研究院出品' : '知己分析报告 · 仅供参考'}
            </div>
          </div>
        </div>
        {saved && (
          <span className="text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm" style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
            ✓ 已存档
          </span>
        )}
      </div>

      {/* 主体 */}
      <div className="p-5 flex flex-col gap-5">

        {/* 综合分析 */}
        {summary && (
          <section>
            <SectionTitle>综合分析</SectionTitle>
            <div className="mt-2 text-[13px] leading-[1.85] whitespace-pre-wrap" style={{ color: '#374151' }}>
              {summary}
            </div>
          </section>
        )}

        {/* 维度评估 */}
        {dims.length > 0 && (
          <section>
            <SectionTitle>维度评估</SectionTitle>
            <div className="flex flex-col gap-4 mt-2">
              {dims.map((d, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-semibold" style={{ color: '#374151' }}>{d.name}</span>
                    {d.score != null && (
                      <span className="text-[12px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(96,85,245,0.08)', color: PRIMARY }}>
                        {d.score}分
                      </span>
                    )}
                  </div>
                  {d.score != null && (
                    <div className="h-2 rounded-full overflow-hidden mb-1.5" style={{ background: '#ede9fe' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(d.score, 100)}%`, background: `linear-gradient(90deg, ${PRIMARY}, #8b5cf6)` }} />
                    </div>
                  )}
                  {d.analysis && (
                    <p className="text-[12px] m-0 leading-relaxed" style={{ color: '#6b7280' }}>{d.analysis}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 推荐方向 */}
        {matches.length > 0 && (
          <section>
            <SectionTitle>{isIndustryReport ? '推荐方向' : '最匹配方向'}</SectionTitle>
            <div className="flex flex-col gap-3 mt-2">
              {matches.map((m, i) => {
                const rank = RANK_COLORS[i] || RANK_DEFAULT;
                return (
                  <div key={i} className="rounded-xl p-3.5 border" style={{ background: rank.bg, borderColor: rank.border }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: rank.border, color: rank.text }}>
                          {i + 1}
                        </div>
                        <span className="text-[13px] font-semibold" style={{ color: '#1a1a2e' }}>{m.name}</span>
                      </div>
                      {m.match != null && (
                        <span className="text-[12px] font-bold flex-shrink-0 px-2 py-0.5 rounded-full"
                          style={{ background: rank.badge, color: rank.text, border: `1px solid ${rank.border}` }}>
                          {m.match}%
                        </span>
                      )}
                    </div>
                    {m.reason && (
                      <p className="text-[12px] leading-relaxed m-0 mb-2" style={{ color: '#4b5563' }}>{m.reason}</p>
                    )}
                    {(m.representative_talents?.length || m.key_institutions?.length || m.expected_outputs || m.verified_outputs || m.cooperation_mode) && (
                      <div className="flex flex-col gap-1 mt-2 pt-2 border-t" style={{ borderColor: rank.border }}>
                        {m.representative_talents && m.representative_talents.length > 0 && (
                          <div className="flex gap-1.5 items-start">
                            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: rank.text }}>代表人才：</span>
                            <span className="text-[11px]" style={{ color: '#6b7280' }}>{m.representative_talents.join('、')}</span>
                          </div>
                        )}
                        {m.key_institutions && m.key_institutions.length > 0 && (
                          <div className="flex gap-1.5 items-start">
                            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: rank.text }}>相关院所：</span>
                            <span className="text-[11px]" style={{ color: '#6b7280' }}>{m.key_institutions.join('、')}</span>
                          </div>
                        )}
                        {m.expected_outputs && (
                          <div className="flex gap-1.5 items-start">
                            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: rank.text }}>预期成果：</span>
                            <span className="text-[11px]" style={{ color: '#6b7280' }}>{m.expected_outputs}</span>
                          </div>
                        )}
                        {m.verified_outputs && (
                          <div className="flex gap-1.5 items-start">
                            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: rank.text }}>核验成果：</span>
                            <span className="text-[11px]" style={{ color: '#6b7280' }}>{m.verified_outputs}</span>
                          </div>
                        )}
                        {m.cooperation_mode && (
                          <div className="flex gap-1.5 items-start">
                            <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: rank.text }}>合作模式：</span>
                            <span className="text-[11px]" style={{ color: '#6b7280' }}>{m.cooperation_mode}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 建议 */}
        {recs.length > 0 && (
          <section>
            <SectionTitle>{isIndustryReport ? '对接建议' : '改进建议'}</SectionTitle>
            <ul className="mt-2 flex flex-col gap-2 list-none m-0 p-0">
              {recs.map((r, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed rounded-xl px-3 py-2.5"
                  style={{ color: '#374151', background: 'rgba(96,85,245,0.04)', border: '1px solid rgba(96,85,245,0.10)' }}>
                  <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PRIMARY }} />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 合作路线图 */}
        {roadmap.length > 0 && (
          <section>
            <SectionTitle>合作路线图</SectionTitle>
            <div className="mt-2 flex flex-col gap-0">
              {roadmap.map((phase, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${PRIMARY}, #8b5cf6)`, color: '#fff' }}>
                      {i + 1}
                    </div>
                    {i < roadmap.length - 1 && (
                      <div className="w-0.5 flex-1 my-1" style={{ background: 'linear-gradient(to bottom, rgba(96,85,245,0.3), rgba(96,85,245,0.05))' }} />
                    )}
                  </div>
                  <div className="flex-1 text-[12.5px] leading-relaxed pb-3" style={{ color: '#374151' }}>
                    {phase}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 下一步行动 */}
        {steps.length > 0 && (
          <section>
            <SectionTitle>下一步行动</SectionTitle>
            <ol className="mt-2 flex flex-col gap-2 list-none m-0 p-0">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed" style={{ color: '#374151' }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(96,85,245,0.10)', color: PRIMARY }}>
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 联系方式 */}
        {contact_note && (
          <section>
            <div className="flex items-start gap-3 rounded-xl p-4" style={{
              background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
              border: '1px solid #bae6fd',
            }}>
              <span className="text-xl flex-shrink-0">📩</span>
              <div className="flex-1">
                <div className="text-[12.5px] font-semibold mb-1" style={{ color: '#0369a1' }}>深度对接 · 战略咨询</div>
                <div className="text-[12px] leading-relaxed" style={{ color: '#374151' }}>{contact_note}</div>
              </div>
            </div>
          </section>
        )}

        {/* 降级 */}
        {!hasStructured && _raw && (() => {
          const cleaned = _raw
            .replace(/<student_profile[^>]*>/gi, '')
            .replace(/<\/student_profile>/gi, '')
            .replace(/<[a-z_]+>/gi, '\n')
            .replace(/<\/[a-z_]+>/gi, '')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
          return (
            <section>
              <SectionTitle>报告内容</SectionTitle>
              <pre style={{ fontSize: 13, lineHeight: 1.75, color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: '8px 0 0', padding: 0, fontFamily: 'inherit', background: 'none', border: 'none' }}>
                {cleaned}
              </pre>
            </section>
          );
        })()}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9ca3af' }}>
      {children}
    </div>
  );
}
