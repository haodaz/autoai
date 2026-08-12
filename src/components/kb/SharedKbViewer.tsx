'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input, Avatar, Empty, message, Drawer } from 'antd';
import {
  FilePdfOutlined,
  SendOutlined,
  LinkOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FileTextOutlined,
  CloseOutlined,
  LeftOutlined,
  DownOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import AsstPanel from './AsstPanel';
import { MarkdownMsg } from '@/components/chat/MarkdownMsg';

export interface SharedKbFile {
  id: string | number;
  title: string;
  type?: string;
  summary?: string;
  content?: string;
  fileDate?: string;
  views?: number;
  downloads?: number;
  externalLink?: string;   // 直接下载链接（Header 按钮用）
  previewUrl?: string;     // 代理预览 URL（iframe 用，避免触发下载）
  allowDownload?: boolean;
}

interface SharedKbViewerProps {
  title: string;
  files: SharedKbFile[];
  selectedFile: SharedKbFile | null;
  onSelectFile: (file: SharedKbFile) => void;
  onClose: () => void;
  /** 后端搜索回调（可选）：debounce 后调用，更新 files 列表 */
  onSearch?: (query: string) => void;
}

function getExt(name: string) {
  return (name.split('.').pop() || '').toLowerCase();
}

function FileIcon({ ext, isActive }: { ext: string, isActive?: boolean }) {
  if (ext === 'pdf') return <FilePdfOutlined style={{ color: isActive ? '#427759' : '#ef4444', fontSize: 16 }} />;
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return <FileImageOutlined style={{ color: isActive ? '#427759' : '#3b82f6', fontSize: 16 }} />;
  return <FileTextOutlined style={{ color: isActive ? '#427759' : '#427759', fontSize: 16 }} />;
}

export default function SharedKbViewer({ title, files, selectedFile, onSelectFile, onClose, onSearch }: SharedKbViewerProps) {
  const isMobile = useIsMobile();
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [previewFile, setPreviewFile] = useState<SharedKbFile | null>(selectedFile);
  const [asstCollapsed, setAsstCollapsed] = useState(true); // 默认收起
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [showMobileAsstProfile, setShowMobileAsstProfile] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [proxyOk, setProxyOk] = useState<boolean | null>(null); // null=checking, true=ok, false=fail

  // 本地过滤 + 可选后端搜索（debounce 400ms）
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleListSearch = useCallback((val: string) => {
    setListSearch(val);
    if (!onSearch) return;
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => onSearch(val), 400);
  }, [onSearch]);

  const displayedFiles = listSearch.trim()
    ? files.filter(f => f.title.toLowerCase().includes(listSearch.toLowerCase()))
    : files;

  // 同步外部选中的文件到预览状态
  useEffect(() => {
    setPreviewFile(selectedFile);
    setIframeLoaded(false);
    setProxyOk(null);
    if (selectedFile) {
      setMessages([
        { role: 'ai', text: `您好，我是本知识库的专属向导。针对当前选中的文献《${selectedFile.title}》，您可以直接向我提问、要求总结或翻译。` }
      ]);
    }
  }, [selectedFile]);

  // 检查 proxy URL 是否可用（S3 文件是否存在）
  useEffect(() => {
    const url = previewFile?.previewUrl;
    if (!url) { setProxyOk(null); return; }
    setProxyOk(null);
    fetch(url, { method: 'HEAD' })
      .then(r => setProxyOk(r.ok))
      .catch(() => setProxyOk(false));
  }, [previewFile?.previewUrl]);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (overrideMessage?: string | React.MouseEvent | React.KeyboardEvent) => {
    const text = typeof overrideMessage === 'string' ? overrideMessage : chatInput;
    if (!text.trim() || isLoading) return;
    const userMessage = text.trim();
    if (typeof overrideMessage !== 'string') setChatInput('');

    setMessages(prev => [
      ...prev,
      { role: 'user', text: userMessage },
      { role: 'ai', text: `正在分析《${selectedFile?.title}》...` }
    ]);
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/kb/libraries/shared/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.filter(m => m.text && !m.text.startsWith('正在分析')).slice(-10), // Pass the last 10 valid messages
          fileId: selectedFile?.id,
          repoType: 'AssistRepository',
          overrideKbName: title,
          fileName: selectedFile?.title,
          fileContent: selectedFile?.content
        })
      });
      const data = await res.json();
      
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'ai', text: data.reply || '[获取回复失败]' };
        return newMsgs;
      });
    } catch (e) {
      console.error(e);
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1] = { role: 'ai', text: '[抱歉，网络或服务出现异常]' };
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isMobile) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', position: 'fixed', inset: 0, zIndex: 999 }}>
        {/* Mobile Header */}
        <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
           <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: 16, color: '#427759', display: 'flex', alignItems: 'center', padding: 0 }}>
             <LeftOutlined style={{ marginRight: 4 }} /> 返回
           </button>
           <div style={{ flex: 1, textAlign: 'center', fontSize: 16, fontWeight: 'bold', color: '#1a1a2e', padding: '0 10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
             {selectedFile?.title || title}
           </div>
           <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>
             {selectedFile?.allowDownload && selectedFile.externalLink && (
               <a href={selectedFile.externalLink} target="_blank" rel="noopener noreferrer" style={{ color: '#427759', fontSize: 18 }}>
                 <DownloadOutlined />
               </a>
             )}
           </div>
        </div>

        {/* Main Body - File Preview */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f5f7fa' }}>
           <div style={{ background: '#fff', borderRadius: 16, padding: '24px 20px', minHeight: '100%', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)' }}>
             <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#1a1a2e', lineHeight: 1.4 }}>{selectedFile?.title}</div>
             {selectedFile?.fileDate && <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}><ClockCircleOutlined /> {selectedFile.fileDate}</div>}
             
             {/* Divider */}
             <div style={{ height: 1, background: '#f0f0f0', marginBottom: 24 }} />

             <div style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.8 }}>
               {selectedFile?.content
                 ? <div dangerouslySetInnerHTML={{ __html: selectedFile.content }} />
                 : (selectedFile?.externalLink ? (
                   <iframe 
                     src={selectedFile.externalLink} 
                     style={{ width: '100%', height: '70vh', border: 'none' }}
                     onLoad={() => setIframeLoaded(true)}
                   />
                 ) : (selectedFile?.summary || '此文件暂无正文内容或正在解析中。您可以点击下方悬浮按钮向知识助理提问。'))
               }
             </div>
           </div>
        </div>

        {/* Floating AI Button */}
        <div style={{ position: 'absolute', right: 24, bottom: 40, zIndex: 100 }}>
           <div 
             onClick={() => setMobileChatOpen(true)}
             style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #786cff, #427759)', boxShadow: '0 4px 16px rgba(96,85,245,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 24, cursor: 'pointer', border: '3px solid #fff' }}
           >
             ✨
           </div>
        </div>

        {/* AI Chat Drawer */}
        <Drawer
          title={
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              onClick={() => setShowMobileAsstProfile(!showMobileAsstProfile)}
            >
              <Avatar src="/assets/cute_ai_orb_home.png" size={32} />
              <span style={{ fontSize: 16, fontWeight: 'bold', color: '#1a1a2e' }}>一答 知识助理</span>
              <DownOutlined style={{ fontSize: 12, color: '#9ca3af', transform: showMobileAsstProfile ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: 4 }} />
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
          {/* Collapsible Profile */}
          <div style={{ 
            height: showMobileAsstProfile ? '100%' : 0, 
            overflow: 'hidden', 
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'absolute', top: 0, left: 0, right: 0,
            background: '#fff', zIndex: 10, display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <AsstPanel
                libId="mock-thinktank"
                libName={title}
                libEmoji="📚"
                fileCount={files.length}
                totalSizeKb={files.length * 2560}
                collapsed={false}
                onAbilityClick={(p) => {
                  setShowMobileAsstProfile(false);
                  handleSend(p);
                }}
              />
            </div>
            <div style={{ padding: 16, background: '#fff', borderTop: '1px solid #f0f0f0' }}>
              <Button block type="primary" size="large" onClick={() => setShowMobileAsstProfile(false)} style={{ borderRadius: 12, background: '#427759' }}>
                返回对话
              </Button>
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && <Avatar size={32} src="/assets/cute_ai_orb_home.png" style={{ marginRight: 12, flexShrink: 0, border: '1px solid rgba(0,0,0,0.05)' }} />}
                <div style={{
                  maxWidth: '85%', padding: '12px 18px', fontSize: 15, lineHeight: 1.6,
                  background: m.role === 'user' ? 'linear-gradient(135deg, #786cff, #427759)' : '#fff',
                  color: m.role === 'user' ? '#fff' : '#1a1a2e',
                  borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 20px',
                  boxShadow: m.role === 'user' ? '0 4px 12px rgba(96,85,245,0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
                  border: m.role === 'ai' ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '16px 20px', background: 'transparent' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
              <button onClick={() => setChatInput('请提炼这篇文献的核心观点')} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', padding: '6px 16px', borderRadius: 20, fontSize: 13, color: '#4b5563', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>核心观点</button>
              <button onClick={() => setChatInput('这篇文献提到了哪些具体的数据指标？')} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.05)', padding: '6px 16px', borderRadius: 20, fontSize: 13, color: '#4b5563', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>数据指标</button>
            </div>
            <div style={{ position: 'relative', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: 24, overflow: 'hidden', background: '#fff' }}>
              <Input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="问我关于这份文件的任何问题..."
                disabled={isLoading}
                style={{ border: 'none', background: 'transparent', padding: '12px 50px 12px 20px', fontSize: 15, boxShadow: 'none' }}
              />
              <Button onClick={handleSend} disabled={isLoading} loading={isLoading} type="primary" icon={!isLoading ? <SendOutlined /> : undefined} style={{ position: 'absolute', right: 4, top: 4, background: '#a78bfa', border: 'none', borderRadius: '50%', height: 38, width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
            </div>
          </div>
        </Drawer>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(135deg, #eef0ff 0%, #e8effd 55%, #f0f4ff 100%)' }}>
      
      {/* ── 行 1：白色 Header ── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #eeeef5', flexShrink: 0, height: 52, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onClose}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 7, border: 'none', background: 'none', cursor: 'pointer', color: '#427759', fontSize: 13, fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f0efff'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}>
            ← 返回
          </button>
          <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#14151f', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            📚 {title}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>就绪</span>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #786cff, #427759)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700 }}>U</div>
        </div>
      </div>

      {/* ── 内容区 (横向 Flex，padding 10, gap 10) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '10px', gap: '10px' }}>
        
        {/* 1. 文件卡片 */}
        <div style={{
          width: 260, flexShrink: 0,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 2px 20px rgba(96,85,245,0.09)',
          border: '1px solid rgba(224,228,242,0.6)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#14151f' }}>文件列表</span>
              <span style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>
                {displayedFiles.length}{listSearch ? `/${files.length}` : ''}
              </span>
            </div>
            {/* 搜索框 */}
            <div style={{ position: 'relative' }}>
              <input
                value={listSearch}
                onChange={e => handleListSearch(e.target.value)}
                placeholder="搜索文件名…"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  border: '1.5px solid #e5e7eb', borderRadius: 8,
                  padding: '6px 30px 6px 10px',
                  fontSize: 12, outline: 'none', color: '#374151',
                  background: '#f9fafb', transition: 'border 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#a78bfa')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
              {listSearch ? (
                <button
                  onClick={() => handleListSearch('')}
                  style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14, lineHeight: 1, padding: 2 }}
                >✕</button>
              ) : (
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#c0c4cc', fontSize: 13 }}>🔍</span>
              )}
            </div>
          </div>
          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
            {displayedFiles.length === 0 && (
              <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, padding: '32px 0' }}>没有找到匹配的文件</div>
            )}
            {displayedFiles.map(f => {
              const isActive = selectedFile?.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => onSelectFile(f)}
                  style={{
                    display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 10,
                    cursor: 'pointer', transition: 'all 0.15s', marginBottom: 4,
                    background: isActive ? 'rgba(96,85,245,0.08)' : 'transparent',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.03)'; }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <div style={{ marginTop: 2 }}><FileIcon ext="pdf" isActive={isActive} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: isActive ? '#427759' : '#374151', lineHeight: 1.4, wordBreak: 'break-all', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {f.title}
                    </div>
                    {f.fileDate && (
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{f.fileDate}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 对话卡片 */}
        <div style={{
          flex: 1, minWidth: 0,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 2px 20px rgba(96,85,245,0.09)',
          border: '1px solid rgba(224,228,242,0.6)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar size={24} src="/assets/cute_ai_orb_home.png" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#14151f' }}>知识助理</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>基于当前选中的文献为您解答</div>
            </div>
          </div>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && <Avatar size={28} src="/assets/cute_ai_orb_home.png" style={{ marginRight: 10, flexShrink: 0 }} />}
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', fontSize: 14, lineHeight: 1.6,
                  background: m.role === 'user' ? 'linear-gradient(135deg, #786cff, #427759)' : '#f9fafb',
                  color: m.role === 'user' ? '#fff' : '#14151f',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  border: m.role === 'ai' ? '1px solid #eeeef5' : 'none',
                  boxShadow: m.role === 'user' ? '0 4px 12px rgba(96,85,245,0.2)' : 'none',
                }}>
                  <MarkdownMsg content={m.text} isUser={m.role === 'user'} userColor={m.role === 'user' ? '#fff' : undefined} />
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          {/* Input */}
          <div style={{ padding: '16px 20px', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button onClick={() => setChatInput('请提炼这篇文献的核心观点')} style={{ background: '#f3f4f6', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 13, color: '#4b5563', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e5e7eb'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}>核心观点</button>
              <button onClick={() => setChatInput('这篇文献提到了哪些具体的数据指标？')} style={{ background: '#f3f4f6', border: 'none', padding: '6px 14px', borderRadius: 20, fontSize: 13, color: '#4b5563', cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e5e7eb'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f3f4f6'}>数据指标</button>
            </div>
            <div style={{ position: 'relative', border: '1.5px solid #eeeef5', borderRadius: 14, overflow: 'hidden', background: '#fcfcfd', transition: 'border-color 0.2s' }}>
              <Input.TextArea
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="向知识助理提问..."
                autoSize={{ minRows: 2, maxRows: 5 }}
                disabled={isLoading}
                style={{ border: 'none', background: 'transparent', padding: '12px 50px 12px 16px', fontSize: 14, boxShadow: 'none' }}
              />
              <Button onClick={handleSend} disabled={isLoading} loading={isLoading} type="primary" icon={!isLoading ? <SendOutlined /> : undefined} style={{ position: 'absolute', right: 8, bottom: 8, background: '#427759', border: 'none', borderRadius: 10, height: 36, width: 36 }} />
            </div>
          </div>
        </div>

        {/* 3. 助理身份卡片 (AsstPanel) */}
        <AsstPanel
          libId="mock-thinktank"
          libName={title}
          libEmoji="📚"
          fileCount={files.length}
          totalSizeKb={files.length * 2560} // mock size
          collapsed={asstCollapsed}
          onToggle={() => setAsstCollapsed(v => !v)}
          onAbilityClick={(label) => handleSend(label)}
        />

        {/* 3. 预览卡片 (通过动态宽度实现动画) */}
        <div style={{
          width: previewFile ? 'min(700px, 45vw)' : 0, flexShrink: 0,
          background: '#fff', borderRadius: 16,
          boxShadow: '0 2px 20px rgba(96,85,245,0.09)',
          border: '1px solid rgba(224,228,242,0.6)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: previewFile ? 1 : 0,
        }}>
          {previewFile && (
            <>
              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <FilePdfOutlined style={{ color: '#ef4444', fontSize: 18 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#14151f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{previewFile.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                  {previewFile.allowDownload && previewFile.externalLink && (
                    <Button type="primary" size="small" icon={<DownloadOutlined />} href={previewFile.externalLink} target="_blank" rel="noopener noreferrer" style={{ background: '#427759', borderRadius: 6 }}>下载</Button>
                  )}
                  <div style={{ width: 1, height: 14, background: '#e5e7eb' }} />
                  <button onClick={() => setPreviewFile(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center' }} onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9ca3af'}>
                    <CloseOutlined />
                  </button>
                </div>
              </div>

              {/* Content: proxyOk→iframe / content(HTML) / summary / empty */}
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#fafafa' }}>
                {previewFile.previewUrl && proxyOk === true ? (
                  /* 代理 URL 可用：iframe 嵌入 PDF */
                  <>
                    <iframe
                      key={previewFile.previewUrl}
                      src={previewFile.previewUrl}
                      title={previewFile.title}
                      style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                    />
                  </>
                ) : previewFile.previewUrl && proxyOk === null ? (
                  /* 正在检测 proxy URL */
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 13, color: '#9ca3af' }}>正在准备预览…</div>
                  </div>
                ) : previewFile.content ? (
                  /* 有 HTML 全文内容：渲染正文 */
                  <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: '40px', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.5, marginBottom: 12, marginTop: 0 }}>{previewFile.title}</h2>
                      {previewFile.fileDate && <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24 }}>{previewFile.fileDate}</div>}
                      <div style={{ height: 1, background: '#f0f0f0', marginBottom: 24 }} />
                      <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: previewFile.content }} />
                    </div>
                  </div>
                ) : previewFile.summary ? (
                  /* 只有摘要：展示摘要文字 */
                  <div style={{ height: '100%', overflowY: 'auto', padding: '32px 40px' }}>
                    <div style={{ maxWidth: 800, margin: '0 auto', background: '#fff', padding: '40px', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
                      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.5, marginBottom: 24, marginTop: 0 }}>{previewFile.title}</h2>
                      <div style={{ fontSize: 15, color: '#374151', lineHeight: 1.9 }}>{previewFile.summary}</div>
                    </div>
                  </div>
                ) : (
                  /* 无内容：空状态 + 提示去点击“原文”按鈕 */
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '40px' }}>
                    <div style={{ fontSize: 48 }}>📄</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>暂无可预览的文字内容</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
                      {previewFile.externalLink ? '请点击右上角「下载」按鈕在新标签页中查看文件' : '此文献暂未提供正文内容'}
                    </div>
                    {previewFile.externalLink && (
                      <Button type="primary" href={previewFile.externalLink} target="_blank" style={{ background: '#427759', borderRadius: 20 }}>
                        下载附件 →
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>


      </div>
    </div>
  );
}
