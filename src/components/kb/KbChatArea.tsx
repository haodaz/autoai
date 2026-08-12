'use client';
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { message } from 'antd';
import { MarkdownMsg } from '@/components/chat/MarkdownMsg';


const PRIMARY = '#5b40e8';
const KB_BLUE = '#1a73e8';

interface KbMessage { role: 'user' | 'ai'; content: string; timestamp: number; }

const QUICK_ACTIONS = [
  { icon: '🔍', label: '查询' }, { icon: '📊', label: '分析' },
  { icon: '🗂', label: '整理' }, { icon: '✍️', label: '创作' },
  { icon: '🌐', label: '翻译' }, { icon: '📌', label: '写入' },
];
const MODELS = ['DeepSeek V3', 'Claude 3.5', 'Gemini 2.0'];

export interface KbChatAreaRef { sendQuery: (text: string) => void; }

const KbChatAreaInner = forwardRef<KbChatAreaRef, { libId: string; libName: string; activeFile?: { name: string; id?: string | number }; onNoteAdded?: () => void }>(function KbChatArea({ libId, libName, activeFile, onNoteAdded }, ref) {
  const [messages, setMessages] = useState<KbMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [greetLoading, setGreetLoading] = useState(true);
  const [noteMode, setNoteMode] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [modelIdx, setModelIdx] = useState(0);
  const [hoveredMsgIdx, setHoveredMsgIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const greetSent = useRef(false);

  // 自动滚底
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending, greetLoading]);

  // 页面打开时自动拉取初始问候（显示 loading → 然后 AI 介绍知识库内容）
  useEffect(() => {
    if (greetSent.current) return;
    greetSent.current = true;
    const initGreet = async () => {
      setGreetLoading(true);
      try {
        const res = await fetch(`/api/kb/libraries/${libId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: '__INIT_GREETING__', 
            model: MODELS[0],
            fileId: activeFile?.id,
            fileName: activeFile?.name 
          }),
        });
        const data = await res.json();
        const reply = data.reply || '';
        if (reply && !reply.startsWith('[错误')) {
          setMessages([{ role: 'ai', content: reply, timestamp: Date.now() }]);
        }
      } catch { /* silent */ }
      finally { setGreetLoading(false); }
    };
    initGreet();
  }, [libId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const q = input.trim(); setInput(''); setSending(true);
    setMessages(p => [...p, { role: 'user', content: q, timestamp: Date.now() }]);
    try {
      const res = await fetch(`/api/kb/libraries/${libId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: q, 
          model: MODELS[modelIdx],
          history: messages.slice(-10), // Pass the last 10 messages for context
          fileId: activeFile?.id,
          fileName: activeFile?.name
        }),
      });
      const data = await res.json();
      setMessages(p => [...p, { role: 'ai', content: data.reply || data.error || '暂无回复', timestamp: Date.now() }]);
    } catch { message.error('发送失败'); }
    finally { setSending(false); }
  };

  const handleNote = async () => {
    if (!noteText.trim()) return;
    try {
      await fetch(`/api/kb/libraries/${libId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText.trim() }),
      });
      message.success('已写入知识库'); setNoteText(''); setNoteMode(false);
      onNoteAdded?.();
    } catch { message.error('写入失败'); }
  };

  // 暴露给父组件的方法：触发发送指定文本
  useImperativeHandle(ref, () => ({
    sendQuery(text: string) {
      if (!text.trim() || sending) return;
      const q = text.trim();
      setSending(true);
      setMessages(p => [...p, { role: 'user', content: q, timestamp: Date.now() }]);
      fetch(`/api/kb/libraries/${libId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: q, 
          model: MODELS[modelIdx],
          history: messages.slice(-10),
          fileId: activeFile?.id,
          fileName: activeFile?.name
        }),
      })
        .then(r => r.json())
        .then(data => setMessages(p => [...p, { role: 'ai', content: data.reply || data.error || '暂无回复', timestamp: Date.now() }]))
        .catch(() => message.error('发送失败'))
        .finally(() => setSending(false));
    }
  }));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(175deg, #eaf4fd 0%, #e0e4f2 100%)', overflow: 'hidden', minWidth: 0 }}>

      {/* Header 44px */}
      <div style={{ height: 44, padding: '0 24px', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.5)' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>💬 知识助理</span>
        <button onClick={() => { setMessages([]); greetSent.current = false; }}
          style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#9ca3af', padding: '4px 8px', borderRadius: 6 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#6b7280'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#9ca3af'}>
          清除对话
        </button>
      </div>

      {/* 消息列表 */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 初始问候 loading 行 */}
        {greetLoading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src="/assets/dog_idle.png" alt="助理"
                onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '10px 16px', borderRadius: 14, borderTopLeftRadius: 4, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontSize: 13, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#427759', animation: 'pulse 1.2s ease-in-out infinite' }} />
              助理正在为你查阅知识库…
            </div>
          </div>
        )}

        {/* 空状态（加载完 + 无消息）*/}
        {!greetLoading && messages.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, opacity: 0.6 }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>向知识助理提问，它只基于你上传的文档回答</div>
          </div>
        )}

        {/* 对话消息 */}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, animation: 'fadeUp 0.22s ease' }}
            onMouseEnter={() => setHoveredMsgIdx(i)}
            onMouseLeave={() => setHoveredMsgIdx(null)}
          >
            {msg.role === 'ai' && (
              <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src="/assets/dog_idle.png" alt="助理"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '74%' }}>
              <div style={{
                padding: '13px 18px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.65,
                borderTopRightRadius: msg.role === 'user' ? 4 : 14,
                borderTopLeftRadius: msg.role === 'ai' ? 4 : 14,
                background: msg.role === 'user' ? `linear-gradient(135deg, #7c5cf6, ${PRIMARY})` : '#fff',
                color: msg.role === 'user' ? '#fff' : '#374151',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}>
                <MarkdownMsg content={msg.content} isUser={msg.role === 'user'} userColor={msg.role === 'user' ? '#fff' : undefined} />
              </div>
              {/* AI 消息操作行 */}
              {msg.role === 'ai' && (
                <div style={{
                  display: 'flex', gap: 6,
                  opacity: hoveredMsgIdx === i ? 1 : 0,
                  transition: 'opacity 0.15s',
                  pointerEvents: hoveredMsgIdx === i ? 'auto' : 'none',
                }}>
                  <button
                    onClick={async () => {
                      try {
                        await fetch(`/api/kb/libraries/${libId}/files`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ note: msg.content }),
                        });
                        message.success('已存入知识库');
                        onNoteAdded?.();
                      } catch { message.error('存入失败'); }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(96,85,245,0.25)',
                      background: 'rgba(96,85,245,0.06)', color: '#427759',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.14)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(96,85,245,0.06)'; }}
                  >
                    ✦ 存入知识库
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content).then(() => message.success('已复制'));
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', borderRadius: 7, border: '1px solid #e5e7eb',
                      background: '#fff', color: '#6b7280',
                      fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f3f4f6'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                  >
                    □ 复制
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* 发送中 loading 点 */}
        {sending && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
              <img src="/assets/dog_idle.png" alt="助理"
                onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ padding: '16px 20px', borderRadius: 14, borderTopLeftRadius: 4, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#9ca3af', display: 'inline-block', animation: 'bounce 1.2s infinite', animationDelay: `${i * 0.2}s` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div style={{ padding: '12px 32px 24px', flexShrink: 0 }}>

        {/* 快捷能力 Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {QUICK_ACTIONS.map(({ icon, label }) => (
            <button key={label}
              onClick={() => { if (label === '写入') { setNoteMode(m => !m); return; } setInput(v => `${icon} ${label}：${v}`); inputRef.current?.focus(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, border: '1px solid #e5e7eb', background: '#fff', color: KB_BLUE, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f0eeff'; (e.currentTarget as HTMLElement).style.borderColor = '#c4b5fd'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* 写入知识库模式 */}
        {noteMode && (
          <div style={{ background: '#fff', border: `1.5px solid rgba(91,64,232,.2)`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>📌 写入知识库</span>
              <button onClick={() => setNoteMode(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 14 }}>✕</button>
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="输入要保存的知识内容…" rows={3}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={handleNote} style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: PRIMARY, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>存入</button>
            </div>
          </div>
        )}

        {/* 主输入框 */}
        <div style={{ background: '#fff', border: `1.5px solid ${input ? 'rgba(91,64,232,.45)' : 'rgba(91,64,232,.25)'}`, borderRadius: 10, padding: '12px 14px 10px', transition: 'border-color 0.15s' }}>
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            disabled={sending}
            placeholder="查询 分析 整理 创作 翻译 写入…"
            rows={1}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 14, lineHeight: 1.6, background: 'transparent', fontFamily: 'inherit', minHeight: 24, maxHeight: 150, overflow: 'hidden', boxSizing: 'border-box' }}
            onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 150) + 'px'; }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <div style={{ flex: 1 }} />
            <button onClick={() => setModelIdx(i => (i + 1) % MODELS.length)}
              style={{ display: 'none' }}>
            </button>
            <button onClick={handleSend} disabled={!input.trim() || sending}
              style={{ padding: '7px 18px', borderRadius: 9, border: 'none', background: !input.trim() || sending ? '#c4b5fd' : PRIMARY, color: '#fff', fontSize: 13, fontWeight: 600, cursor: !input.trim() || sending ? 'default' : 'pointer' }}>
              发送
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
          知识助理只基于你上传的文档回答，超范围它会如实告知。
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);} 40%{transform:translateY(-4px);} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
      `}</style>
    </div>
  );
});

export default KbChatAreaInner;
