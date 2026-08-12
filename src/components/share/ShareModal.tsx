'use client';

import { useRef, useState, useCallback } from 'react';
import { message as antMsg } from 'antd';
import { CopyOutlined, DownloadOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import PosterCard from './PosterCard';
import { Character } from '@/lib/characters/types';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  character: Character;
}

function resolveShareUrl(char: Character): string {
  const base = (typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_ZHIJI_HOST || ''));
  return `${base}/chat?charId=${char.id}`;
}

export default function ShareModal({ open, onClose, character }: ShareModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const shareUrl = resolveShareUrl(character);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl).then(() => antMsg.success('链接已复制 ✓'));
  }, [shareUrl]);

  const waitForImage = (img: HTMLImageElement) => new Promise<void>((resolve) => {
    if (img.complete && img.naturalWidth > 0) {
      resolve();
      return;
    }
    img.onload = () => resolve();
    img.onerror = () => resolve();
  });

  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  const waitForNextPaint = () => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });

  const waitForPosterReady = async (el: HTMLElement, timeoutMs = 1500) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const images = Array.from(el.querySelectorAll('img'));
      const isReady = images.length >= 3 && images.every((img) => img.complete && img.naturalWidth > 0);
      if (isReady) {
        return;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    }
  };

  // 在离屏 clone 上把远程图片转成 data URL，避免 iOS Safari 首次 toPng 丢图
  async function prepareCloneForPng(el: HTMLElement): Promise<{ clone: HTMLDivElement; cleanup: () => void }> {
    const clone = el.cloneNode(true) as HTMLDivElement;
    const wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:0',
      'z-index:-999',
      'width:270px',
      'height:auto',
      'overflow:visible',
      'background:transparent',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(wrapper);
    wrapper.appendChild(clone);

    const sourceImgs = Array.from(el.querySelectorAll('img'));
    const cloneImgs = Array.from(clone.querySelectorAll('img'));

    await Promise.all(cloneImgs.map(async (cloneImg, index) => {
      const sourceImg = sourceImgs[index];
      const src = sourceImg?.currentSrc || sourceImg?.src || cloneImg.currentSrc || cloneImg.src;

      if (!src || src.startsWith('data:')) {
        await waitForImage(cloneImg);
        return;
      }

      try {
        const response = await fetch(src, { cache: 'force-cache' });
        const blob = await response.blob();
        const dataUrl = await blobToDataUrl(blob);
        cloneImg.src = dataUrl;
        await waitForImage(cloneImg);
      } catch (err) {
        cloneImg.src = src;
        await waitForImage(cloneImg);
      }
    }));

    return {
      clone,
      cleanup: () => {
        if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      },
    };
  }

  // 一键下载海报
  // 先等二维码生成，再把 poster 内图片转为 data URL 交给 html-to-image 渲染
  const handleDownload = useCallback(async () => {
    if (!posterRef.current || downloading) return;
    const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setDownloading(true);

    await waitForPosterReady(posterRef.current);

    const prepared = await prepareCloneForPng(posterRef.current);

    try {
      const { toPng } = await import('html-to-image');
      const renderOptions = {
        pixelRatio: 2,
        cacheBust: false,
        width: 270,
      };

      // iOS Safari 上首次 toPng 会稳定丢图，先做一次预热再取第二次结果
      if (isIOS) {
        await waitForNextPaint();
        await toPng(prepared.clone, renderOptions);
        await waitForNextPaint();
      }

      const dataUrl = await toPng(prepared.clone, renderOptions);

      // Data URL → Blob，提升 iOS Safari 兼容性
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      if (isWeChat) {
        // 微信 WebView：navigator.share 和 a[download] 都被拦截，
        // 用全屏浮层 + data URL（非 blob:）让用户长按保存
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.88);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
        const img = document.createElement('img');
        img.src = dataUrl; // 直接用 data URL，微信能识别
        img.style.cssText = 'max-width:88%;max-height:80%;object-fit:contain;border-radius:12px;';
        const hint = document.createElement('div');
        hint.textContent = '长按图片 → 保存到相册';
        hint.style.cssText = 'color:#fff;font-size:15px;font-weight:600;';
        const sub = document.createElement('div');
        sub.textContent = '点击任意处关闭';
        sub.style.cssText = 'color:rgba(255,255,255,0.5);font-size:12px;';
        overlay.appendChild(img);
        overlay.appendChild(hint);
        overlay.appendChild(sub);
        overlay.addEventListener('click', () => document.body.removeChild(overlay));
        document.body.appendChild(overlay);
      } else if (isIOS) {
        // iOS：优先用 Web Share API（原生分享面板含"保存图片"），
        // 兜底用全屏浮层让用户长按保存
        const file = new File([blob], `知己-${character.name}-分享海报.png`, { type: 'image/png' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `知己-${character.name}`,
            });
          } catch {
            // 用户取消分享，忽略
          }
        } else {
          // 不支持 Web Share，用全屏图片浮层代替 window.open（iOS Safari 会拦截 blob: URL 的新窗口）
          const overlay = document.createElement('div');
          overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;';
          const img = document.createElement('img');
          img.src = blobUrl;
          img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
          overlay.appendChild(img);
          overlay.addEventListener('click', () => {
            document.body.removeChild(overlay);
            antMsg.success('已关闭预览');
          });
          document.body.appendChild(overlay);
          antMsg.success('请长按图片保存 ✓');
        }
      } else {
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `知己-${character.name}-分享海报.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        antMsg.success('海报已保存 ✓');
      }

      // 延迟释放 Blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch (err) {
      console.error('[ShareModal] download error:', err);
      antMsg.error('下载失败，请截屏保存');
    } finally {
      prepared.cleanup();
      setDownloading(false);
    }
  }, [character.name, downloading]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'rgba(20,15,40,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px',
        animation: 'shareModalIn 0.22s cubic-bezier(.4,0,.2,1)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          // v1 关键：modal 卡片本身限制最大高度，内部可滚动
          maxHeight: '92dvh',
          background: '#fff',
          borderRadius: 24,
          // 不用 overflow:hidden（否则 flex 子元素的 overflow-y:auto 会被覆盖）
          // 改用 borderRadius 自然圆角，内容超出由 flex 子元素自行处理
          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', // 保留圆角 clip，内部用 flex:1+min-height:0 允许滚动
        }}
      >
        {/* 顶部标题栏 — 固定高度，不参与滚动 */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(223,227,245,0.6)',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#14151f' }}>
              分享「{character.name}」
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              让更多人认识这位知己
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, border: 'none', background: '#f5f5f8',
            borderRadius: 50, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
            flexShrink: 0,
          }}>
            <CloseOutlined style={{ fontSize: 13 }} />
          </button>
        </div>

        {/* 海报预览 — v1 关键三件套：flex:1 + min-height:0 + overflow-y:auto */}
        <div style={{
          flex: 1,
          minHeight: 0,          // flex 子元素收缩必须有这个
          overflowY: 'auto',     // 超出时可滚动，看到海报底部
          padding: '16px 20px',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          background: 'linear-gradient(180deg, #f8f7ff 0%, #f3f2ff 100%)',
        }}>
          <PosterCard
            char={character}
            shareUrl={shareUrl}
            posterRef={posterRef}
          />
        </div>

        {/* 链接栏 + 操作按钮 — 固定在底部 */}
        <div style={{ flexShrink: 0 }}>
          {/* 链接栏 */}
          <div style={{ padding: '12px 20px 0' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 0,
              background: '#f7f8fc', borderRadius: 10,
              border: '1px solid rgba(223,227,245,0.9)',
              overflow: 'hidden',
            }}>
              <div style={{
                flex: 1, padding: '9px 12px',
                fontSize: 12, color: '#6b7280',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {shareUrl}
              </div>
              <button onClick={handleCopyLink} style={{
                flexShrink: 0, padding: '9px 14px',
                border: 'none', borderLeft: '1px solid rgba(223,227,245,0.9)',
                background: 'none', cursor: 'pointer', color: '#5b40e8',
                fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                WebkitTapHighlightColor: 'transparent',
              }}
                onTouchStart={e => (e.currentTarget.style.background = '#f0eeff')}
                onTouchEnd={e => (e.currentTarget.style.background = 'none')}
              >
                <CopyOutlined style={{ fontSize: 12 }} /> 复制
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
            padding: '12px 20px calc(16px + env(safe-area-inset-bottom, 0px))',
          }}>
            {/* 复制链接 */}
            <button onClick={handleCopyLink} style={{
              padding: '12px 0', border: '1.5px solid rgba(91,64,232,0.25)',
              borderRadius: 12, background: '#fff', cursor: 'pointer',
              fontSize: 14, fontWeight: 600, color: '#5b40e8',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.15s', fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f5f3ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
              onTouchStart={e => (e.currentTarget.style.background = '#f5f3ff')}
              onTouchEnd={e => (e.currentTarget.style.background = '#fff')}
            >
              <CopyOutlined style={{ fontSize: 14 }} />
              复制链接
            </button>

            {/* 下载海报 */}
            <button onClick={handleDownload} disabled={downloading} style={{
              padding: '12px 0', border: 'none',
              borderRadius: 12,
              background: downloading
                ? 'rgba(91,64,232,0.6)'
                : 'linear-gradient(135deg, #5b40e8, #7c5ce8)',
              cursor: downloading ? 'default' : 'pointer',
              fontSize: 14, fontWeight: 600, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 4px 16px rgba(91,64,232,0.35)',
              transition: 'all 0.15s', fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
            }}>
              {downloading
                ? <><LoadingOutlined style={{ fontSize: 14 }} /> 生成中…</>
                : <><DownloadOutlined style={{ fontSize: 14 }} /> 下载图片</>
              }
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shareModalIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
