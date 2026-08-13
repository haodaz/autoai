'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, Download, FileText, Calendar, Mail, Sparkles, Bot, User, ChevronRight, Loader2 } from 'lucide-react';
import { marked } from 'marked';

interface AgentConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  color: string;
  skills_preview: string[];
  greeting?: string;
  quick_prompts?: string[];
}

interface ToolCall {
  id: string;
  name: string;
  status: 'running' | 'success' | 'error';
  logs: string[];
  uiPayload?: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Record<string, ToolCall>;
  isWorking?: boolean;
}

const COLOR_MAP: Record<string, { accent: string; light: string; gradient: string }> = {
  blue:    { accent: 'text-blue-600',    light: 'bg-blue-50',    gradient: 'from-blue-500 to-blue-600' },
  emerald: { accent: 'text-emerald-600', light: 'bg-emerald-50', gradient: 'from-emerald-500 to-emerald-600' },
  purple:  { accent: 'text-purple-600',  light: 'bg-purple-50',  gradient: 'from-purple-500 to-purple-600' },
  red:     { accent: 'text-red-600',     light: 'bg-red-50',     gradient: 'from-red-500 to-red-600' },
  amber:   { accent: 'text-amber-600',   light: 'bg-amber-50',   gradient: 'from-amber-500 to-amber-600' },
  cyan:    { accent: 'text-cyan-600',    light: 'bg-cyan-50',    gradient: 'from-cyan-500 to-cyan-600' },
  pink:    { accent: 'text-pink-600',    light: 'bg-pink-50',    gradient: 'from-pink-500 to-pink-600' },
  indigo:  { accent: 'text-indigo-600',  light: 'bg-indigo-50',  gradient: 'from-indigo-500 to-indigo-600' },
};

