'use client';
import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Target, Award, Briefcase, Lightbulb, CheckCircle2, Users, Rocket, Globe } from 'lucide-react';
import { ValueEvaluationData, ResumeStruct } from './types';
import './ValueEvaluationReport.css';

interface Props {
  data: ValueEvaluationData;
  resume: ResumeStruct;
  onClose?: () => void;
}

export function ValueEvaluationReport({ data, resume, onClose }: Props) {
  const radarRef = useRef<HTMLCanvasElement>(null);

  const scores = [
      data.education_eval?.score || 0,
      data.research_eval?.score || 0,
      data.industry_eval?.score || 0,
      data.leadership_eval?.score || 0,
      data.innovation_eval?.score || 0,
      data.social_eval?.score || 0
    ];

  useEffect(() => {
    if (!radarRef.current) return;
    const ctx = radarRef.current.getContext('2d');
    if (!ctx) return;

    // Draw a simple, beautiful custom radar chart
    const w = 280;
    const h = 280;
    const cx = w / 2;
    const cy = h / 2;
    const radius = 80;

    const labels = ['学术与教育', '科研影响力', '产业价值', '领导与管理', '创新与探索', '社会影响力'];

    ctx.clearRect(0, 0, w, h);

    // Draw background web
    ctx.strokeStyle = 'rgba(223, 227, 245, 0.5)';
    ctx.lineWidth = 1;
    for (let level = 1; level <= 5; level++) {
      const r = (radius / 5) * level;
      ctx.beginPath();
      for (let i = 0; i < scores.length; i++) {
        const angle = (i * 2 * Math.PI) / scores.length - Math.PI / 2;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = 'rgba(223, 227, 245, 0.5)';
    for (let i = 0; i < scores.length; i++) {
      const angle = (i * 2 * Math.PI) / scores.length - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.stroke();
    }

    // Draw labels
    ctx.fillStyle = '#64748b';
    ctx.font = '600 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < scores.length; i++) {
      const angle = (i * 2 * Math.PI) / scores.length - Math.PI / 2;
      const x = cx + (radius + 20) * Math.cos(angle);
      const y = cy + (radius + 15) * Math.sin(angle);
      ctx.fillText(labels[i], x, y);
    }

    // Draw data polygon
    ctx.beginPath();
    for (let i = 0; i < scores.length; i++) {
      const angle = (i * 2 * Math.PI) / scores.length - Math.PI / 2;
      const r = radius * (Math.max(scores[i], 20) / 100);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, 'rgba(96, 85, 245, 0.4)');
    gradient.addColorStop(1, 'rgba(167, 139, 250, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Outline
    ctx.strokeStyle = '#427759';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw points
    ctx.fillStyle = '#fff';
    for (let i = 0; i < scores.length; i++) {
      const angle = (i * 2 * Math.PI) / scores.length - Math.PI / 2;
      const r = radius * (Math.max(scores[i], 20) / 100);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }, [data]);

  const validScores = scores.filter(s => s > 0);
  const avgScore = validScores.length ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
  let rank = 'S';
  if (avgScore < 90) rank = 'A';
  if (avgScore < 80) rank = 'B';
  if (avgScore < 70) rank = 'C';

  return (
    <div className="eval-report-container animate-fade-in">
      {/* 移除大面积深色背景，使用一个顶部的小装饰带或完全去掉 */}
      
      <div className="eval-header-content">
        {onClose && (
          <button className="eval-close-btn" onClick={onClose}>×</button>
        )}
        <div className="eval-title-area">
          <h2>{resume.name} - 数字化人才真值评价报告</h2>
          <div className="eval-meta">
            {data.isUnverified ? (
              <>
                <ShieldCheck size={16} style={{ color: '#ef4444' }} />
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ 此评价基于未经系统验真的原始简历生成，注意甄别真伪</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} className="text-success" />
                <span className="text-success">基于已验真履历生成的 AI 深度测值报告</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="eval-body">
        
        {/* Head Card: Radar + Rank + Profile */}
        <div className="eval-head-card glass-card">
          <div className="head-card-content">
            
            {/* 1. 基本信息 */}
            <div className="head-card-profile-wrapper">
              <div className="head-card-profile-top">
                <div className="profile-avatar-large">{resume.name?.[0] || '?'}</div>
                <div className="profile-details">
                  <h3>{resume.name}</h3>
                </div>
              </div>
              <div className="profile-tags">
                {resume.education?.[0] && <span className="ptag">{resume.education[0].school}</span>}
                {resume.education?.[0]?.degree && <span className="ptag">{resume.education[0].degree}</span>}
                {resume.experience?.[0] && <span className="ptag">{resume.experience[0].company}</span>}
              </div>
            </div>

            {/* 2. 雷达图 */}
            <div className="radar-container">
              <canvas ref={radarRef} width={280} height={280} className="radar-canvas"></canvas>
            </div>

            {/* 3. 评级与分数 */}
            <div className="head-card-info">
              <div className="eval-rank-badge-large">
                <span className="rank-label">AI 真值综合评级</span>
                <span className="rank-value">{rank}</span>
              </div>
              <p className="head-card-desc">
                经过多维深度测算，该候选人综合评分为 <strong>{avgScore}分</strong>。具备卓越的核心素养与显著的成长潜力。
              </p>
            </div>
            
          </div>
        </div>

        {/* Details Section (Vertical Stack) */}
        <div className="eval-vertical-stack mt-5">
          <DimensionCard 
            title="学术与教育底蕴" 
            subtitle="院校背景强度、专业价值"
            icon={<GraduationCapIcon size={20} />} 
            iconClass="edu-icon"
            data={data.education_eval} 
          />

          <DimensionCard 
            title="科研与学术影响力" 
            subtitle="论文影响力、期刊重量级"
            icon={<Award size={20} />} 
            iconClass="res-icon"
            data={data.research_eval} 
          />

          <DimensionCard 
            title="产业与实践价值" 
            subtitle="工作经历、产业贡献评估"
            icon={<Briefcase size={20} />} 
            iconClass="ind-icon"
            data={data.industry_eval} 
          />

          
          {data.leadership_eval && (
            <DimensionCard 
              title="领导与团队管理" 
              subtitle="实验室带队、高管经验评估"
              icon={<Users size={20} />} 
              iconClass="ind-icon"
              data={data.leadership_eval} 
            />
          )}

          {data.innovation_eval && (
            <DimensionCard 
              title="创新与前沿探索" 
              subtitle="颠覆性技术、前沿交叉学科"
              icon={<Rocket size={20} />} 
              iconClass="res-icon"
              data={data.innovation_eval} 
            />
          )}

          {data.social_eval && (
            <DimensionCard 
              title="社会与行业影响力" 
              subtitle="重要协会任职、媒体报道"
              icon={<Globe size={20} />} 
              iconClass="edu-icon"
              data={data.social_eval} 
            />
          )}

          {/* Overall Judgment */}
          <div className="eval-overall-card glass-card mt-4">
            <h3><Lightbulb size={20} className="text-warning me-2" /> AI 综合研判</h3>
            <p className="eval-overall-text">{data.overall_summary}</p>
            
            {data.industry_impacts && data.industry_impacts.length > 0 && (
              <div className="industry-impact-section" style={{ marginTop: '20px' }}>
                <h4 style={{ fontSize: '15px', color: '#0f172a', marginBottom: '12px', fontWeight: 700 }}>产业赋能与核心价值：</h4>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {data.industry_impacts.map((item: any, idx: number) => (
                    <div key={idx} style={{ background: '#fff', border: '1px solid rgba(223, 227, 245, 0.8)', borderRadius: '10px', padding: '12px 16px', borderLeft: '3px solid #427759' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>{item.industry}</div>
                      <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>{item.impact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Suggestions */}
          <div className="action-suggestions mt-4">
            <h4 className="suggestion-title">接触与合作建议</h4>
            <ul className="suggestion-list">
              {data.action_suggestions.map((s, i) => (
                <li key={i}>
                  <CheckCircle2 size={16} className="text-primary me-2 flex-shrink-0 mt-1" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

function DimensionCard({ title, subtitle, icon, iconClass, data }: any) {
  // Graceful fallback for old data formats that just had 'comment'
  const summary = data.summary || data.comment;
  const items = data.items || [];
  
  return (
    <div className="eval-detail-card">
      <div className="detail-header-row">
        <div className="detail-title-col">
          <div className={`detail-icon ${iconClass}`}>{icon}</div>
          <div className="detail-title-group">
            <h4>{title}</h4>
            <div className="detail-subtitle">{subtitle}</div>
          </div>
        </div>
        <div className="detail-score-col">
          <div className="detail-score">{data.score}<span>分</span></div>
          <div className="detail-mini-progress">
            <div className="progress-fill" style={{ width: `${data.score}%`, background: '#427759' }}></div>
          </div>
        </div>
      </div>
      
      <div className="detail-content-area">
        {items.length > 0 && (
          <ul className="detail-item-list">
            {items.map((item: any, idx: number) => (
              <li key={idx}>
                <strong>{item.point}：</strong>
                <span>{item.judgment}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="detail-summary-box">
          <strong>维度综述：</strong>
          {summary}
        </div>
      </div>
    </div>
  );
}

// Inline GraduationCapIcon for local use
function GraduationCapIcon({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
