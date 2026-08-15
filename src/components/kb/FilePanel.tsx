'use client';
import React, { useState, useEffect, useRef } from 'react';
import { message, Modal } from 'antd';

const KB_BLUE = '#1a73e8';
const PURPLE = '#427759';

interface KbFile {
  name: string; size: number; type: string; updatedAt: string;
  uid: string; id?: number;
}

function fileTypeStyle(type: string): { bg: string; color: string; label: string } {
  switch (type.toLowerCase()) {
    case 'pdf': return { bg: '#fee2e2', color: '#dc2626', label: 'PDF' };
    case 'txt': return { bg: '#f0fdf4', color: '#16a34a', label: 'TXT' };
    case 'md':  return { bg: '#f0f9ff', color: '#0284c7', label: 'MD' };
    default:    return { bg: '#faf5ff', color: '#7c3aed', label: type.toUpperCase().slice(0, 4) };
  }
}

function formatSize(bytes: number) {
  if (!bytes) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
}

const QUOTA = 200 * 1024 * 1024; // 200 MB

export default function FilePanel({
  libId,
  refreshTrigger,
  onPreview,
  onStatsChange,
}: {
  libId: string;
  refreshTrigger?: number;
  onPreview: (file: KbFile) => void;
  onStatsChange?: (count: number, sizeKb: number) => void;
}) {
  const [files, setFiles] = useState<KbFile[]>([]);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [hoveredFile, setHoveredFile] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchFiles(); }, [libId, refreshTrigger]);

  useEffect(() => {
    if (onStatsChange) {
      const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);
      onStatsChange(files.length, totalSize / 1024);
    }
  }, [files, onStatsChange]);

  const fetchFiles = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/kb/libraries/${libId}/files`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setFiles(list.map((f: KbFile) => ({ ...f, uid: f.uid || crypto.randomUUID() })));
    } catch { message.error('加载文件失败'); }
    finally { setFetching(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    const form = new FormData();
    Array.from(fileList).forEach(f => form.append('file', f));
    try {
      const res = await fetch(`/api/kb/libraries/${libId}/files`, { method: 'POST', body: form });
      const result = await res.json();
      if (result.ok) { message.success('文件已上传'); fetchFiles(); }
      else message.error(result.error || '上传失败');
    } catch { message.error('上传失败'); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  const handleDelete = (file: KbFile) => {
    Modal.confirm({
      title: '确定移除此文件吗？', content: '移除后 AI 将无法引用其中内容。',
      okText: '确定', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const res = await fetch(`/api/kb/libraries/${libId}/files/${encodeURIComponent(file.name)}`, { method: 'DELETE' });
          const result = await res.json();
          if (result.ok) { message.success('已移除'); fetchFiles(); }
        } catch { message.error('删除失败'); }
      },
    });
  };

  const handleRename = async (file: KbFile, newName: string) => {
    if (!newName.trim() || newName === file.name) {
      setEditingFileId(null);
      return;
    }
    
    // Ensure the new name has the same extension if possible
    const oldExt = file.name.split('.').pop() || '';
    const newExt = newName.split('.').pop() || '';
    let finalName = newName.trim();
    if (oldExt && newExt !== oldExt && !finalName.endsWith(`.${oldExt}`)) {
      finalName += `.${oldExt}`;
    }

    try {
      const res = await fetch(`/api/kb/libraries/${libId}/files/${encodeURIComponent(file.name)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName }),
      });
      const result = await res.json();
      if (result.ok) {
        message.success('重命名成功');
        fetchFiles();
      } else {
        message.error(result.error || '重命名失败');
      }
    } catch {
      message.error('重命名失败');
    } finally {
      setEditingFileId(null);
    }
  };

  const totalSize = files.reduce((s, f) => s + (f.size || 0), 0);
  const usagePct = Math.min(100, Math.round((totalSize / QUOTA) * 100));

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteSaving, setPasteSaving] = useState(false);

  const handlePasteSubmit = async () => {
    if (!pasteContent.trim()) { message.warning('请输入文本内容'); return; }
    const title = pasteTitle.trim() || `文档_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}`;
    const fileName = title.endsWith('.txt') || title.endsWith('.md') ? title : `${title}.txt`;
    const blob = new Blob([pasteContent], { type: 'text/plain' });
    const file = new File([blob], fileName, { type: 'text/plain' });
    
    setPasteSaving(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch(`/api/kb/libraries/${libId}/files`, { method: 'POST', body: form });
      const result = await res.json();
      if (result.ok) {
        message.success('文本已保存为文档');
        fetchFiles();
        setShowPasteModal(false);
        setPasteTitle('');
        setPasteContent('');
      } else { message.error(result.error || '保存失败'); }
    } catch { message.error('保存失败'); }
    finally { setPasteSaving(false); }
  };

  return (
    <div style={{ width: '100%', flex: 1, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>文件列表</span>
        <span style={{ fontSize: 11, background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '1px 7px', fontWeight: 500 }}>{files.length}</span>
      </div>

      {/* 上传按钮组 */}
      <div style={{ padding: '0 14px 10px', flexShrink: 0, display: 'flex', gap: 6 }}>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            flex: 1, height: 34, borderRadius: 9, border: 'none',
            background: uploading ? '#c4b5fd' : PURPLE,
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: uploading ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}>
          {uploading
            ? <><span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite' }}>⟳</span> 处理中…</>
            : <>📁 上传文件</>
          }
        </button>
        <button
          onClick={() => setShowPasteModal(true)}
          style={{
            flex: 1, height: 34, borderRadius: 9, border: `1.5px solid ${PURPLE}`,
            background: '#fff', color: PURPLE, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0fdf4'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}>
          📝 粘贴文本
        </button>
        <input ref={inputRef} type="file" multiple accept=".pdf,.txt,.md,.doc,.docx,.csv,.xlsx,.xls,.pptx,.ppt"
          style={{ display: 'none' }} onChange={handleUpload} />
      </div>

      {/* 粘贴文本弹窗 */}
      {showPasteModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowPasteModal(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 10001, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 560, maxWidth: '95vw', maxHeight: '85vh', borderRadius: 16, background: '#fff', padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#14151f', marginBottom: 16 }}>粘贴文本内容</div>
            <input
              value={pasteTitle}
              onChange={e => setPasteTitle(e.target.value)}
              placeholder="文档标题（选填，默认按日期命名）"
              maxLength={60}
              style={{ width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9, padding: '9px 13px', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
              onFocus={e => e.target.style.borderColor = PURPLE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <textarea
              value={pasteContent}
              onChange={e => setPasteContent(e.target.value)}
              placeholder="在此粘贴文本内容...&#10;&#10;支持直接粘贴会议记录、文章、笔记等任何文本内容"
              style={{
                flex: 1, minHeight: 240, width: '100%', border: '1.5px solid #e5e7eb', borderRadius: 9,
                padding: '12px 14px', fontSize: 13.5, lineHeight: 1.7, outline: 'none', boxSizing: 'border-box',
                resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = PURPLE}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>{pasteContent.length} 字</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowPasteModal(false)}
                  style={{ padding: '8px 18px', borderRadius: 9, border: '1px solid #e5e7eb', background: '#f9fafb', color: '#374151', fontSize: 13, cursor: 'pointer' }}>
                  取消
                </button>
                <button onClick={handlePasteSubmit} disabled={pasteSaving}
                  style={{ padding: '8px 22px', borderRadius: 9, border: 'none', background: PURPLE, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: pasteSaving ? 0.7 : 1 }}>
                  {pasteSaving ? '保存中…' : '保存为文档'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 文件列表（可滚动）*/}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        {fetching ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            <span style={{ display: 'inline-block', animation: 'spin 0.8s linear infinite', fontSize: 24, marginBottom: 8 }}>⟳</span>
            <div>正在加载文件...</div>
          </div>
        ) : files.length === 0 ? (
          <div style={{ padding: '40px 10px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            暂无文件，上传后 AI 即可引用
          </div>
        ) : (
          files.map(file => {
            const ext = file.name.split('.').pop() || '';
            const { bg, color, label } = fileTypeStyle(ext);
            const hov = hoveredFile === file.uid;
            return (
              <div key={file.uid}
                onMouseEnter={() => setHoveredFile(file.uid)}
                onMouseLeave={() => setHoveredFile(null)}
                style={{
                  padding: '7px 8px', borderRadius: 8, marginBottom: 2,
                  border: `1px solid ${hov ? '#e5e7eb' : 'transparent'}`,
                  background: hov ? '#fff' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                {/* 类型标签 */}
                <div style={{ width: 30, height: 34, borderRadius: 6, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>
                  {label}
                </div>
                {/* 文件名 + 大小 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingFileId === file.uid ? (
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRename(file, editName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(file, editName);
                        if (e.key === 'Escape') setEditingFileId(null);
                      }}
                      style={{ 
                        width: '100%', fontSize: 11.5, fontWeight: 600, color: '#14151f', 
                        border: '1px solid #1a73e8', borderRadius: 4, padding: '1px 4px', outline: 'none' 
                      }}
                    />
                  ) : (
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#14151f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  )}
                  <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>{formatSize(file.size)}</div>
                </div>
                {/* 操作按钮 */}
                {hov && editingFileId !== file.uid && (
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button title="重命名" onClick={(e) => {
                      e.stopPropagation();
                      setEditName(file.name.replace(/\.[^/.]+$/, '')); // 不选中扩展名
                      setEditingFileId(file.uid);
                    }}
                      style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = KB_BLUE}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9ca3af'}>
                      🖊
                    </button>
                    <button title="预览" onClick={(e) => { e.stopPropagation(); onPreview(file); }}
                      style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = KB_BLUE}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9ca3af'}>
                      👁
                    </button>
                    <button title="删除" onClick={(e) => { e.stopPropagation(); handleDelete(file); }}
                      style={{ width: 22, height: 22, borderRadius: 5, border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9ca3af'}>
                      🗑
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 底部存储量 */}
      <div style={{ borderTop: '1px solid #eeeef5', padding: '10px 14px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>已用空间</span>
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>{formatSize(totalSize)} / 200 MB</span>
        </div>
        <div style={{ height: 3, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${usagePct}%`, background: KB_BLUE, borderRadius: 2, transition: 'width 0.4s' }} />
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
