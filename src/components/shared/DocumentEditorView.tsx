
'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Tooltip, Spin } from 'antd';
import { marked } from 'marked';
import { useWorkspace } from '@/components/layout/WorkspaceContext';
import { ThinkBlock, ToolCallsBlock, renderPreviewStandalone, COLOR_BORDER_MAP } from '@/components/shared/UIBlocks';
import { Building2, Cpu, Activity, History, BookOpen, Settings, Send, CheckCircle2, ChevronRight, ChevronLeft, Users, Layout, Plus, FileText, Calendar, Presentation, AlertTriangle, Scale, Mail, StopCircle, Edit, Edit3, Link2, UploadCloud, Terminal, Info, Download, MessageSquare, Wrench, PenTool, CheckCircle, XCircle, Hourglass, ChevronDown, ChevronUp, Database, Menu, X, Copy, RefreshCw, GitMerge, LogOut, UserCircle, Phone, AtSign, Camera, Save, ArrowLeft, ArrowRight, SaveAll, Loader2 } from 'lucide-react';

export default function DocumentEditorView({ taskId, agent, onClose }: { taskId: string; agent: string; onClose: () => void }) {
  const [taskData, setTaskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [markdown, setMarkdown] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: string; content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Load task data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/bristh/tasks/${taskId}`);
        const data = await res.json();
        setTaskData(data);
        // Extract markdown content from resultPayload
        if (data.resultPayload) {
          try {
            const parsed = JSON.parse(data.resultPayload);
            setMarkdown(parsed.content || parsed.icsContent || data.resultPayload);
          } catch {
            setMarkdown(data.resultPayload);
          }
        }
        // Load existing copilot history
        if (data.copilotHistory) {
          try { setChatHistory(JSON.parse(data.copilotHistory)); } catch {}
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    })();
  }, [taskId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput;
    setChatInput('');
    setChatLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', content: msg }]);

    try {
      const res = await fetch('/api/bristh/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, message: msg })
      });
      const data = await res.json();
      if (res.ok && data.task) {
        setTaskData(data.task);
        // Update markdown from new resultPayload
        if (data.task.resultPayload) {
          try {
            const parsed = JSON.parse(data.task.resultPayload);
            setMarkdown(parsed.content || parsed.icsContent || data.task.resultPayload);
          } catch {
            setMarkdown(data.task.resultPayload);
          }
        }
        // Update chat history
        if (data.task.copilotHistory) {
          try { setChatHistory(JSON.parse(data.task.copilotHistory)); } catch {}
        }
      }
    } catch (e) { console.error(e); }
    setChatLoading(false);
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportDocx = async () => {
    if (!previewRef.current) return;
    const html = previewRef.current.innerHTML;
    const fullHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;font-size:12pt;line-height:1.6;color:#333}h1{font-size:20pt;font-weight:bold}h2{font-size:16pt;font-weight:bold}h3{font-size:14pt;font-weight:bold}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px}</style></head><body>${html}</body></html>`;
    try {
      const blob = new Blob([fullHtml], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${agent}_document.doc`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error('Word export error:', e); alert('Word 导出失败'); }
  };

  const exportPdf = async () => {
    if (!previewRef.current) return;
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `${agent}_document.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).from(previewRef.current).save();
    } catch (e) { console.error('PDF export error:', e); alert('PDF 导出失败'); }
  };

  const agentShort = agent.split(',')[0];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Spin size="large" />
        <span className="ml-3 text-gray-500 font-bold">加载文档中...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar */}
      <div className="px-4 md:px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-black text-gray-900">{agentShort} — 文档共创</h2>
            <p className="text-[10px] text-gray-400">{taskData?.instruction?.substring(0, 60)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 p-0.5 rounded-xl mr-2">
            <button onClick={() => setEditMode(false)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${!editMode ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>预览</button>
            <button onClick={() => setEditMode(true)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${editMode ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>编辑</button>
          </div>
          <button onClick={() => { navigator.clipboard.writeText(markdown); }} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1"><Copy className="w-3 h-3" /> 复制</button>
          <button onClick={() => downloadFile(markdown, `${agent}_document.md`, 'text/markdown')} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold hover:bg-gray-200 flex items-center gap-1"><Download className="w-3 h-3" /> .md</button>
          <button onClick={exportDocx} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-700 flex items-center gap-1 shadow-sm"><Download className="w-3 h-3" /> .doc</button>
          <button onClick={exportPdf} className="px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[11px] font-bold hover:bg-violet-700 flex items-center gap-1 shadow-sm"><Download className="w-3 h-3" /> .pdf</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document Preview/Edit */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-100">
          <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-gray-50/50">
            <div className="max-w-3xl mx-auto">
              {editMode ? (
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  className="w-full min-h-[600px] p-6 bg-white border border-gray-200 rounded-xl font-mono text-sm text-gray-800 outline-none resize-y focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all shadow-sm"
                  placeholder="在此编辑 Markdown 内容..."
                />
              ) : (
                <div ref={previewRef} className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                  {chatLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                      <Spin size="large" />
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none text-gray-700 prose-headings:text-gray-900 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-strong:text-gray-800" dangerouslySetInnerHTML={{ __html: marked(markdown) as string }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Copilot Chat */}
        <div className="hidden md:flex w-[340px] shrink-0 bg-white flex-col">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <h3 className="text-xs font-black text-gray-700 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> {agentShort} Copilot</h3>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Initial AI message */}
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[9px] shrink-0">AI</div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 text-xs text-gray-700 max-w-[85%]">
                你好，我是 {agentShort}。左侧是我生成的文档，你可以直接编辑或告诉我需要修改的地方。
              </div>
            </div>

            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${
                  msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {msg.role === 'user' ? 'ME' : 'AI'}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                  msg.role === 'user' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-sm' : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-[9px] shrink-0">AI</div>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center bg-white border border-gray-200 rounded-xl px-3 py-2 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400/20 transition-all shadow-sm">
              <input
                type="text"
                className="flex-1 outline-none text-xs bg-transparent placeholder-gray-400"
                placeholder="告诉 AI 哪里需要修改..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                disabled={chatLoading}
              />
              <button
                onClick={sendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="ml-2 w-7 h-7 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. 工具箱视图 (Toolbox View)
// ==========================================