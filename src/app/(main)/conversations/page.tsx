'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchOutlined, PlusOutlined, CommentOutlined, TeamOutlined,
  CloseCircleFilled, DownOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { Modal, message } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Character } from '@/lib/ai/types';
import dynamic from 'next/dynamic';
const CreateRoomModal = dynamic(() => import('@/components/roundtable/CreateRoomModal'), { ssr: false });
const CharacterPickerModal = dynamic(() => import('@/components/character/CharacterPickerModal'), { ssr: false });

const PRIMARY = '#5b40e8';

function resolveAvatarUrl(char?: Character): string | null {
  if (!char) return null;
  if (char.id === 'yida_main') {
    return '/assets/characters/yida_main/avatar_cropped.jpeg';
  }
  const src = char.assets?.avatar || char.assets?.idle || char.avatar;
  if (!src) return null;
  return src.startsWith('http') || src.startsWith('/') ? src : `/characters/${char.id}/${src}`;
}

// ─── 时间格式 ────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const d = new Date(iso), now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return '刚刚';
  if (diff < 3600)  return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  const m = d.getMonth() + 1, day = d.getDate();
  return `${m}月${day}日`;
}

// ─── 新建 下拉菜单 ────────────────────────────────────────────────────────────
function NewMenu({ onNewChat, onNewGroup, onClose }: {
  onNewChat: () => void; onNewGroup: () => void; onClose: () => void;
}) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9990 }} />
      <div style={{
        position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9991,
        background: '#fff', borderRadius: 12, overflow: 'hidden', minWidth: 130,
        boxShadow: '0 8px 28px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.06)',
        animation: 'convMenuIn 0.15s ease',
      }}>
        <button onClick={() => { onNewChat(); onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%',
            padding: '12px 16px', border: 'none',
            borderBottom: '1px solid rgba(223,227,245,0.5)',
            background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            color: '#1a1a2e', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}
          onTouchStart={e => (e.currentTarget.style.background = '#f5f3ff')}
          onTouchEnd={e => (e.currentTarget.style.background = '#fff')}>
          <CommentOutlined style={{ fontSize: 16, color: PRIMARY }} />
          新对话
        </button>
        <button onClick={() => { onNewGroup(); onClose(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%',
            padding: '12px 16px', border: 'none',
            background: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500,
            color: '#1a1a2e', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}
          onTouchStart={e => (e.currentTarget.style.background = '#f5f3ff')}
          onTouchEnd={e => (e.currentTarget.style.background = '#fff')}>
          <TeamOutlined style={{ fontSize: 16, color: PRIMARY }} />
          新群聊
        </button>
      </div>
      <style>{`@keyframes convMenuIn { from { opacity:0; transform:scale(0.95) translateY(-4px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </>
  );
}

// ─── 对话 Item ────────────────────────────────────────────────────────────────
interface Conv {
  id: string; charId: string; charName: string; charAvatar?: string;
  title?: string;
  lastMsg: string; lastRole?: 'user' | 'assistant'; updatedAt: string; unread?: number;
}

function ConvItem({ c, avatarUrl, onClick, onDelete }: { c: Conv; avatarUrl: string | null; onClick: () => void; onDelete: (id: string) => void }) {
  const [pressed, setPressed] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleDeleteClick = () => {
    if (confirming) {
      onDelete(c.id);
    } else {
      setConfirming(true);
    }
  };

  const handleCancel = () => {
    setConfirming(false);
    setTimeout(() => setShowDelete(false), 200);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* 删除按钮区域 */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0,
        display: 'flex', alignItems: 'center', gap: 0,
        transform: showDelete ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.2s ease',
      }}>
        <button
          onClick={handleDeleteClick}
          style={{
            height: '100%', padding: '0 24px', border: 'none',
            background: confirming ? '#d9363e' : '#ff4d4f',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
            transition: 'background 0.15s',
          }}
        >
          <DeleteOutlined style={{ fontSize: 16 }} />
          {confirming ? '删除' : ''}
        </button>
        <button
          onClick={handleCancel}
          style={{
            height: '100%', padding: '0 24px', border: 'none',
            background: '#9ca3af',
            color: '#fff', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
          }}
        >
          取消
        </button>
      </div>

      {/* 主内容 */}
      <button onClick={onClick}
        onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 13, padding: '13px 18px',
          background: pressed ? '#f5f3ff' : '#fff', border: 'none',
          borderBottom: '1px solid rgba(223,227,245,0.45)',
          cursor: 'pointer', textAlign: 'left', width: '100%', fontFamily: 'inherit',
          WebkitTapHighlightColor: 'transparent', transition: 'background 0.1s',
        }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg, #ede9ff, #c7d2fe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {avatarUrl
            ? <img src={avatarUrl} alt={c.charName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
            : <span style={{ fontSize: 20, fontWeight: 700, color: PRIMARY }}>{c.charName?.[0] || '?'}</span>}
        </div>
        {/* 文字 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 8 }}>
              {c.title || c.charName}
            </span>
            <span style={{ fontSize: 11.5, color: '#9ca3af', flexShrink: 0 }}>{timeAgo(c.updatedAt)}</span>
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.title ? c.charName : ''}{c.title ? '：' : (c.lastRole === 'user' ? '我：' : '')}{c.lastMsg}
          </div>
        </div>
        {/* 未读 badge */}
        {(c.unread || 0) > 0 && (
          <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: PRIMARY, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', padding: '0 4px' }}>
            {(c.unread || 0) > 99 ? '99+' : c.unread}
          </div>
        )}
        {/* 删除图标按钮 */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowDelete(s => !s); setConfirming(false); }}
          style={{
            border: 'none', background: 'none', cursor: 'pointer',
            padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#9ca3af', transition: 'color 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9ca3af'}
        >
          <DeleteOutlined style={{ fontSize: 16 }} />
        </button>
      </button>
    </div>
  );
}

// ─── AvatarStack 层叠头像（群聊用）───────────────────────────────────────
function AvatarStack({ charIds, characters }: { charIds: string[]; characters: Character[] }) {
  const shown = charIds.slice(0, 3);
  const offsets = [
    { top: 0,  left: 8  },
    { top: 8,  left: 0  },
    { top: 0,  left: 16 },
  ];
  return (
    <div style={{ width: 50, height: 50, position: 'relative', flexShrink: 0 }}>
      {shown.map((id, i) => {
        const char = characters.find(c => c.id === id);
        const url = resolveAvatarUrl(char);
        return (
          <div key={id} style={{
            position: 'absolute', top: offsets[i]?.top ?? 0, left: offsets[i]?.left ?? 0,
            width: 34, height: 34, borderRadius: '50%',
            border: '2px solid #fff', background: '#f3f0ff', overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.10)',
          }}>
            {url
              ? <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: PRIMARY }}>{char?.name?.[0] || '?'}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ── 横向头像排列组件 ────────────────────────────────────────────────────────
function RowAvatars({ charIds, characters }: { charIds: string[]; characters: Character[] }) {
  const shown = charIds.slice(0, 5);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {shown.map((id) => {
        const char = characters.find(c => c.id === id);
        const src = char?.assets?.idle || char?.avatar;
        const imgUrl = src ? (src.startsWith('http') || src.startsWith('/') ? src : `/characters/${id}/${src}`) : null;
        return (
          <div key={id} style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', background: '#f8fafc', flexShrink: 0, border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imgUrl
              ? <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" color="#cbd5e1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
            }
          </div>
        );
      })}
    </div>
  );
}

// ── 聊天群卡片 ──────────────────────────────────────────────────────────
interface Roundtable {
  id: string; name: string; characters: string[]; lastMsg?: RoomMessage;
  updatedAt: string; is_broadcast?: boolean;
}
interface RoomMessage { role?: string; content?: string; charName?: string; }

function GroupCard({ g, allChars, onDelete, onClick }: {
  g: Roundtable; allChars: Character[];
  onDelete: (e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const lastMsg = g.lastMsg;
  const names = (g.characters || [])
    .map(id => allChars.find(c => c.id === id)?.name)
    .filter(Boolean);
  const memberNames = names.length > 3 
    ? names.slice(0, 3).join('，') + `，等 ${names.length}位嘉宾`
    : names.join('，');
  const preview = lastMsg?.content || null;
  const previewSender = lastMsg?.charName || null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: 18,
        border: `1.5px solid ${hovered ? '#c4b5fd' : 'rgba(223,227,245,0.6)'}`,
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 12px 28px rgba(96,85,245,0.15)' : '0 4px 14px rgba(0,0,0,0.03)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

      {/* 顶部：彩色渐变 Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #ede9fe 100%)',
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: '1px solid rgba(255,255,255,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap', flex: 1, minWidth: 0, paddingRight: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
            {g.name}
          </span>
          {g.is_broadcast && (
            <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 800, color: '#fff', background: 'linear-gradient(135deg, #ef4444, #f87171)', borderRadius: 100, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 2px 6px rgba(239,68,68,0.2)' }}>
              <span style={{ fontSize: 6 }}>●</span> LIVE
            </span>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(e); }}
          style={{
            background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.9)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8b5cf6', transition: 'all 0.15s', flexShrink: 0, padding: 6, borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#ef4444'; (e.currentTarget as HTMLElement).style.background = '#fee2e2'; (e.currentTarget as HTMLElement).style.borderColor = '#fca5a5'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8b5cf6'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.9)'; }}>
          <DeleteOutlined style={{ fontSize: 13 }} />
        </button>
      </div>

      {/* 卡片主体内容 */}
      <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', flex: 1 }}>
        
        {/* 第二行：最近活跃时间 */}
        <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
          最近活跃于 {timeAgo(g.updatedAt)}
        </div>

        {/* 第三行：对话预览气泡 */}
        <div style={{ position: 'relative', marginTop: 12, filter: 'drop-shadow(0 4px 12px rgba(59,130,246,0.08))' }}>
          <div style={{
            background: 'rgba(240, 247, 255, 0.85)', borderRadius: 12, padding: '12px 14px',
            border: '1px solid rgba(219, 234, 254, 1)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            fontSize: 13, color: '#374151', lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
            height: 66, boxSizing: 'border-box',
          }}>
            {preview
              ? <>{previewSender && <span style={{ color: PRIMARY, fontWeight: 700 }}>{previewSender}：</span>}{preview}</>
              : <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>系统初始化中，准备随时待命...</span>
            }
          </div>
          {/* 气泡小箭头 */}
          <div style={{
            position: 'absolute',
            bottom: -6, left: 24,
            width: 14, height: 14,
            background: 'rgba(240, 247, 255, 0.85)',
            backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            borderRight: '1px solid rgba(219, 234, 254, 1)',
            borderBottom: '1px solid rgba(219, 234, 254, 1)',
            transform: 'rotate(45deg)',
            borderBottomRightRadius: 3,
          }} />
        </div>

        {/* 第四行：头像行 */}
        <div style={{ marginTop: 14, minHeight: 30 }}>
          <RowAvatars charIds={g.characters || []} characters={allChars} />
        </div>

        {/* 第五行：嘉宾列表 + 进入按钮 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', marginBottom: 0, marginRight: -20, paddingTop: 14 }}>
          <div style={{ flex: 1, fontSize: 13, color: '#6b7280', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingBottom: 20, paddingRight: 16 }}>
            {memberNames || '多位知己正在受邀加入...'}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onClick(); }}
            style={{
              height: 44, padding: '0 24px', border: 'none', borderRadius: '24px 0 0 0',
              background: 'linear-gradient(135deg, #427759 0%, #8b5cf6 100%)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              flexShrink: 0, transition: 'all 0.15s',
              boxShadow: '-2px -2px 8px rgba(255,255,255,1), inset 0 2px 4px rgba(255,255,255,0.2)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}>
            {g.is_broadcast ? '入舱观摩' : '进入群聊'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── 下划线 Tabs ──────────────────────────────────────────────────────────────
function UnderlineTabs({ tabs, active, onChange }: {
  tabs: string[]; active: string; onChange: (t: string) => void;
}) {
  return (
    <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid rgba(223,227,245,0.8)', flexShrink: 0 }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          style={{ flex: 1, padding: '11px 0', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: active === t ? 700 : 500,
            color: active === t ? PRIMARY : '#9ca3af',
            borderBottom: active === t ? `2.5px solid ${PRIMARY}` : '2.5px solid transparent',
            transition: 'all 0.18s', fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent' }}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────
export default function ConversationsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [groups, setGroups] = useState<Roundtable[]>([]);
  const [allChars, setAllChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('对话历史');
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCharPicker, setShowCharPicker] = useState(false);
  const newBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/conversations').then(r => r.json()).catch(() => []),
      fetch('/api/roundtable').then(r => r.json()).catch(() => []),
      fetch('/api/public/chars').then(r => r.json()).catch(() => []),
    ]).then(([c, g, chars]) => {
      const charList: Character[] = Array.isArray(chars) ? chars : [];
      setAllChars(charList);
      // 内内居头像 URL
      const rawConvs: Conv[] = Array.isArray(c) ? c : (c.conversations || []);
      setConvs(rawConvs.map(conv => {
        const char = charList.find(x => x.id === conv.charId);
        return { ...conv, charAvatar: resolveAvatarUrl(char) || conv.charAvatar || undefined };
      }));
      setGroups(Array.isArray(g) ? g : []);
    }).finally(() => setLoading(false));
  }, []);

  const filteredConvs = useMemo(() => {
    if (!search.trim()) return convs;
    const kw = search.toLowerCase();
    return convs.filter(c => c.charName?.toLowerCase().includes(kw) || c.lastMsg?.toLowerCase().includes(kw));
  }, [convs, search]);

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const kw = search.toLowerCase();
    return groups.filter(g => g.name?.toLowerCase().includes(kw));
  }, [groups, search]);

  const handleOpenConv = (c: Conv) => {
    localStorage.setItem('selected_character_id', c.charId);
    window.dispatchEvent(new CustomEvent('characterChanged', { detail: { charId: c.charId } }));
    router.push(`/chat?id=${c.id}&charId=${encodeURIComponent(c.charId)}`);
  };

  const handleDeleteConv = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setConvs(prev => prev.filter(c => c.id !== id));
        message.success('对话已删除');
      }
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确定要删除这个聊天群吗？',
      content: '删除后聊天记录将无法找回。',
      okText: '确定删除', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const res = await fetch(`/api/roundtable/${id}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.ok) {
            message.success('删除成功');
            setGroups(prev => prev.filter(g => g.id !== id));
          }
        } catch { message.error('删除失败'); }
      },
    });
  };

  const currentList = tab === '对话历史' ? filteredConvs : filteredGroups;
  const isEmpty = currentList.length === 0;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f7f8fc',
      paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : 0 }}>

      {/* ── 顶部：Tab + 新建按钮（最顶部一行）───────────────────────────────── */}
      <div style={{ background: '#fff', padding: '10px 14px 0', flexShrink: 0,
        borderBottom: '1px solid rgba(223,227,245,0.5)' }}>

        {/* Tab 行 + 新建 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          {/* 胶囊 Tabs（与广场手机端一致） */}
          <div style={{ flex: 1, display: 'flex', background: 'rgba(91,64,232,0.07)', borderRadius: 100, padding: 3, gap: 2 }}>
            {['对话历史', '聊天群'].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: tab === t ? 600 : 500,
                  borderRadius: 100,
                  background: tab === t ? PRIMARY : 'transparent',
                  color: tab === t ? '#fff' : '#888',
                  transition: 'all 0.20s', fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}>
                {t}
              </button>
            ))}
          </div>

          {/* 新建按钮 */}
          <div ref={newBtnRef} style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowMenu(m => !m)}
              style={{ height: 40, padding: '0 14px', borderRadius: 12, border: 'none',
                background: PRIMARY, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(91,64,232,0.3)', WebkitTapHighlightColor: 'transparent' }}>
              <PlusOutlined style={{ fontSize: 13 }} />
              新建
              <DownOutlined style={{ fontSize: 9, opacity: 0.7 }} />
            </button>
            {showMenu && (
              <NewMenu
                onNewChat={() => setShowCharPicker(true)}
                onNewGroup={() => { setShowCreateModal(true); }}
                onClose={() => setShowMenu(false)} />
            )}
          </div>
        </div>

        {/* 搜索框（在 Tab 下方）*/}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f7f8fc',
          border: '1.5px solid rgba(223,227,245,0.9)', borderRadius: 10, padding: '0 12px', height: 38, marginBottom: 10 }}>
          <SearchOutlined style={{ color: '#9ca3af', fontSize: 14, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="按知己名称搜索…"
            style={{ flex: 1, border: 'none', background: 'none', fontSize: 14, outline: 'none',
              color: '#374151', fontFamily: 'inherit' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <CloseCircleFilled style={{ fontSize: 14, color: '#9ca3af' }} />
            </button>
          )}
        </div>
      </div>



      {/* ── 列表内容 ────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <span style={{ fontSize: 14, color: '#9ca3af' }}>加载中…</span>
          </div>
        ) : isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 260, gap: 12 }}>
            {tab === '对话历史'
              ? <CommentOutlined style={{ fontSize: 48, color: '#e5e7eb' }} />
              : <TeamOutlined style={{ fontSize: 48, color: '#e5e7eb' }} />}
            <div style={{ fontSize: 14, color: '#9ca3af', fontWeight: 500 }}>
              {search ? '没有匹配结果' : (tab === '对话历史' ? '还没有对话记录' : '还没有聊天群')}
            </div>
            {!search && tab === '对话历史' && (
              <button onClick={() => router.push('/conversations/new')}
                style={{ marginTop: 6, padding: '10px 24px', borderRadius: 24, border: 'none',
                  background: PRIMARY, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                发起新对话
              </button>
            )}
            {!search && tab === '聊天群' && (
              <button onClick={() => setShowCreateModal(true)}
                style={{ marginTop: 6, padding: '10px 24px', borderRadius: 24, border: 'none',
                  background: PRIMARY, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                创建聊天群
              </button>
            )}
          </div>
        ) : (
          <>
            {tab === '对话历史' && filteredConvs.map((c, i) => (
              <ConvItem key={c.id || i} c={c} avatarUrl={c.charAvatar || null} onClick={() => handleOpenConv(c)} onDelete={handleDeleteConv} />
            ))}
            {tab === '聊天群' && (
              // 和 roundtable/page.tsx 完全一致的响应式网格：手机 1 列，桌面自动填充
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'minmax(0, 1fr)' : 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 16,
                padding: isMobile ? '12px 14px 80px' : '16px 36px 36px',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                {filteredGroups.map((g, i) => (
                  <GroupCard key={g.id || i} g={g} allChars={allChars} onDelete={e => handleDeleteGroup(e, g.id)} onClick={() => router.push(`/roundtable/${g.id}`)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 创建聊天室弹窗（直接内联，无需跳页）── */}
      <CreateRoomModal
        open={showCreateModal}
        characters={allChars}
        themes={[]}
        isAdmin={false}
        onClose={() => setShowCreateModal(false)}
        onCreated={(data) => {
          setShowCreateModal(false);
          if (data?.id) {
            // 刷新群列表
            fetch('/api/roundtable').then(r => r.json()).then(g => {
              setGroups(Array.isArray(g) ? g : []);
            }).catch(() => {});
            // 直接进入新建的聊天室
            router.push(`/roundtable/${data.id}`);
          }
        }}
      />
      <CharacterPickerModal open={showCharPicker} onClose={() => setShowCharPicker(false)} />
    </div>
  );
}
