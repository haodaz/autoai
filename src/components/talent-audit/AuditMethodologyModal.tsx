'use client';
import React from 'react';
import { Modal } from 'antd';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRIMARY = '#427759';
const PRIMARY_LIGHT = 'rgba(96,85,245,0.08)';
const PRIMARY_BORDER = 'rgba(96,85,245,0.2)';

export default function AuditMethodologyModal({ open, onClose }: Props) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      width={680}
      centered
      zIndex={100000}
      styles={{ content: { padding: 0 }, body: { padding: 0 } }}
    >
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", borderRadius: 16, overflow: 'hidden', background: '#fff' }}>

        {/* Header — 主题色背景 */}
        <div 
          className="px-5 py-6 md:px-8 md:py-7"
          style={{
          background: `linear-gradient(135deg, ${PRIMARY} 0%, #4338ca 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>Audit Methodology</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>我们如何核验你的每一条人才信息</h2>
              <p style={{ margin: '9px 0 0', fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
                平方体系构建三层信源，以 AI 推理贯穿全局，让每一条核验结论都可追溯、可解释。
              </p>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-5 md:px-8 md:py-6" style={{ background: '#f8fafc', maxHeight: '58vh', overflowY: 'auto' }}>

          <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#64748b', lineHeight: 1.8 }}>
            每当我们审计一条信息，系统会同时从以下三层调取证据，并由 AI 将散落线索汇聚为最终判断：
          </p>

          {/* Layer 1 — 平方自有 (基本盘) */}
          <div className="mb-3 p-4 md:p-5 bg-white rounded-2xl border" style={{ borderColor: PRIMARY_BORDER, boxShadow: `0 0 0 3px ${PRIMARY_LIGHT}` }}>
            <div className="flex gap-3 md:gap-4 items-center mb-3">
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: PRIMARY_LIGHT, border: `1px solid ${PRIMARY_BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="whitespace-nowrap" style={{ fontSize: 11, fontWeight: 700, color: PRIMARY, background: PRIMARY_LIGHT, padding: '2px 9px', borderRadius: 100, letterSpacing: '0.04em' }}>PROPRIETARY · 第一层</span>
                <span className="whitespace-nowrap" style={{ fontSize: 11, color: '#94a3b8' }}>核验基本盘</span>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>平方自有数据基础设施</h4>
              <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.75 }}>
                历经十余年沉淀的教育、科技、人才实体知识图谱，含 <strong style={{ color: '#1e293b' }}>1.6 亿篇学术论文</strong>、<strong style={{ color: '#1e293b' }}>5900 万项专利</strong> 与数万所高校及机构字典。这是平方核验体系最厚重的根基 — 绝大多数学历与学术信息的原子级比对，都以此为第一信源。
              </p>
            </div>
          </div>

          {/* Layer 2 — 合作生态 */}
          <div className="mb-3 p-4 md:p-5 bg-white rounded-2xl border border-slate-200">
            <div className="flex gap-3 md:gap-4 items-center mb-3">
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="whitespace-nowrap" style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', padding: '2px 9px', borderRadius: 100, letterSpacing: '0.04em' }}>PARTNER · 第二层</span>
                <span className="whitespace-nowrap" style={{ fontSize: 11, color: '#94a3b8' }}>官方权威校验</span>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>合作生态：数据源 + 官方验证接口</h4>
              <p style={{ margin: '0 0 10px', fontSize: 13.5, color: '#64748b', lineHeight: 1.75 }}>
                与学信网（CHSI）、National Student Clearinghouse（美国）、ATA 认证平台、维普数据库等机构深度合作，对学历真实性、学位授予、学术不端记录、职业资质等核心节点进行无死角穿透比对。
              </p>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {['学信网 CHSI', 'NSC (USA)', 'ATA 认证', '维普 VP'].map(p => (
                  <span key={p} style={{ fontSize: 12, color: '#7c3aed', background: '#f5f3ff', padding: '3px 10px', borderRadius: 100, border: '1px solid #ddd6fe' }}>{p}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Layer 3 — 全网 OSINT */}
          <div className="mb-5 p-4 md:p-5 bg-white rounded-2xl border border-slate-200">
            <div className="flex gap-3 md:gap-4 items-center mb-3">
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="whitespace-nowrap" style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 9px', borderRadius: 100, letterSpacing: '0.04em' }}>OPEN SOURCE · 第三层</span>
                <span className="whitespace-nowrap" style={{ fontSize: 11, color: '#94a3b8' }}>动态补充信源</span>
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>全网公开信息比对</h4>
              <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.75 }}>
                基于 DBLP、LinkedIn、Google Scholar、arXiv 等平台，对候选人公开轨迹进行多源交叉审计。这一层尤其覆盖了那些难以进入结构化数据库的信息 — 包括<strong style={{ color: '#1e293b' }}>即时动态、舆情信号、碎片化公开记录</strong>等，作为前两层的有效补充，也是发现异常的重要前哨。
              </p>
            </div>
          </div>

          {/* AI Reasoning */}
          <div className="p-4 md:p-5 rounded-2xl border" style={{ background: PRIMARY_LIGHT, borderColor: PRIMARY_BORDER }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: PRIMARY }}>AI 聚合推理 · 三层信源的智能融合</span>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#4b5563', lineHeight: 1.8 }}>
              三层信源的原始信号经由 AI 引擎完成最终汇聚：事实比对与矛盾识别、时间与空间冲突校验、发展路径合理性分析、以及异常信号的风险定级。结论是三层证据加权后的推理输出，而非任何单点数据的简单判断。
            </p>
            <div style={{ padding: '8px 12px', background: 'rgba(96,85,245,0.1)', borderRadius: 8, fontSize: 12, color: PRIMARY, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
              Trust = (SQ Base × Authority Partners) + OSINT × AI Reasoning
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 md:px-8 md:py-5 bg-white border-t border-slate-100 pb-8 md:pb-5">
          <button
            onClick={onClose}
            style={{ width: '100%', padding: '13px', background: PRIMARY, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#4338ca')}
            onMouseLeave={e => (e.currentTarget.style.background = PRIMARY)}
          >
            确认
          </button>
        </div>

      </div>
    </Modal>
  );
}
