'use client';

import { useState, useEffect } from 'react';

export interface LeadFormData {
  name: string;
  position: string;
  phone: string;
  wechat: string;
  notes: string;
  // 保留兼容字段，避免后端报错
  grade?: string;
  education?: string;
  province?: string;
  resourceTypes?: string[];
}

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFormData) => Promise<void>;
  charName?: string;
}

export default function LeadFormModal({ open, onClose, onSubmit, charName = '一答Pro' }: LeadFormModalProps) {
  const [form, setForm] = useState<LeadFormData>({
    name: '', position: '', phone: '', wechat: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // 关闭时重置
  useEffect(() => {
    if (!open) { setSubmitted(false); setError(''); }
  }, [open]);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('请填写称呼'); return; }
    if (!form.phone.trim() && !form.wechat.trim()) { setError('手机号和微信号至少填一个'); return; }
    setError('');
    setLoading(true);
    try {
      await onSubmit(form);
      setSubmitted(true);
    } catch {
      setError('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Mask */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 9998, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '380px', maxWidth: '100vw',
        background: '#fff', zIndex: 9999, boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', fontFamily: 'inherit',
        animation: 'slideInRight 0.25s ease',
      }}>
        <style>{`
          @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
          .ld-input { width:100%; padding:10px 12px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:14px; outline:none; box-sizing:border-box; transition:border-color .2s; }
          .ld-input:focus { border-color:#427759; }
          .ld-submit { width:100%; padding:13px; background:#427759; color:#fff; border:none; border-radius:10px; font-size:15px; font-weight:600; cursor:pointer; transition:background .2s; }
          .ld-submit:hover:not(:disabled) { background:#4f46e5; }
          .ld-submit:disabled { opacity:0.6; cursor:not-allowed; }
        `}</style>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>📋 留下联系方式</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{charName} · 产研转化，为你安排后续对接</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>信息已提交</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.8 }}>
                胡博士团队会尽快与您联系<br />
                也可以直接发邮件至 <strong style={{ color: '#427759' }}>huwanqi@squareedu.com</strong> 与胡博士联系 😊
              </div>
              <button onClick={onClose} className="ld-submit" style={{ marginTop: 32, maxWidth: 180 }}>关闭</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 称呼 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                  称呼 <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input className="ld-input" placeholder="怎么称呼您？" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              {/* 职务 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>职务</label>
                <input className="ld-input" placeholder="如：CEO、技术总监、研究员…" value={form.position}
                  onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
              </div>

              {/* 手机号 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>手机号</label>
                <input className="ld-input" type="tel" placeholder="方便团队联系您" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>

              {/* 微信 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>微信号</label>
                <input className="ld-input" placeholder="微信号（手机号 / 微信至少填一个）" value={form.wechat}
                  onChange={e => setForm(f => ({ ...f, wechat: e.target.value }))} />
              </div>

              {/* 补充说明 */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>补充说明（可选）</label>
                <textarea className="ld-input" rows={3} placeholder="如：企业名称、所在地区、核心需求方向…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ resize: 'none' }} />
              </div>

              {/* 胡博士直联提示 */}
              <div style={{ background: '#f5f4ff', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
                也可以直接发邮件至{' '}
                <strong style={{ color: '#427759' }}>huwanqi@squareedu.com</strong>{' '}
                与方略研究院执行院长胡博士联系 😊
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f3f4f6' }}>
            <button className="ld-submit" onClick={handleSubmit} disabled={loading}>
              {loading ? '提交中...' : '提交信息，等待胡博士团队联系'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
