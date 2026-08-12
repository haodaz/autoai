'use client';
import React, { useState, useEffect } from 'react';
import { CloseOutlined, FileTextOutlined, FilePdfOutlined, FileImageOutlined, LeftOutlined } from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';

interface PreviewFile { name: string; type?: string; }

interface Props {
  open: boolean;
  file: PreviewFile | null;
  libId: string;
  onClose: () => void;
}

const PDF_IMAGE_EXTS = ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

function getExt(name: string) {
  return (name.split('.').pop() || '').toLowerCase();
}

function FileIcon({ ext }: { ext: string }) {
  if (ext === 'pdf') return <FilePdfOutlined style={{ color: '#ef4444', fontSize: 16 }} />;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return <FileImageOutlined style={{ color: '#3b82f6', fontSize: 16 }} />;
  return <FileTextOutlined style={{ color: '#427759', fontSize: 16 }} />;
}

// 骨架屏：PDF 页面占位
function PdfSkeleton() {
  return (
    <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* 模拟 PDF 页眉 */}
      <div style={{ height: 16, borderRadius: 6, background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ height: 12, borderRadius: 6, width: '60%', background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite 0.1s' }} />
      <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
      {/* 模拟正文段落 */}
      {[100, 88, 95, 72, 90, 83, 78, 96].map((w, i) => (
        <div key={i} style={{ height: 11, borderRadius: 4, width: `${w}%`, background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s infinite ${i * 0.08}s` }} />
      ))}
      <div style={{ height: 11, borderRadius: 4, width: '45%', background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite 0.7s' }} />
      <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
      {[82, 91, 76, 88, 95].map((w, i) => (
        <div key={i} style={{ height: 11, borderRadius: 4, width: `${w}%`, background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s infinite ${i * 0.08}s` }} />
      ))}
      <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>正在加载文档…</div>
    </div>
  );
}

// 骨架屏：文本占位
function TextSkeleton() {
  return (
    <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[100, 88, 95, 72, 100, 90, 83, 78, 96, 65, 100, 85, 92, 70].map((w, i) => (
        <div key={i} style={{ height: 12, borderRadius: 4, width: `${w}%`, background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s infinite ${i * 0.06}s` }} />
      ))}
      <div style={{ marginTop: 6, fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>正在提取文本内容…</div>
    </div>
  );
}

export default function PreviewPanel({ open, file, libId, onClose }: Props) {
  const isMobile = useIsMobile();
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ext = file ? getExt(file.name) : '';
  const isNative = PDF_IMAGE_EXTS.includes(ext);

  const rawUrl = file
    ? `/api/kb/libraries/${libId}/files/${encodeURIComponent(file.name)}/raw`
    : '';

  // 文件切换时重置 iframe 加载状态
  useEffect(() => {
    setIframeLoaded(false);
    setTextContent(null);
    setError(null);
  }, [file?.name]);

  // 文本文件：fetch preview
  useEffect(() => {
    if (!open || !file || isNative) return;
    setTextLoading(true);
    setTextContent(null);
    setError(null);
    fetch(`/api/kb/libraries/${libId}/files/${encodeURIComponent(file.name)}/preview`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setTextContent(d.content || '');
      })
      .catch(() => setError('加载失败，请稍后重试'))
      .finally(() => setTextLoading(false));
  }, [open, file?.name, libId, isNative]);

  return (
    // ── Inline flex child OR mobile fullscreen ──
    <div style={{
      width: isMobile ? '100%' : (open ? 'min(700px, 52vw)' : 0),
      display: (isMobile && !open) ? 'none' : 'flex',
      flexShrink: 0,
      height: '100%',
      background: '#fff',
      borderRadius: isMobile ? 0 : 16,
      border: isMobile ? 'none' : '1px solid rgba(224,228,242,0.6)',
      boxShadow: isMobile ? 'none' : '0 2px 20px rgba(96,85,245,0.09)',
      overflow: 'hidden',
      flexDirection: 'column',
      transition: isMobile ? 'none' : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      opacity: open ? 1 : 0,
    }}>
      {/* 头部区 */}
      <div style={{
        height: 54, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#fafafc', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          {isMobile && (
            <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#427759', fontSize: 16, padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <LeftOutlined style={{ marginRight: 4 }} /> 返回
            </button>
          )}
          {!isMobile && <FileIcon ext={ext} />}
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {file?.name}
          </span>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8, border: 'none', background: '#f3f4f6',
                color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e5e7eb'; (e.currentTarget as HTMLElement).style.color = '#374151'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
            >
              <CloseOutlined style={{ fontSize: 13 }} />
            </button>
          </div>
        )}
      </div>

      {/* ── 内容区 ── */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#fafafa' }}>

        {/* PDF / 图片：骨架屏 + iframe 叠放（iframe 加载完后显示）*/}
        {open && isNative && (
          <>
            {/* 骨架屏：iframe 加载前显示 */}
            {!iframeLoaded && (
              <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', background: '#fff', zIndex: 1 }}>
                <PdfSkeleton />
              </div>
            )}
            <iframe
              key={rawUrl}
              src={rawUrl}
              title={file?.name}
              onLoad={() => setIframeLoaded(true)}
              style={{
                width: '100%', height: '100%', border: 'none', display: 'block',
                opacity: iframeLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
              }}
            />
          </>
        )}

        {/* 文本：骨架屏 → 内容 */}
        {!isNative && (
          <div style={{ height: '100%', overflowY: 'auto' }}>
            {textLoading && <TextSkeleton />}
            {error && !textLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
                <div style={{ fontSize: 32 }}>⚠️</div>
                <div style={{ fontSize: 13, color: '#ef4444' }}>{error}</div>
              </div>
            )}
            {textContent !== null && !textLoading && !error && (
              <div style={{
                padding: '24px 22px',
                fontFamily: '"SF Mono", "Fira Code", "Courier New", monospace',
                fontSize: 12.5, lineHeight: 1.75, color: '#1a1a2e',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}>
                {textContent}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
