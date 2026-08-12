'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SearchOutlined, CloseOutlined, CloseCircleFilled, RightOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useThemeNames } from '@/hooks/useThemeNames';
import { Character } from '@/lib/ai/types';

const PRIMARY = '#5b40e8';

// ── helpers ───────────────────────────────────────────────────────────────────
function getAvatar(c: Character) {
  const src = c.assets?.idle || c.avatar;
  if (!src) return '';
  return src.startsWith('http') || src.startsWith('/') ? src : `/characters/${c.id}/${src}`;
}

const TYPE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  official:     { bg: '#e8f0fe', color: '#1a73e8', label: '官方' },
  partner:      { bg: '#fef3d0', color: '#b45309', label: '合作' },
  ambassador:   { bg: '#fdf4ff', color: '#a21caf', label: 'AI大使' },
};

const COLL_COLORS = [
  { bg: '#e8f0fe', color: '#1a73e8' }, { bg: '#fef3d0', color: '#b45309' },
  { bg: '#f3e8ff', color: '#7c3aed' }, { bg: '#f0fdf4', color: '#16a34a' },
  { bg: '#fff7ed', color: '#c2410c' }, { bg: '#fdf4ff', color: '#a21caf' },
  { bg: '#ecfdf5', color: '#065f46' }, { bg: '#eff6ff', color: '#1d4ed8' },
];

function buildFilters(chars: Character[], themeNames: Record<string, string>) {
  const seenLabels = new Set<string>();
  const collFilters: { key: string; label: string }[] = [];
  chars.forEach(c => {
    if (!c.theme_id) return;
    const label = themeNames[c.theme_id] || c.theme_id;
    if (!seenLabels.has(label)) { seenLabels.add(label); collFilters.push({ key: `__coll_${c.theme_id}`, label }); }
  });
  return [
    { key: 'all', label: '全部' },
    { key: '__ai_type_official', label: '官方' },
    { key: '__ai_type_partner',  label: '合作' },
    ...collFilters.slice(0, 8),
  ];
}

function matchFilter(c: Character, key: string) {
  if (key === 'all') return true;
  if (key.startsWith('__ai_type_')) return c.ai_type === key.replace('__ai_type_', '');
  if (key.startsWith('__coll_'))   return c.theme_id === key.replace('__coll_', '');
  return false;
}

