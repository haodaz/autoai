'use client';
import React from 'react';
import { UserSquare2, FileText, Award, X, Briefcase, GraduationCap, Star, TrendingUp, Cpu, Globe, Users, Database, Search, BookOpen, Trophy, ExternalLink, BarChart3, User, Notebook } from 'lucide-react';

const SOURCE_COLORS: Record<string, string> = {
  pingfang: '#427759', journal: '#059669', internet: '#d97706',
};
const SOURCE_LABEL: Record<string, string> = {
  pingfang: '平方', openalex: 'Scholar', wikipedia: 'Wiki', internet: '互联网',
};
const ICON_MAP: Record<string, React.ReactNode> = {
  user: <User size={15} />, chart: <BarChart3 size={15} />,
  bio: <FileText size={15} />, note: <Notebook size={15} />,
  report: <TrendingUp size={15} />, web: <Globe size={15} />,
};

export function TalentModal({ selectedTalent, onClose }: { selectedTalent: any; onClose: any }) {
  if (!selectedTalent) return null;
  const d = selectedTalent;
  const journal = d.journalMeta;

  // 是否是新格式（有 sections 字段）
  const hasNewFormat = Array.isArray(d.sections);

  return (
    <div className="talent-modal-overlay" onClick={onClose}>
      <div className="talent-modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} color="#666" />
        </button>

        {/* ── Header ── */}
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="modal-avatar">
              {d.avatar ? (
                <img src={d.avatar} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserSquare2 size={40} color="#fff" />
              )}
            </div>
            <div className="modal-title-area">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3>{d.name}</h3>
                {d.nameEn && <span style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>{d.nameEn}</span>}
                {d.title && <span className="modal-badge">{d.title}</span>}
              </div>
              {d.currentOrg && <p className="modal-subtitle">{d.currentOrg}</p>}
              {/* {d.tags?.length > 0 && (
                <div className="modal-tags">
                  {d.tags.map((t: any) => <span key={t} className="m-tag">#{t}</span>)}
                </div>
              )} */}
            </div>
          </div>

          {/* 顶部指标 — 只显示有值的 */}
          {(validStat(d.highestDegree) || validStat(d.rating)) && (
            <div className="modal-stats-grid">
              {validStat(d.highestDegree) && (
                <div className="stat-item">
                  <span className="stat-label"><GraduationCap size={14} /> 最高学历</span>
                  <span className="stat-value">{d.highestDegree}</span>
                </div>
              )}
              {validStat(d.rating) && (
                <div className="stat-item">
                  <span className="stat-label"><Star size={14} /> 学术评级</span>
                  <span className="stat-value" style={{ color: '#427759' }}>{d.rating}</span>
                </div>
              )}
            </div>
          )}

          {/* 数据来源标签 */}
          {(journal || d.hasPingfangData) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0 0', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#999' }}><Database size={11} style={{ verticalAlign: -1 }} /> 数据来源：</span>
              {d.hasPingfangData && <SourceBadge color="#427759" label="平方数据库" />}
              {journal?.dataSources?.map((s: string) => {
                if (s === 'pingfang') return null;
                return <SourceBadge key={s} color={SOURCE_COLORS[s] || '#999'} label={SOURCE_LABEL[s] || s} />;
              })}
              {journal && (
                <span style={{ fontSize: 11, color: '#bbb', marginLeft: 4 }}>
                  <Search size={10} style={{ verticalAlign: -1 }} /> 被查询 {journal.searchCount} 次
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="modal-body">

          {/* ========== 新格式：弹性 sections ========== */}
          {hasNewFormat && d.sections.map((sec: any, si: number) => (
            <div key={si} className="modal-section card-style">
              <h4>{ICON_MAP[sec.icon] || <FileText size={15} />} {sec.title}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sec.items.map((item: any, ii: number) => (
                  <div key={ii} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.7 }}>
                    {item.label && (
                      <span style={{ color: '#888', flexShrink: 0, minWidth: 72 }}>{item.label}</span>
                    )}
                    <span style={{ color: 'rgba(0,0,0,0.8)', flex: 1, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {item.isLink ? (
                        <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ color: '#427759' }}>
                          {simplifyUrl(item.value)} <ExternalLink size={10} style={{ verticalAlign: -1 }} />
                        </a>
                      ) : (
                        <RichText text={item.value} />
                      )}
                      {item.source !== 'pingfang' && <span style={{ fontSize: 10, color: SOURCE_COLORS[item.source] || '#999', marginLeft: 4 }}>🌐</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* ========== 旧格式兼容：researchOutput / influence 等 ========== */}
          {!hasNewFormat && d.researchOutput && (
            <div className="modal-section card-style">
              <h4><Award size={15} /> 科研成果与产出</h4>
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}><RichText text={d.researchOutput} /></p>
            </div>
          )}
          {!hasNewFormat && d.influence && d.influence !== '行业内具有一定影响力' && (
            <div className="modal-section card-style">
              <h4><Globe size={15} /> 行业影响力</h4>
              <p>{d.influence}</p>
            </div>
          )}

          {/* ========== 结构化子表（新旧格式共享）========== */}

          {/* 教育经历 */}
          {d.educationList?.length > 0 && (
            <div className="modal-section card-style">
              <h4><GraduationCap size={15} /> 教育经历</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {d.educationList.map((e: any, i: number) => (
                  <SubCard key={i} highlight={e.isHighest} highlightColor="rgba(96,85,245,0.06)" borderColor="rgba(96,85,245,0.2)">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'rgba(0,0,0,0.85)' }}>
                        {e.school}
                        {e.isHighest && <MicroBadge text="最高学历" color="#427759" />}
                      </span>
                      <span style={{ fontSize: 11, color: '#999' }}>{e.period}</span>
                    </div>
                    {(e.major || e.degree) && (
                      <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                        {[e.degree, e.major].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </SubCard>
                ))}
              </div>
            </div>
          )}

          {/* 获奖经历 */}
          {d.awardList?.length > 0 && (
            <div className="modal-section card-style">
              <h4><Trophy size={15} /> 获奖经历</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {d.awardList.map((a: any, i: number) => (
                  <SubCard key={i} bg="#fffbe6" border="#fff1b8">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: 'rgba(0,0,0,0.85)' }}>{a.name}</span>
                      {a.year && <span style={{ fontSize: 11, color: '#d48806' }}>{a.year}年</span>}
                    </div>
                    {(a.level || a.description) && (
                      <div style={{ fontSize: 12, color: '#8c6d1f', marginTop: 2 }}>
                        {[a.level, a.description].filter(Boolean).join(' · ')}
                      </div>
                    )}
                  </SubCard>
                ))}
              </div>
            </div>
          )}

          {/* 专利 */}
          {d.patentList?.length > 0 && (
            <div className="modal-section card-style">
              <h4><Cpu size={15} /> 专利授权 ({d.patentList.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {d.patentList.map((p: any, i: number) => (
                  <SubCard key={i} bg="#f6ffed" border="#d9f7be">
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'rgba(0,0,0,0.85)' }}>
                      {p.name}
                      {p.isFirstInventor && <MicroBadge text="第一发明人" color="#389e0d" />}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {[p.patentNo && `专利号：${p.patentNo}`, p.date, p.type].filter(Boolean).join(' · ')}
                    </div>
                    {p.inventors && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>发明人：{p.inventors}</div>}
                  </SubCard>
                ))}
              </div>
            </div>
          )}

          {/* 论文 */}
          {d.paperList?.length > 0 && (
            <div className="modal-section card-style">
              <h4><BookOpen size={15} /> 代表论文 ({d.paperList.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {d.paperList.slice(0, 10).map((p: any, i: number) => (
                  <SubCard key={i} bg="#f0f5ff" border="#d6e4ff">
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'rgba(0,0,0,0.85)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                      {[p.journal, p.impactFactor && `IF: ${p.impactFactor}`, p.indexedBy].filter(Boolean).join(' · ')}
                    </div>
                    {p.authors && <div style={{ fontSize: 11, color: '#999', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.authors}</div>}
                  </SubCard>
                ))}
                {d.paperList.length > 10 && <div style={{ fontSize: 12, color: '#999', textAlign: 'center' }}>… 共 {d.paperList.length} 篇</div>}
              </div>
            </div>
          )}

          {/* 科研项目 */}
          {d.projectList?.length > 0 && (
            <div className="modal-section card-style">
              <h4><TrendingUp size={15} /> 科研项目 ({d.projectList.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {d.projectList.map((p: any, i: number) => (
                  <div key={i} style={{ fontSize: 13, display: 'flex', gap: 6, lineHeight: 1.6 }}>
                    <span style={{ color: '#427759' }}>•</span>
                    <span style={{ color: 'rgba(0,0,0,0.8)' }}>
                      {p.name}
                      {p.year && <span style={{ color: '#999', marginLeft: 6 }}>{p.year}</span>}
                      {p.isFirstPerson && <MicroBadge text="主持" color="#427759" />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 旧格式兼容：dynamicFields */}
          {!hasNewFormat && d.dynamicFields?.length > 0 && (
            <div className="modal-section card-style">
              <h4><FileText size={15} /> 详细信息</h4>
              <div style={{ display: 'grid', gap: 6 }}>
                {d.dynamicFields.map((f: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.6 }}>
                    <span style={{ color: '#888', flexShrink: 0, minWidth: 72 }}>{f.label}</span>
                    <span style={{ color: 'rgba(0,0,0,0.75)', wordBreak: 'break-all' }}><RichText text={f.value} /></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 旧格式兼容：projects (string) */}
          {!hasNewFormat && !d.projectList && d.projects && d.projects !== '暂无项目记录' && (
            <div className="modal-section card-style">
              <h4><TrendingUp size={15} /> 核心科研项目</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{d.projects}</p>
            </div>
          )}

          {/* 关联群体 */}
          {d.groups?.length > 0 && (
            <div className="modal-section card-style">
              <h4><Users size={15} /> 关联群体</h4>
              <div className="groups-list">
                {d.groups.map((g: any, i: number) => <span key={i} className="group-tag">{g}</span>)}
              </div>
            </div>
          )}

          {/* 职业履历 */}
          {d.history?.length > 0 && (
            <div className="modal-section card-style">
              <h4><Briefcase size={15} /> 职业履历</h4>
              <div className="timeline">
                {d.history.map((h: any, i: number) => (
                  <div key={i} className="timeline-item">
                    <div className="time">{h.time}</div>
                    <div className="role">
                      {h.role}
                      {h.department && <span style={{ fontSize: 12, color: '#999' }}> · {h.department}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 完全没数据 */}
          {!hasNewFormat && !d.researchOutput && !d.dynamicFields?.length && !d.educationList?.length && !d.history?.length && (
            <div className="modal-section card-style" style={{ textAlign: 'center', color: '#ccc', padding: '32px 16px' }}>
              暂无详细数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 辅助 ─────────────────────────────────────────────────────────────────

function validStat(val: string | undefined): boolean {
  if (!val) return false;
  return !['未知', '暂无评级', '待评估', '多年'].includes(val);
}

function SourceBadge({ color, label }: { color: string; label: string }) {
  return (
    <span style={{
      fontSize: 11, padding: '1px 8px', borderRadius: 10,
      background: `${color}14`, color, border: `1px solid ${color}30`, fontWeight: 500, whiteSpace: 'nowrap' as const,
    }}>{label}</span>
  );
}

function MicroBadge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, color, marginLeft: 6,
      background: `${color}15`, padding: '1px 6px', borderRadius: 4,
      border: `1px solid ${color}30`, whiteSpace: 'nowrap' as const,
    }}>{text}</span>
  );
}

function SubCard({ children, highlight, highlightColor, borderColor, bg, border }: {
  children: React.ReactNode;
  highlight?: boolean; highlightColor?: string; borderColor?: string;
  bg?: string; border?: string;
}) {
  return (
    <div style={{
      padding: '6px 12px',
      background: highlight ? (highlightColor || '#f8f8ff') : (bg || '#fafafa'),
      borderRadius: 8,
      border: `1px solid ${highlight ? (borderColor || '#e0e0ff') : (border || '#f0f0f0')}`,
    }}>{children}</div>
  );
}

function RichText({ text }: { text: any }) {
  if (text === null || text === undefined || text === '') return null;
  const str = typeof text === 'string' ? text : String(text);
  const parts = str.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s\)）\]]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: 'rgba(0,0,0,0.85)' }}>{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" style={{ color: '#427759' }}>{linkMatch[1]} <ExternalLink size={10} style={{ verticalAlign: -1 }} /></a>;
        }
        if (/^https?:\/\//.test(part)) {
          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#427759' }}>{simplifyUrl(part)} <ExternalLink size={10} style={{ verticalAlign: -1 }} /></a>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function simplifyUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const nameMap: Record<string, string> = {
      'baike.baidu.com': '百度百科', 'en.wikipedia.org': 'Wikipedia', 'zh.wikipedia.org': '维基百科',
      'scholar.google.com': 'Google Scholar', 'cnki.net': '知网', 'nsfc.gov.cn': '基金委官网',
    };
    return nameMap[host] || host;
  } catch { return url; }
}
