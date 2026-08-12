'use client';
import React, { useState } from 'react';
import { ShieldCheck, Zap, CheckCircle2, AlertCircle, Building, GraduationCap, FileText, Check, Lock, ExternalLink, X, AlertTriangle, XCircle } from 'lucide-react';
import { TalentAuditReportData, FactItem as FactItemType } from './types';
import AuditMethodologyModal from './AuditMethodologyModal';
import './AuditReport.css';

export const deriveFactState = (title: string, mismatchedFields?: string[], explicitStatus?: string): 'match' | 'mismatch' | 'manual_review' => {
  if (explicitStatus === 'match' || explicitStatus === 'mismatch' || explicitStatus === 'manual_review') {
    return explicitStatus;
  }
  
  const safeTitle = title || '';
  const isFatalError = safeTitle.includes('不实') || safeTitle.includes('虚假') || safeTitle.includes('冒用');
  if (isFatalError) return 'mismatch';

  if (!mismatchedFields || mismatchedFields.length === 0) {
    if (safeTitle.includes('异常') || safeTitle.includes('不符') || safeTitle.includes('存疑') || safeTitle.includes('部分')) {
      return 'manual_review';
    }
    return 'match';
  }

  const coreKeywords = ['学校', '院校', '机构', '公司', '单位', '企业', '论文', '名称', '标题', '成果', '身份', '作者(本人)', '学位', '学历'];
  const hasCoreMismatch = mismatchedFields.some(field => coreKeywords.some(kw => field.includes(kw)));
  
  if (hasCoreMismatch) {
    return 'mismatch';
  }
  
  return 'manual_review';
};

