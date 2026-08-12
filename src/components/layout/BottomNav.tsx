'use client';
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CompassOutlined, ThunderboltOutlined, TeamOutlined, BookOutlined, MessageOutlined, UserOutlined, UsergroupAddOutlined, SafetyCertificateOutlined, NodeIndexOutlined, AppstoreOutlined } from '@ant-design/icons';
import { showZhijiPro } from '@/lib/zhiji-pro';
import { useAuth } from '@/hooks/useAuth';
import LoginPromptModal from '@/components/auth/LoginPromptModal';

const CharacterPickerModal = dynamic(() => import('@/components/character/CharacterPickerModal'), { ssr: false });
const CreateRoomModal = dynamic(() => import('@/components/roundtable/CreateRoomModal'), { ssr: false });
import { Character } from '@/lib/ai/types';

const PRIMARY  = '#7e57c2';
const INACTIVE = '#9d96b8';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconHome = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const IconCompass = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
);
const IconChat = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconPerson = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconAudit = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <circle cx="12" cy="11" r="2.5"/>
    <path d="M14 13.5l2.5 2.5"/>
  </svg>
);

export default function BottomNav() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [fabOpen, setFabOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [allChars, setAllChars] = useState<Character[]>([]);
  const { isGuest, isLoading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (showCreateRoom && allChars.length === 0) {
      fetch('/api/public/chars').then(r => r.json()).then(chars => {
        setAllChars(Array.isArray(chars) ? chars : []);
      }).catch(() => {});
    }
  }, [showCreateRoom]);

  if (pathname === '/login') return null;
  // 聊天页、群聊页以及验真空间详情页全屏模式，不显示底导航
  if (
    pathname === '/chat' || 
    pathname.startsWith('/roundtable/') ||
    pathname.startsWith('/talent-audit/') ||
    pathname === '/a2a/history' ||
    pathname.startsWith('/a2a/history/') ||
    (pathname.startsWith('/kb/') && pathname !== '/kb') ||
    (pathname.startsWith('/apps/') && pathname !== '/apps')
  ) return null;

  const view     = searchParams.get('view') || 'home';
  const isHome   = pathname === '/square' && (view === 'home' || !searchParams.get('view'));
  const isSquare = pathname === '/square' && ['all', 'thinktank'].includes(view);
  const isConvs  = pathname === '/conversations' || pathname === '/chat';
  const isAudit  = pathname.startsWith('/talent-audit');
  const isMine   = pathname === '/mine' || pathname === '/kb' || pathname === '/reports' || pathname === '/profile';

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 3, padding: '8px 2px 6px',
    border: 'none', background: 'none', cursor: 'pointer',
    color: active ? PRIMARY : INACTIVE,
    fontSize: 10, fontWeight: active ? 600 : 500,
    transition: 'color 0.15s', fontFamily: 'inherit',
    WebkitTapHighlightColor: 'transparent',
  });

  // FAB 弹出菜单项
  const FAB_ITEMS = [
    { icon: <MessageOutlined />, color: '#5c9ee8', label: '一答智能体', onClick: () => { setFabOpen(false); router.push('/chat?charId=yida_main'); } },
    { icon: <UserOutlined />, color: '#7e57c2', label: '专家对谈', onClick: () => { setFabOpen(false); setShowCharPicker(true); } },
    { icon: <UsergroupAddOutlined />, color: '#27ae60', label: '新群聊', onClick: () => { setFabOpen(false); setShowCreateRoom(true); } },
    { icon: <SafetyCertificateOutlined />, color: '#a855f7', label: '人才检测', onClick: () => { setFabOpen(false); router.push('/talent-audit/new'); } },
  ];

  return (
    // mob-bottom-nav：全局 CSS 控制 display:flex 只在手机端
    <div className="mob-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999999999,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)', pointerEvents: 'none' }}>

      {/* 遮罩 */}
      {(fabOpen || moreOpen) && (
        <div onClick={() => { setFabOpen(false); setMoreOpen(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'rgba(0,0,0,0.18)',
            backdropFilter: 'blur(2px)', pointerEvents: 'auto' }} />
      )}

      {/* FAB 弹出菜单 */}
      {fabOpen && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 10px)', left: 14,
          background: '#fff', borderRadius: 20, padding: '16px 14px 14px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', zIndex: 2,
          width: 220, pointerEvents: 'auto',
          animation: 'fabMenuIn 0.2s cubic-bezier(.4,0,.2,1)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {FAB_ITEMS.map(item => (
              <button key={item.label} onClick={item.onClick}
                style={{
                  padding: '14px 6px 10px', background: '#f7f7fb', borderRadius: 14,
                  border: 'none', cursor: 'pointer', display: 'flex',
                  flexDirection: 'column', alignItems: 'center', gap: 7,
                  transition: 'background 0.15s', fontFamily: 'inherit',
                }}
                onTouchStart={e => (e.currentTarget.style.background = '#ede9ff')}
                onTouchEnd={e => (e.currentTarget.style.background = '#f7f7fb')}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${item.color}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: item.color,
                }}>
                  {item.icon}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#374151', textAlign: 'center' }}>{item.label}</span>
              </button>
            ))}
          </div>
          {/* 箭头 */}
          <div style={{ position: 'absolute', bottom: -8, left: 30, width: 0, height: 0,
            borderTop: '8px solid #fff', borderLeft: '7px solid transparent', borderRight: '7px solid transparent' }} />
        </div>
      )}

      {/* 导航条主体：胶囊，左右留白 */}
      <nav style={{
        margin: '0 12px 10px',
        background: '#fff',
        borderRadius: 24,
        boxShadow: '0 4px 24px rgba(126,87,194,0.14), 0 1px 6px rgba(0,0,0,0.08)',
        display: 'flex', alignItems: 'center',
        height: 58, overflow: 'hidden',
        pointerEvents: 'auto',
      }}>
        {/* FAB 按钮（左侧） */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingLeft: 10, paddingRight: 4 }}>
          <button
            onClick={() => setFabOpen(f => !f)}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: fabOpen ? '#14151f' : PRIMARY,
              color: '#fff', cursor: 'pointer',
              boxShadow: fabOpen ? '0 4px 16px rgba(0,0,0,0.25)' : '0 4px 16px rgba(126,87,194,0.4)',
              transform: fabOpen ? 'rotate(45deg)' : 'none',
              transition: 'transform .18s, background .18s, box-shadow .18s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              WebkitTapHighlightColor: 'transparent',
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* 分隔线 */}
        <div style={{ width: 1, height: 28, background: 'rgba(223,227,245,0.8)', flexShrink: 0, margin: '0 2px' }} />

        {/* 4 个 tab */}
        <button style={tabStyle(isHome)} onClick={() => router.push('/square?view=home')}>
          <IconHome /><span>首页</span>
        </button>
        <button style={tabStyle(isSquare)} onClick={() => router.push('/square?view=all')}>
          <IconCompass /><span>专家智库</span>
        </button>
        <button style={tabStyle(isAudit)} onClick={() => router.push('/talent-audit')}>
          <IconAudit /><span>智查查</span>
        </button>
        <button style={tabStyle(isConvs)} onClick={() => router.push('/conversations')}>
          <IconChat /><span>对话</span>
        </button>
        <button style={tabStyle(moreOpen)} onClick={() => { setMoreOpen(m => !m); setFabOpen(false); }}>
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>更多</span>
        </button>
      </nav>

      {/* 更多 弹出菜单 */}
      {moreOpen && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% - 10px)', right: 14,
          background: '#fff', borderRadius: 20, padding: '8px 6px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', zIndex: 2,
          width: 170, pointerEvents: 'auto',
          animation: 'fabMenuIn 0.2s cubic-bezier(.4,0,.2,1)',
          display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <button onClick={() => { setMoreOpen(false); router.push('/a2a'); }}
            style={{ padding: '12px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#14151f', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <NodeIndexOutlined style={{ fontSize: 18, color: '#f59e0b' }} /> <span>A2A智能对接</span>
          </button>
          <button onClick={() => { setMoreOpen(false); router.push('/apps'); }}
            style={{ padding: '12px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#14151f', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <AppstoreOutlined style={{ fontSize: 18, color: '#8b5cf6' }} /> <span>应用中心</span>
          </button>
          <button onClick={() => { setMoreOpen(false); router.push('/kb'); }}
            style={{ padding: '12px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#14151f', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <BookOutlined style={{ fontSize: 18, color: '#427759' }} /> <span>我的知识库</span>
          </button>
          <button onClick={() => { setMoreOpen(false); router.push('/mine'); }}
            style={{ padding: '12px 14px', background: 'transparent', border: 'none', textAlign: 'left', fontSize: 15, fontWeight: 600, color: '#14151f', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <UserOutlined style={{ fontSize: 18, color: '#3b82f6' }} /> <span>我的</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes fabMenuIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <CharacterPickerModal open={showCharPicker} onClose={() => setShowCharPicker(false)} />
      <CreateRoomModal
        open={showCreateRoom}
        characters={allChars}
        themes={[]}
        isAdmin={false}
        onClose={() => setShowCreateRoom(false)}
        onCreated={(data) => {
          setShowCreateRoom(false);
          if (data?.id) router.push(`/roundtable/${data.id}`);
        }}
      />
      <LoginPromptModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => setShowLoginModal(false)}
        reason="使用一答Pro"
      />
    </div>
  );
}