// ── Character row ─────────────────────────────────────────────────────────────
function CharRow({ c, colIdx, onSelect }: { c: Character; colIdx: number; onSelect: () => void }) {
  const themeNames = useThemeNames();
  const avatarUrl = getAvatar(c);
  const badge = TYPE_BADGE[c.ai_type || ''] || null;
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onSelect}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 18px', border: 'none', width: '100%',
        borderBottom: '1px solid rgba(223,227,245,0.45)',
        background: pressed ? '#f5f3ff' : '#fff',
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
        WebkitTapHighlightColor: 'transparent', transition: 'background 0.1s',
      }}>
      {/* Avatar */}
      <div style={{ width: 52, height: 52, borderRadius: 14, flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(135deg,#ede9ff,#c7d2fe)' }}>
        {avatarUrl
          ? <img src={avatarUrl} alt={c.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 22, fontWeight: 700, color: PRIMARY }}>
              {c.name?.[0]}
            </div>}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e' }}>{c.name}</span>
          {badge && (
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
              background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
          )}
          {c.theme_id && (
            <span style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
              background: COLL_COLORS[colIdx % COLL_COLORS.length].bg,
              color: COLL_COLORS[colIdx % COLL_COLORS.length].color, flexShrink: 0 }}>
              {themeNames[c.theme_id] || c.theme_id}
            </span>
          )}
          {(c.tags || []).slice(0, 1).map((tag, ti) => (
            <span key={ti} style={{ fontSize: 10.5, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
              background: COLL_COLORS[(colIdx + ti + 1) % COLL_COLORS.length].bg,
              color: COLL_COLORS[(colIdx + ti + 1) % COLL_COLORS.length].color, flexShrink: 0 }}>
              {tag}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {c.tagline || c.description || ''}
        </div>
      </div>
      <RightOutlined style={{ color: '#d1d5db', fontSize: 12, flexShrink: 0 }} />
    </button>
  );
}

// ── Main modal body ───────────────────────────────────────────────────────────
function PickerBody({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const themeNames = useThemeNames();
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/public/chars')
      .then(r => r.json())
      .then(d => setChars(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  const filters = useMemo(() => buildFilters(chars, themeNames), [chars, themeNames]);
  const filtered = useMemo(() => {
    let list = chars.filter(c => matchFilter(c, filter));
    if (search.trim()) {
      const kw = search.toLowerCase();
      list = list.filter(c =>
        c.name?.toLowerCase().includes(kw) ||
        c.tagline?.toLowerCase().includes(kw) ||
        (c.tags || []).some(t => t.toLowerCase().includes(kw))
      );
    }
    return list;
  }, [chars, filter, search]);

  const handleSelect = (c: Character) => {
    localStorage.setItem('selected_character_id', c.id);
    window.dispatchEvent(new CustomEvent('characterChanged', { detail: { charId: c.id } }));
    onClose();
    router.push(`/chat?charId=${encodeURIComponent(c.id)}`);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px 10px',
        borderBottom: '1px solid rgba(223,227,245,0.7)', flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', flex: 1 }}>选择知己</div>
        {!loading && <span style={{ fontSize: 12, color: '#9ca3af', marginRight: 10 }}>{filtered.length}/{chars.length}</span>}
        <button onClick={onClose}
          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af',
            fontSize: 18, padding: 4, display: 'flex', alignItems: 'center', lineHeight: 1 }}>
          <CloseOutlined />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 16px 6px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f7f8fc',
          border: '1.5px solid rgba(223,227,245,0.9)', borderRadius: 10, padding: '0 12px', height: 40 }}>
          <SearchOutlined style={{ color: '#9ca3af', fontSize: 14, flexShrink: 0 }} />
          <input
            autoFocus value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索知己名称、标签…"
            style={{ flex: 1, border: 'none', background: 'none', fontSize: 14, outline: 'none',
              color: '#374151', fontFamily: 'inherit' }} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', alignItems: 'center' }}>
              <CloseCircleFilled style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tags */}
      <div style={{ display: 'flex', gap: 7, padding: '4px 16px 10px', overflowX: 'auto',
        scrollbarWidth: 'none', flexShrink: 0, borderBottom: '1px solid rgba(223,227,245,0.5)' }}>
        {filters.map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: '5px 13px', borderRadius: 20,
                border: `1.5px solid ${active ? PRIMARY : '#e5e7eb'}`,
                background: active ? 'rgba(91,64,232,0.08)' : '#fff',
                color: active ? PRIMARY : '#6b7280',
                fontSize: 12.5, fontWeight: active ? 700 : 500,
                whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                transition: 'all .15s', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
              }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <span style={{ fontSize: 14, color: '#9ca3af' }}>加载中…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 10 }}>
            <SearchOutlined style={{ fontSize: 36, color: '#e5e7eb' }} />
            <div style={{ fontSize: 14, color: '#9ca3af' }}>没有匹配的知己</div>
          </div>
        ) : filtered.map((c, i) => (
          <CharRow key={c.id} c={c} colIdx={i} onSelect={() => handleSelect(c)} />
        ))}
      </div>
    </div>
  );
}

// ── Export: modal wrapper ─────────────────────────────────────────────────────
interface CharacterPickerModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CharacterPickerModal({ open, onClose }: CharacterPickerModalProps) {
  const isMobile = useIsMobile();

  // Lock body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  if (isMobile) {
    // ── Bottom drawer ──────────────────────────────────────────────────────
    return (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000000010,
            background: 'rgba(0,0,0,0.4)',
            pointerEvents: 'auto',
            animation: 'charPickerFadeIn 0.2s ease',
          }} />
        {/* Drawer */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000000011,
          height: '84vh',
          borderRadius: '20px 20px 0 0',
          overflow: 'hidden',
          pointerEvents: 'auto',
          animation: 'charPickerSlideUp 0.28s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        }}>
          {/* Drag handle */}
          <div style={{ background: '#fff', paddingTop: 10, paddingBottom: 2, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.15)' }} />
          </div>
          <div style={{ height: 'calc(100% - 18px)' }}>
            <PickerBody onClose={onClose} />
          </div>
        </div>
        <style>{`
          @keyframes charPickerFadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes charPickerSlideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
        `}</style>
      </>
    );
  }

  // ── Desktop modal ────────────────────────────────────────────────────────
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000000010,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          pointerEvents: 'auto',
          animation: 'charPickerFadeIn 0.18s ease',
        }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 1000000011,
        transform: 'translate(-50%, -50%)',
        width: 480, height: 620,
        borderRadius: 20,
        overflow: 'hidden',
        pointerEvents: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        animation: 'charPickerModalIn 0.22s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <PickerBody onClose={onClose} />
      </div>
      <style>{`
        @keyframes charPickerFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes charPickerModalIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.95) } to { opacity:1; transform:translate(-50%,-50%) scale(1) } }
      `}</style>
    </>
  );
}
