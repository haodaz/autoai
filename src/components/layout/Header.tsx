'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Dropdown, message } from 'antd';
import {
  EditOutlined, CheckOutlined, CloseOutlined,
  UserOutlined, SettingOutlined, FileTextOutlined,
  InfoCircleOutlined, DownloadOutlined, FolderOpenOutlined,
  UploadOutlined, LogoutOutlined, DashboardOutlined, MenuOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AIStatus } from '@/lib/ai/types';


// ── 页面标题映射 ─────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  square:    '专家智库',
  chat:      '一答智能体',
  kb:        '知识库',
  reports:   '报告记录',
  roundtable:'圆桌讨论',
  apps:      '应用中心',
  settings:  '系统设置',
  profile:   '个人资料',
};

// ── 状态圆点配置（对应 AIStatus 各状态）──────────────────────────────────
const STATUS_CONFIG: Record<AIStatus, { color: string; label: string; pulse: boolean }> = {
  idle:     { color: '#22c55e', label: '就绪',     pulse: false },
  thinking: { color: '#f59e0b', label: '思考中…',  pulse: true  },
  talking:  { color: '#3b82f6', label: '回复中…',  pulse: true  },
  working:  { color: '#8b5cf6', label: '处理中…',  pulse: true  },
  sleeping: { color: '#9ca3af', label: '休眠中…',  pulse: false },
  resting:  { color: '#6b7280', label: '休息中…',  pulse: false },
};

