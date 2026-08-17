'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button, Tooltip, Avatar } from 'antd';
import {
  CompassOutlined,
  MessageOutlined,
  BookOutlined,
  FileTextOutlined,
  RobotOutlined,
  AppstoreOutlined,
  PlusOutlined,
  LeftOutlined,
  RightOutlined,
  TeamOutlined,
  ReadOutlined,
  DeleteOutlined,
  UserOutlined,
  SettingOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getConversations, deleteConversation, Conversation } from '@/lib/conversations';
import { showZhijiPro } from '@/lib/zhiji-pro';
import { Character } from '@/lib/characters/types';
import s from './Sidebar.module.css';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import LoginPromptModal from '@/components/auth/LoginPromptModal';
import dynamic from 'next/dynamic';
const CharacterPickerModal = dynamic(() => import('@/components/character/CharacterPickerModal'), { ssr: false });

const PRIMARY = '#427759';
const PRIMARY2 = '#141b38';
const SIDEBAR_BG = 'linear-gradient(110.65deg, #1b3827 0%, #0d1f14 100%)';
const GLASS_BG = 'linear-gradient(180deg, rgba(27,56,39,0.8) 0%, rgba(13,31,20,0.8) 100%)';
const GLASS_BORDER = 'rgba(66,119,89,1)';



// 本地菜单行组件
function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: React.ReactNode; onClick: () => void }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px', cursor: 'pointer', borderRadius: 8, margin: '1px 6px',
        background: hover ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'background 0.12s',
      }}
    >
      <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>{label}</span>
    </div>
  );
}


