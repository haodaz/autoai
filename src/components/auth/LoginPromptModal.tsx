'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import { SafetyCertificateOutlined, RobotOutlined, MessageOutlined, CloseOutlined } from '@ant-design/icons';
import { refreshAuth } from '@/hooks/useAuth';
import { UserAgreementContent, PrivacyPolicyContent } from '@/components/auth/AgreementContent';

interface LoginPromptModalProps {
  open: boolean;
  onClose: () => void;
  reason?: string;
  onSuccess?: () => void;  // 登录成功后的回调，不传则默认 reload
}

const PRIMARY = '#427759';
const PRIMARY_DARK = '#4a3fd4';

// ── 群星（黄金角分布，SSR 安全，与登录页同款）
const STARS = Array.from({ length: 18 }, (_, i) => ({
  x:     ((i * 137.508 + 23) % 100),
  y:     ((i * 97.33  + 17) % 100),
  size:  Math.round((1.2 + (i % 6) * 0.7) * 10) / 10,
  dur:   1.8 + (i % 9) * 0.4,
  delay: (i % 13) * 0.35,
}));

function StarField() {
  return (
    <>
      {STARS.map((s, i) => {
        const big = s.size >= 4, mid = s.size >= 2.8 && !big;
        const glow = big
          ? `0 0 ${s.size}px ${s.size*.6}px rgba(255,255,255,.9), 0 0 ${s.size*4}px ${s.size*2}px rgba(200,185,255,.5)`
          : mid
          ? `0 0 ${s.size}px ${s.size*.5}px rgba(255,255,255,.85), 0 0 ${s.size*3}px ${s.size*1.5}px rgba(200,185,255,.4)`
          : `0 0 ${s.size}px ${s.size*.4}px rgba(255,255,255,.8), 0 0 ${s.size*2}px ${s.size}px rgba(210,195,255,.3)`;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: '50%', background: '#fff',
            boxShadow: glow,
            animation: `starTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            pointerEvents: 'none',
          }} />
        );
      })}
    </>
  );
}

export default function LoginPromptModal({ open, onClose, reason, onSuccess }: LoginPromptModalProps) {
  const [tab, setTab] = useState<'sms' | 'password'>('sms');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [agreementModal, setAgreementModal] = useState({ open: false, title: '', url: '' });

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  if (!open) return null;

  const handleClose = () => {
    // 确保 blur 当前焦点，防止 onFocus 再次触发
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onClose();
  };

  const isValidPhone = (p: string) => /^1[3-9]\d{9}$/.test(p.trim());

  const sendCode = async () => {
    if (!phone.trim()) { setError('请输入手机号'); return; }
    if (!isValidPhone(phone)) { setError('手机号格式不正确'); return; }
    if (sending || countdown > 0) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/auth/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: phone }),
      });
      if (res.ok) { setCountdown(60); }
      else { const d = await res.json(); setError(d.message || '发送失败，请稍后重试'); }
    } catch { setError('网络错误，请重试'); }
    finally { setSending(false); }
  };

  const handleLogin = async () => {
    setError('');
    if (!agreed) { setError('请先阅读并勾选同意《用户协议》与《隐私政策》'); return; }
    if (tab === 'sms') {
      if (!phone.trim()) { setError('请输入手机号'); return; }
      if (!isValidPhone(phone)) { setError('手机号格式不正确'); return; }
      if (!code.trim()) { setError('请输入验证码'); return; }
    } else {
      if (!username.trim()) { setError('请输入账号'); return; }
      if (!password.trim()) { setError('请输入密码'); return; }
    }
    setLoading(true);
    try {
      const body = tab === 'sms' ? { mobile: phone, code } : { username, password };
      const endpoint = tab === 'sms' ? '/api/auth/sms/login' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        refreshAuth();
        if (onSuccess) { onSuccess(); } else { window.location.reload(); }
      } else {
        setError(d.error || d.message || '登录失败，请检查账号信息');
      }
    } catch { setError('网络错误，请重试'); }
    finally { setLoading(false); }
  };

  const features = [
    { icon: <SafetyCertificateOutlined style={{ fontSize: 20, color: PRIMARY }} />, label: '人才验真' },
    { icon: <RobotOutlined style={{ fontSize: 20, color: PRIMARY }} />, label: '群体智能协同' },
    { icon: <MessageOutlined style={{ fontSize: 20, color: PRIMARY }} />, label: 'A2A新模式' },
  ];

  return (
    /* Overlay */
    <div
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(20, 10, 50, 0.72)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'auto',
      }}
    >
      {/* Modal Card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(60, 40, 180, 0.4)',
          margin: '0 16px',
          animation: 'loginModalIn 0.28s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {/* ── 顶部紫色区域 ── */}
        <div style={{
          background: 'linear-gradient(150deg, #4a3fd4 0%, #427759 55%, #9b6ff5 100%)',
          padding: '22px 24px 36px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* 群星背景（与登录页同款）*/}
          <StarField />

          {/* Logo行 + 关闭按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/assets/eda-logo-white.png"
                alt="一答"
                style={{ height: 33, objectFit: 'contain' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>智能体</span>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer',
                width: 30, height: 30, borderRadius: '50%',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, flexShrink: 0,
              }}
            >
              <CloseOutlined />
            </button>
          </div>

          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: '0.15em', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase' }}>
            Eda, answer for truth.
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, margin: '0 0 16px', color: '#fff', whiteSpace: 'nowrap' }}>
            随时随地，为您一答
          </h2>
          {reason && (
            <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, lineHeight: 1.6 }}>
              {reason}，需要登录后继续
            </div>
          )}
        </div>

        {/* ── 白色表单区 ── */}
        <div style={{ background: '#fff', padding: '22px 22px 18px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#14151f', marginBottom: 2 }}>免注册，一键登录</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 18 }}>手机验证即可进入 · 新用户自动开通账号</div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f5', marginBottom: 18 }}>
            {(['password', 'sms'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '7px 0', border: 'none', background: 'none',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: tab === t ? PRIMARY : '#9ca3af',
                  borderBottom: `2px solid ${tab === t ? PRIMARY : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                {t === 'password' ? '账号密码' : '短信验证码'}
              </button>
            ))}
          </div>

          {tab === 'sms' ? (
            <>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 500 }}>手机号</div>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="输入手机号"
                  type="tel"
                  style={{
                    width: '100%', padding: '11px 13px', borderRadius: 10,
                    border: `1.5px solid ${phone ? PRIMARY : '#e5e7eb'}`,
                    outline: 'none', fontSize: 14, boxSizing: 'border-box',
                    background: '#fafbff', transition: 'border 0.15s', fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 500 }}>验证码</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="输入短信验证码"
                    style={{
                      flex: 1, padding: '11px 13px', borderRadius: 10,
                      border: `1.5px solid ${code ? PRIMARY : '#e5e7eb'}`,
                      outline: 'none', fontSize: 14, boxSizing: 'border-box',
                      background: '#fafbff', transition: 'border 0.15s', fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={sendCode}
                    disabled={sending || countdown > 0 || !phone.trim()}
                    style={{
                      flexShrink: 0, padding: '0 13px', borderRadius: 10,
                      border: `1.5px solid ${countdown > 0 ? '#e5e7eb' : PRIMARY}`,
                      background: countdown > 0 ? '#f9fafb' : '#fff',
                      color: countdown > 0 ? '#9ca3af' : PRIMARY,
                      fontSize: 13, fontWeight: 600, cursor: sending || countdown > 0 || !phone.trim() ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap', fontFamily: 'inherit',
                    }}
                  >
                    {countdown > 0 ? `${countdown}s` : sending ? '发送中…' : '发送验证码'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 500 }}>账号</div>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="输入账号或手机号"
                  style={{
                    width: '100%', padding: '11px 13px', borderRadius: 10,
                    border: `1.5px solid ${username ? PRIMARY : '#e5e7eb'}`,
                    outline: 'none', fontSize: 14, boxSizing: 'border-box',
                    background: '#fafbff', transition: 'border 0.15s', fontFamily: 'inherit',
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 5, fontWeight: 500 }}>密码</div>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="输入密码"
                  type="password"
                  onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                  style={{
                    width: '100%', padding: '11px 13px', borderRadius: 10,
                    border: `1.5px solid ${password ? PRIMARY : '#e5e7eb'}`,
                    outline: 'none', fontSize: 14, boxSizing: 'border-box',
                    background: '#fafbff', transition: 'border 0.15s', fontFamily: 'inherit',
                  }}
                />
              </div>
            </>
          )}

          {error && (
            <div style={{ marginBottom: 10, padding: '8px 12px', borderRadius: 8, background: '#fef2f2', color: '#ef4444', fontSize: 12 }}>
              {error}
            </div>
          )}

          {/* 协议政策 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0 16px', fontSize: 11, color: '#9ca3af' }}>
            <input 
              type="checkbox" 
              checked={agreed} 
              onChange={(e) => setAgreed(e.target.checked)} 
              style={{ marginRight: 6, cursor: 'pointer' }}
            />
            <label onClick={() => setAgreed(!agreed)} style={{ cursor: 'pointer' }}>
              我已阅读并同意
            </label>
            <a href="#" onClick={(e) => { e.preventDefault(); setAgreementModal({ open: true, title: '用户协议', url: '' }); }} style={{ color: '#427759', textDecoration: 'none', margin: '0 2px' }}>
              《用户协议》
            </a>
            和
            <a href="#" onClick={(e) => { e.preventDefault(); setAgreementModal({ open: true, title: '隐私政策', url: '' }); }} style={{ color: '#427759', textDecoration: 'none', margin: '0 2px' }}>
              《隐私政策》
            </a>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: loading ? '#c4b5fd' : `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: `0 4px 20px rgba(96,85,245,0.3)`,
              fontFamily: 'inherit',
            }}
          >
            {loading ? '登录中…' : '启动一答'}
          </button>

          {/* Features — Ant Design icons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {features.map(f => (
              <div key={f.label} style={{
                flex: 1, padding: '10px 4px', borderRadius: 10,
                background: '#f5f3ff', textAlign: 'center',
              }}>
                <div style={{ marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600 }}>{f.label}</div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 11, color: '#d1d5db' }}>
            © 2026 平方创想 · 一答智能体
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loginModalIn {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.25; transform: scale(0.75); }
          50%       { opacity: 1;    transform: scale(1.2); }
        }
      `}</style>
      <Modal
        title={agreementModal.title}
        open={agreementModal.open}
        onCancel={() => setAgreementModal({ ...agreementModal, open: false })}
        footer={null}
        width={800}
        destroyOnClose
        zIndex={100000}
        styles={{ body: { padding: 0 } }}
      >
        {agreementModal.title === '用户协议' ? (
          <UserAgreementContent />
        ) : agreementModal.title === '隐私政策' ? (
          <PrivacyPolicyContent />
        ) : null}
      </Modal>
    </div>
  );
}