export default function AgentChat({ agent, onBack }: { agent: AgentConfig; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with greeting
  useEffect(() => {
    if (agent.greeting) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: agent.greeting,
      }]);
    }
  }, [agent.id]);

  const colors = COLOR_MAP[agent.color] || COLOR_MAP.blue;

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    const assistantMsgId = `assistant-${Date.now() + 1}`;
    const initialAssistant: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
    };

    setMessages(prev => [...prev, userMsg, initialAssistant]);
    setLoading(true);

    try {
      // Build message history for API (exclude greeting, only user/assistant content)
      const historyForApi = [...messagesRef.current, userMsg]
        .filter(m => m.content && m.content !== '⏳')
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch('/api/chat/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, messages: historyForApi }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentContent = '';
      let networkBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        networkBuffer += decoder.decode(value, { stream: true });
        const lines = networkBuffer.split('\n');
        networkBuffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim().startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.trim().slice(6));

            if (data.type === 'delta') {
              currentContent += data.content;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId ? { ...msg, content: currentContent } : msg
                )
              );
            } else if (data.type === 'reset') {
              currentContent = '';
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId ? { ...msg, content: '⏳' } : msg
                )
              );
            } else if (data.type === 'final') {
              if (!data.skip_overwrite) {
                currentContent = data.content;
              }
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId ? { ...msg, content: currentContent } : msg
                )
              );
            } else if (data.type === 'error') {
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: `（出错：${data.error || '请刷新后重试'}）` }
                    : msg
                )
              );
            } else if (data.type === 'tool_start') {
              setMessages(prev => prev.map(msg => {
                if (msg.id !== assistantMsgId) return msg;
                return {
                  ...msg,
                  isWorking: true,
                  toolCalls: {
                    ...msg.toolCalls,
                    [data.taskId]: { id: data.taskId, name: data.taskName, status: 'running', logs: [] },
                  },
                };
              }));
            } else if (data.type === 'tool_log') {
              setMessages(prev => prev.map(msg => {
                if (msg.id !== assistantMsgId) return msg;
                const tc = msg.toolCalls?.[data.taskId];
                if (!tc) return msg;
                return {
                  ...msg,
                  toolCalls: {
                    ...msg.toolCalls,
                    [data.taskId]: { ...tc, logs: [...tc.logs, data.message] },
                  },
                };
              }));
            } else if (data.type === 'tool_end') {
              setMessages(prev => prev.map(msg => {
                if (msg.id !== assistantMsgId) return msg;
                const tc = msg.toolCalls?.[data.taskId];
                if (!tc) return msg;
                return {
                  ...msg,
                  isWorking: false,
                  toolCalls: {
                    ...msg.toolCalls,
                    [data.taskId]: { ...tc, status: data.status, uiPayload: data.uiPayload },
                  },
                };
              }));
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId ? { ...msg, content: '（网络异常，请稍后重试）' } : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, [agent.id, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 md:px-6 py-3 border-b border-gray-100 bg-white flex items-center gap-3 shrink-0">
          <button onClick={onBack} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full object-cover bg-gray-100" />
          <div className="min-w-0">
            <h2 className="text-sm font-black text-gray-900 truncate">{agent.name}</h2>
            <p className="text-[10px] text-gray-400 font-medium truncate">{agent.title}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600">在线</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              {msg.role === 'assistant' ? (
                <img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full object-cover bg-gray-100 shrink-0 mt-1" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Bubble */}
              <div className={`max-w-[75%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-tr-sm'
                      : 'bg-gray-50 text-gray-800 rounded-tl-sm border border-gray-100'
                  }`}
                >
                  {msg.content === '⏳' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : msg.role === 'assistant' ? (
                    <div
                      className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5"
                      dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Tool Call Cards */}
                {msg.toolCalls && Object.values(msg.toolCalls).map(tc => (
                  <ToolCallCard key={tc.id} toolCall={tc} colors={colors} />
                ))}
              </div>
            </div>
          ))}

          {/* Quick prompts — only show if there's just the greeting */}
          {messages.length <= 1 && agent.quick_prompts && agent.quick_prompts.length > 0 && (
            <div className="flex flex-col items-start gap-2 pt-2">
              <p className="text-xs font-bold text-gray-400 ml-11">💡 你可能想问</p>
              {agent.quick_prompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(prompt)}
                  className="ml-11 text-left text-xs text-indigo-600 font-medium px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition-colors flex items-center gap-2"
                >
                  <ChevronRight className="w-3 h-3 shrink-0" />
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {loading && messages[messages.length - 1]?.content === '' && (
            <div className="flex gap-3">
              <img src={agent.avatar} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100 shrink-0" />
              <div className="px-4 py-3 bg-gray-50 rounded-2xl rounded-tl-sm border border-gray-100">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="px-4 md:px-6 py-3 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`告诉 ${agent.name} 你的需求...`}
                rows={1}
                className="w-full resize-none px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
                style={{ maxHeight: '120px' }}
                onInput={e => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                }}
              />
            </div>
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="p-3 bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-2">Shift+Enter 换行 · Enter 发送</p>
        </div>
      </div>

      {/* Right Sidebar — Agent Info (desktop only) */}
      <div className="hidden lg:flex w-72 border-l border-gray-100 bg-white flex-col shrink-0">
        <div className="p-5 text-center border-b border-gray-50">
          <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-lg mb-3 overflow-hidden`}>
            <img src={agent.avatar} alt={agent.name} className="w-16 h-16 object-contain" />
          </div>
          <h3 className="text-sm font-black text-gray-900">{agent.name}</h3>
          <p className="text-[11px] text-gray-400 font-medium mt-0.5">{agent.title}</p>
        </div>

        <div className="p-4 border-b border-gray-50">
          <p className="text-xs text-gray-500 leading-relaxed">{agent.description}</p>
        </div>

        <div className="p-4 border-b border-gray-50">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">技能</p>
          <div className="flex flex-wrap gap-1.5">
            {agent.skills_preview.map(skill => (
              <span key={skill} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.light} ${colors.accent}`}>
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="p-4 flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">可用工具</p>
          <div className="space-y-2">
            {getToolsForDisplay(agent.id).map(tool => (
              <div key={tool.name} className="flex items-center gap-2 text-xs text-gray-600">
                <tool.icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{tool.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tool Call Card Component ────────────────────────────────────────────────

function ToolCallCard({ toolCall, colors }: { toolCall: ToolCall; colors: any }) {
  const isRunning = toolCall.status === 'running';
  const isSuccess = toolCall.status === 'success';

  const TOOL_LABELS: Record<string, string> = {
    generate_ppt: '🎨 PPT 生成',
    create_calendar_event: '📅 日历事件',
    draft_email: '✉️ 邮件草稿',
    searchKnowledgeBase: '🔍 知识库检索',
  };

  return (
    <div className="mt-2 ml-0 bg-white border border-gray-200 rounded-xl p-3 shadow-sm max-w-[400px]">
      <div className="flex items-center gap-2 mb-2">
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        ) : isSuccess ? (
          <Sparkles className="w-4 h-4 text-emerald-500" />
        ) : (
          <span className="w-4 h-4 text-red-500">✕</span>
        )}
        <span className="text-xs font-bold text-gray-700">
          {TOOL_LABELS[toolCall.name] || toolCall.name}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
          isRunning ? 'bg-indigo-50 text-indigo-500' : isSuccess ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
        }`}>
          {isRunning ? '执行中' : isSuccess ? '完成' : '失败'}
        </span>
      </div>

      {/* Logs */}
      {toolCall.logs.length > 0 && (
        <div className="space-y-1 mb-2">
          {toolCall.logs.map((log, idx) => (
            <p key={idx} className="text-[11px] text-gray-500 font-mono">{log}</p>
          ))}
        </div>
      )}

      {/* UI Payload — download buttons etc */}
      {toolCall.uiPayload && <ToolPayloadUI payload={toolCall.uiPayload} />}
    </div>
  );
}

// ── Tool Payload UI (downloads, previews) ───────────────────────────────────

function ToolPayloadUI({ payload }: { payload: any }) {
  if (payload.type === 'ppt_download') {
    return (
      <a
        href={payload.fileUrl}
        download={payload.fileName}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-xs font-bold text-indigo-600 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        下载 {payload.fileName} ({payload.slideCount} 页)
      </a>
    );
  }

  if (payload.type === 'ics_download') {
    return (
      <div>
        <p className="text-[11px] text-gray-500 mb-1.5">
          📅 {payload.subject} · {payload.start?.join('/')} · {payload.duration}分钟
        </p>
        <a
          href={payload.fileUrl}
          download={payload.fileName}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-xs font-bold text-emerald-600 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          下载日历文件 (.ics)
        </a>
      </div>
    );
  }

  if (payload.type === 'email_draft') {
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-bold text-gray-600">收件人: {payload.to}</p>
        <p className="text-[11px] font-bold text-gray-600">主题: {payload.subject}</p>
        <div
          className="text-[11px] text-gray-500 bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: payload.htmlBody }}
        />
      </div>
    );
  }

  return null;
}

// ── Helper: display tool list for sidebar ───────────────────────────────────

function getToolsForDisplay(agentId: string) {
  const base = [{ name: 'kb', icon: FileText, label: '知识库检索' }];

  const toolMap: Record<string, { name: string; icon: any; label: string }[]> = {
    edda: [{ name: 'ppt', icon: FileText, label: 'PPT 幻灯片生成' }],
    bob: [{ name: 'cal', icon: Calendar, label: '日历事件创建' }],
    grace: [{ name: 'email', icon: Mail, label: '邮件草稿撰写' }],
  };

  return [...base, ...(toolMap[agentId.toLowerCase()] || [])];
}
