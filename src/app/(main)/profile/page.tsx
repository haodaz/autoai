'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Form, Input, message, Modal, Spin } from 'antd';
import {
  CameraOutlined, SaveOutlined, LockOutlined, DeleteOutlined,
  MailOutlined, PhoneOutlined, EditOutlined,
} from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { refreshProfile } from '@/hooks/useProfile';

const PRIMARY = '#427759';

// ── 默认头像：渐变 + 首字母（取代 dicebear 卡通图）──────────────────────────
function DefaultAvatar({ name, size }: { name: string; size: number }) {
  const initial = (name || '用户')[0].toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #786cff, #427759)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
      flexShrink: 0,
      boxShadow: '0 4px 20px rgba(96,85,245,0.4)',
      userSelect: 'none',
    }}>
      {initial}
    </div>
  );
}

// ── 账号安全行 ────────────────────────────────────────────────────────────────
function SecurityRow({ icon, title, desc, action, danger, onClick }: {
  icon?: React.ReactNode; title: string; desc: string; action: string; danger?: boolean;
  onClick?: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 0', borderBottom: '1px solid #f3f4f6',
        transition: 'background 0.15s',
      }}
    >
      {icon && (
      <div style={{
        width: 38, height: 38, borderRadius: 12, flexShrink: 0,
        background: danger ? 'rgba(239,68,68,0.08)' : 'rgba(96,85,245,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, color: danger ? '#ef4444' : PRIMARY,
      }}>
        {icon}
      </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#14151f' }}>{title}</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={onClick}
        style={{
        padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
        border: danger ? '1px solid rgba(239,68,68,0.3)' : `1px solid rgba(96,85,245,0.3)`,
        background: hover
          ? (danger ? 'rgba(239,68,68,0.06)' : 'rgba(96,85,245,0.06)')
          : 'transparent',
        color: danger ? '#ef4444' : PRIMARY,
        transition: 'all 0.15s',
      }}>
        {action}
      </button>
    </div>
  );
}