const HeaderInner: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<AIStatus>('idle');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const { user, isGuest } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();

  // 监听来自我的页面齿轮的打开事件
  useEffect(() => {
    const handler = () => setDropdownOpen(true);
    window.addEventListener('openUserMenu', handler);
    return () => window.removeEventListener('openUserMenu', handler);
  }, []);

  // 当前页面 key
  const pageKey = pathname.split('/')[1] || 'square';
  const isChatPage = pageKey === 'chat';

  // Fetch user profile (now handled by useAuth and useProfile globally)

  // 动态页面标题：聊天页监听角色名事件
  const [chatTitle, setChatTitle] = useState('新对话');
  useEffect(() => {
    if (!isChatPage) return;
    const handleCharNameUpdate = (e: Event) => {
      const name = (e as CustomEvent).detail?.name;
      if (name) setChatTitle(name);
    };
    window.addEventListener('character-name-updated', handleCharNameUpdate);
    return () => {
      window.removeEventListener('character-name-updated', handleCharNameUpdate);
    };
  }, [isChatPage]);

  const displayTitle = isChatPage ? chatTitle : (PAGE_TITLES[pageKey] || '一答');

  // 监听 AI 状态事件（供 ChatArea 触发）
  useEffect(() => {
    const handler = (e: CustomEvent) => setStatus(e.detail as AIStatus);
    window.addEventListener('ai-status-change', handler as EventListener);
    return () => window.removeEventListener('ai-status-change', handler as EventListener);
  }, []);

  // 聚焦编辑框
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const startEdit = () => {
    setTitleDraft(displayTitle);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    if (isChatPage && titleDraft.trim()) {
      const newTitle = titleDraft.slice(0, 40);
      setChatTitle(newTitle);
      
      const convId = searchParams.get('id');
      if (convId) {
        import('@/lib/conversations').then(({ getConversation, updateConversation }) => {
          getConversation(convId).then(conv => {
            if (conv) {
              conv.title = newTitle;
              updateConversation(conv).then(() => {
                window.dispatchEvent(new Event('conversationsUpdated'));
              });
            }
          });
        });
      }
    }
    setEditingTitle(false);
  };

  const cancelEdit = () => setEditingTitle(false);

  // 退出登录
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) { message.success('已安全退出'); router.push('/login'); }
    } catch { message.error('退出失败'); }
  };

  // 导出数据
  const handleExport = () => {
    const data = { exported_at: new Date().toISOString(), note: '一答数据导出' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `yida_export_${Date.now()}.json`; a.click();
  };

  // 导入数据
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = () => message.info('数据导入功能开发中');
    input.click();
  };

  // 用户菜单
  const menuItems = useMemo(() => {
    const items: any[] = [
      {
        key: 'account',
        label: (
          <div style={{ padding: '4px 0', cursor: 'default', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: `linear-gradient(135deg, #9c6cd4, #7e57c2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700
            }}>
              {profile?.avatar ? (
                <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (profile?.username || user?.username || '我')[0].toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(0,0,0,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.username || user?.username || '用户'}
              </div>
              {profile?.bio && (
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {profile.bio}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: profile?.bio ? 2 : 4 }}>
                账号：{user?.phone || user?.uid}
              </div>
            </div>
          </div>
        ),
        disabled: true,
      },
      { type: 'divider' as const },
    ];

    if (user?.isAdmin) {
      items.push({
        key: 'admin',
        icon: <DashboardOutlined />,
        label: <span style={{ color: '#7e57c2', fontWeight: 600 }}>管理后台</span>,
        onClick: () => router.push('/admin'),
      });
    }

    items.push(
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人设置',
        onClick: () => router.push('/profile'),
      },
      {
        key: 'docs',
        icon: <FileTextOutlined />,
        label: '产品文档',
        onClick: () => router.push('/docs'),
      },
      {
        key: 'about',
        icon: <InfoCircleOutlined />,
        label: '关于一答',
        onClick: () => window.open('/about', '_blank'),
      },
      { type: 'divider' as const },
      {
        key: 'export',
        icon: <DownloadOutlined />,
        label: '导出我的数据',
        onClick: handleExport,
      },
      {
        key: 'import',
        icon: <UploadOutlined />,
        label: '导入队员数据',
        onClick: handleImport,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: <span style={{ color: '#ef4444' }}>退出登录</span>,
        onClick: handleLogout,
      },
    );

    return items;
  }, [user, profile, router]);

  const statusCfg = STATUS_CONFIG[status];

  const isYidaMobile = isChatPage && isMobile && searchParams.get('charId') === 'yida_main';

  // 只有 /chat 页面才需要顶导航（展示会话标题、状态），移动端非 yida_main 去掉（多余）
  if (!isChatPage || (isMobile && !isYidaMobile)) return null;

  return (
    <header style={{
      height: 52,
      minHeight: 52,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px 0 20px',
      background: 'transparent',   // 透明！与侧边栏背景融合
      border: 'none',
      boxShadow: 'none',
      position: 'relative',
      zIndex: 9001,
      flexShrink: 0,
    }}>
      {isYidaMobile ? (
        <>
          {/* 左侧：返回首页的汉堡菜单 */}
          <button 
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b', padding: 4, display: 'flex', alignItems: 'center' }}>
            <MenuOutlined style={{ fontSize: 20 }} />
          </button>
          
          {/* 右侧：新建对话 */}
          <button 
            onClick={() => { window.location.href = '/chat?charId=yida_main'; }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e293b', padding: 4, display: 'flex', alignItems: 'center' }}>
            <EditOutlined style={{ fontSize: 20 }} />
          </button>
        </>
      ) : (
        <>
          {/* ── 左侧：页面标题区 ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* 移动端汉堡菜单按钮 */}
            <button 
              className="mob-only-menu-btn"
              onClick={() => window.dispatchEvent(new Event('toggle-mobile-drawer'))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.80)', marginRight: 4, display: 'flex', alignItems: 'center' }}>
              <MenuOutlined style={{ fontSize: 18 }} />
            </button>

            {editingTitle ? (
              <>
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  maxLength={40}
                  onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') cancelEdit(); }}
                  style={{
                    fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.85)',
                    border: 'none', borderBottom: '2px solid #7e57c2', outline: 'none',
                    background: 'transparent', padding: '2px 4px', width: 200,
                  }}
                />
                <button onClick={saveTitle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#427759', padding: 4 }}>
                  <CheckOutlined style={{ fontSize: 13 }} />
                </button>
                <button onClick={cancelEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(128,128,128,1)', padding: 4 }}>
                  <CloseOutlined style={{ fontSize: 12 }} />
                </button>
              </>
            ) : (
              <>
                {/* 非对话页才显示标题文字；对话页只保留"新对话"按钮 */}
                {!isChatPage && (
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(0,0,0,0.80)' }}>
                    {displayTitle}
                  </span>
                )}
                {/* 新对话按钮 — 显眼的有边框按钮，标题编辑仅在侧边栏处理 */}
                {isChatPage && !isMobile && (
                  <button
                    onClick={() => { window.location.href = `/chat?charId=${searchParams.get('charId') || 'yida_main'}`; }}
                    title="开始新对话"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 8,
                      background: 'rgba(96,85,245,0.08)',
                      border: '1.5px solid rgba(96,85,245,0.25)',
                      color: '#427759',
                      fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.18s', whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = '#427759';
                      (e.currentTarget as HTMLElement).style.color = '#fff';
                      (e.currentTarget as HTMLElement).style.borderColor = '#427759';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.08)';
                      (e.currentTarget as HTMLElement).style.color = '#427759';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,85,245,0.25)';
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    新对话
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* 状态圆点脉冲动画 */}
      <style>{`
        @keyframes status-pulse {
          0%   { transform: scale(1);   opacity: 0.5; }
          50%  { transform: scale(2.2); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
      `}</style>
    </header>
  );
};

export default function Header() {
  return (
    <Suspense fallback={null}>
      <HeaderInner />
    </Suspense>
  );
}
