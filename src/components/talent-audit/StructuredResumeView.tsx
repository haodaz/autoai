import React from 'react';
import { useRouter } from 'next/navigation';
import { ResumeStruct, FactItem as FactItemType } from './types';
import { ShieldCheck, AlertCircle, Building, GraduationCap, Zap, CheckCircle2, LayoutGrid, AlertTriangle } from 'lucide-react';
import { deriveFactState } from './AuditReport';
import './AuditReport.css'; // Reuse existing CSS for resume items

export default function StructuredResumeView({ 
  resume, 
  factItems, 
  reportId 
}: { 
  resume: ResumeStruct;
  factItems?: FactItemType[];
  reportId: string;
}) {
  const router = useRouter();
  if (!resume) return null;

  const mismatchSet = new Set<string>();
  const warningSet = new Set<string>();
  const factItemMap = new Map<string, FactItemType>();
  
  if (factItems) {
    factItems.forEach(item => {
      const state = deriveFactState(item.title, item.mismatchedFields, item.status);
      
      if (item.mismatchedFields) {
        item.mismatchedFields.forEach(f => {
          if (state === 'mismatch') { mismatchSet.add(f); factItemMap.set(f, item); }
          else if (state === 'manual_review') { warningSet.add(f); factItemMap.set(f, item); }
          else { mismatchSet.add(f); factItemMap.set(f, item); }
        });
      }
      if (item.title) {
        factItemMap.set(item.title, item);
      }
      if (item.claimText) {
        factItemMap.set(item.claimText, item);
      }
    });
  }

  const getFactStatus = (text1: string, text2?: string): { state: 'match' | 'mismatch' | 'warning' | 'none', fact?: FactItemType } => {
    if (!factItems || factItems.length === 0) return { state: 'none' };
    
    // Check mismatches/warnings first
    for (const m of Array.from(mismatchSet)) {
      if (m.length > 3 && (text1.includes(m) || m.includes(text1) || (text2 && (text2.includes(m) || m.includes(text2))))) {
        return { state: 'mismatch', fact: factItemMap.get(m) };
      }
    }
    for (const w of Array.from(warningSet)) {
      if (w.length > 3 && (text1.includes(w) || w.includes(text1) || (text2 && (text2.includes(w) || w.includes(text2))))) {
        return { state: 'warning', fact: factItemMap.get(w) };
      }
    }

    // Check titles for older formats
    for (const item of factItems) {
      const state = deriveFactState(item.title, item.mismatchedFields, item.status);
      
      if (text1 && text1.length > 3 && ((item.title && item.title.includes(text1)) || (item.claimText && item.claimText.includes(text1)))) {
        return { state: state === 'mismatch' ? 'mismatch' : (state === 'manual_review' ? 'warning' : 'match'), fact: item };
      }
      if (text2 && text2.length > 3 && ((item.title && item.title.includes(text2)) || (item.claimText && item.claimText.includes(text2)))) {
        return { state: state === 'mismatch' ? 'mismatch' : (state === 'manual_review' ? 'warning' : 'match'), fact: item };
      }
    }

    // Default assume match if verified mode (we just return none if we don't have a specific item, but we could return match if we wanted everything green)
    return { state: 'none' }; 
  };

  const renderStatusBadge = (statusInfo: ReturnType<typeof getFactStatus>) => {
    if (statusInfo.state === 'none') return null;
    
    const onClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      router.push(`/talent-audit/${reportId}`);
    };

    if (statusInfo.state === 'mismatch') {
      return (
        <span onClick={onClick} title="发现不符，点击查看详情" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginLeft: 8, color: '#ef4444' }}>
          <AlertTriangle size={16} />
        </span>
      );
    }
    if (statusInfo.state === 'warning') {
      return (
        <span onClick={onClick} title="存疑/需人工复核，点击查看详情" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', marginLeft: 8, color: '#f59e0b' }}>
          <AlertCircle size={16} />
        </span>
      );
    }
    if (statusInfo.state === 'match') {
      return (
        <span title="已验真" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 8, color: '#10b981' }}>
          <ShieldCheck size={16} />
        </span>
      );
    }
    return null;
  };

  const getHighlightClass = (text1: string, text2?: string) => {
    const status = getFactStatus(text1, text2);
    if (status.state === 'mismatch') return 'highlight-error';
    if (status.state === 'warning') return 'highlight-warning';
    return '';
  };

  return (
    <div style={{ padding: '32px 40px', overflowY: 'auto', height: '100%', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 30 }}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
              {(resume.name || '').replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim()}
            </h2>
            {resume.title && (
              <span style={{ fontSize: 16, fontWeight: 600, color: '#427759', paddingBottom: 3 }}>
                {resume.title}
              </span>
            )}
          </div>
          {resume.subtitle && (
            <div style={{ fontSize: 14, fontWeight: 500, color: '#475569', marginBottom: 16 }}>
              {resume.subtitle}
            </div>
          )}
          {resume.summary && (
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, background: '#f8fafc', padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #427759', marginBottom: 16 }}>
              {resume.summary}
            </div>
          )}
          {resume.personalStatement && (
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, background: '#f1f5f9', padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #94a3b8' }}>
              <div style={{ fontWeight: 600, marginBottom: 4, color: '#334155' }}>个人陈述 / 自我评价：</div>
              {resume.personalStatement}
            </div>
          )}
        </div>
      </div>

      <div className="audit-card resume-card" style={{ boxShadow: 'none', border: 'none', padding: 0 }}>
        
        {/* Education */}
        <div className="resume-section">
          <h4>教育背景</h4>
          {resume.education?.map((edu, idx) => {
            const status = getFactStatus(edu.school, edu.major);
            return (
              <div className={`resume-item ${getHighlightClass(edu.school, edu.major)}`} key={idx} style={{ padding: '12px 16px', margin: '0 -16px 8px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                <div className="item-icon"><GraduationCap size={20} /></div>
                <div className="item-content">
                  <div className="item-header">
                    <span className="item-title" style={{ display: 'flex', alignItems: 'center' }}>
                      {edu.school} {renderStatusBadge(status)}
                    </span>
                    <span className="item-time">{edu.period}</span>
                  </div>
                  <div className="item-sub">{edu.major ? `${edu.major} ` : ''}{edu.degree}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <div className="resume-section">
            <h4>实习与工作经历</h4>
            {resume.experience.map((exp, idx) => {
              const status = getFactStatus(exp.company, exp.role);
              return (
                <div className={`resume-item ${getHighlightClass(exp.company, exp.role)}`} key={idx} style={{ padding: '12px 16px', margin: '0 -16px 8px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div className="item-icon"><Building size={20} /></div>
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-title" style={{ display: 'flex', alignItems: 'center' }}>
                        {exp.company} {renderStatusBadge(status)}
                      </span>
                      <span className="item-time">{exp.period}</span>
                    </div>
                    <div className="item-sub fw-bold">{exp.role}</div>
                    {exp.description && <p className="item-detail">{exp.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Publications */}
        {resume.publications && resume.publications.length > 0 && (
          <div className="resume-section">
            <h4>代表性学术成果</h4>
            {resume.publications.map((pub, idx) => {
              const status = getFactStatus(pub.title);
              return (
                <div className={`resume-item ${getHighlightClass(pub.title)}`} key={idx} style={{ padding: '12px 16px', margin: '0 -16px 8px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div className="item-content">
                    <div className="item-title text-primary" style={{ display: 'flex', alignItems: 'center' }}>
                      {pub.title} {renderStatusBadge(status)}
                    </div>
                    <div className="item-sub">发表于: {pub.journal} {pub.year ? `(${pub.year})` : ''} &nbsp;&nbsp; {pub.citations !== undefined ? `引用量: ${pub.citations}` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* Patents */}
        {resume.patents && resume.patents.length > 0 && (
          <div className="resume-section">
            <h4>专利 (Patents)</h4>
            {resume.patents.map((pat, idx) => {
              const status = getFactStatus(pat.name);
              return (
                <div className={`resume-item ${getHighlightClass(pat.name)}`} key={idx} style={{ padding: '12px 16px', margin: '0 -16px 8px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div className="item-content">
                    <div className="item-title text-primary" style={{ display: 'flex', alignItems: 'center' }}>
                      {pat.name} {renderStatusBadge(status)}
                    </div>
                    {pat.role && <div className="item-sub">角色: {pat.role}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <div className="resume-section">
            <h4>科研项目 (Projects)</h4>
            {resume.projects.map((proj, idx) => {
              const status = getFactStatus(proj.name, proj.keywords);
              return (
                <div className={`resume-item ${getHighlightClass(proj.name, proj.keywords)}`} key={idx} style={{ padding: '12px 16px', margin: '0 -16px 8px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div className="item-content">
                    <div className="item-title text-primary" style={{ display: 'flex', alignItems: 'center' }}>
                      {proj.name} {renderStatusBadge(status)}
                    </div>
                    <div className="item-sub">
                      {proj.role && <span>角色: {proj.role} </span>}
                      {proj.keywords && <span>领域/关键字: {proj.keywords}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Skills & Exams */}
        {(resume.skills && resume.skills.length > 0 || resume.exams && resume.exams.length > 0) && (
          <div className="resume-section">
            <h4>专业技能与标准化考试</h4>
            {resume.skills && resume.skills.length > 0 && (
              <div className="skills-row">
                {resume.skills.map((skill, idx) => (
                  <span className="skill-tag" key={idx}>{skill}</span>
                ))}
              </div>
            )}
            
            {resume.exams && resume.exams.length > 0 && (
              <div className="exam-cards">
                {resume.exams.map((exam, idx) => {
                  const status = getFactStatus(exam.name);
                  return (
                    <div className={`exam-card ${getHighlightClass(exam.name)}`} key={idx} style={{ position: 'relative' }}>
                      <div className="exam-name" style={{ display: 'flex', alignItems: 'center' }}>
                        {exam.name} {renderStatusBadge(status)} 
                        <span className="exam-date" style={{ marginLeft: 'auto' }}>{exam.date}</span>
                      </div>
                      <div className="exam-score">{exam.score}</div>
                      {exam.details && <div className="exam-detail">{exam.details}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Awards & Honors */}
        {resume.awards && resume.awards.length > 0 && (
          <div className="resume-section">
            <h4>荣誉与奖项 (Awards & Honors)</h4>
            {resume.awards.map((award: any, idx: number) => {
              const status = getFactStatus(award.name);
              return (
                <div className={`resume-item ${getHighlightClass(award.name)}`} key={idx} style={{ padding: '12px 16px', margin: '0 -16px 8px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div className="item-icon"><Zap size={20} className="text-warning" /></div>
                  <div className="item-content">
                    <div className="item-title" style={{ display: 'flex', alignItems: 'center' }}>
                      {award.name} {renderStatusBadge(status)}
                    </div>
                    <div className="item-sub">{award.organization} {award.date ? `(${award.date})` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Affiliations */}
        {resume.affiliations && resume.affiliations.length > 0 && (
          <div className="resume-section">
            <h4>社会与学术职务 (Affiliations)</h4>
            {resume.affiliations.map((affil: any, idx: number) => {
              const status = getFactStatus(affil.organization, affil.role);
              return (
                <div className={`resume-item ${getHighlightClass(affil.organization, affil.role)}`} key={idx} style={{ padding: '12px 16px', margin: '0 -16px 8px', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                  <div className="item-icon"><Building size={20} /></div>
                  <div className="item-content">
                    <div className="item-title" style={{ display: 'flex', alignItems: 'center' }}>
                      {affil.organization} {renderStatusBadge(status)}
                    </div>
                    <div className="item-sub fw-bold">{affil.role} {affil.period ? `[${affil.period}]` : ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
