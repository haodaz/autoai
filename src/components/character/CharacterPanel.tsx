'use client';

import React, { useEffect, useState } from 'react';
import { Skeleton } from 'antd';
import { RightOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useThemeNames } from '@/hooks/useThemeNames';
import { Character } from '@/lib/characters/types';
import { AIStatus } from '@/lib/ai/types';
import dynamic from 'next/dynamic';

const ShareModal = dynamic(() => import('@/components/share/ShareModal'), { ssr: false });


// ── 类型标签配色 ────────────────────────────────────────────────────────
const AI_TYPE_LABEL: Record<string, string> = {
  official:     '官方',
  partner:      '合作',
  custom:       '其他',
  virtual:      '虚拟人物',
  digital_twin: '数字分身',
  ambassador:   'AI代言人',
};

// ── 获取图片 URL ────────────────────────────────────────────────────────
function resolveUrl(src: string | undefined, charId: string): string {
  if (!src) return '/assets/default-ai-robot.png';
  return src.startsWith('http') || src.startsWith('/') ? src : `/characters/${charId}/${src}`;
}

// ── 主组件 ──────────────────────────────────────────────────────────────
const CharacterPanel: React.FC<{
  onSkillClick?: (skill: string) => void;
  collapsed?: boolean;
  onToggle?: () => void;
  aiStatus?: AIStatus;
}> = ({ onSkillClick, collapsed = false, onToggle, aiStatus = 'idle' }) => {
  const isMobile = useIsMobile();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedChars, setRelatedChars] = useState<Character[]>([]);
  const [convHistory, setConvHistory] = useState<any[]>([]);
  const [showShare, setShowShare] = useState(false);
  const themeNames = useThemeNames();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const urlParams = new URLSearchParams(window.location.search);
      const urlCharId = urlParams.get('charId');
      const savedId = urlCharId || localStorage.getItem('selected_character_id') || 'cat_butler';
      try {
        const [charsRes, convsRes] = await Promise.all([
          fetch('/api/public/chars').then(r => r.json()),
          fetch('/api/conversations').then(r => r.ok ? r.json() : []).catch(() => []),
        ]);
        const data = Array.isArray(charsRes) ? charsRes : [];

        let char = data.find((c: any) => String(c.id) === savedId || c.slug === savedId);
        if (!char) {
          try {
            const cr = await fetch(`/api/public/char/${savedId}`);
            if (cr.ok) char = await cr.json();
          } catch {}
          if (!char) char = { id: savedId, name: savedId, assets: {} };
        }
        setCharacter(char);

        // 历史对话（过滤当前角色）
        const allConvs = Array.isArray(convsRes) ? convsRes : (convsRes?.conversations ?? []);
        setConvHistory(allConvs.filter((c: any) => c.charId === savedId).slice(0, 5));

        // 相关知己：优先 related_chars，不足则同专题/随机补至4
        const relatedIds: string[] = char?.related_chars || [];
        let related: any[] = relatedIds.map((id: string) => data.find((c: any) => c.id === id)).filter(Boolean);
        if (related.length < 4) {
          const col = char?.theme_id;
          const sameCol = col ? data.filter((c: any) => c.id !== savedId && c.theme_id === col && !relatedIds.includes(c.id)) : [];
          const others = data.filter((c: any) => c.id !== savedId && !relatedIds.includes(c.id) && !sameCol.find((s: any) => s.id === c.id));
          const pool = [...sameCol, ...others.sort(() => Math.random() - 0.5)];
          related = [...related, ...pool.slice(0, 4 - related.length)];
        }
        setRelatedChars(related.slice(0, 4));
      } catch (e) { console.error('[CharacterPanel]', e); }
      setLoading(false);
    };
    load();
    window.addEventListener('characterChanged', load);
    window.addEventListener('character-name-updated', load);
    return () => {
      window.removeEventListener('characterChanged', load);
      window.removeEventListener('character-name-updated', load);
    };
  }, []);

  // 手机端不渲染（由 MobileCharProfile 接管），必须在所有 hook 之后判断
  if (isMobile) return null;

  // ── 图片 URL（根据 AI 状态选择对应 assets）──
  const assetForStatus =
    (aiStatus !== 'idle' ? (character?.assets as Record<string, string> | undefined)?.[aiStatus] : undefined)
    || character?.assets?.idle
    || character?.avatar;
  const sceneUrl  = resolveUrl(assetForStatus, character?.id || '');
  const avatarUrl = resolveUrl(
    character?.assets?.avatar || character?.avatar || character?.assets?.idle,
    character?.id || '',
  );

  const aiType   = character?.ai_type || '';
  const skills: string[]    = (character?.skills_preview || []) as string[];
  const topicTags: string[] = character?.topic_tags || [];
  const collection: string  = character?.theme_id || '';
  // 专题 ID → 中文名翻译（如 theme_professions → 职业）
  const collectionDisplay: string = themeNames[collection] || collection;
  // 状态文字：优先 state_labels[当前状态]，其次 state_labels.idle，最后兜底
  const stateLabels = (character?.state_labels || {}) as Record<string, string>;
  const stateText = stateLabels[aiStatus] || stateLabels.idle || '恭候差遣。';
  const isActive = aiStatus !== 'idle';

  // ── 气泡左尾巴（::before/::after 用内联 style 模拟）──
  const bubbleStyle: React.CSSProperties = {
    flex: 1, background: '#fff',
    border: '1px solid rgba(224,228,242,0.9)',
    borderRadius: '4px 14px 14px 14px',
    padding: '9px 14px', fontSize: 14,
    color: '#4a4a5e', lineHeight: 1.55,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'relative', marginTop: 48,
  };

  return (
    <div style={{
      width: collapsed ? 0 : 380,
      flexShrink: 0,
      /* overflow:visible 让左侧 tab 可见，内容由内层滚动容器控制 */
      overflow: 'visible',
      transition: 'width 0.32s cubic-bezier(.4,0,.2,1)',
      /* 不加 opacity——收起时内容已 return null，加 opacity 反而隐藏了浮出的小卡片 tab */
      position: 'relative',
      borderLeft: collapsed ? 'none' : '1px solid rgba(224,228,242,0.6)',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>

      {/* ── 收起/展开 tab ── */}
      <div onClick={onToggle} style={{
        position: 'absolute',
        left: collapsed ? -50 : -20,
        top: '50%',
        transform: 'translateY(-50%)',
        width: collapsed ? 50 : 20,
        paddingTop: collapsed ? 8 : 0,
        paddingBottom: collapsed ? 8 : 0,
        height: collapsed ? 'auto' : 52,
        background: '#fff',
        border: '1px solid rgba(223,227,245,1)',
        borderRight: 'none',
        borderRadius: '12px 0 0 12px',
        boxShadow: collapsed ? '-2px 0 12px rgba(0,0,0,0.10)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: collapsed ? 4 : 0,
        cursor: 'pointer',
        zIndex: 10,
        transition: 'width 0.32s cubic-bezier(.4,0,.2,1), left 0.32s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
      }}>
        {collapsed ? (
          // 收起状态：显示头像 + 详情文字
          <>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg, #ede9ff, #f4f0ff)',
              border: '2px solid rgba(124,92,246,0.2)',
              flexShrink: 0,
            }}>
              {character ? (
                <img src={avatarUrl} alt=""
                  onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#7c5cf6' }}>
                  {'AI'}
                </div>
              )}
            </div>
            <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500, lineHeight: 1 }}>详情</span>
          </>
        ) : (
          // 展开状态：只显示符头
          <RightOutlined style={{ fontSize: 10, color: 'rgba(128,128,128,1)' }} />
        )}
      </div>

      {collapsed ? null : loading ? (
        <div style={{ padding: 24 }}><Skeleton active avatar paragraph={{ rows: 7 }} /></div>
      ) : !character ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

          {/* ══ 一、场景图区 240px ══ */}
          <div style={{
            height: 240, flexShrink: 0, position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(175.11deg, rgba(234,244,253,1) 0%, rgba(224,228,242,1) 100%)',
          }}>
            {/* 场景背景图（全幅覆盖，非 idle 状态有呼吸动画） */}
            <div style={{
              position: 'absolute', left: '50%', top: 0,
              transform: 'translateX(-50%)',
              width: '100%', height: '240px',
              overflow: 'hidden',
            }}>
              <img
                src={sceneUrl}
                alt={character.name}
                onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center top',
                  display: 'block',
                  transition: 'transform 0.6s ease',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                }}
              />
            </div>
            {/* AI 活跃光晕（非 idle 时显示） */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 2,
              background: 'radial-gradient(ellipse at 50% 60%, rgba(91,64,232,.10) 0%, transparent 70%)',
              opacity: isActive ? 1 : 0,
              pointerEvents: 'none',
              transition: 'opacity 0.4s',
              animation: isActive ? 'shimwave 2.5s ease-in-out infinite' : 'none',
            }} />
          {/* 场景图覆盖 + 分享按钮右上角 */}
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
            <button
              onClick={() => setShowShare(true)}
              title="分享这位知己"
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#5b40e8', transition: 'all 0.15s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(91,64,232,0.9)';
                (e.currentTarget as HTMLElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.85)';
                (e.currentTarget as HTMLElement).style.color = '#5b40e8';
              }}
            >
              <ShareAltOutlined style={{ fontSize: 15 }} />
            </button>
          </div>
        </div>

          {/* ══ 二、信息卡区 ══ */}
          <div style={{ padding: '0 20px 20px', background: 'transparent' }}>

            {/* 2-1 头像 + 气泡行（叠压场景图）*/}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              marginTop: -40, marginBottom: 14,
              position: 'relative', zIndex: 5,
            }}>
              {/* 头像 */}
              <div style={{
                width: 80, height: 80, 
                borderRadius: character.id === 'yida_main' ? '50%' : 16, 
                overflow: 'hidden',
                flexShrink: 0,
                background: character.id === 'yida_main' ? '#fff' : 'linear-gradient(135deg, #ede9ff, #f4f0ff)',
                border: character.id === 'yida_main' ? '2px solid rgba(124,92,246,0.3)' : '3px solid #fff',
                boxShadow: character.id === 'yida_main' ? '0 4px 16px rgba(96,85,245,0.15)' : '0 4px 16px rgba(0,0,0,.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img
                  src={avatarUrl}
                  alt={character.name}
                  onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                  style={{ 
                    width: character.id === 'yida_main' ? '180%' : '100%', 
                    height: character.id === 'yida_main' ? '180%' : '100%', 
                    maxWidth: 'none',
                    objectFit: character.id === 'yida_main' ? 'contain' : 'cover', 
                    objectPosition: 'center', 
                    display: 'block' 
                  }}
                />
              </div>

              {/* 语音气泡 */}
              <div style={bubbleStyle}>
                {/* 左侧尾巴（伪元素用绝对定位 div 模拟）*/}
                <div style={{
                  position: 'absolute', top: 14, left: -8,
                  width: 0, height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid rgba(224,228,242,0.9)',
                }} />
                <div style={{
                  position: 'absolute', top: 15, left: -6,
                  width: 0, height: 0,
                  borderTop: '7px solid transparent',
                  borderBottom: '7px solid transparent',
                  borderRight: '7px solid #fff',
                }} />
                {stateText}
              </div>
            </div>

            {/* 2-2 类型标签行 */}
            {(aiType || collectionDisplay) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                {aiType && AI_TYPE_LABEL[aiType] && (
                  <span style={tagStyle}>{AI_TYPE_LABEL[aiType]}</span>
                )}
                {collectionDisplay && (
                  <span style={tagStyle}>{collectionDisplay}</span>
                )}
              </div>
            )}

            {/* 2-3 角色名 */}
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-.02em', marginBottom: 6, lineHeight: 1.2 }}>
              {character.name}
            </div>

            {/* 2-4 tagline */}
            {character?.tagline && (
              <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 10, lineHeight: 1.4 }}>
                {character.tagline}
              </div>
            )}

            {/* 2-5 intro 最多4行 */}
            {(character?.intro || character?.description) && (
              <div style={{
                fontSize: 14, color: '#4a4a5e', lineHeight: 1.65, marginBottom: 14,
                display: '-webkit-box', WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical' as any, overflow: 'hidden',
              }}>
                {character?.intro || character?.description}
              </div>
            )}

            {/* 2-6 话题/专题/技能标签行 */}
            {(collectionDisplay || topicTags.length > 0 || skills.length > 0) && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
                {collectionDisplay && (
                  <span style={{ ...chipBase, background: 'rgba(245,158,11,.08)', color: 'rgba(160,90,0,1)', border: '1px solid rgba(245,158,11,.22)' }}>
                    {collectionDisplay}
                  </span>
                )}
                {topicTags.slice(0, 6).map((tag: string) => (
                  <span key={tag} style={{ ...chipBase, background: 'rgba(16,163,127,.07)', color: 'rgba(16,163,127,1)', border: '1px solid rgba(16,163,127,.16)' }}>
                    {tag}
                  </span>
                ))}
                {topicTags.length === 0 && skills.slice(0, 5).map((s: string) => (
                  <span key={s} style={{ ...chipBase, background: 'rgba(91,64,232,.07)', color: 'rgba(91,64,232,1)', border: '1px solid rgba(91,64,232,.14)' }}>
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* 2-7 快捷提问（竖向按钮，✦ 前缀）*/}
            {skills.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {skills.slice(0, 4).map((skill: string) => (
                  <button
                    key={skill}
                    onClick={() => onSkillClick?.(skill)}
                    style={{
                      textAlign: 'left', whiteSpace: 'normal', height: 'auto',
                      padding: '9px 14px', lineHeight: 1.4,
                      background: '#fff', border: '1px solid rgba(224,228,242,0.9)',
                      borderRadius: 10, cursor: 'pointer', fontSize: 13,
                      color: '#374151', display: 'flex', alignItems: 'flex-start', gap: 8,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(91,64,232,.05)';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(91,64,232,.2)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = '#fff';
                      (e.currentTarget as HTMLElement).style.borderColor = 'rgba(224,228,242,0.9)';
                    }}
                  >
                    <span style={{ color: 'rgba(91,64,232,0.7)', fontWeight: 700, flexShrink: 0, fontSize: 12, marginTop: 1 }}>✦</span>
                    <span>{skill}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 2-8 相关知己 */}
            {relatedChars.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionHdrStyle}>相关知识分身</div>
                {relatedChars.map((rc: any) => {
                  const rcUrl = resolveUrl(rc.assets?.idle || rc.avatar, rc.id);
                  return (
                    <div
                      key={rc.id}
                      onClick={() => {
                        window.location.href = `/chat?charId=${rc.id}`;
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 0',
                        borderBottom: '1px solid rgba(0,0,0,.05)',
                        cursor: 'pointer', transition: 'opacity 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.75'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    >
                      {/* 38×38 圆形头像 */}
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, #ede9ff, #f4f0ff)',
                        border: '1px solid rgba(0,0,0,.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {rcUrl ? (
                          <img src={rcUrl} alt={rc.name}
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                        ) : (
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(91,64,232,.7)' }}>{rc.name?.[0]}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rc.name}</div>
                        {rc.tagline && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rc.tagline}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2-9 历史对话 */}
            {convHistory.length > 0 && (
              <div>
                <div style={{ ...sectionHdrStyle, marginTop: 4 }}>历史对话</div>
                {convHistory.map((conv: any) => (
                  <div
                    key={conv.id}
                    onClick={() => { window.location.href = `/chat?id=${conv.id}&charId=${conv.charId}`; }}
                    style={{
                      padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                      transition: 'background 0.15s',
                      borderBottom: '1px solid rgba(0,0,0,.05)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,64,232,.05)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3 }}>
                      {conv.title || character?.name || '对话'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMsg || '点击继续对话'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 分享 Modal */}
      {character && (
        <ShareModal
          open={showShare}
          onClose={() => setShowShare(false)}
          character={character}
        />
      )}

      {/* 全局动画 */}
      <style>{`
        @keyframes shimwave {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// ── 共用样式常量 ──────────────────────────────────────────────────────────
const tagStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 11px', borderRadius: 20,
  fontSize: 12, fontWeight: 500,
  background: 'rgba(255,255,255,0.7)',
  border: '1px solid rgba(0,0,0,.12)',
  color: '#4a4a5e',
};
const chipBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 10px', borderRadius: 20,
  fontSize: 12, fontWeight: 500,
};
const sectionHdrStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: '#9ca3af',
  letterSpacing: '.06em', textTransform: 'uppercase' as const,
  marginBottom: 10,
};

export default CharacterPanel;
