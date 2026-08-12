'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SendOutlined, AudioOutlined } from '@ant-design/icons';
import { TalentAuditReportData } from './types';
import { MarkdownMsg } from '@/components/chat/MarkdownMsg';
import s from '@/components/chat/ChatArea.module.css';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ResumeAIChat({ reportData }: { reportData: TalentAuditReportData }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: `你好！我是求真工作室专属 AI 助手。我已经阅读了 **${reportData.resume?.name || '该候选人'}** 的履历与验真报告，你可以向我提问任何关于这份履历的细节。` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Create a conversation history array
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch('/api/talent-audit/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: history,
          contextData: {
            resume: reportData.resume,
            overallEvaluation: reportData.overallEvaluation,
            stats: reportData.stats
          }
        })
      });

      if (!res.ok) throw new Error('API Error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No reader');

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        
        // Parse SSE
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content += data.text;
                  return newMsgs;
                });
              }
            } catch {
              // ignore
            }
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，服务暂时不可用，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.main} style={{ height: '100%', borderRadius: 16, overflow: 'hidden' }}>
      <div className={s.messages}>
        <div style={{ paddingTop: 20 }} />
        {messages.map((msg, idx) => (
          msg.role === 'user' ? (
            <div key={idx} className={s.userMsgWrap}>
              <div className={s.userBubble}>
                <MarkdownMsg content={msg.content} isUser={true} />
              </div>
            </div>
          ) : (
            <div key={idx} className={s.assistantMsgWrap}>
              <div className={s.assistantHeader}>
                <div className={s.assistantAvatar}>
                  <img src="/assets/characters/yida_main/avatar_cropped.jpeg" alt="AI" className={s.assistantAvatarImg} />
                </div>
                <span className={s.assistantName}>一答</span>
              </div>
              <div className={s.assistantContent}>
                <MarkdownMsg content={msg.content} isUser={false} />
              </div>
            </div>
          )
        ))}
        {loading && messages[messages.length - 1].role === 'user' && (
          <div className={s.assistantMsgWrap}>
            <div className={s.assistantHeader}>
              <div className={s.assistantAvatar}>
                <img src="/assets/characters/yida_main/avatar_cropped.jpeg" alt="AI" className={s.assistantAvatarImg} />
              </div>
              <span className={s.assistantName}>一答</span>
            </div>
            <div className={s.dotWrap}>
              <span className={s.dot} style={{ animationDelay: '0s' }}></span>
              <span className={s.dot} style={{ animationDelay: '0.2s' }}></span>
              <span className={s.dot} style={{ animationDelay: '0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div 
        className={`${s.composerInner} ${input ? s.composerInnerActive : ''} animate-fade-in`}
        style={{
          borderRadius: '9999px',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 4px 20px rgba(96,85,245,0.12), 0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid rgba(255,255,255,0.6)',
          padding: '6px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          width: 'calc(100% - 32px)',
          margin: '0 auto 16px',
        }}
      >
        <div className="flex items-center w-full">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="问我关于这份履历的任何问题..."
            rows={1}
            className="flex-1 bg-transparent border-none outline-none px-4 py-1.5 text-[16px] resize-none"
            style={{ maxHeight: 80, color: '#334155' }}
            onInput={e => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 80) + 'px';
            }}
            disabled={loading}
          />
          {input.trim() ? (
            <button onClick={() => handleSend()} disabled={loading} className="w-[36px] h-[36px] rounded-full bg-[#427759] text-white flex items-center justify-center flex-shrink-0 mr-0.5 shadow-md active:scale-95 transition-transform">
              <SendOutlined style={{ fontSize: 14 }} />
            </button>
          ) : (
            <button className="w-[36px] h-[36px] rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#427759] text-white flex items-center justify-center flex-shrink-0 mr-0.5 shadow-md active:scale-95 transition-transform opacity-70">
              <AudioOutlined style={{ fontSize: 16 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
