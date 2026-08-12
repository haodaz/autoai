'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Character } from '@/lib/characters/types';
import { AIStatus } from '@/lib/ai/types';

function resolveUrl(src: string | undefined, charId: string): string {
  if (!src) return '/assets/default-ai-robot.png';
  return src.startsWith('http') || src.startsWith('/') ? src : `/characters/${charId}/${src}`;
}

const AI_TYPE_LABEL: Record<string, string> = {
  official: '官方', partner: '合作', custom: '其他',
  virtual: '虚拟人物', digital_twin: '数字分身', ambassador: 'AI代言人',
};

interface ConvSummary { id: string; charId: string; charName?: string; title?: string; updatedAt?: string }

interface Props {
  open: boolean;
  onClose: () => void;
  character: Character | null;
  onSkillClick?: (skill: string) => void;
  aiStatus?: AIStatus;
}

export default function MobileCharProfile({ open, onClose, character, onSkillClick, aiStatus = 'idle' }: Props) {
  const [closing, setClosing] = useState(false);
  const [relatedChars, setRelatedChars] = useState<Character[]>([]);
  const [convHistory, setConvHistory] = useState<ConvSummary[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 关闭动画
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 260);
  };

  // 加载相关知己 + 历史
  useEffect(() => {
    if (!open || !character) return;
    const load = async () => {
      try {
        const [charsRes, convsRes] = await Promise.all([
          fetch('/api/public/chars').then(r => r.json()),
          fetch('/api/conversations').then(r => r.ok ? r.json() : []).catch(() => []),
        ]);
        const data = Array.isArray(charsRes) ? charsRes : [];
        const relatedIds: string[] = character?.related_chars || [];
        let related: Character[] = relatedIds.map((id: string) => data.find((c: Character) => c.id === id)).filter(Boolean) as Character[];
        if (related.length < 4) {
          const col = character?.theme_id;
          const sameCol = col ? data.filter((c: Character) => c.id !== character.id && c.theme_id === col && !relatedIds.includes(c.id)) : [];
          const others = data.filter((c: Character) => c.id !== character.id && !relatedIds.includes(c.id) && !sameCol.find((s: Character) => s.id === c.id));
          related = [...related, ...sameCol, ...others.sort(() => Math.random() - 0.5)].slice(0, 4);
        }
        setRelatedChars(related.slice(0, 4));
        const allConvs = Array.isArray(convsRes) ? convsRes : (convsRes?.conversations ?? []);
        setConvHistory(allConvs.filter((c: ConvSummary) => c.charId === character.id).slice(0, 5));
      } catch {}
    };
    load();
  }, [open, character]);

  if (!open && !closing) return null;
  if (!character) return null;

  const assetForStatus =
    (aiStatus !== 'idle' ? (character?.assets as Record<string, string> | undefined)?.[aiStatus] : undefined)
    || character?.assets?.idle
    || character?.avatar;
  const sceneUrl  = resolveUrl(assetForStatus, character?.id);
  const avatarUrl = resolveUrl(character?.assets?.avatar || character?.avatar || character?.assets?.idle, character?.id);
  const skills: string[]    = (character?.skills_preview as string[] | undefined) || [];
  const topicTags: string[] = (character?.topic_tags as string[] | undefined) || [];
  const collection: string  = character?.theme_id || '';
  const aiType: string      = character?.ai_type || '';

  return (
    <>
      <div
        ref={overlayRef}
        style={{
          position: 'fixed', inset: 0,
          zIndex: 1000001,
          background: '#f5f7fb',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          animation: closing
            ? 'mobCpSlideOut 0.26s cubic-bezier(.4,0,.2,1) both'
            : 'mobCpSlideIn 0.32s cubic-bezier(.4,0,.2,1) both',
        }}
      >
        {/* ① 顶栏（sticky 毛玻璃） */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          height: 'calc(52px + env(safe-area-inset-top, 0px))',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingLeft: 14, paddingRight: 14,
          background: 'rgba(245,247,251,0.90)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 2, flexShrink: 0,
        }}>
          <button onClick={handleClose} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 10px 6px 4px',
            border: 'none', background: 'none',
            color: '#7c5cf6', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            ← 返回
          </button>
        </div>

        {/* ② 场景图区 240px */}
        <div style={{
          width: '100%', height: 240, flexShrink: 0,
          background: 'linear-gradient(180deg, #1a0a3e, #3a1a6e)',
          position: 'relative',
        }}>
          <img
            src={sceneUrl}
            alt={character.name}
            onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
          />
          {/* 头像叠压在 scene 底部（穿入白卡） */}
          <div style={{
            position: 'absolute', bottom: -40, left: 18,
            width: 80, height: 80, borderRadius: 16, overflow: 'hidden',
            background: 'linear-gradient(135deg, #ede9ff, #f4f0ff)',
            border: '3px solid #fff',
            boxShadow: '0 4px 16px rgba(0,0,0,.22)',
            zIndex: 3,
          }}>
            <img
              src={avatarUrl}
              alt={character.name}
              onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
            />
          </div>
        </div>

        {/* ③ 白色圆角卡（内容区） */}
        <div style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          marginTop: -22,
          padding: '20px 18px 80px',
          flex: 1,
          position: 'relative', zIndex: 1,
        }}>
          {/* 头像占位高度 */}
          <div style={{ height: 44 }} />

          {/* 状态文字 */}
          <div style={{ fontSize: 13, color: '#888', marginBottom: 10 }}>
            {(character?.state_labels as Record<string, string> | undefined)?.[aiStatus]
              || (character?.state_labels as Record<string, string> | undefined)?.idle
              || '随时都在，有什么想聊的？'}
          </div>

          {/* 类型标签行 */}
          {(aiType || collection) && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {aiType && AI_TYPE_LABEL[aiType] && (
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, background: '#f0edf9', color: '#7c5cf6', fontWeight: 600 }}>
                  {AI_TYPE_LABEL[aiType]}
                </span>
              )}
              {collection && (
                <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, background: '#f0edf9', color: '#7c5cf6', fontWeight: 600 }}>
                  {collection}
                </span>
              )}
            </div>
          )}

          {/* 角色名 */}
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.25, marginBottom: 4 }}>
            {character.name}
          </div>

          {/* tagline */}
          {character?.tagline && (
            <div style={{ fontSize: 13, color: '#666', marginBottom: 14 }}>{character.tagline}</div>
          )}

          {/* intro */}
          {(character?.intro || character?.description) && (
            <div style={{ fontSize: 14, color: '#444', lineHeight: 1.7, marginBottom: 16 }}>
              {character.intro || character.description}
            </div>
          )}

          {/* 话题 tags */}
          {topicTags.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={sectionHdr}>相关话题</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {topicTags.map((t: string) => (
                  <span key={t} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#f0edf9', color: '#7c5cf6', border: '1px solid rgba(124,92,246,.15)' }}>{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* 快捷提问 */}
          {skills.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {skills.slice(0, 4).map((skill: string) => (
                <button
                  key={skill}
                  onClick={() => { onSkillClick?.(skill); handleClose(); }}
                  style={{
                    textAlign: 'left', padding: '10px 14px', lineHeight: 1.4,
                    background: '#fff', border: '1px solid rgba(224,228,242,0.9)',
                    borderRadius: 12, cursor: 'pointer', fontSize: 14,
                    color: '#374151', display: 'flex', alignItems: 'flex-start', gap: 8,
                    whiteSpace: 'normal', height: 'auto',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <span style={{ color: 'rgba(124,92,246,0.7)', fontWeight: 700, flexShrink: 0, fontSize: 12, marginTop: 2 }}>✦</span>
                  <span>{skill}</span>
                </button>
              ))}
            </div>
          )}

          {/* 相关知己 */}
          {relatedChars.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={sectionHdr}>相关知识分身</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {relatedChars.map((rc: Character) => {
                  const rcUrl = resolveUrl(rc.assets?.idle || rc.avatar, rc.id);
                  return (
                    <div
                      key={rc.id}
                      onClick={() => {
                        handleClose();
                        window.location.href = `/chat?charId=${rc.id}`;
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 12,
                        background: '#f8f7ff', cursor: 'pointer',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10, flexShrink: 0, overflow: 'hidden',
                        background: 'linear-gradient(135deg,#ede9ff,#f4f0ff)',
                      }}>
                        <img src={rcUrl} alt={rc.name}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>{rc.name}</div>
                        {rc.tagline && <div style={{ fontSize: 12, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rc.tagline}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 历史对话 */}
          {convHistory.length > 0 && (
            <div>
              <div style={sectionHdr}>历史对话</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {convHistory.map((conv: ConvSummary) => (
                  <div
                    key={conv.id}
                    onClick={() => { window.location.href = `/chat?id=${conv.id}&charId=${conv.charId}`; }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: 12, background: '#f8f8fb', cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.title || conv.charName || '对话'}
                    </div>
                    {conv.updatedAt && (
                      <div style={{ fontSize: 11, color: '#aaa', flexShrink: 0, marginLeft: 8 }}>
                        {new Date(conv.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes mobCpSlideIn  { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes mobCpSlideOut { from { transform: translateX(0); }    to { transform: translateX(100%); } }
      `}</style>
    </>
  );
}

const sectionHdr: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#aaa',
  textTransform: 'uppercase', letterSpacing: '.06em',
  marginBottom: 8,
};