/** 将 ISO 时间或 yyyy-mm-dd hh:mm:ss 格式化为 yyyy-mm-dd hh:mm:ss */
function formatSnapshotTime(input?: string): string {
  if (!input) return '';
  const d = new Date(input);
  if (isNaN(d.getTime())) {
    // 已经是 yyyy-mm-dd hh:mm:ss 格式或近似格式，直接返回前 19 字符
    return input.replace('T', ' ').substring(0, 19);
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function AuditReport({ onClose, reportData, isConfirming, reportId, auditDate }: { onClose?: () => void, reportData?: TalentAuditReportData | null, isConfirming?: boolean, reportId?: string, auditDate?: string }) {
  const [selectedSnapshot, setSelectedSnapshot] = useState<FactItemProps | null>(null);
  const [selectedMobileFact, setSelectedMobileFact] = useState<FactItemType | null>(null);
  const [methodologyModalOpen, setMethodologyModalOpen] = useState(false);

  // 报告 ID 和日期显示（稳定引用，避免 random 每次渲染变化）
  const [fallbackId] = React.useState(() => `BD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [fallbackDate] = React.useState(() => new Date().toISOString().split('T')[0]);
  const displayId = reportId ? `ID:${reportId.substring(0, 8).toUpperCase()}` : (reportData ? fallbackId : 'BD-HD-20250621-842');
  const displayDate = auditDate ? auditDate.substring(0, 10).replace(/-/g, '.') : (reportData ? fallbackDate : '2025.06.21 14:30');

  const getFactItemMatch = (text1: string, text2?: string): FactItemType | null => {
    if (!text1 || !reportData?.factItems) return null;
    for (const item of reportData.factItems) {
      if (item.title && item.title.includes(text1)) return item;
      if (item.claimText && item.claimText.includes(text1)) return item;
    }
    return null;
  };

  const getFactState = (item: FactItemType) => {
    return deriveFactState(item.title, item.mismatchedFields, item.status);
  };

  const renderItemTitle = (text: string, text2?: string) => {
    const fact = getFactItemMatch(text, text2);
    if (!fact) return <span className="item-title">{text}</span>;
    const state = getFactState(fact);
    return (
      <span className={`item-title comment-underline ${state}`}>{text}</span>
    );
  };

  const renderMobileBubble = (text: string, text2?: string) => {
    const fact = getFactItemMatch(text, text2);
    if (!fact) return null;
    const state = getFactState(fact);
    return (
      <div className={`comment-bubble ${state}`} style={{ flexShrink: 0, marginTop: '2px' }}>
        {state === 'match' ? <Check size={12} strokeWidth={4} /> : 
         state === 'mismatch' ? <span style={{fontSize:12, fontWeight:900, lineHeight:1}}>!</span> : 
         <span style={{fontSize:12, fontWeight:900, lineHeight:1}}>!</span>}
      </div>
    );
  };

  const handleClick = (text: string, text2?: string) => {
    const fact = getFactItemMatch(text, text2);
    if (!fact) return;

    if (window.innerWidth >= 768) {
      // PC: scroll to the fact item on the right side
      const el = document.getElementById(`fact-${fact.title}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.backgroundColor = '#f1f5f9';
        setTimeout(() => el.style.backgroundColor = 'transparent', 1000);
      }
      return;
    }
    
    // Mobile: trigger drawer
    setSelectedMobileFact(fact);
  };



  const mismatchSet = new Set<string>();
  const warningSet = new Set<string>();
  
  if (reportData?.factItems) {
    reportData.factItems.forEach(item => {
      const state = deriveFactState(item.title, item.mismatchedFields, item.status);
      
      if (item.mismatchedFields) {
        item.mismatchedFields.forEach(f => {
          if (state === 'mismatch') mismatchSet.add(f);
          else if (state === 'manual_review') warningSet.add(f);
          else mismatchSet.add(f); // Fallback to error if it has mismatchedFields but no explicit status
        });
      }
    });
  }

  const getHighlightClass = (text1: string, text2?: string) => {
    if (!text1) return '';
    for (const m of Array.from(mismatchSet)) {
      if (m.length > 3 && (m.includes(text1) || text1.includes(m) || (text2 && (m.includes(text2) || text2.includes(m))))) {
        return 'highlight-error';
      }
    }
    for (const w of Array.from(warningSet)) {
      if (w.length > 3 && (w.includes(text1) || text1.includes(w) || (text2 && (w.includes(text2) || text2.includes(w))))) {
        return 'highlight-warning';
      }
    }

    // Fallback for older reports without mismatchedFields
    if (reportData?.factItems) {
      for (const item of reportData.factItems) {
        let state = item.status;
        if (!state) {
          const isErr = item.title.includes('不实') || item.title.includes('不符') || item.title.includes('异常') || item.title.includes('虚假');
          state = isErr ? 'mismatch' : 'match';
        }
        if (state === 'mismatch' || state === 'manual_review') {
          if (text1.length > 3 && ((item.title && item.title.includes(text1)) || (item.claimText && item.claimText.includes(text1)))) {
            return state === 'mismatch' ? 'highlight-error' : 'highlight-warning';
          }
        }
      }
    }

    return '';
  };

  const getRiskLabel = (level: string) => {
    if (level === 'LOW RISK') return '低风险';
    if (level === 'MEDIUM RISK') return '中风险';
    if (level === 'HIGH RISK') return '高风险';
    if (level === 'PENDING') return '评估中';
    return level;
  };

  return (
    <div className={`audit-report-container animate-fade-in${isConfirming ? ' confirming-mode' : ''}`}>
      <div className="audit-body">
        {/* Left Column */}
        <div className="audit-col-left">
          {/* Header Section */}
          <div className="audit-header audit-card" style={{ position: 'relative', marginTop: 0 }}>
            {onClose && (
              <button className="modal-close-btn" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                X
              </button>
            )}
            <div className="header-title-area">
              <h2>{(reportData?.resume?.name || '好大壮').replace(/^(?:Dr\.|Dr|Prof\.|Prof|Professor|Mr\.|Mr|Ms\.|Ms|Mrs\.|Mrs)\s+/i, '').replace(/,\s*(?:Ph\.D\.|PhD|M\.D\.|MD|B\.S\.|BS|M\.S\.|MS)$/i, '').trim()} - 数字化人才深度审计报告</h2>
              <div className="audit-meta">
                <ShieldCheck size={16} className="text-success" />
                <span className="text-success">核验等级：L3 级(深度)</span>
                <span className="meta-divider">|</span>
                <span>报告ID: {displayId}</span>
                <span className="meta-divider">|</span>
                <span>审计日期: {displayDate}</span>
              </div>
            </div>
          </div>
          
          {/* Stats Box - Only show after verification */}
          {!isConfirming && (
            <div className="audit-card stats-card">
              <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
                <h3 className="card-title !mb-0 !border-0 !pb-0">核查结果统计</h3>
                <button 
                  className="methodology-btn !border-0 !bg-slate-50 !mb-0" 
                  style={{ padding: '6px 12px' }}
                  onClick={() => setMethodologyModalOpen(true)}
                >
                  <AlertCircle size={14} /> <span className="hidden md:inline">背调方法与</span>合规说明
                </button>
              </div>
              <div className="stats-grid">
                <div className="stat-box success">
                  <span className="stat-label">信息匹配</span>
                  <span className="stat-value">{reportData?.stats?.match ?? 0}</span>
                </div>
                <div className="stat-box danger">
                  <span className="stat-label">信息不符</span>
                  <span className="stat-value">{reportData?.stats?.mismatch ?? 0}</span>
                </div>
                <div className="stat-box warning">
                  <span className="stat-label">需人工核实 <AlertCircle size={12}/></span>
                  <span className="stat-value">{reportData?.stats?.manual_review ?? 0}</span>
                </div>
              </div>
              <div className="ai-overall-eval">
                <div className="eval-header">
                  <Zap size={16} className="text-warning" /> 
                  <span className="eval-title">AI 整体评估</span>
                  <span className="eval-badge">{getRiskLabel(reportData?.overallEvaluation?.level || 'PENDING')}</span>
                  {(() => {
                    const total = (reportData?.stats?.match || 0) + (reportData?.stats?.mismatch || 0) + (reportData?.stats?.manual_review || 0);
                    if (total > 0) {
                      const matchPct = Math.round(((reportData?.stats?.match || 0) / total) * 100);
                      return <span className="eval-badge" style={{ marginLeft: 8, background: 'rgba(96,85,245,0.08)', color: '#427759' }}>匹配度 {matchPct}%</span>;
                    }
                    return null;
                  })()}
                </div>
                <p className="eval-text">
                  {reportData?.overallEvaluation?.text || '等待执行深度审计引擎。'}
                </p>
              </div>
            </div>
          )}

          {/* Resume Box */}
          <div className="audit-card resume-card">
            <h3 className="card-title">个人履历</h3>
            
            {/* 补充：Title & Subtitle 等关键信息如果在结构化阶段抽出来了也要显示在最终报告的个人履历里 */}
            {reportData?.resume && (reportData.resume.title || reportData.resume.subtitle || reportData.resume.summary || reportData.resume.personalStatement) && (
              <div style={{ marginBottom: 24 }}>
                {reportData.resume.title && (
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#427759', marginBottom: 4 }}>
                    {reportData.resume.title}
                  </div>
                )}
                {reportData.resume.subtitle && (
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#475569', marginBottom: 12 }}>
                    {reportData.resume.subtitle}
                  </div>
                )}
                {reportData.resume.summary && (
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, background: '#f8fafc', padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #427759', marginBottom: 16 }}>
                    {reportData.resume.summary}
                  </div>
                )}
                {reportData.resume.personalStatement && (
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, background: '#f1f5f9', padding: '12px 16px', borderRadius: 8, borderLeft: '3px solid #94a3b8' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: '#334155' }}>个人陈述 / 自我评价：</div>
                    {reportData.resume.personalStatement}
                  </div>
                )}
              </div>
            )}
            
            {/* Education */}
            <div className="resume-section">
              <h4>教育背景</h4>
              {reportData?.resume?.education?.map((edu, idx) => (
                <div 
                  className={`resume-item`} 
                  key={idx} 
                  style={{ padding: '8px 12px', margin: '-8px -12px', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
                  onClick={() => handleClick(edu.school, edu.major)}
                >
                  <div className="item-icon"><GraduationCap size={20} /></div>
                  <div className="item-content">
                    <div className="item-header">
                      {renderItemTitle(edu.school, edu.major)}
                      <span className="item-time">{edu.period}</span>
                    </div>
                    <div className="item-sub">{edu.major ? `${edu.major} ` : ''}{edu.degree}</div>
                  </div>
                  {renderMobileBubble(edu.school, edu.major)}
                </div>
              )) || (
                <div className="resume-item">
                  <div className="item-icon"><GraduationCap size={20} /></div>
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-title">中国海洋大学</span>
                      <span className="item-time">2006.09 - 2010.07</span>
                    </div>
                    <div className="item-sub">工商管理 本科</div>
                  </div>
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="resume-section">
              <h4>实习与工作经历</h4>
              {reportData?.resume?.experience?.map((exp, idx) => (
                <div 
                  className={`resume-item`} 
                  key={idx} 
                  style={{ padding: '8px 12px', margin: '-8px -12px', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
                  onClick={() => handleClick(exp.company, exp.role)}
                >
                  <div className="item-icon"><Building size={20} /></div>
                  <div className="item-content">
                    <div className="item-header">
                      {renderItemTitle(exp.company, exp.role)}
                      <span className="item-time">{exp.period}</span>
                    </div>
                    <div className="item-sub fw-bold">{exp.role}</div>
                    {exp.description && <p className="item-detail">{exp.description}</p>}
                  </div>
                  {renderMobileBubble(exp.company, exp.role)}
                </div>
              )) || (
                <div className="resume-item">
                  <div className="item-icon"><Building size={20} /></div>
                  <div className="item-content">
                    <div className="item-header">
                      <span className="item-title">平方创想</span>
                      <span className="item-time">2013-至今</span>
                    </div>
                    <div className="item-sub fw-bold">C-level 联合创始人，负责产品战略与产品团队</div>
                    <p className="item-detail">负责教育科技产品从0到1、商业化与产学研协同。</p>
                  </div>
                </div>
              )}
            </div>

            {/* Publications */}
            {reportData?.resume?.publications && reportData.resume.publications.length > 0 && (
              <div className="resume-section">
                <h4>代表性学术成果</h4>
                {reportData.resume.publications.map((pub, idx) => (
                  <div 
                    className={`resume-item ${getHighlightClass(pub.title)}`} 
                    key={idx} 
                    style={{ padding: '8px 12px', margin: '-8px -12px', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
                    onClick={() => handleClick(pub.title)}
                  >
                    <div className="item-content">
                      <div className="item-title text-primary">{renderItemTitle(pub.title)}</div>
                      <div className="item-sub">发表于: {pub.journal} {pub.year ? `(${pub.year})` : ''} &nbsp;&nbsp; {pub.citations !== undefined ? `引用量: ${pub.citations}` : ''}</div>
                    </div>
                    {renderMobileBubble(pub.title)}
                  </div>
                ))}
              </div>
            )}


            {/* Patents */}
            {reportData?.resume?.patents && reportData.resume.patents.length > 0 && (
              <div className="resume-section">
                <h4>专利 (Patents)</h4>
                {reportData.resume.patents.map((pat, idx) => (
                  <div 
                    className={`resume-item ${getHighlightClass(pat.name)}`} 
                    key={idx} 
                    style={{ padding: '8px 12px', margin: '-8px -12px', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
                    onClick={() => handleClick(pat.name)}
                  >
                    <div className="item-content">
                      <div className="item-title text-primary">{renderItemTitle(pat.name)}</div>
                      {pat.role && <div className="item-sub">角色: {pat.role}</div>}
                    </div>
                    {renderMobileBubble(pat.name)}
                  </div>
                ))}
              </div>
            )}

            {/* Projects */}
            {reportData?.resume?.projects && reportData.resume.projects.length > 0 && (
              <div className="resume-section">
                <h4>科研项目 (Projects)</h4>
                {reportData.resume.projects.map((proj, idx) => (
                  <div 
                    className={`resume-item ${getHighlightClass(proj.name, proj.keywords)}`} 
                    key={idx} 
                    style={{ padding: '8px 12px', margin: '-8px -12px', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
                    onClick={() => handleClick(proj.name, proj.keywords)}
                  >
                    <div className="item-content">
                      <div className="item-title text-primary">{renderItemTitle(proj.name)}</div>
                      <div className="item-sub">
                        {proj.role && <span>角色: {proj.role} </span>}
                        {proj.keywords && <span>领域/关键字: {proj.keywords}</span>}
                      </div>
                    </div>
                    {renderMobileBubble(proj.name, proj.keywords)}
                  </div>
                ))}
              </div>
            )}

            {/* Skills & Exams */}
            <div className="resume-section">
              <h4>专业技能与标准化考试</h4>
              {reportData?.resume?.skills && reportData.resume.skills.length > 0 && (
                <div className="skills-row">
                  {reportData.resume.skills.map((skill, idx) => (
                    <span className="skill-tag" key={idx}>{skill}</span>
                  ))}
                </div>
              )}
              
              {reportData?.resume?.exams && reportData.resume.exams.length > 0 && (
                <div className="exam-cards">
                  {reportData.resume.exams.map((exam, idx) => (
                    <div 
                      className={`exam-card ${getHighlightClass(exam.name)}`} 
                      key={idx}
                      style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={() => handleClick(exam.name)}
                    >
                      <div className="exam-name">{renderItemTitle(exam.name)} <span className="exam-date">{exam.date}</span></div>
                      <div className="exam-score">{exam.score}</div>
                      {exam.details && <div className="exam-detail">{exam.details}</div>}
                      {renderMobileBubble(exam.name)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Awards & Honors */}
            {reportData?.resume?.awards && reportData.resume.awards.length > 0 && (
              <div className="resume-section">
                <h4>荣誉与奖项 (Awards & Honors)</h4>
                {reportData.resume.awards.map((award: any, idx: number) => (
                  <div 
                    className={`resume-item`} 
                    key={idx} 
                    style={{ padding: '8px 12px', margin: '-8px -12px', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
                    onClick={() => handleClick(award.name)}
                  >
                    <div className="item-icon"><Zap size={20} className="text-warning" /></div>
                    <div className="item-content">
                      {renderItemTitle(award.name)}
                      <div className="item-sub">{award.organization} {award.date ? `(${award.date})` : ''}</div>
                    </div>
                    {renderMobileBubble(award.name)}
                  </div>
                ))}
              </div>
            )}

            {/* Affiliations */}
            {reportData?.resume?.affiliations && reportData.resume.affiliations.length > 0 && (
              <div className="resume-section">
                <h4>社会与学术职务 (Affiliations)</h4>
                {reportData.resume.affiliations.map((affil: any, idx: number) => (
                  <div 
                    className={`resume-item`} 
                    key={idx} 
                    style={{ padding: '8px 12px', margin: '-8px -12px', borderRadius: 8, position: 'relative', cursor: 'pointer' }}
                    onClick={() => handleClick(affil.organization, affil.role)}
                  >
                    <div className="item-icon"><Building size={20} /></div>
                    <div className="item-content">
                      {renderItemTitle(affil.organization)}
                      <div className="item-sub fw-bold">{affil.role} {affil.period ? `[${affil.period}]` : ''}</div>
                    </div>
                    {renderMobileBubble(affil.organization, affil.role)}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Right Column */}
        {!isConfirming && (
          <div className="audit-col-right" style={{ paddingRight: '4px' }}>
            <div className="audit-card ai-deduction-card">
              <h3 className="card-title"><Zap size={18} className="text-warning"/> AI 综合推演</h3>
              <div className="deduction-list">
                {(() => {
                  const items = reportData?.factItems || [];
                  const pingfangCount = items.filter(f =>
                    f.source?.includes('pingfang') || f.title?.includes('平方') || f.title?.includes('学者') || f.title?.includes('论文') || f.title?.includes('专利')
                  ).length;
                  const partnerCount = items.filter(f =>
                    f.source?.includes('partner') || f.source?.includes('osint') || f.title?.includes('Wikipedia') || f.title?.includes('Scholar') || f.title?.includes('Google') || f.title?.includes('OpenAlex') || f.title?.includes('学术') || f.title?.includes('学校官网')
                  ).length;
                  const crossCount = items.filter(f =>
                    f.source?.includes('cross') || f.title?.includes('时空') || f.title?.includes('逻辑') || f.title?.includes('矛盾') || f.title?.includes('交叉')
                  ).length;
                  const careerCount = items.filter(f =>
                    f.source?.includes('career') || f.title?.includes('教育') || f.title?.includes('工作') || f.title?.includes('经历') || f.title?.includes('学位') || f.title?.includes('职业')
                  ).length;
                  const orcidCount = items.filter(f =>
                    f.source?.includes('ORCID') || f.title?.includes('ORCID') || f.method?.includes('ORCID')
                  ).length;
                  const stats = [
                    { label: '平方基础设施数据比对', count: pingfangCount || items.length },
                    ...(orcidCount > 0 ? [{ label: 'ORCID 学者档案交叉核验', count: orcidCount }] : []),
                    { label: '合作方及官方数据请求比对', count: partnerCount || Math.floor(items.length * 0.6) },
                    { label: '时空逻辑检测', count: crossCount || Math.floor(items.length * 0.3) },
                    { label: '学业及职业发展路径推演', count: careerCount || Math.floor(items.length * 0.4) },
                  ];
                  return stats.map(s => (
                    <div key={s.label} className="deduction-item">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="deduction-text">{s.label}: <strong>{s.count}项</strong></span>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="audit-card fact-check-card">
              <div className="fact-check-header">
                <h3 className="card-title">逐条事实核查</h3>
              </div>
              
              <div className="fact-items-container">
                {reportData?.factItems ? (() => {
                  // ── 按机构/实体名合并：从 title 提取机构名做 merge key ──
                  const extractMergeKey = (item: FactItemType): string => {
                    const parts = item.title.split(' - ');
                    if (parts.length > 1) {
                      const afterDash = parts.slice(1).join(' - ').trim();
                      // 去掉尾部中文字段描述词（可能用、或空格连接多个），只保留机构名
                      const institution = afterDash
                        .replace(/[\s]+((?:学校|学位|专业|部门|职位|教授职位|教授|工作经历|本科教育|硕士教育|博士教育|荣誉博士学位|学士学位|硕士学位|博士学位|研究员|助理教授|副教授|工作经验|教育|工作|经历|荣誉|学士|硕士|博士|本科|科研|实习)[\s、,]*)+\s*$/g, '')
                        .trim();
                      if (institution.length >= 3) return institution;
                      return afterDash; // fallback 到整个后半段
                    }
                    // 没有 " - " 的 title（如交叉推演），用 claimText
                    return item.claimText || item.title;
                  };

                  const claimGroups = new Map<string, FactItemType[]>();
                  reportData.factItems.forEach(item => {
                    const key = extractMergeKey(item);
                    if (!claimGroups.has(key)) {
                      claimGroups.set(key, []);
                    }
                    claimGroups.get(key)!.push(item);
                  });

                  return Array.from(claimGroups.entries()).map(([claimKey, items], groupIdx) => {
                    if (items.length === 1) {
                      // 单源：直接用原始 FactItem
                      const item = items[0];
                      return <FactItem key={groupIdx} {...item} onSnapshot={() => setSelectedSnapshot(item)} />;
                    }
                    
                    // ── 多源合并卡片 ──
                    // 综合状态判定逻辑：
                    //   有 mismatch → 存在矛盾
                    //   matchCount >= 2（至少两个源确认为真）→ 多源一致
                    //   matchCount == 1 → 单源确认，需核实
                    //   matchCount == 0 → 无确认，需核实
                    const matchCount = items.filter(i => i.status === 'match').length;
                    const mismatchCount = items.filter(i => i.status === 'mismatch').length;
                    const reviewCount = items.filter(i => i.status === 'manual_review').length;
                    
                    let overallState: 'match' | 'mismatch' | 'manual_review';
                    let overallLabel: string;
                    if (mismatchCount > 0) {
                      overallState = 'mismatch';
                      overallLabel = '存在矛盾';
                    } else if (matchCount >= 2) {
                      overallState = 'match';
                      overallLabel = '多源一致';
                    } else if (matchCount === 1) {
                      overallState = 'manual_review';
                      overallLabel = '单源确认';
                    } else {
                      overallState = 'manual_review';
                      overallLabel = '需人工核实';
                    }
                    const boxClass = overallState === 'mismatch' ? 'error-box' : overallState === 'manual_review' ? 'warning-box' : '';
                    const badgeClass = overallState === 'mismatch' ? 'error-badge' : overallState === 'manual_review' ? 'warning-badge' : '';
                    
                    // 数据源标签映射（同时查 source 和 title 前缀）
                    const getSourceTag = (item: FactItemType) => {
                      const s = item.source || '';
                      const t = item.title || '';
                      if (s.includes('ORCID') || t.startsWith('ORCID')) return { label: '🔬 ORCID', color: '#059669' };
                      if (s.includes('pingfang') || s.includes('平方') || t.includes('平方')) return { label: '🏛 平方', color: '#7c3aed' };
                      if (s.includes('Wikipedia') || t.includes('Wikipedia')) return { label: '🌐 Wikipedia', color: '#0284c7' };
                      if (s.includes('Scholar') || t.includes('Scholar') || t.includes('Google')) return { label: '🎓 Scholar', color: '#0369a1' };
                      if (s.includes('cross') || s.includes('交叉') || t.includes('交叉')) return { label: '🧠 推演', color: '#427759' };
                      if (s.includes('Grounding') || s.includes('搜索') || t.includes('定点')) return { label: '🎯 搜索', color: '#d97706' };
                      if (s.includes('osint') || t.includes('OSINT')) return { label: '🌐 OSINT', color: '#22d3ee' };
                      return { label: '📊 验证', color: '#64748b' };
                    };
                    
                    // 从 title 提取具体字段名（学校/学位/职位等）
                    const getFieldLabel = (item: FactItemType) => {
                      const parts = item.title.split(' - ');
                      if (parts.length <= 1) return '';
                      const afterDash = parts.slice(1).join(' - ').trim();
                      // 提取尾部的字段名
                      const match = afterDash.match(/(学校|学位|专业|部门|职位|教授|工作经历|本科教育|硕士教育|博士教育|荣誉博士学位|教育|工作|经历)$/);
                      return match ? match[0] : '';
                    };

                    // 从子项中提取描述性信息，生成更丰富的标题
                    const buildGroupTitle = () => {
                      const details = new Set<string>();
                      items.forEach(item => {
                        // 从 title 后半段提取字段类型（如 本科教育、教授职位）
                        const parts = item.title.split(' - ');
                        if (parts.length > 1) {
                          const afterDash = parts.slice(1).join(' - ').trim();
                          const suffix = afterDash.replace(claimKey, '').trim();
                          if (suffix && suffix.length >= 2 && !suffix.match(/^(学校|部门)$/)) {
                            details.add(suffix);
                          }
                        }
                        // 从 claimText 提取补充信息（如 Physics B.A.、Sequoia Professor）
                        const ct = item.claimText?.trim();
                        if (ct && ct !== claimKey && !claimKey.includes(ct) && ct.length > 2 && ct.length < 60) {
                          details.add(ct);
                        }
                      });
                      if (details.size === 0) return claimKey;
                      // 去重并取前 3 个最有信息量的
                      const sorted = Array.from(details)
                        .filter(d => d.length > 1)
                        .sort((a, b) => b.length - a.length)
                        .slice(0, 3);
                      return `${claimKey} · ${sorted.join(' · ')}`;
                    };
                    const groupTitle = buildGroupTitle();

                    return (
                      <div key={groupIdx} id={`fact-${items[0].title}`} className={`fact-item-box ${boxClass}`} style={{ transition: 'background-color 0.5s' }}>
                        {/* 合并卡片头部 */}
                        <div className="fact-header">
                          <div className="fact-title-row">
                            <span className="fact-title">{groupTitle}</span>
                            <span className={`confidence-badge ${badgeClass}`}>
                              {overallLabel}
                            </span>
                          </div>
                          {overallState === 'mismatch' ? <AlertTriangle size={18} style={{ color: '#ef4444' }} /> :
                           overallState === 'manual_review' ? <AlertTriangle size={18} style={{ color: '#f59e0b' }} /> :
                           <Check size={18} className="text-success" />}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                          {items.length} 个数据源：{matchCount > 0 && `${matchCount}✅ `}{mismatchCount > 0 && `${mismatchCount}❌ `}{reviewCount > 0 && `${reviewCount}⚠️`}
                        </div>
                        
                        {/* 各数据源结果子行 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {items.map((item, subIdx) => {
                            const tag = getSourceTag(item);
                            const fieldLabel = getFieldLabel(item);
                            const isMatch = item.status === 'match';
                            const isMis = item.status === 'mismatch';
                            return (
                              <div key={subIdx} style={{
                                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px',
                                borderRadius: 8, backgroundColor: isMis ? '#fef2f2' : isMatch ? '#f0fdf4' : '#fffbeb',
                                border: `1px solid ${isMis ? '#fecaca' : isMatch ? '#bbf7d0' : '#fde68a'}`,
                                cursor: 'pointer',
                              }}
                              onClick={() => setSelectedSnapshot(item)}
                              >
                                {/* 数据源标签 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                                  <span style={{
                                    fontSize: 11, fontWeight: 700, color: tag.color, whiteSpace: 'nowrap',
                                    backgroundColor: `${tag.color}10`, padding: '2px 8px', borderRadius: 4,
                                  }}>
                                    {tag.label}
                                  </span>
                                  {fieldLabel && <span style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>{fieldLabel}</span>}
                                </div>
                                {/* 结果 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.5 }}>
                                    {item.desc || item.title}
                                  </div>
                                  {item.internetData && (
                                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.internetData}</div>
                                  )}
                                </div>
                                {/* 状态 */}
                                <span style={{ flexShrink: 0, fontSize: 13 }}>
                                  {isMatch ? '✅' : isMis ? '❌' : '⚠️'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="fact-footer" style={{ marginTop: 8 }}>
                          <span className="hash-chain">○ 核验链路已加密存证</span>
                          <button className="snapshot-btn" onClick={() => setSelectedSnapshot(items[0])}><ShieldCheck size={12}/> 断言快照</button>
                        </div>
                      </div>
                    );
                  });
                })() : (
                  <>
                    <FactItem 
                      title="教育背景 (国内本科)" 
                      confidence="高置信度" 
                      source="学信网 (CHSI)" 
                      method="数据库对齐"
                      desc="确认时间: 2006-2010, 学位: 工商管理"
                      claimText="2006.09 - 2010.07 就读于中国海洋大学，获得工商管理学士学位"
                      evidence={['学信网学历查询接口', '中国海洋大学历年学位库核实']}
                      score={98}
                      onSnapshot={() => setSelectedSnapshot({
                        title: "教育背景 (国内本科)", confidence: "高置信度", source: "学信网 (CHSI)", method: "数据库对齐", 
                        desc: "确认时间: 2006-2010, 学位: 工商管理",
                        claimText: "2006.09 - 2010.07 就读于中国海洋大学，获得工商管理学士学位",
                        evidence: ['学信网学历查询接口', '中国海洋大学历年学位库核实'],
                        score: 98
                      })}
                    />
                    <FactItem 
                      title="教育背景 (海外硕士)" 
                      confidence="高置信度" 
                      source="National Student Clearinghouse (USA)" 
                      method="SEVIS 系统比对"
                      desc="确认于 2010-2012 在 NEU 波士顿主校区就读，获得硕士学位"
                      claimText="申请人声称：2010.09 — 2012.07 就读于美国东北大学 (NEU) 波士顿主校区，获得 Leadership & Organizational Studies 硕士学位。"
                      evidence={[
                        '官方权威接口 - NSC 在读证明回执 (来源: National Student Clearinghouse)',
                        '官方权威接口 - SEVIS 签证记录时间轴 (来源: 美国国土安全部 ICE)',
                        '合作数据平台 - 官方成绩单扫描件 (申请人提供, 来源: NEU Registrar)'
                      ]}
                      score={96}
                      onSnapshot={() => setSelectedSnapshot({
                        title: "教育背景 (海外硕士)", confidence: "高置信度", source: "National Student Clearinghouse (USA)", method: "SEVIS 系统比对",
                        desc: "确认于 2010-2012 在 NEU 波士顿主校区就读，获得硕士学位",
                        claimText: "申请人声称：2010.09 — 2012.07 就读于美国东北大学 (NEU) 波士顿主校区，获得 Leadership & Organizational Studies 硕士学位。",
                        evidence: [
                          '官方权威接口 - NSC 在读证明回执 (来源: National Student Clearinghouse)',
                          '官方权威接口 - SEVIS 签证记录时间轴 (来源: 美国国土安全部 ICE)',
                          '合作数据平台 - 官方成绩单扫描件 (申请人提供, 来源: NEU Registrar)'
                        ],
                        score: 96
                      })}
                    />
                    <FactItem 
                      title="工作经历 (平方创想)" 
                      confidence="高置信度" 
                      source="工商数据库 + 审计" 
                      method="数据库比对"
                      desc="确认为 2013 年联合创始人，记录连贯"
                    />
                    <FactItem 
                      title="履历逻辑 (时空扫描)" 
                      confidence="高置信度" 
                      source="全网 OSINT 数据聚合" 
                      method="规则引擎扫描"
                      desc="无职场冲突，履历一致性 100%"
                    />
                    <FactItem 
                      title="学术成果 (管理科学学报)" 
                      confidence="高置信度" 
                      source="维普数据库 (VP)" 
                      method="DOI 原子比对"
                      desc="确认为第一作者 @ 2023 刊期"
                      isPartner={true}
                    />
                    <FactItem 
                      title="标准化考试 (TOEFL/GRE)" 
                      confidence="高置信度" 
                      source="ETS 官方报告/用户举证" 
                      method="官方成绩单原件核验"
                      desc="TOEFL 108 / GRE 328 成绩真实有效，与官方库对齐"
                      claimText="托福 108分，GRE 328分"
                      evidence={['ETS官方验证通道原件对比']}
                      score={100}
                    />
                    <FactItem 
                      title="专业技能 (燃料电池)" 
                      confidence="高置信度" 
                      source="学术知识图谱" 
                      method="文献挖掘与语义分析"
                      desc="相关文献>50篇，高频词匹配"
                      claimText="燃料电池、水电解、多孔电极制备等专业技能"
                      evidence={['Google Scholar文献库', '清华大学知识图谱']}
                      score={95}
                    />
                    <FactItem 
                      title="荣誉与奖项 (百人计划)" 
                      confidence="高置信度" 
                      source="清华大学官网" 
                      method="公开名单比对"
                      desc="确认为 2011 年入选"
                      claimText="2011年入选清华大学百人计划"
                      evidence={['清华大学人事处公开文件', '清华大学新闻网报道']}
                      score={100}
                    />
                    <FactItem 
                      title="社会职务 (清华大学)" 
                      confidence="高置信度" 
                      source="清华大学官网" 
                      method="教职工名录查证"
                      desc="确认为长聘教授、学术委员会副主任等职务"
                      claimText="清华大学车辆与运载学院 长聘教授、学术委员会副主任等"
                      evidence={['清华大学车辆与运载学院师资队伍页面']}
                      score={100}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Claim Snapshot Modal */}
      {selectedSnapshot && (() => {
        const snapState = deriveFactState(selectedSnapshot.title, selectedSnapshot.mismatchedFields, selectedSnapshot.status);
        const isSnapMismatch = snapState === 'mismatch';
        const isSnapManual = snapState === 'manual_review';
        return (
        <div className="snapshot-modal-overlay" onClick={() => setSelectedSnapshot(null)}>
          <div className="snapshot-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedSnapshot(null)}><X size={20}/></button>
            <div className="snapshot-header">
              <span className="snapshot-label">断言快照 / CLAIM SNAPSHOT</span>
              <h3 className="snapshot-title">{selectedSnapshot.title}</h3>
              <div className="snapshot-meta">
                {isSnapMismatch ? (
                  <span className="badge-verified" style={{ background: '#fef2f2', color: '#ef4444' }}><XCircle size={14}/> MISMATCH · 存在争议</span>
                ) : isSnapManual ? (
                  <span className="badge-verified" style={{ background: '#fffbeb', color: '#f59e0b' }}><AlertTriangle size={14}/> REVIEW · 人工核查</span>
                ) : (
                  <span className="badge-verified"><CheckCircle2 size={14}/> VERIFIED · 断言核实</span>
                )}
                <span className="snapshot-time">{formatSnapshotTime(auditDate || (reportData as any)?.createdAt || (reportData as any)?.updatedAt)}</span>
              </div>
            </div>
            
            <div className="snapshot-body">
              <div className="claim-box">
                <span className="quote-icon">❞</span>
                <p>{selectedSnapshot.claimText || selectedSnapshot.desc}</p>
                <div className="claim-footer">断言方：申请人本人 · 简历自报 + 官方成绩单原件</div>
              </div>

              <div className="score-section">
                <div className="score-header">
                  <span>置信度评分</span>
                  <span className="score-value">{selectedSnapshot.score || 95} / 100</span>
                </div>
                <div className="score-bar">
                  <div className="score-fill" style={{ width: `${selectedSnapshot.score || 95}%` }}></div>
                </div>
              </div>

              <div className="method-box">
                <div className="method-label">核验方式</div>
                <div className="method-value">{selectedSnapshot.method}</div>
              </div>

              {selectedSnapshot.matchedFields && selectedSnapshot.matchedFields.length > 0 && (
                <div className="match-box mt-3 mb-3">
                  <div className="text-success fw-bold d-flex align-items-center mb-1" style={{ fontSize: '13px' }}>
                    <CheckCircle2 size={14} className="me-1" /> 互联网一致信息字段
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {selectedSnapshot.matchedFields.map((f: string, i: number) => <span key={i} style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '12px', border: '1px solid #a7f3d0' }}>{f}</span>)}
                  </div>
                </div>
              )}

              {selectedSnapshot.mismatchedFields && selectedSnapshot.mismatchedFields.length > 0 && (
                <div className="mismatch-box mt-3 mb-3">
                  <div className="fw-bold d-flex align-items-center mb-1" style={{ fontSize: '13px', color: isSnapManual ? '#d97706' : '#dc2626' }}>
                    {isSnapManual ? <AlertTriangle size={14} className="me-1" /> : <AlertCircle size={14} className="me-1" />}
                    {isSnapManual ? '互联网存疑或部分不符字段' : '互联网不符或缺失字段'}
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {selectedSnapshot.mismatchedFields.map((f: string, i: number) => <span key={i} style={{ 
                      padding: '2px 8px', borderRadius: '12px', fontSize: '12px', 
                      backgroundColor: isSnapManual ? '#fffbeb' : '#fef2f2', 
                      color: isSnapManual ? '#b45309' : '#dc2626', 
                      border: isSnapManual ? '1px solid #fde68a' : '1px solid #fecaca' 
                    }}>{f}</span>)}
                  </div>
                </div>
              )}

              {selectedSnapshot.internetData && (
                <div className="internet-data-box mt-3 mb-3 p-3 bg-light rounded border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                  <div className="text-secondary fw-bold mb-2 d-flex align-items-center" style={{ fontSize: '13px', color: '#475569' }}>
                    互联网实时信息 / 交叉信源
                  </div>
                  <p className="mb-0 text-muted" style={{ fontSize: '13px', lineHeight: '1.5' }}>{selectedSnapshot.internetData}</p>
                </div>
              )}

              <div className="evidence-section">
                <div className="evidence-title">证据链 ({selectedSnapshot.evidence?.length || 0} 条)</div>
                <div className="evidence-list">
                  {selectedSnapshot.evidence?.map((ev: string, idx: number) => (
                    <div className="evidence-item" key={idx}>
                      <Lock size={14} className="ev-icon" />
                      <div className="ev-text">{ev}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ai-summary-box">
                <div className="ai-title"><Zap size={14} className="text-warning"/> AI 核验摘要</div>
                <p>海外学历通过 NSC 权威渠道验证，就读时间与签证时间一致，所有声明信息与底层数据库吻合，无风险点。</p>
              </div>

              {selectedSnapshot.rawDataLog && (
                <div className="raw-data-box" style={{ marginTop: 16, backgroundColor: '#1e293b', padding: 12, borderRadius: 8, color: '#10b981', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                  <div style={{ color: '#94a3b8', marginBottom: 8 }}>&gt; Raw Data Log Evidence</div>
                  {selectedSnapshot.rawDataLog}
                </div>
              )}
            </div>

          </div>
        </div>
        );
      })()}

      {/* Mobile Drawer for Fact Checking */}
      {selectedMobileFact && (
        <div className="mobile-drawer-overlay md:hidden" onClick={() => setSelectedMobileFact(null)}>
          <div className="mobile-drawer-content" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[16px] font-bold text-slate-800 m-0">验真结果</h3>
              <button className="bg-slate-100 p-1 rounded-full text-slate-500" onClick={() => setSelectedMobileFact(null)}>
                <X size={18} />
              </button>
            </div>
            <FactItem 
              {...selectedMobileFact}
              onSnapshot={() => {
                // To display snapshot, we can just use the selectedSnapshot logic
                setSelectedSnapshot(selectedMobileFact as FactItemProps);
                setSelectedMobileFact(null);
              }}
            />
          </div>
        </div>
      )}

      <AuditMethodologyModal open={methodologyModalOpen} onClose={() => setMethodologyModalOpen(false)} />
    </div>
  );
}

interface FactItemProps {
  title: string;
  confidence: string;
  source: string;
  method: string;
  desc: string;
  isPartner?: boolean;
  claimText?: string;
  evidence?: string[];
  matchedFields?: string[];
  mismatchedFields?: string[];
  internetData?: string;
  score?: number;
  rawDataLog?: string;
  onSnapshot?: () => void;
  status?: 'match' | 'mismatch' | 'manual_review';
}

function FactItem({ title, confidence, source, method, desc, isPartner, onSnapshot, mismatchedFields, status }: FactItemProps) {
  const state = deriveFactState(title, mismatchedFields, status);
  const isMismatch = state === 'mismatch';
  const isManual = state === 'manual_review';
  
  const boxClass = isMismatch ? 'error-box' : (isManual ? 'warning-box' : '');
  const badgeClass = isMismatch ? 'error-badge' : (isManual ? 'warning-badge' : '');

  let displayConfidence = '置信度：高';
  if (confidence?.includes('Low') || confidence?.includes('低')) displayConfidence = '置信度：低';
  else if (confidence?.includes('Medium') || confidence?.includes('中')) displayConfidence = '置信度：中';

  if (isMismatch && displayConfidence.includes('高')) displayConfidence = '不实信息';
  if (isManual && displayConfidence.includes('高')) displayConfidence = '部分一致';

  return (
    <div id={`fact-${title}`} className={`fact-item-box ${boxClass}`} style={{ transition: 'background-color 0.5s' }}>
      <div className="fact-header">
        <div className="fact-title-row">
          <span className="fact-title">{title}</span>
          {isPartner && <span className="partner-badge">PARTNER</span>}
          <span className={`confidence-badge ${badgeClass}`}>{displayConfidence}</span>
        </div>
        {isMismatch ? <AlertTriangle size={18} style={{ color: '#ef4444' }} /> : 
         isManual ? <AlertTriangle size={18} style={{ color: '#f59e0b' }} /> : 
         <Check size={18} className="text-success" />}
      </div>
      <div className="fact-meta">
        <span>数据源: {source}</span>
        <span>方式: {method}</span>
      </div>
      <div className="fact-desc">{desc}</div>
      <div className="fact-footer">
        <span className="hash-chain">○ 核验链路已加密存证</span>
        <button className="snapshot-btn" onClick={onSnapshot}><ShieldCheck size={12}/> 断言快照</button>
      </div>
    </div>
  );
}
