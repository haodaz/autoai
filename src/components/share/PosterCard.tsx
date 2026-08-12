'use client';

import React, { useEffect, useState } from 'react';
import { Character } from '@/lib/ai/types';

interface PosterCardProps {
  char: Character;
  shareUrl: string;
  posterRef?: React.RefObject<HTMLDivElement | null>;
}

function resolveImg(char: PosterCardProps['char']): string {
  const src = char.assets?.idle || char.avatar || '';
  if (!src) return '/assets/default-ai-robot.png';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return `/characters/${char.id}/${src}`;
}

export default function PosterCard({ char, shareUrl, posterRef }: PosterCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const chips: string[] = ((char.quick_prompts as string[] | undefined) || []).slice(0, 4);
  const topicTags: string[] = (char.topic_tags || []).slice(0, 4);
  const sceneImg = resolveImg(char); // 场景大图：优先 idle（全身/场景插图）

  // 头像小图：优先 assets.avatar（方形头像），fallback 到 avatar 字段，最后才用 idle
  const avatarImg = (() => {
    const src = char.assets?.avatar || char.avatar || char.assets?.idle || '';
    if (!src) return '/assets/default-ai-robot.png';
    if (src.startsWith('http') || src.startsWith('/')) return src;
    return `/characters/${char.id}/${src}`;
  })();

  useEffect(() => {
    let cancelled = false;
    import('qrcode').then((QRCode: any) => {
      (QRCode.default || QRCode).toDataURL(shareUrl, {
        width: 92, margin: 1,
        color: { dark: '#3b30c4', light: '#ffffff' },
        errorCorrectionLevel: 'M',
      }).then((url: string) => {
        if (!cancelled) setQrDataUrl(url);
      });
    });
    return () => { cancelled = true; };
  }, [shareUrl]);

  return (
    <div ref={posterRef} style={{
      width: 270,
      minHeight: 480,
      borderRadius: 16,
      overflow: 'hidden',
      background: 'linear-gradient(160deg, #f0f4ff 0%, #faf8ff 40%, #f5f0ff 100%)',
      fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      boxShadow: '0 8px 40px rgba(91,64,232,0.18)',
      position: 'relative',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ① 顶栏 38px */}
      <div style={{
        height: 38, flexShrink: 0,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            <img alt="yida" style={{ width: '180%', height: '180%', maxWidth: 'none', objectFit: 'cover', objectPosition: 'center' }} src="/assets/cute_ai_orb_home.png" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#5b40e8' }}>一答智能体</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#5b40e8', whiteSpace: 'nowrap' }}>
          与{char.name}面对面
        </span>
      </div>

      {/* ② 场景图 192px */}
      <div style={{ position: 'relative', height: 192, flexShrink: 0, overflow: 'hidden' }}>
        <img src={sceneImg} alt={char.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }}
          onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
        />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 56,
          background: 'linear-gradient(to bottom, rgba(240,244,255,0) 0%, rgba(240,244,255,0.92) 100%)',
        }} />
      </div>

      {/* ③ 信息区 — flex:1，footer margin-top:auto 贴底 */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        padding: '0 14px',
      }}>

        {/*
         * 头像 + 问候语
         * alignItems: flex-end — 文字对齐头像底部，即图片边界以下
         * 头像 top 向上 -28px 延伸进场景图，但文字显示在图片下方
         */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, marginTop: -28, position: 'relative', zIndex: 2 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
            border: '2px solid #fff', flexShrink: 0,
            boxShadow: '0 2px 8px rgba(91,64,232,0.18)', background: '#f0eeff',
          }}>
            <img src={avatarImg} alt={char.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
            />
          </div>
          {/* 单行：你好，我是 [高亮名字]，对齐头像底部 */}
          <div style={{ lineHeight: 1.4, minWidth: 0, flex: 1, paddingBottom: 4 }}>
            <div style={{
              fontSize: 13, color: '#1a1730', fontWeight: 500,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {'你好，我是\u00a0'}<span style={{ color: '#5b40e8', fontWeight: 800 }}>{char.name}</span>
            </div>
          </div>
        </div>

        {/* 话题标签 pill — 单行不换行，超出截断，不显示半个标签 */}
        {topicTags.length > 0 && (
          <div style={{
            display: 'flex', flexWrap: 'nowrap', gap: 5, marginTop: 10,
            overflow: 'hidden',
            // 右侧留 2px 余量，确保截断发生在标签间隙而非标签中间
            paddingRight: 2,
          }}>
            {topicTags.map((tag, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 600, padding: '3px 8px',
                borderRadius: 20, background: 'rgba(91,64,232,0.08)',
                border: '1px solid rgba(91,64,232,0.18)', color: '#5b40e8',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* chips 引导语 + chips 列表 */}
        {chips.length > 0 && (
          <>
            <div style={{ fontSize: 9, color: '#9490b0', marginTop: 9, marginBottom: 5 }}>
              大家常常和我聊：
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {chips.map((chip, i) => (
                <div key={i} style={{
                  fontSize: 11.5, color: '#3a3060', lineHeight: '16px',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  <span style={{ color: '#7c6fcd', marginRight: 3, fontWeight: 700 }}>#</span>
                  {chip}
                </div>
              ))}
            </div>
          </>
        )}

        {/* 分隔线 */}
        <div style={{
          height: 1, background: 'rgba(91,64,232,0.08)',
          marginTop: 12,
        }} />

        {/* 页脚 — margin-top:auto 贴底 */}
        <div style={{
          marginTop: 'auto',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 0 14px',
        }}>
          {/* QR 码 46px */}
          <div style={{
            width: 46, height: 46, flexShrink: 0,
            background: '#fff', borderRadius: 7, padding: 2,
            boxShadow: '0 1px 4px rgba(91,64,232,0.12)',
          }}>
            {qrDataUrl
              ? <img src={qrDataUrl} alt="QR" style={{ width: '100%', height: '100%' }} />
              : <div style={{ width: '100%', height: '100%', background: '#f0eeff', borderRadius: 5 }} />
            }
          </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0, justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>
                一答智能体平台
              </span>
              <span style={{ fontSize: 9, color: '#94a3b8', transform: 'scale(0.9)', transformOrigin: 'left center', whiteSpace: 'nowrap' }}>
                随时随地，为你一答
              </span>
            </div>
        </div>
      </div>
    </div>
  );
}
