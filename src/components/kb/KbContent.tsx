'use client';

import React, { useState, useEffect } from 'react';
import { message, Modal } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { KbLibrary } from '@/lib/characters/types';

const KB_BLUE   = '#1a73e8';
const KB_BLUE_L = '#e8f0fe';

const EMOJI_OPTIONS = ['📚', '📖', '📝', '🔬', '💡', '🎯', '🧠', '🌍', '💼', '🏫', '🎓', '🔭', '🧬', '🏆', '🎨', '🎵', '🌱', '🤖', '⚡', '🦁'];

const COVER_GRADIENTS = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fccb90, #d57eeb)',
  'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
];

// ── 新建弹窗
function CreateModal({ open, onClose, onCreate }: {
  open: boolean; onClose: () => void; onCreate: (lib: Partial<KbLibrary>) => void;
}) {
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
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>名称 <span style={{ color: '#ef4444' }}>*</span></div>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={30}
            placeholder="例如：拉布拉多养育 / 大模型论文" style={inputStyle}
            onFocus={e => e.target.style.borderColor = KB_BLUE}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6 }}>简介（选填）</div>
          <input value={desc} onChange={e => setDesc(e.target.value)} maxLength={60}
            placeholder="一句话描述这个知识库的主题" style={inputStyle}
            onFocus={e => e.target.style.borderColor = KB_BLUE}
            onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>图标</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
            {EMOJI_OPTIONS.map(e => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{ fontSize: 20, border: `2px solid ${emoji === e ? KB_BLUE : 'transparent'}`,
                  borderRadius: 8, background: emoji === e ? KB_BLUE_L : '#f9fafb',
                  padding: '6px 0', cursor: 'pointer', transition: 'all 0.12s' }}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}
            style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 14, cursor: 'pointer' }}>
            取消
          </button>
          <button onClick={handleCreate} disabled={submitting}
            style={{ padding: '9px 24px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${KB_BLUE}, #1557b0)`, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 2px 8px rgba(26,115,232,0.3)' }}>
            {submitting ? '创建中…' : '创建知识库'}
          </button>
        </div>
      </div>
      <style>{`@keyframes modal-in { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}

// ── 知识库卡片
function LibCard({ lib, idx, onDelete, onClick }: {
  lib: KbLibrary; idx: number; onDelete: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const gradient = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 16, border: `1px solid ${hovered ? 'rgba(26,115,232,0.25)' : '#eeeef5'}`,
        overflow: 'hidden', cursor: 'pointer',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? '0 8px 32px rgba(26,115,232,0.15)' : '0 1px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
      }}>
      <div style={{ height: 156, background: gradient, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <span style={{ fontSize: 56, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))', position: 'relative', zIndex: 1 }}>{lib.emoji}</span>
        <button onClick={onDelete}
          style={{
            position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 8,
            background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
            border: 'none', color: '#fff', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.2s',
          }}>✕</button>
      </div>
      <div style={{ padding: '16px 16px 14px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#14151f', marginBottom: 4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
          {lib.name}
        </div>
        {lib.desc && (
          <div style={{ fontSize: 12.5, color: '#9ca3af', marginBottom: 8,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
            {lib.desc}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: lib.desc ? 0 : 8 }}>
          <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '2px 8px', fontWeight: 500 }}>
            {lib.fileCount} 个文档
          </span>
        </div>
      </div>
    </div>
  );
}

// ── 主内容组件（可嵌入任何页面）
export function KbContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [libs, setLibs] = useState<KbLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { if (!isMobile) fetchLibs(); }, [isMobile]);

  const fetchLibs = async () => {
    try {
      const res = await fetch('/api/kb/libraries');
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
      {/* 顶部 Header */}
      <div style={{ padding: '20px 18px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#14151f' }}>我的知识库</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>管理你的专属知识空间</div>
        </div>
        {/* 新建按鈕 */}
        <button onClick={() => setShowCreate(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            height: 34, padding: '0 14px', borderRadius: 10, border: 'none',
            background: `linear-gradient(135deg, ${KB_BLUE}, #1557b0)`,
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26,115,232,0.25)',
          }}>
          <PlusOutlined style={{ fontSize: 12 }} />新建
        </button>
      </div>

      {/* 卡片区 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 18px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12 }}>
            <div style={{ fontSize: 40 }}>⏳</div>
            <div style={{ fontSize: 14, color: '#9ca3af' }}>加载中…</div>
          </div>
        ) : libs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 240, gap: 12 }}>
            <div style={{ fontSize: 48 }}>📚</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>还没有知识库</div>
            <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>创建一个专属知识空间，让 AI 变得更懂你</div>
            <button onClick={() => setShowCreate(true)}
              style={{ marginTop: 8, padding: '9px 20px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${KB_BLUE}, #1557b0)`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              新建第一个知识库
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            {libs.map((lib, idx) => (
              <LibCard key={lib.id} lib={lib} idx={idx}
                onClick={() => router.push(`/kb/${lib.id}`)}
                onDelete={e => handleDelete(e, lib.id)} />
            ))}
          </div>
        )}
      </div>

      <CreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreate={() => fetchLibs()} />
    </>
  );
}
