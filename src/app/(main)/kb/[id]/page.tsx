'use client';
import React, { Suspense, useRef } from 'react';
import { Spin, message } from 'antd';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { EditOutlined, CloseOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Drawer } from 'antd';
import FilePanel from '@/components/kb/FilePanel';
import KbChatArea, { type KbChatAreaRef } from '@/components/kb/KbChatArea';
import AsstPanel from '@/components/kb/AsstPanel';
import PreviewPanel from '@/components/kb/PreviewPanel';

const BRAND = '#427759';
const BRAND_L = '#f0efff';
const EMOJI_OPTIONS = ['📚', '📖', '📝', '🔬', '💡', '🎯', '🧠', '🌍', '💼', '🏫', '🎓', '🔭', '🧬', '🏆', '🎨', '🎵', '🌱', '🤖', '⚡', '🦁'];

// ── 页面核心（读 URL 参数，无任何 loading 等待） ──────────────────────
const KbDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isMobile = useIsMobile();




  // 直接从 URL 参数读取，避免调用慢速的 /api/kb/libraries
  const libName  = searchParams.get('name')  || '知识库';
  const libEmoji = searchParams.get('emoji') || '📚';
  const libDesc  = searchParams.get('desc')  || '';

  const [tab, setTab] = React.useState<'knowledge' | 'agent'>('knowledge');
  const [panelCollapsed, setPanelCollapsed] = React.useState(false);
  const [previewFile, setPreviewFile] = React.useState<{ name: string; type?: string; id?: string | number } | null>(null);
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  const [fileCount, setFileCount] = React.useState(0);
  const [totalSizeKb, setTotalSizeKb] = React.useState(0);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // 本地可修改状态
  const [localLibName,  setLocalLibName]  = React.useState(libName);
  const [localLibEmoji, setLocalLibEmoji] = React.useState(libEmoji);
  const [localLibDesc,  setLocalLibDesc]  = React.useState(libDesc);

  // 设置 Modal 状态
  const [showSettings,   setShowSettings]   = React.useState(false);
  const [settingName,    setSettingName]    = React.useState(libName);
  const [settingDesc,    setSettingDesc]    = React.useState(libDesc);
  const [settingEmoji,   setSettingEmoji]   = React.useState(libEmoji);
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [mobileChatOpen, setMobileChatOpen] = React.useState(false);

  // 内联改名状态
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [editNameValue, setEditNameValue] = React.useState('');

  // KbChatArea ref，用于从外部触发发送
  const chatRef = useRef<KbChatAreaRef>(null);

  const ABILITY_PROMPTS: Record<string, string> = {
    '查询文档内容': '请帮我查询这个知识库的主要内容和要点',
    '深度分析资料': '请对知识库中的资料进行深度分析，提取关键洞察和结论',
    '归纳整理知识点': '请帮我将知识库的内容归纳整理成结构化的知识点列表',
    '基于内容创作': '请基于知识库中的内容，帮我创作一篇专业文章或报告',
    '翻译资料内容': '请将知识库中的内容翻译成中文，保持专业术语准确',
    '写入我的笔记': '请总结知识库的重要内容，整理成笔记格式',
  };

  const openSettings = () => {
    setSettingName(localLibName);
    setSettingDesc(localLibDesc);
    setSettingEmoji(localLibEmoji);
    setShowSettings(true);
  };

  const handleSaveSettings = async () => {
    if (!settingName.trim()) return;
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/kb/libraries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: settingName.trim(), desc: settingDesc.trim(), emoji: settingEmoji }),
      });
      const result = await res.json();
      if (result.ok || result.id || res.ok) {
        setLocalLibName(settingName.trim());
        setLocalLibDesc(settingDesc.trim());
        setLocalLibEmoji(settingEmoji);
        setShowSettings(false);
        message.success('设置已保存');
        
        // Update URL to prevent refresh reverting to old params
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('name', settingName.trim());
        newUrl.searchParams.set('desc', settingDesc.trim());
        newUrl.searchParams.set('emoji', settingEmoji);
        window.history.replaceState(null, '', newUrl.toString());
      } else {
        message.error(result.error || '保存失败');
      }
    } catch { message.error('保存失败，请重试'); }
    finally { setSavingSettings(false); }
  };

  const handleInlineNameSave = async () => {
    const newName = editNameValue.trim();
    setIsEditingName(false);
    if (!newName || newName === localLibName) return;
    try {
      const res = await fetch(`/api/kb/libraries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, desc: localLibDesc, emoji: localLibEmoji }),
      });
      if (res.ok) {
        setLocalLibName(newName);
        message.success('已重命名');
        
        // Update URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('name', newName);
        window.history.replaceState(null, '', newUrl.toString());
      }
    } catch {}
  };

  // 获取当前用户权限
  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.isAdmin) setIsAdmin(true);
    }).catch(() => {});
  }, []);



  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    position: 'relative', padding: '0 18px', height: 44,
    display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer',
    fontSize: 13.5, fontWeight: active ? 700 : 500,
    color: active ? '#427759' : '#6b7280', transition: 'color 0.15s',
  });

  const handleStatsChange = React.useCallback((count: number, sizeKb: number) => {
    setFileCount(count);
    setTotalSizeKb(sizeKb);
  }, []);

  return (
    <>
      {/* ── 行 1：白色 Header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eeeef5', flexShrink: 0, height: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
        <button onClick={() => router.push('/kb')}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: '#427759', fontSize: 13, fontWeight: 500, minWidth: 60 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0efff'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
          ← 返回
        </button>
        <div style={{ flexShrink: 0, width: 1, height: 20, background: '#e5e7eb' }} />
        {/* 内联改名 */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 4 }}>
          {isEditingName ? (
            <input
              autoFocus
              value={editNameValue}
              onChange={e => setEditNameValue(e.target.value)}
              maxLength={40}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleInlineNameSave(); }
                if (e.key === 'Escape') setIsEditingName(false);
              }}
              onBlur={handleInlineNameSave}
              style={{
                fontSize: 14, fontWeight: 700, color: '#14151f',
                border: 'none', borderBottom: '2px solid #427759',
                outline: 'none', background: 'transparent',
                width: '100%', maxWidth: 280,
                padding: '0 2px',
              }}
            />
          ) : (
            <>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#14151f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {localLibEmoji} {localLibName}
              </span>
              <button
                onClick={() => { setEditNameValue(localLibName); setIsEditingName(true); }}
                title="重命名"
                style={{ flexShrink: 0, border: 'none', background: 'none', cursor: 'pointer', color: '#c4c4d4', padding: '2px 4px', borderRadius: 4, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#427759'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#c4c4d4'; }}>
                <EditOutlined style={{ fontSize: 12 }} />
              </button>
            </>
          )}
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>就绪</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #786cff, #427759)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>U</div>
        </div>
      </div>

      {/* ── 渐变层： Tab 行 + 内容区 ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(135deg, #eef0ff 0%, #e8effd 55%, #f0f4ff 100%)' }}>

        {/* 行 2： Tab + 操作按鈕（透明底，显示渐变） */}
        <div style={{ height: 44, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {([['knowledge', '知识管理'], ['agent', '智能体']] as const).map(([key, label]) => (
              <button key={key} style={TAB_STYLE(tab === key)} onClick={() => setTab(key)}>
                {label}
                {tab === key && <div style={{ position: 'absolute', bottom: 0, left: 18, right: 18, height: 2.5, borderRadius: 2, background: '#427759' }} />}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={openSettings}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 13, padding: '5px 10px', borderRadius: 7, transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.08)'; (e.currentTarget as HTMLElement).style.color = '#427759'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}>
              设置
            </button>
              {/* 分享按钮暂时隐藏 */}
          </div>
        </div>

      {/* ── 知识管理 Tab ── */}
      {tab === 'knowledge' && (
        <div style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          padding: isMobile ? 0 : '10px',
          gap: isMobile ? 0 : '10px',
        }}>
          {/* 文件卡片 */}
          <div style={{
            width: isMobile ? '100%' : 260, flexShrink: 0,
            background: '#fff', borderRadius: isMobile ? 0 : 16,
            boxShadow: isMobile ? 'none' : '0 2px 20px rgba(96,85,245,0.09)',
            border: isMobile ? 'none' : '1px solid rgba(224,228,242,0.6)',
            overflow: 'hidden', display: (isMobile && !!previewFile) ? 'none' : 'flex', flexDirection: 'column',
          }}>
            <FilePanel
              libId={id}
              refreshTrigger={refreshTrigger}
              onPreview={(file) => {
                setPreviewFile({ name: file.name, type: file.type, id: file.id });
                setPanelCollapsed(true);
              }}
              onStatsChange={handleStatsChange}
            />
          </div>

          {/* 对话卡片 */}
          {!isMobile ? (
            <div style={{
              flex: 1, minWidth: 0,
              background: '#fff', borderRadius: 16,
              boxShadow: '0 2px 20px rgba(96,85,245,0.09)',
              border: '1px solid rgba(224,228,242,0.6)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <KbChatArea ref={chatRef} libId={id} libName={libName} activeFile={previewFile || undefined} onNoteAdded={() => setRefreshTrigger(t => t + 1)} />
            </div>
          ) : (
             <>
                <div style={{ position: 'fixed', right: 24, bottom: 40, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
                  <div 
                    onClick={() => { setMobileChatOpen(true); setPanelCollapsed(false); }}
                    style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: 18, cursor: 'pointer', border: '1px solid #e5e7eb', overflow: 'hidden' }}
                  >
                    <img src="/assets/dog_idle.png" alt="Profile" onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                  </div>
                  <div 
                    onClick={() => { setMobileChatOpen(true); setPanelCollapsed(true); }}
                    style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #786cff, #427759)', boxShadow: '0 4px 16px rgba(96,85,245,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, cursor: 'pointer', border: '3px solid #fff' }}
                  >
                    ✨
                  </div>
                </div>
                <Drawer
                  title={
                    <div 
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      onClick={() => setPanelCollapsed(!panelCollapsed)}
                    >
                      <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' }}>知识助理</span>
                      <span style={{ fontSize: 12, color: '#9ca3af', transform: !panelCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                    </div>
                  }
                  placement="bottom"
                  height="85vh"
                  open={mobileChatOpen}
                  onClose={() => setMobileChatOpen(false)}
                  className="rounded-t-2xl"
                  styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', background: '#f5f3ff', position: 'relative' }, header: { borderBottom: 'none', padding: '16px 20px' } }}
                  closeIcon={<CloseOutlined style={{ background: '#f3f4f6', padding: 6, borderRadius: '50%', fontSize: 12, color: '#4b5563' }} />}
                >
                  <div style={{ height: panelCollapsed ? 0 : '100%', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', position: 'absolute', top: 0, left: 0, right: 0, background: '#fff', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                      <AsstPanel
                        libId={id}
                        libName={libName}
                        libEmoji={libEmoji}
                        fileCount={fileCount}
                        totalSizeKb={totalSizeKb}
                        collapsed={false}
                        onToggle={() => setPanelCollapsed(v => !v)}
                        onAbilityClick={(label) => chatRef.current?.sendQuery(ABILITY_PROMPTS[label] || label)}
                      />
                    </div>
                  </div>
                  <KbChatArea ref={chatRef} libId={id} libName={localLibName} activeFile={previewFile || undefined} />
                </Drawer>
             </>
          )}

          {/* 助理卡片（内部自带卡片样式） */}
          {!isMobile && (
            <AsstPanel
              libId={id}
              libName={libName}
              libEmoji={libEmoji}
              fileCount={fileCount}
              totalSizeKb={totalSizeKb}
              collapsed={panelCollapsed}
              onToggle={() => setPanelCollapsed(v => !v)}
              onAbilityClick={(label) => chatRef.current?.sendQuery(ABILITY_PROMPTS[label] || label)}
            />
          )}

          {/* 预览卡片（内部自带卡片样式） */}
          <PreviewPanel
            open={!!previewFile}
            file={previewFile}
            libId={id}
            onClose={() => setPreviewFile(null)}
          />
        </div>
      )}



      {/* ── 知识分身 Tab ── */}
      {tab === 'agent' && (
        <div style={{ flex: 1, overflow: 'hidden auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
          <div style={{ maxWidth: 520, width: '100%' }}>

            {/* 标题 */}
            <div style={{ marginBottom: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#14151f', marginBottom: 8 }}>知识分身</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, maxWidth: 400, margin: '0 auto' }}>
                以知识库为核心，构建一个能够「代表你」回答问题的 AI 助理。它不是通用模型，而是你专属领域的深度定制成果。
              </div>
            </div>

            {/* Bulletin 要点列表 */}
            {([
              { title: '专属深度', desc: '分身仅基于你的知识库内容回答问题，不大范围游走，不长篇大论。' },
              { title: '自用或分享', desc: '可以作为个人工具使用，也可以生成链接分享给任何人，让对方通过对话理解你的知识主题。' },
              { title: '随时保持同步', desc: '知识库内容实时更新，分身的知识边界随之扩展，始终与你的知识库保持同步。' },
            ] as { title: string; desc: string; }[]).map(item => (
              <div key={item.title} style={{
                display: 'flex', gap: 14, marginBottom: 12,
                padding: '16px 20px', borderRadius: 14,
                background: '#fff', border: '1px solid #eeeef5',
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              }}>
                <div style={{ width: 4, borderRadius: 4, background: 'linear-gradient(180deg, #427759, #a78bfa)', flexShrink: 0, minHeight: 36 }} />
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14151f', marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.65 }}>{item.desc}</div>
                </div>
              </div>
            ))}

            {/* 创建按钮区域 */}
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => {
                  if (isAdmin) {
                    router.push(`/admin/agents/new?fromKb=${id}&kbName=${encodeURIComponent(localLibName)}`);
                  } else {
                    message.info({ content: '该功能即将开放，敬请期待 🎉', key: 'coming-soon', duration: 3 });
                  }
                }}
                style={{
                  padding: '11px 36px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #427759, #a78bfa)',
                  color: '#fff', fontSize: 14.5, fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(96,85,245,0.32)',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                {isAdmin ? '前往创建知识分身' : '创建知识分身'}
              </button>

              {!isAdmin && (
                <div style={{ fontSize: 12, color: '#b0b0c3' }}>功能即将开放，我们正在紧张准备中</div>
              )}
            </div>

          </div>
        </div>
      )}

      </div>{/* /gradient wrapper */}

      {/* ── 设置模态框 ── */}
      {showSettings && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowSettings(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 480, maxWidth: '95vw', background: '#fff', borderRadius: 18, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', animation: 'modalIn 0.2s ease' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#14151f', marginBottom: 22 }}>知识库设置</div>

            {/* 名称 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 7 }}>名称</div>
              <input
                value={settingName}
                onChange={e => setSettingName(e.target.value)}
                maxLength={40}
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 13px', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = BRAND)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* 简介 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 7 }}>简介（选填）</div>
              <input
                value={settingDesc}
                onChange={e => setSettingDesc(e.target.value)}
                maxLength={60}
                placeholder="一句话描述这个知识库的主题"
                style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 13px', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
                onFocus={e => (e.target.style.borderColor = BRAND)}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Emoji 选择 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>图标</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 6 }}>
                {EMOJI_OPTIONS.map(e => (
                  <button key={e} onClick={() => setSettingEmoji(e)}
                    style={{
                      fontSize: 20, border: `2px solid ${settingEmoji === e ? BRAND : 'transparent'}`,
                      borderRadius: 8, background: settingEmoji === e ? BRAND_L : '#f9fafb',
                      padding: '6px 0', cursor: 'pointer', transition: 'all 0.12s',
                    }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowSettings(false)}
                style={{ padding: '9px 18px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13, cursor: 'pointer' }}>
                取消
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings || !settingName.trim()}
                style={{ padding: '9px 22px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #427759, #a78bfa)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingSettings ? 0.7 : 1 }}>
                {savingSettings ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes popoverIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
};

export default function KbDetailPageWrapper() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>}>
      <KbDetailPage />
    </Suspense>
  );
}
