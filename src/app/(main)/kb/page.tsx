'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { message, Modal, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { KbLibrary } from '@/lib/characters/types';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import { DesktopOutlined } from '@ant-design/icons';

// ── 蓝色品牌色（知识库专属，区别于主应用紫色）
const BRAND = '#427759';
const BRAND_L = '#f0efff';

const EMOJI_OPTIONS = ['📚', '📖', '📝', '🔬', '💡', '🎯', '🧠', '🌍', '💼', '🏫', '🎓', '🔭', '🧬', '🏆', '🎨', '🎵', '🌱', '🤖', '⚡', '🦁'];

// 用户指定卡片色系
const MORANDI_CARDS = ['#EDEFFA', '#DEF1F7', '#F0E9EF'];

const fmtDate = (s?: string) => {
  if (!s) return null;
  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

// ── 新建弹窗 ─────────────────────────────────────────────────────────
function CreateModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (lib: Partial<KbLibrary>) => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [emoji, setEmoji] = useState('📚');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!open) { setName(''); setDesc(''); setEmoji('📚'); } }, [open]);

  const handleCreate = async () => {
    if (!name.trim()) { message.warning('请输入知识库名称'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/kb/libraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), desc: desc.trim(), emoji }),
      });
      const result = await res.json();
      if (result.ok || result.id) { message.success('知识库已创建'); onCreate(result.data || result); onClose(); }
      else message.error(result.error || '创建失败');
    } catch { message.error('创建失败，请重试'); }
    finally { setSubmitting(false); }
  };

  if (!open) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 480, maxWidth: '95vw', borderRadius: 16, background: '#fff', padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'modal-in 0.2s ease' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#14151f', marginBottom: 22 }}>新建知识库</div>

        {/* 名称 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>名称 <span style={{ color: '#ef4444' }}>*</span></div>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={30}
            placeholder="例如：拉布拉多养育 / 大模型论文" style={inputStyle}
            onFocus={e => e.target.style.borderColor = BRAND}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
        </div>

        {/* 简介 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>简介（选填）</div>
          <input value={desc} onChange={e => setDesc(e.target.value)} maxLength={60}
            placeholder="一句话描述这个知识库的主题" style={inputStyle}
            onFocus={e => e.target.style.borderColor = BRAND}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
        </div>

        {/* Emoji 选择 */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>图标</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{
                  fontSize: 20, border: `2px solid ${emoji === e ? BRAND : 'transparent'}`,
                  borderRadius: 8, background: emoji === e ? BRAND_L : '#f9fafb',
                  padding: '6px 0', cursor: 'pointer', transition: 'all 0.12s',
                }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}
            style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 14, cursor: 'pointer' }}>
            取消
          </button>
          <button onClick={handleCreate} disabled={submitting}
            style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #427759, #a78bfa)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 2px 10px rgba(96,85,245,0.35)' }}>
            {submitting ? '创建中…' : '创建知识库'}
          </button>
        </div>
      </div>
      <style>{`@keyframes modal-in { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

// ── 知识库卡片（莫兰迪全底色风格）──────────────────────────────────────────
function LibCard({ lib, idx, onDelete, onClick }: { lib: KbLibrary; idx: number; onDelete: (e: React.MouseEvent) => void; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  const bg = MORANDI_CARDS[idx % MORANDI_CARDS.length];
  const dateStr = fmtDate(lib.updatedAt);

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: bg,
        borderRadius: 14,
        overflow: 'hidden', cursor: 'pointer',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? '0 10px 28px rgba(0,0,0,0.13)' : '0 1px 4px rgba(0,0,0,0.07)',
        transition: 'all 0.2s ease',
        padding: '24px 24px 20px',
        position: 'relative',
        height: 220,
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      }}>

      {/* 删除按钮 */}
      <button onClick={onDelete}
        style={{
          position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: 7,
          background: 'rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)',
          border: 'none', color: '#444', fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0, transition: 'opacity 0.15s',
        }}>✕</button>

      {/* 上部：emoji + 名称 */}
      <div>
        <div style={{ fontSize: 48, marginBottom: 10, lineHeight: 1 }}>{lib.emoji}</div>
        <div style={{
          fontSize: 16, fontWeight: 700, color: '#1a1a28', marginBottom: 5, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
        }}>{lib.name}</div>
        {lib.desc && (
          <div style={{
            fontSize: 12.5, color: '#52526a', lineHeight: 1.5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{lib.desc}</div>
        )}
      </div>

      {/* 下部：元数据 */}
      <div style={{ fontSize: 11.5, color: '#7a7a96', marginTop: 14 }}>
        {lib.fileCount} 个文档{dateStr ? ` · ${dateStr}` : ''}
      </div>
    </div>
  );
}

// ── 主页面 ────────────────────────────────────────────────────────────
const KbPageContent = () => {
  const router = useRouter();
  const { isGuest, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [loginOpen, setLoginOpen] = useState(false);
  const [libs, setLibs] = useState<KbLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { if (!isGuest && !authLoading) fetchLibs(); }, [isGuest, authLoading]);


  const fetchLibs = async () => {
    try {
      const res = await fetch('/api/kb/libraries', { cache: 'no-store' });
      const data = await res.json();
      setLibs(Array.isArray(data) ? data : []);
    } catch { message.error('加载知识库失败'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确定要删除这个知识库吗？',
      content: '删除后所有文档将无法找回。',
      okText: '确定删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const res = await fetch(`/api/kb/libraries/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.ok) { message.success('已删除'); fetchLibs(); }
        } catch { message.error('删除失败'); }
      },
    });
  };



  return (
    <>
      {/* 顶部 Header 区 */}
        <div style={{ padding: isMobile ? '20px 20px 16px' : '28px 36px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#14151f', letterSpacing: '-0.3px', margin: 0 }}>知识库</h1>
            <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>管理你的专属知识空间</div>
          </div>
          <button onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 38, padding: '0 18px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #427759, #a78bfa)',
              color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(96,85,245,0.32)',
              transition: 'all 0.18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 18px rgba(96,85,245,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(96,85,245,0.32)'; }}>
            <PlusOutlined />新建
          </button>
        </div>

        {/* 卡片区 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0 20px calc(80px + env(safe-area-inset-bottom, 0px))' : '4px 36px 36px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
              <div style={{ fontSize: 48 }}>⏳</div>
              <div style={{ fontSize: 14, color: '#9ca3af' }}>加载中…</div>
            </div>
          ) : libs.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #ede9ff, #d4ccff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>📚</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>还没有知识库</div>
              <div style={{ fontSize: 13, color: '#9ca3af' }}>创建一个专属知识空间，让 AI 更懂你</div>
              <button onClick={() => setShowCreate(true)}
                style={{ marginTop: 8, padding: '9px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #427759, #a78bfa)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                新建第一个知识库
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {libs.map((lib, idx) => (
                <LibCard key={lib.id} lib={lib} idx={idx}
                  onClick={() => router.push(`/kb/${lib.id}?name=${encodeURIComponent(lib.name)}&emoji=${encodeURIComponent(lib.emoji || '📚')}&desc=${encodeURIComponent(lib.desc || '')}`)}
                  onDelete={e => handleDelete(e, lib.id)} />
              ))}
            </div>
          )}
        </div>

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)}
        onCreate={data => { fetchLibs(); }} />
    </>
  );
};

export default function KbPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>}>
      <KbPageContent />
    </Suspense>
  );
}
