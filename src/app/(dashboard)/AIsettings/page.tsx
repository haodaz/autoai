
'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Tooltip, Spin } from 'antd';
import { marked } from 'marked';
import { useWorkspace } from '@/components/layout/WorkspaceContext';
import { ThinkBlock, ToolCallsBlock, renderPreviewStandalone, COLOR_BORDER_MAP } from '@/components/shared/UIBlocks';
import { Building2, Cpu, Activity, History, BookOpen, Settings, Send, CheckCircle2, ChevronRight, ChevronLeft, Users, Layout, Plus, FileText, Calendar, Presentation, AlertTriangle, Scale, Mail, StopCircle, Edit, Edit3, Link2, UploadCloud, Terminal, Info, Download, MessageSquare, Wrench, PenTool, CheckCircle, XCircle, Hourglass, ChevronDown, ChevronUp, Database, Menu, X, Copy, RefreshCw, GitMerge, LogOut, UserCircle, Phone, AtSign, Camera, Save, ArrowLeft, ArrowRight, SaveAll, Loader2 } from 'lucide-react';

export default function AISettingsView() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [editAgent, setEditAgent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const COLOR_MAP: Record<string, string> = {
    indigo: 'from-indigo-500 to-violet-500',
    blue: 'from-blue-500 to-blue-600',
    emerald: 'from-emerald-500 to-teal-500',
    purple: 'from-purple-500 to-violet-500',
    red: 'from-red-500 to-rose-500',
    amber: 'from-amber-500 to-orange-500',
    cyan: 'from-cyan-500 to-blue-500',
    pink: 'from-pink-500 to-rose-500',
  };

  const loadAgents = () => {
    setLoading(true);
    fetch('/api/bristh/agents/config')
      .then(r => r.json())
      .then(data => { setAgents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setAgents([]); setLoading(false); });
  };

  useEffect(() => { loadAgents(); }, []);

  const openEditor = (agent: any) => {
    setEditAgent({ ...agent });
    setViewMode('edit');
    setSaveMsg('');
  };

  const handleSave = async () => {
    if (!editAgent) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/bristh/agents/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editAgent),
      });
      if (res.ok) {
        setSaveMsg('✅ 保存成功');
        loadAgents();
        setTimeout(() => setSaveMsg(''), 2000);
      } else {
        setSaveMsg('❌ 保存失败');
      }
    } catch { setSaveMsg('❌ 网络错误'); }
    setSaving(false);
  };

  const set = (key: string, val: any) => setEditAgent((prev: any) => prev ? { ...prev, [key]: val } : null);

  // ── LIST VIEW ──
  if (viewMode === 'list') {
    return (
      <div className="w-full h-full overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-black text-gray-800 flex items-center">
                <Settings className="w-6 h-6 mr-3 text-indigo-500" /> AI 装配与配置
              </h1>
              <p className="text-sm text-gray-400 mt-1">管理 Bristh 多智能体系统的角色设定、人格指令和知识范围</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => openEditor(agent)}
                  className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300 cursor-pointer group"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${COLOR_MAP[agent.color] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0`}>
                        {agent.avatar ? (
                          <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          agent.name?.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-bold text-gray-800 truncate">{agent.name}</h3>
                          {agent.role === 'orchestrator' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 font-bold uppercase tracking-wider">Chief</span>
                          )}
                          {!agent.enabled && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-bold">OFF</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">{agent.title}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed">{agent.description}</p>

                    {/* Skills tags */}
                    {agent.skills_preview && agent.skills_preview.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {agent.skills_preview.slice(0, 4).map((s: string) => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-100 font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom */}
                  <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {agent.knowledge_scope === 'global+private' ? '🌐+🔒 分层知识' : '🌐 全局知识'}
                      </span>
                      {agent._contextFiles && agent._contextFiles.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-500 font-bold">
                          {agent._contextFiles.length} 专属文档
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                      配置 <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── EDIT VIEW ──
  if (!editAgent) return null;

  return (
    <div className="w-full h-full overflow-y-auto p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          <button onClick={() => setViewMode('list')} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-800 transition-colors">
            <ChevronDown className="w-4 h-4 rotate-90" /> 返回列表
          </button>
          <span className="text-gray-300">›</span>
          <span className="text-[15px] font-bold text-gray-800">{editAgent.name} 装配</span>

          <div className="ml-auto flex items-center gap-3">
            {saveMsg && <span className="text-sm font-medium">{saveMsg}</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? '保存中…' : '保存配置'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center mb-5">
            <Cpu className="w-4 h-4 mr-2 text-indigo-500" /> 基本信息
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">名称</label>
                <input value={editAgent.name || ''} onChange={e => set('name', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">职能头衔</label>
                <input value={editAgent.title || ''} onChange={e => set('title', e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-medium outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">描述</label>
              <textarea value={editAgent.description || ''} onChange={e => set('description', e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 h-20 resize-none transition-all" />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={!!editAgent.enabled} onChange={e => set('enabled', e.target.checked)}
                  className="rounded text-indigo-600 w-4 h-4" />
                <span className="font-medium">启用此 Agent</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase">输出格式:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-bold">{editAgent.output_format || 'markdown'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persona & Prompt */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center mb-5">
            <Users className="w-4 h-4 mr-2 text-violet-500" /> 人格指令 / System Prompt
          </h3>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Persona（系统人格）
              <span className="ml-2 text-gray-300 normal-case font-normal">核心身份设定和行为指导</span>
            </label>
            <textarea value={editAgent.persona || ''} onChange={e => set('persona', e.target.value)}
              className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-800 font-mono outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 h-48 resize-none leading-relaxed transition-all" />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center mb-5">
            <PenTool className="w-4 h-4 mr-2 text-emerald-500" /> 技能标签
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {(editAgent.skills_preview || []).map((s: string, i: number) => (
              <span key={i} className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 font-medium flex items-center gap-1.5">
                {s}
                <button onClick={() => set('skills_preview', (editAgent.skills_preview || []).filter((_: any, idx: number) => idx !== i))}
                  className="text-indigo-300 hover:text-red-500 transition-colors">×</button>
              </span>
            ))}
          </div>
          <input
            placeholder="输入新技能标签后按回车…"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                set('skills_preview', [...(editAgent.skills_preview || []), (e.target as HTMLInputElement).value.trim()]);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>

        {/* Context Files (read-only display) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 flex items-center mb-4">
            <BookOpen className="w-4 h-4 mr-2 text-amber-500" /> 专属知识库 / Context
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            知识范围: <span className="font-bold text-gray-600">{editAgent.knowledge_scope === 'global+private' ? '🌐 全局 + 🔒 专属' : '🌐 仅全局'}</span>
            <span className="ml-1 text-gray-300">（专属文档存储于 characters/{editAgent._folder || `bristh_${editAgent.id}`}/context/）</span>
          </p>
          {editAgent._contextFiles && editAgent._contextFiles.length > 0 ? (
            <div className="space-y-2">
              {editAgent._contextFiles.map((f: string) => (
                <div key={f} className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                  <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                  <span className="text-sm text-gray-700 font-medium">{f}</span>
                  <span className="text-[10px] text-gray-400 ml-auto font-mono">.md</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-300 text-sm">
              暂无专属文档，可在 context/ 目录下添加 .md 文件
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