function SidebarInner() {
  const { t } = useTranslation();

  const NAV_ITEMS = [
    { key: 'square', icon: <CompassOutlined />, label: t('sidebar.nav.square.title', '专家智库'), sub: t('sidebar.nav.square.sub', '政务顾问团'), path: '/square', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
    { key: 'chat', icon: <MessageOutlined />, label: t('sidebar.nav.chat.title', '一答智能体'), sub: t('sidebar.nav.chat.sub', '专业数据与决策'), path: '/chat?charId=yida_main', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
    { key: 'talent-audit', icon: <SafetyCertificateOutlined />, label: t('sidebar.nav.talent.title', '人才检测'), sub: t('sidebar.nav.talent.sub', '背景与信用核查'), path: '/talent-audit', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
    { key: 'kb', icon: <BookOutlined />, label: t('sidebar.nav.kb.title', '知识库'), sub: t('sidebar.nav.kb.sub', '政策与文档'), path: '/kb', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
    { key: 'reports', icon: <FileTextOutlined />, label: t('sidebar.nav.reports.title', '报告记录'), sub: t('sidebar.nav.reports.sub', '分析与归档'), path: '/reports', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
    { key: 'roundtable', icon: <TeamOutlined />, label: t('sidebar.nav.roundtable.title', '聊天室'), sub: t('sidebar.nav.roundtable.sub', '多端交流'), path: '/roundtable', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
    { key: 'apps', icon: <AppstoreOutlined />, label: t('sidebar.nav.apps.title', '应用中心'), sub: t('sidebar.nav.apps.sub', '生态扩展工具'), path: '/apps', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
    { key: 'a2a', icon: <NodeIndexOutlined />, label: t('sidebar.nav.a2a.title', 'A2A 智能对接'), sub: t('sidebar.nav.a2a.sub', '跨体任务分发'), path: '/a2a', iconBg: 'rgba(255,255,255,0.1)', iconColor: '#86d9a9' },
  ];

  const NEW_OPTIONS = [
    { key: 'square', icon: <CompassOutlined />, color: '#86d9a9', label: t('sidebar.new.square.title'), sub: t('sidebar.new.square.sub') },
    { key: 'group', icon: <TeamOutlined />, color: '#86d9a9', label: t('sidebar.new.group.title'), sub: t('sidebar.new.group.sub') },
    { key: 'kb', icon: <ReadOutlined />, color: '#86d9a9', label: t('sidebar.new.kb.title'), sub: t('sidebar.new.kb.sub') },
  ];
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [characterMap, setCharacterMap] = useState<Map<string, Character>>(new Map());
  const [swipedConvId, setSwipedConvId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ username?: string; uid?: string; isAdmin?: boolean } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCharPicker, setShowCharPicker] = useState(false);
  const newMenuRef   = useRef<HTMLDivElement>(null);
  const newBtnRef    = useRef<HTMLButtonElement>(null);
  const userMenuRef  = useRef<HTMLDivElement>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; left: number } | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentConvId = searchParams.get('id');
  const { isGuest } = useAuth();
  const { profile } = useProfile();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginSuccessCallback, setLoginSuccessCallback] = useState<(() => void) | undefined>(undefined);

  // 打开登录弹窗，可不传带登录成功后的回调
  const openLoginFor = (callback?: () => void) => {
    setLoginSuccessCallback(callback ? () => callback : undefined);
    setShowLoginModal(true);
  };

  const activeKey = React.useMemo(() => {
    const base = pathname.split('/')[1] || 'square';
    if (base === 'chat') {
      const charId = searchParams.get('charId');
      if (charId && charId !== 'yida_main') {
        return 'square';
      }
    }
    return base;
  }, [pathname, searchParams]);
  const sidebarW = collapsed ? 60 : 330;

  // 同步侧栏宽度到 CSS 变量，让 .app-main margin-left 随收起/展开动画
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-w', `${sidebarW}px`);
  }, [sidebarW]);

  // 进入广场页或知识库页时自动收起侧栏（这些页面有自己的内部面板，不需要占宽度）
  useEffect(() => {
    if (pathname?.startsWith('/square') || pathname?.startsWith('/kb')) {
      setCollapsed(true);
    }
  }, [pathname]);

  useEffect(() => {
    const handleToggle = () => setMobileDrawerOpen(prev => !prev);
    window.addEventListener('toggle-mobile-drawer', handleToggle);
    return () => window.removeEventListener('toggle-mobile-drawer', handleToggle);
  }, []);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      const [convs, charRes] = await Promise.all([
        getConversations(),
        fetch('/api/public/chars').then(r => r.ok ? r.json() : []).catch(() => []),
      ]);
      setConversations(convs);
      const chars: Character[] = Array.isArray(charRes) ? charRes : [];
      setCharacterMap(new Map(chars.map((c: Character) => [c.id, c])));
    };
    load();
    window.addEventListener('conversationsUpdated', load);
    return () => window.removeEventListener('conversationsUpdated', load);
  }, []);

  // 加载当前用户
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => { if (d?.uid) setCurrentUser(d); }).catch(() => {});
  }, []);

  // 关闭用户菜单点击外
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);



  const handleNav = (key: string, path: string | null) => {
    setMobileDrawerOpen(false);
    if (key === 'zhiji-pro') {
      if (isGuest) { openLoginFor(() => { showZhijiPro(); window.location.reload(); }); return; }
      showZhijiPro(); return;
    }
    if (path) router.push(path);
  };

  const handleNewOption = (key: string) => {
    setShowNewMenu(false);
    setMobileDrawerOpen(false);
    if (key === 'square') setShowCharPicker(true);
    else if (key === 'pro') {
      if (isGuest) { openLoginFor(() => { showZhijiPro(); window.location.reload(); }); return; }
      showZhijiPro();
    }
    else if (key === 'group') router.push('/roundtable');
    else if (key === 'kb') router.push('/kb');
  };

  return (
    <>
      {mobileDrawerOpen && (
        <div className={`md:hidden ${s.overlay}`} onClick={() => setMobileDrawerOpen(false)} />
      )}
      <div
        className={`${s.main} ${mobileDrawerOpen ? s.mobileOpen : ''}`}
        style={{ width: sidebarW, background: SIDEBAR_BG }}
      >
        {/* ① Logo 区 + 收起按鈕（右上角） */}
        <div className={s.logoArea} style={{ padding: collapsed ? '0 8px' : '0 16px 0 20px', justifyContent: 'space-between', position: 'relative' }}>
          {collapsed ? (
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', margin: '0 auto',
            }}>
              <img alt="平方创想" className="w-[180%] h-[180%] max-w-none object-center" src="/logo.png" style={{ objectFit: 'contain' }} />
            </div>
          ) : (
            <div className={s.logoRow}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                <img alt="平方创想" className="w-[180%] h-[180%] max-w-none object-center" src="/logo.png" style={{ objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{t('sidebar.title')}</div>
                <div className={s.logoTagline} style={{color: 'rgba(255,255,255,0.6)'}}>{t('sidebar.subtitle')}</div>
              </div>
            </div>
          )}
          {/* 收起按鈕 — 右上角小图标，仅展开时可见 */}
          {!collapsed && (
            <button
              onClick={(e) => { e.stopPropagation(); setCollapsed(true); }}
              title="收起侧栏"
              style={{
                width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.6)', fontSize: 11, flexShrink: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.5)'; }}
            >
              <LeftOutlined />
            </button>
          )}
        </div>
        {/* showNewMenu dropdown portal */}
        {showNewMenu && menuAnchor && typeof document !== 'undefined' && createPortal(
          <>
            {/* Transparent backdrop — closes menu on outside click */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99990 }}
              onClick={() => setShowNewMenu(false)}
            />
            {/* Menu card — floats outside sidebar frame */}
            <div style={{
              position: 'fixed',
              top: menuAnchor.top,
              left: menuAnchor.left,
              zIndex: 99991,
              background: '#1b3827',
              borderRadius: 14,
              overflow: 'hidden',
              minWidth: 210,
              boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
              animation: 'sidebarMenuIn 0.18s cubic-bezier(.4,0,.2,1)',
            }}>
              {NEW_OPTIONS.map((opt) => (
                <div
                  key={opt.key}
                  onClick={() => handleNewOption(opt.key)}
                  className={s.dropItem}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div className={s.dropIcon} style={{ background: `${opt.color}18`, color: opt.color }}>
                    {opt.icon}
                  </div>
                  <div>
                    <div className={s.dropLabel}>{opt.label}</div>
                    <div className={s.dropSub}>{opt.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <style>{`@keyframes sidebarMenuIn { from { opacity:0; transform:translateX(-6px) scale(0.97); } to { opacity:1; transform:translateX(0) scale(1); } }`}</style>
          </>,
          document.body,
        )}

        {/* ③ 6个导航入口 (2列网格) */}
        <div className={s.navWrap} style={{ padding: collapsed ? '0 8px' : '0 12px' }}>
          {!collapsed ? (
            <div className={s.navGrid}>
              {NAV_ITEMS.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleNav(item.key, item.path)}
                    className={s.navBtn}
                    style={{
                      border: `1px solid ${isActive ? 'rgba(126,87,194,0.4)' : GLASS_BORDER}`,
                      background: isActive ? 'rgba(237,231,246,0.9)' : GLASS_BG,
                      boxShadow: isActive ? '0 2px 8px rgba(126,87,194,0.2)' : '0 1px 4px rgba(156,142,191,0.1)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = 'translateY(-1px)';
                        el.style.boxShadow = '0 4px 12px rgba(156,142,191,0.22)';
                        el.style.color = PRIMARY;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.transform = '';
                        el.style.boxShadow = '0 1px 4px rgba(156,142,191,0.1)';
                        el.style.color = '';
                      }
                    }}
                  >
                    <div className={s.navIcon} style={{ background: isActive ? `${PRIMARY}18` : item.iconBg, color: isActive ? PRIMARY : item.iconColor }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div className={s.navLabel} style={{ fontWeight: isActive ? 600 : 500, color: isActive ? PRIMARY : 'rgba(0,0,0,0.80)' }}>
                        {item.label}
                      </div>
                      <div className={s.navSub} style={{ color: isActive ? `${PRIMARY}99` : 'rgba(128,128,128,1)' }}>
                        {item.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={s.navCol}>
              {NAV_ITEMS.map((item) => {
                const isActive = activeKey === item.key;
                return (
                  <Tooltip key={item.key} title={item.label} placement="right">
                    <button
                      onClick={() => handleNav(item.key, item.path)}
                      className={s.navCollapsedBtn}
                      style={{
                        border: `1px solid ${isActive ? 'rgba(126,87,194,0.4)' : GLASS_BORDER}`,
                        background: isActive ? 'rgba(237,231,246,0.9)' : GLASS_BG,
                        color: isActive ? PRIMARY : item.iconColor,
                      }}
                    >
                      {item.icon}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        {/* ④ 历史记录面板 */}
        {!collapsed && (
          <div className={s.history}>
            <div className={s.historyHeader}>对话记录</div>
            <div className={s.historyScroll}>
              {isGuest ? (
                <div
                  className={s.historyEmpty}
                  style={{ cursor: 'pointer', color: '#7e57c2' }}
                  onClick={() => router.push('/login')}
                >
                  🔑 登录后查看历史对话
                </div>
              ) : conversations.length === 0 ? (
                <div className={s.historyEmpty}>暂无历史记录</div>
              ) : (
                conversations.map((conv) => {
                  const isActive = currentConvId === conv.id;
                  const isSwiped = !!swipedConvId && swipedConvId === conv.id;
                  const char = characterMap.get(conv.charId);
                  const displayName = char?.name || conv.charName || '';
                  const isValidAvatar = char?.avatar && char.avatar !== '/assets/default-ai-robot.png';
                  const avatarSrc = conv.charId === 'yida_main' 
                    ? '/assets/characters/yida_main/avatar_cropped.jpeg'
                    : (isValidAvatar ? char.avatar : (char?.assets?.avatar || char?.assets?.idle || conv.avatar || char?.avatar))
                       || (conv.charId ? `/characters/${conv.charId}/avatar.png` : '');
                  return (
                    <div key={conv.id} className={s.convWrap}>
                      <div className={s.convActions} style={{ opacity: isSwiped ? 1 : 0, pointerEvents: isSwiped ? 'auto' : 'none' }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await deleteConversation(conv.id);
                            if (currentConvId === conv.id) router.push('/chat');
                            setConversations(await getConversations());
                            setSwipedConvId(null);
                          }}
                          className={s.convDel}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#d9363e'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#ff4d4f'; }}
                        >
                          <DeleteOutlined style={{ fontSize: 14 }} />
                          <span>删除</span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSwipedConvId(null); }}
                          className={s.convCancel}
                        >
                          <span>取消</span>
                        </button>
                      </div>

                      <div
                        onClick={() => {
                          if (isSwiped) { setSwipedConvId(null); return; }
                          router.push(`/chat?id=${conv.id}&charId=${conv.charId}`);
                        }}
                        className={s.convItem}
                        style={{
                          background: isActive ? 'rgba(126,87,194,0.08)' : '#fff',
                          transform: isSwiped ? 'translateX(-120px)' : 'translateX(0)',
                        }}
                      >
                        <div className={s.convAvatar}>
                          <span className={s.convFallback}>{(displayName || '?')[0]}</span>
                          {avatarSrc && (
                            <img src={avatarSrc} alt={displayName}
                              className={s.convAvatarImg}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                          )}
                        </div>

                        <div className={s.convText}>
                          <div className={s.convRow}>
                            <span className={s.convTitle} style={{ color: isActive ? PRIMARY : 'rgba(0,0,0,0.75)' }}>
                              {conv.title || displayName}
                            </span>
                            {!isSwiped && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSwipedConvId(conv.id); }}
                                title="删除"
                                className={s.convDeleteBtn}
                              >
                                <DeleteOutlined />
                              </button>
                            )}
                          </div>
                          <span className={s.convSub}>{conv.lastMsg || '刚刚开始对话'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 收起时：整个空白区可点击展开 */}
        {collapsed && (
          <div
            onClick={() => setCollapsed(false)}
            title="点击展开侧栏"
            style={{ flex: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <span style={{ fontSize: 14, color: '#7e57c2', fontWeight: 700, lineHeight: 1, userSelect: 'none' }}>›</span>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500, userSelect: 'none', letterSpacing: '0.02em' }}>{t('sidebar.expand')}</span>
          </div>
        )}

        {/* ⑤ 底部用户信息 —— 仅展开时显示 */}
        {!collapsed && (
          <div ref={userMenuRef} style={{ flexShrink: 0, position: 'relative' }}>

            {/* 游客：登录按钮 */}
            {isGuest ? (
              <>
                <div style={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.05)',
                }}>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    style={{
                      width: '100%', height: 38, borderRadius: 10,
                      background: 'linear-gradient(135deg, #9c6cd4, #7e57c2)',
                      border: 'none', cursor: 'pointer',
                      color: '#fff', fontSize: 13, fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <span>🔑</span> 登录一答
                  </button>
                </div>
              </>
            ) : (
              <>
            {showUserMenu && (
              <div style={{
                position: 'absolute', bottom: '100%', left: 8, right: 8, marginBottom: 6,
                background: '#1b3827', borderRadius: 12,
                boxShadow: '0 -4px 24px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.06)',
                padding: '6px 0', zIndex: 9999,
              }}>
                {/* 账号信息 */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                    background: `linear-gradient(135deg, #9c6cd4, ${PRIMARY})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700
                  }}>
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      (profile?.username || currentUser?.username || '我')[0].toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.95)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {profile?.username || currentUser?.username || '用户'}
                    </div>
                    {profile?.bio && (
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {profile.bio}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: profile?.bio ? 2 : 4 }}>
                      账号：{currentUser?.phone || currentUser?.uid}
                    </div>
                  </div>
                </div>
                {/* 菜单项 */}
                {(currentUser as any)?.isAdmin && (
                  <MenuItem icon={<DashboardOutlined />} label={
                    <span style={{ color: PRIMARY, fontWeight: 600 }}>{t('sidebar.menu.admin')}</span>
                  } onClick={() => { setShowUserMenu(false); router.push('/admin'); }} />
                )}
                <MenuItem icon={<UserOutlined />} label="个人设置" onClick={() => { setShowUserMenu(false); router.push('/profile'); }} />
                <MenuItem icon={<InfoCircleOutlined />} label="关于一答" onClick={() => { setShowUserMenu(false); window.open('/about', '_blank'); }} />
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                {(currentUser as any)?.isAdmin && (
                  <MenuItem icon={<DownloadOutlined />} label="导出我的数据" onClick={() => {
                    setShowUserMenu(false);
                    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                    a.download = `zhiji_export_${Date.now()}.json`; a.click();
                  }} />
                )}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />
                <MenuItem
                  icon={<LogoutOutlined />}
                  label={<span style={{ color: '#ef4444' }}>{t('sidebar.menu.logout')}</span>}
                  onClick={async () => {
                    setShowUserMenu(false);
                    const res = await fetch('/api/auth/logout', { method: 'POST' });
                    if (res.ok) router.push('/login');
                  }}
                />
              </div>
            )}
            {/* 用户栏 */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              padding: '10px 12px',
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.05)',
            }}>
              <Avatar
                size={34}
                src={mounted ? profile?.avatar : undefined}
                style={{ background: `linear-gradient(135deg,#9c6cd4,${PRIMARY})`, flexShrink: 0, fontSize: 14, cursor: 'pointer' }}
                onClick={() => setShowUserMenu(v => !v)}
              >
                {mounted ? (!profile?.avatar && ((profile?.username || currentUser?.username || '我')[0])) : '我'}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {mounted ? (profile?.username || currentUser?.username || '用户') : '用户'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>
                  {mounted ? (currentUser?.phone || '一答账户') : '一答账户'}
                </div>
              </div>
              <button
                onClick={() => setShowUserMenu(v => !v)}
                title="账户设置"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: showUserMenu ? PRIMARY : 'rgba(255,255,255,0.4)', padding: 4, borderRadius: 6, display: 'flex', fontSize: 15 }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = PRIMARY; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = showUserMenu ? PRIMARY : 'rgba(0,0,0,0.35)'; }}
              >
                <SettingOutlined />
              </button>
            </div>
              </>
            )}
          </div>
        )}
      </div>
      <CharacterPickerModal open={showCharPicker} onClose={() => setShowCharPicker(false)} />
      {/* LoginPromptModal 放在顶层，不受 collapsed 状态影响，position:fixed 全屏覆盖 */}
      <LoginPromptModal open={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={loginSuccessCallback} />
    </>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={null}>
      <SidebarInner />
    </Suspense>
  );
}