const ProfilePageContent = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [username, setUsername] = useState('知己用户');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();

  // 密码修改
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile?t=${Date.now()}`);
      const data = await res.json();
      if (data) {
        const uname = data.username || '知己用户';
        setUsername(uname);
        form.setFieldsValue({
          username: uname,
          email: data.email || '',
          phone: data.phone || '',
          bio: data.bio || '',
        });
        if (data.avatar && !data.avatar.includes('dicebear')) {
          setAvatarUrl(data.avatar);
        }
      }
    } catch {
      message.error('加载个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: { username?: string; email?: string; phone?: string; bio?: string }) => {
    setSaving(true);
    try {
      const uname = values.username || username;
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, avatar: avatarUrl }),
      });
      if (res.ok) {
        setUsername(uname);
        message.success('个人资料已更新');
        refreshProfile();
      } else {
        message.error('更新失败');
      }
    } catch {
      message.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { message.warning('文件大小不能超过 5MB'); return; }
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      const url = data?.data?.uri || data?.url;
      if (url) {
        setAvatarUrl(url);
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form.getFieldsValue(), avatar: url }),
        });
        message.success('头像已更新');
        refreshProfile();
      } else {
        message.error('上传失败');
      }
    } catch {
      message.error('上传失败');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const openPasswordModal = () => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalOpen(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      message.warning('请填写新密码和确认密码');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json();
      if (data.ok) {
        message.success('密码修改成功');
        setPasswordModalOpen(false);
      } else {
        message.error(data.error || '修改密码失败');
      }
    } catch {
      message.error('修改密码失败');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  const PAD = isMobile ? '0 16px calc(16px + 72px + env(safe-area-inset-bottom, 0px))' : '0 24px 48px';

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#f4f5fb' }}>

      {/* ── Hero 渐变顶部 ── */}
      <div style={{
        background: 'linear-gradient(135deg, #5b40e8 0%, #786cff 50%, #9333ea 100%)',
        padding: isMobile ? '40px 20px 72px' : '48px 32px 80px',
        position: 'relative', textAlign: 'center',
      }}>
        {/* 背景网点 */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />

        {/* 头像区域 */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="头像"
              style={{
                width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                border: '3px solid rgba(255,255,255,0.6)',
                boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'rgba(255,255,255,0.22)',
              backdropFilter: 'blur(8px)',
              border: '3px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800, color: '#fff',
              boxShadow: '0 8px 28px rgba(0,0,0,0.2)',
            }}>
              {(username || '用')[0].toUpperCase()}
            </div>
          )}
          {/* 相机上传按钮 */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 28, height: 28, borderRadius: '50%',
              background: '#fff', border: '2px solid rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 13, color: PRIMARY,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {uploadingAvatar ? <Spin size="small" /> : <CameraOutlined />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>

        <div style={{ marginTop: 14, color: '#fff', fontSize: 18, fontWeight: 700 }}>{username}</div>
        <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>点击头像右下角相机图标可更换头像</div>
      </div>

      {/* ── 主内容区（向上 overlap）── */}
      <div style={{ maxWidth: 680, margin: isMobile ? '-48px auto 0' : '-56px auto 0', padding: PAD, position: 'relative' }}>

        {/* ── 基本信息卡片 ── */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: isMobile ? '24px 20px' : '32px 28px',
          boxShadow: '0 4px 28px rgba(0,0,0,0.09)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(96,85,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY, fontSize: 16 }}>
              <EditOutlined />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#14151f' }}>基本信息</div>
          </div>

          <Form form={form} layout="vertical" onFinish={handleSave}
            style={{ '--ant-color-primary': PRIMARY } as React.CSSProperties}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 20px' }}>
              <Form.Item name="username" label={<span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>用户名</span>} rules={[{ required: true, message: '请填写用户名' }]}>
                <Input
                  placeholder="请输入昵称"
                  style={{ borderRadius: 10, height: 40, fontSize: 14 }}
                  onChange={e => setUsername(e.target.value)}
                />
              </Form.Item>
              <Form.Item name="phone" label={<span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>手机号</span>}>
                <Input
                  prefix={<PhoneOutlined style={{ color: '#9ca3af' }} />}
                  disabled
                  placeholder="暂未绑定"
                  style={{ borderRadius: 10, height: 40, fontSize: 14, background: '#f9fafb' }}
                />
              </Form.Item>
            </div>

            <Form.Item name="email" label={<span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>邮箱地址</span>}>
              <Input
                prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                placeholder="请输入联系邮箱"
                style={{ borderRadius: 10, height: 40, fontSize: 14 }}
              />
            </Form.Item>

            <Form.Item name="bio" label={<span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>个人简介</span>} style={{ marginBottom: 28 }}>
              <Input.TextArea
                rows={3}
                placeholder="用一句话介绍一下自己…"
                style={{ borderRadius: 10, fontSize: 14, resize: 'none' }}
                maxLength={120}
                showCount
              />
            </Form.Item>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%', height: 46, borderRadius: 12, border: 'none',
                background: saving ? '#a5a0f8' : `linear-gradient(135deg, #5b40e8, ${PRIMARY})`,
                color: '#fff', fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: saving ? 'none' : '0 4px 16px rgba(96,85,245,0.35)',
                transition: 'all 0.2s',
              }}
            >
              <SaveOutlined />
              {saving ? '保存中…' : '保存更改'}
            </button>
          </Form>
        </div>

        {/* ── 账号安全卡片 ── */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: isMobile ? '24px 20px' : '28px 28px',
          boxShadow: '0 4px 28px rgba(0,0,0,0.09)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(96,85,245,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: PRIMARY, fontSize: 16 }}>
              <LockOutlined />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#14151f' }}>账号安全</div>
          </div>

          <SecurityRow
            title="登录密码"
            desc="定期更换密码可以保护您的账号安全"
            action="修改"
            onClick={openPasswordModal}
          />

        </div>

        {/* 修改密码弹窗 */}
        <Modal
          title="修改登录密码"
          open={passwordModalOpen}
          onCancel={() => !changingPassword && setPasswordModalOpen(false)}
          footer={null}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <Input.Password
              placeholder="请输入新密码"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              style={{ borderRadius: 10, height: 40, fontSize: 14 }}
              disabled={changingPassword}
            />
            <Input.Password
              placeholder="请确认新密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={{ borderRadius: 10, height: 40, fontSize: 14 }}
              disabled={changingPassword}
            />
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              style={{
                width: '100%', height: 42, borderRadius: 10, border: 'none',
                background: changingPassword ? '#a5a0f8' : PRIMARY,
                color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: changingPassword ? 'not-allowed' : 'pointer',
                marginTop: 4,
              }}
            >
              {changingPassword ? '保存中…' : '保存'}
            </button>
          </div>
        </Modal>

      </div>
    </div>
  );
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>}>
      <ProfilePageContent />
    </Suspense>
  );
}