'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Building2, Cpu, Activity, History, BookOpen, Settings, Send, CheckCircle2, ChevronRight, ChevronLeft, Users, Layout, Plus, FileText, Calendar, Presentation, AlertTriangle, Scale, Mail, StopCircle, Edit, Edit3, Link2, UploadCloud, Terminal, Info, Download, MessageSquare, Wrench, PenTool, CheckCircle, XCircle, Hourglass, ChevronDown, ChevronUp, Database, Menu, X, Copy, RefreshCw, GitMerge, LogOut, UserCircle, Phone, AtSign, Camera, Save } from 'lucide-react';
import { Modal, Tooltip, Spin } from 'antd';
import { marked } from 'marked';
import { useAuth } from '@/components/auth/AuthGuard';
import { canAccessTab } from '@/lib/roles';
import { useTranslation } from 'react-i18next';

const LogicWhitepaper = lazy(() => import('./logic/page'));
import AIEmployeesView from '@/components/employees/AIEmployeesView';
import UserManagementView from '@/components/admin/UserManagementView';
import VoiceInputButton from '@/components/ui/VoiceInputButton';

// Standalone preview renderer for use outside VirtualOfficeView
function renderPreviewStandalone(payload: string | null) {
  if (!payload) return <div className="text-gray-400">No output generated.</div>;
  if (payload.trim().startsWith('{') || payload.trim().startsWith('[')) {
    try {
      const json = JSON.parse(payload);
      if (json.content) {
        return (
          <div>
            <p className="text-xs font-bold text-gray-500 mb-3">{json.summary}</p>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(json.content) }} />
          </div>
        );
      }
      if (json.summary) return <div className="text-sm text-gray-700"><p className="font-bold mb-2">{json.summary}</p>{json.fileUrl && <a href={json.fileUrl} download className="text-blue-600 underline text-xs">下载文件</a>}</div>;
    } catch {}
  }
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(payload) }} />;
}


const COLOR_BORDER_MAP: Record<string, { color: string; shadow: string }> = {
  blue: { color: 'border-blue-500', shadow: 'shadow-blue-500/20' },
  emerald: { color: 'border-emerald-500', shadow: 'shadow-emerald-500/20' },
  purple: { color: 'border-purple-500', shadow: 'shadow-purple-500/20' },
  red: { color: 'border-red-500', shadow: 'shadow-red-500/20' },
  amber: { color: 'border-amber-500', shadow: 'shadow-amber-500/20' },
  cyan: { color: 'border-cyan-500', shadow: 'shadow-cyan-500/20' },
  pink: { color: 'border-pink-500', shadow: 'shadow-pink-500/20' },
  indigo: { color: 'border-indigo-500', shadow: 'shadow-indigo-500/20' },
};

export default function BristhWorkspace() {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('office');
  // Profile modal
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState({ displayName: '', phone: '', email: '', avatarUrl: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  // Bridge: pass PPT data from Edda (office) → ToolboxView
  const [pendingPptData, setPendingPptData] = useState<{ slides: any[]; fileUrl: string; topic: string } | null>(null);
  // Bridge: open DocumentEditorView for Markdown-based agents
  const [copilotView, setCopilotView] = useState<{ taskId: string; agent: string } | null>(null);
  
  // Model selector state
  const [currentModel, setCurrentModel] = useState<{id: string, name: string, provider: string} | null>(null);
  const [availableModels, setAvailableModels] = useState<{id: string, name: string, provider: string, hasKey: boolean}[]>([]);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [modelSwitching, setModelSwitching] = useState(false);

  useEffect(() => {
    fetch('/api/bristh/model')
      .then(r => r.json())
      .then(data => {
        setCurrentModel(data.current);
        setAvailableModels(data.available || []);
      }).catch(() => {});
  }, []);

  const switchModel = async (modelId: string) => {
    setModelSwitching(true);
    try {
      const res = await fetch('/api/bristh/model', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentModel(data.model);
        setModelDropdownOpen(false);
      } else {
        alert(data.error || 'Failed to switch model');
      }
    } catch { alert('Network error'); }
    setModelSwitching(false);
  };

  const PROVIDER_COLORS: Record<string, string> = {
    DashScope: 'bg-blue-100 text-blue-600',
    Anthropic: 'bg-violet-100 text-violet-600',
    Google: 'bg-emerald-100 text-emerald-600',
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f8f9fc] font-sans relative overflow-hidden">
      {/* Aurora gradient blobs */}
      <div className="fixed top-[-10%] right-[10%] w-[500px] h-[500px] bg-gradient-to-br from-violet-200/40 via-blue-200/30 to-transparent rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed bottom-[-5%] left-[5%] w-[400px] h-[400px] bg-gradient-to-tr from-indigo-200/30 via-purple-100/20 to-transparent rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="fixed top-[40%] left-[40%] w-[300px] h-[300px] bg-gradient-to-br from-cyan-100/20 via-blue-100/15 to-transparent rounded-full blur-[80px] pointer-events-none z-0" />

      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200/80 z-40 flex items-center px-4 shadow-sm">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 mr-3">
          {sidebarOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
        </button>
        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-[8px] font-black mr-2">BEP</div>
        <span className="text-xs font-bold text-gray-700">Bristh Auto Office</span>
        {currentModel && (
          <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold ${PROVIDER_COLORS[currentModel.provider] || 'bg-gray-100 text-gray-500'}`}>
            {currentModel.name}
          </span>
        )}
      </div>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && <div className="md:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)} />}
      
      {/* 左侧导航栏 */}
      <div className={`
        w-64 bg-white text-gray-700 flex flex-col border-r border-gray-200/80 z-30 shadow-sm
        fixed md:relative inset-y-0 left-0
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        pt-14 md:pt-0
      `}>
        <div className="p-5 pb-3 border-b border-gray-200/80 hidden md:block">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-[11px] font-black mr-3 shadow-lg shadow-indigo-500/30">
              BEP
            </div>
            <h1 className="text-[14px] font-extrabold tracking-tight leading-tight text-gray-800">Bristh Enrollment<br/>Partners</h1>
          </div>
        </div>

        <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
          {[
            { id: 'office', label: t('bristh.nav.office'), icon: Layout },
            { id: 'employees', label: t('bristh.nav.employees'), icon: Users },
            { id: 'history', label: t('bristh.nav.history'), icon: History },
            { id: 'kb', label: t('bristh.nav.kb'), icon: BookOpen },
            { id: 'settings', label: t('bristh.nav.settings'), icon: Settings },
            { id: 'toolbox', label: t('bristh.nav.toolbox'), icon: Wrench },
            { id: 'skills', label: t('bristh.nav.skills'), icon: PenTool },
            { id: 'logic', label: t('bristh.nav.logic'), icon: BookOpen },
            { id: 'users', label: t('bristh.nav.users'), icon: Users },
          ].filter(tab => canAccessTab(tab.id, user?.role || 'user')).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-2.5 rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm border border-indigo-100/80' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <tab.icon className={`w-[18px] h-[18px] mr-3 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'}`} />
              <span className="text-[13px] font-semibold">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200/80 space-y-2">
          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all text-left"
            >
              <div className="flex items-center min-w-0">
                <Cpu className="w-3.5 h-3.5 mr-2 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-medium leading-none">{t('bristh.model.current')}</p>
                  <p className="text-[11px] font-bold text-gray-700 truncate mt-0.5">{currentModel?.name || 'Loading...'}</p>
                </div>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ml-2 ${PROVIDER_COLORS[currentModel?.provider || ''] || 'bg-gray-100 text-gray-500'}`}>
                {currentModel?.provider || '...'}
              </span>
            </button>

            {/* Dropdown */}
            {modelDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">{t('bristh.model.switch')}</p>
                </div>
                <div className="p-1.5">
                  {availableModels.map(m => (
                    <button
                      key={m.id}
                      disabled={!m.hasKey || modelSwitching}
                      onClick={() => switchModel(m.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-left ${
                        currentModel?.id === m.id
                          ? 'bg-indigo-50 border border-indigo-100'
                          : m.hasKey
                            ? 'hover:bg-gray-50'
                            : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-bold ${currentModel?.id === m.id ? 'text-indigo-700' : 'text-gray-700'}`}>{m.name}</p>
                        <p className="text-[10px] text-gray-400">{m.provider}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!m.hasKey && <span className="text-[9px] text-red-400 font-medium">{t('bristh.model.noKey')}</span>}
                        {currentModel?.id === m.id && <CheckCircle className="w-3.5 h-3.5 text-indigo-500" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Card */}
          <div className="flex items-center px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100 group">
            <button
              onClick={() => {
                fetch('/api/auth/profile').then(r => r.json()).then(d => {
                  if (d.user) setProfileData({
                    displayName: d.user.displayName || '',
                    phone: d.user.phone || '',
                    email: d.user.email || '',
                    avatarUrl: d.user.avatarUrl || '',
                  });
                });
                setShowProfile(true);
              }}
              className="flex items-center flex-1 min-w-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-bold text-white mr-2.5 shadow-md shadow-indigo-500/20 shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span>{(user?.displayName || user?.username || '?')[0].toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-700 truncate">{user?.displayName || user?.username || 'User'}</p>
                <p className="text-[10px] font-semibold text-gray-400">
                  {user?.role === 'admin' ? 'Admin' : 'User'}
                  <span className="ml-1.5 text-emerald-500">● Online</span>
                </p>
              </div>
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all ml-1 shrink-0"
              title="退出登录"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => { const next = i18n.language === 'zh' ? 'en' : 'zh'; i18n.changeLanguage(next); localStorage.setItem('bristh_lang', next); }}
            className="w-full flex items-center justify-center px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-100 transition-all text-xs font-bold text-gray-500"
          >
            🌐 {t('bristh.lang.toggle')}
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      <Modal
        open={showProfile}
        onCancel={() => setShowProfile(false)}
        footer={null}
        title={null}
        width={440}
        centered
        destroyOnClose
      >
        <div className="pt-2">
          <h3 className="text-lg font-black text-gray-900 mb-6">{t('bristh.profile.title')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('bristh.profile.displayName')}</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={e => setProfileData(p => ({ ...p, displayName: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Your display name"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('bristh.profile.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="+86 ..."
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('bristh.profile.email')}</label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={profileData.email}
                  onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('bristh.profile.avatar')}</label>
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={profileData.avatarUrl}
                  onChange={e => setProfileData(p => ({ ...p, avatarUrl: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              setProfileSaving(true);
              try {
                const res = await fetch('/api/auth/profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(profileData),
                });
                if (res.ok) {
                  setShowProfile(false);
                  window.location.reload(); // refresh to pick up new session
                }
              } finally {
                setProfileSaving(false);
              }
            }}
            disabled={profileSaving}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {profileSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-gray-400 mt-3">
            账号: <span className="font-bold text-gray-500">{user?.username}</span>
            <span className="mx-2">·</span>
            {t('bristh.profile.role')}: <span className="font-bold text-gray-500">{user?.role === 'admin' ? t('bristh.profile.admin') : t('bristh.profile.user')}</span>
          </p>
        </div>
      </Modal>

      {/* 右侧主视窗 */}
      <div className="flex-1 overflow-y-auto md:overflow-hidden relative pt-14 md:pt-0">
        {copilotView && (
          <DocumentEditorView taskId={copilotView.taskId} agent={copilotView.agent} onClose={() => setCopilotView(null)} />
        )}
        <div key="main-tabs" style={{ display: copilotView ? 'none' : 'contents' }}>
          <div style={{ display: activeTab === 'office' ? 'contents' : 'none' }}>
            <VirtualOfficeView onOpenPptCopilot={(data) => { setPendingPptData(data); setActiveTab('toolbox'); }} onOpenDocCopilot={(data) => setCopilotView(data)} />
          </div>
          {activeTab === 'employees' && <AIEmployeesView />}
          {activeTab === 'history' && <TaskHistoryView onOpenPptCopilot={(data) => { setPendingPptData(data); setActiveTab('toolbox'); }} onOpenDocCopilot={(data) => setCopilotView(data)} />}
          {activeTab === 'kb' && <KnowledgeBaseView />}
          {activeTab === 'settings' && <AISettingsView />}
          {activeTab === 'toolbox' && <ToolboxView initialPpt={pendingPptData} onPptConsumed={() => setPendingPptData(null)} />}
          {activeTab === 'skills' && <SkillsView />}
          {activeTab === 'logic' && <Suspense fallback={<div className="flex items-center justify-center h-full"><Spin size="large" /></div>}><LogicWhitepaper /></Suspense>}
          {activeTab === 'users' && <UserManagementView />}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 0. 辅助组件：Think & Tool Logs Blocks
// ==========================================
function ThinkBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-3">
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center text-xs font-bold text-gray-500 cursor-pointer hover:text-gray-700 transition-colors"
      >
        {expanded ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
        已完成思考, 耗时 3s
      </div>
      {expanded && (
        <div 
          className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-600 font-mono prose prose-sm max-w-none prose-p:my-1"
          dangerouslySetInnerHTML={{ __html: marked.parse(content) }}
        />
      )}
    </div>
  );
}

function ToolCallsBlock({ calls }: { calls: any[] }) {
  if (!calls || calls.length === 0) return null;
  return (
    <div className="mb-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center text-xs font-bold text-gray-700 mb-2">
        <Activity className="w-3 h-3 mr-1 text-blue-500" /> 正在并发调度工具...
      </div>
      <div className="space-y-1.5 mt-2">
        {calls.map((call, idx) => (
          <div key={idx} className="text-xs text-gray-600 font-mono">
            <span className="font-bold text-gray-800 mr-2">● 工具调度专线「{call.tool}」</span>
            {call.logs.map((log: string, lIdx: number) => (
              <div key={lIdx} className="flex items-start mt-1 ml-4">
                {log.includes('✅') || log.includes('成功') ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1.5 mt-0.5 shrink-0" />
                ) : log.includes('❌') || log.includes('失败') ? (
                  <XCircle className="w-3.5 h-3.5 text-red-500 mr-1.5 mt-0.5 shrink-0" />
                ) : (
                  <Hourglass className="w-3.5 h-3.5 text-amber-600 mr-1.5 mt-0.5 shrink-0 animate-pulse" />
                )}
                <span>{log.replace(/✅|❌|⏳/g, '')}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 1. 虚拟办公室视图 (Virtual Office View)
// ==========================================
interface LogEntry {
  id: number;
  source: string;
  message: string;
  time: string;
}

function VirtualOfficeView({ onOpenPptCopilot, onOpenDocCopilot }: { onOpenPptCopilot?: (data: { slides: any[]; fileUrl: string; topic: string }) => void; onOpenDocCopilot?: (data: { taskId: string; agent: string }) => void }) {
  const { t, i18n } = useTranslation();
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'dispatching' | 'completed' | 'failed'>('idle');
  const [activeNodes, setActiveNodes] = useState<{agent: string, instruction: string, status: string, taskId: string, depth: number, summary?: string}[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'file' | 'email'>('text');
  const [currentTaskDisplay, setCurrentTaskDisplay] = useState(t('bristh.office.noTask'));
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // Dynamic agent config from API
  const [subAIs, setSubAIs] = useState<{id: string, name: string, desc: string, image: string, color: string, shadow: string}[]>([]);
  
  useEffect(() => {
    fetch('/api/bristh/agents/config')
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const mapped = data
          .filter((a: any) => a.role === 'agent' && a.enabled)
          .map((a: any) => {
            const cm = COLOR_BORDER_MAP[a.color] || { color: 'border-gray-400', shadow: 'shadow-gray-400/20' };
            return {
              id: a.name,  // Agent routes use Name (Alice, Bob...) as the identifier
              name: `${a.name}, ${a.title?.split('/')[0]?.trim() || ''}`,
              desc: a.description || '',
              image: a.avatar || '/pixel_worker.png',
              color: cm.color,
              shadow: cm.shadow,
            };
          });
        setSubAIs(mapped);
      })
      .catch(() => {
        // Fallback: if API fails, use hardcoded defaults
        setSubAIs([
          { id: 'Alice', name: 'Alice, 方案架构师', desc: '撰写商业方案', image: '/pixel_worker_analysis.png', color: 'border-blue-500', shadow: 'shadow-blue-500/20' },
          { id: 'Bob', name: 'Bob, 日程安排专员', desc: '生成日历邀请', image: '/pixel_worker_social.png', color: 'border-emerald-500', shadow: 'shadow-emerald-500/20' },
          { id: 'Edda', name: 'Edda, PPT制作专员', desc: '生成幻灯片', image: '/pixel_worker_presentation.png', color: 'border-purple-500', shadow: 'shadow-purple-500/20' },
          { id: 'David', name: 'David, 内控纪检专员', desc: '内部整改', image: '/pixel_worker_support.png', color: 'border-red-500', shadow: 'shadow-red-500/20' },
          { id: 'Fiona', name: 'Fiona, 组织宣发专员', desc: '内部通报', image: '/pixel_worker.png', color: 'border-amber-500', shadow: 'shadow-amber-500/20' },
          { id: 'Eric', name: 'Eric, 法务写作专员', desc: '法律文书', image: '/pixel_worker_filing.png', color: 'border-cyan-500', shadow: 'shadow-cyan-500/20' },
          { id: 'Grace', name: 'Grace, 邮件分发专员', desc: '邮件发送', image: '/pixel_worker_social.png', color: 'border-pink-500', shadow: 'shadow-pink-500/20' },
        ]);
      });
  }, []);
  
  // States for Email Integration
  const [emails, setEmails] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Copilot
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotNode, setCopilotNode] = useState<{ agent: string, taskId: string } | null>(null);
  const [copilotData, setCopilotData] = useState<any>(null);
  const [copilotMessage, setCopilotMessage] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeAgentIds = activeNodes.map(n => n.agent);
  const idleAIs = subAIs.filter(ai => !activeAgentIds.includes(ai.id));
  const activeAIs = subAIs.filter(ai => activeAgentIds.includes(ai.id));

  const addLog = (source: string, message: string) => {
    setLogs(prev => [...prev, {
      id: Date.now() + Math.random(),
      source,
      message,
      time: new Date().toLocaleTimeString([], { hour12: false })
    }]);
  };

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [copilotData?.copilotHistory]);

  const fetchEmails = async () => {
    setLoadingEmails(true);
    try {
      const res = await fetch('/api/crm/emails/list');
      const data = await res.json();
      setEmails(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoadingEmails(false);
  };

  useEffect(() => {
    if (inputMode === 'email') {
      fetchEmails();
    }
  }, [inputMode]);

  const handleEmailSelect = (emailItem: any) => {
    let content = '';
    try {
      const parsedMsgs = JSON.parse(emailItem.messages);
      content = parsedMsgs[0]?.content || '';
    } catch (e) {
      content = emailItem.messages;
    }
    setInput(`[Subject: ${emailItem.summary || 'Email'}]\n\n${content}`);
    setInputMode('text');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setInput(`[File: ${file.name}]\n\n${result}`);
        setInputMode('text');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // reset
  };

  const loadHistory = async (contextId: string = 'latest') => {
    try {
      const res = await fetch(`/api/bristh/tasks?contextId=${contextId}`);
      const tasks = await res.json();
      if (!tasks || tasks.length === 0) {
        addLog('System', 'No historical tasks found.');
        return;
      }
      
      const mappedNodes = tasks.map((t: any) => ({
        agent: t.agent,
        instruction: t.instruction,
        status: t.status === 'COMPLETED' ? 'done' : t.status === 'FAILED' ? 'error' : 'running',
        taskId: t.id
      }));
      setActiveNodes(mappedNodes);
      setStatus('completed');
      setCurrentTaskDisplay(`[History Loaded] Context ID: ${tasks[0].contextId}`);
      
      setLogs([
        { id: 1, source: 'System', message: 'Restored pipeline from background history execution.', time: new Date().toLocaleTimeString() }
      ]);
    } catch (e) {
      console.error(e);
      addLog('System', 'Failed to load history.');
    }
  };

  const handleDispatch = async () => {
    // ... [existing handleDispatch code below]
    if (inputMode === 'text' && !input.trim()) return;
    
    setCurrentTaskDisplay(inputMode === 'text' ? input.substring(0, 50) + '...' : `已关联${inputMode === 'file' ? '上传文件' : 'CRM邮件'}`);
    setIsModalOpen(false);
    setStatus('analyzing');
    setActiveNodes([]);
    setLogs([]);
    
    addLog('System', 'Task initiated. Routing to Chief Master AI.');
    addLog('Chief', 'Reading context and analyzing intent...');

    try {
      const res = await fetch('/api/bristh/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'TEXT', rawContent: input, locale: i18n.language })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');

      setStatus('dispatching');
      const assignedTasks = data.tasks || [];
      addLog('Chief', `Orchestration complete. Participating agents: ${assignedTasks.map((t:any) => t.agent).join(', ')}.`);
      
      const initialActiveNodes = assignedTasks.map((t:any) => {
        const taskRecord = data.tasks.find((dbTask: any) => dbTask.agent === t.agent);
        return {
          agent: t.agent,
          instruction: t.instruction,
          status: 'working',
          taskId: taskRecord?.id,
          depth: t.agent.toLowerCase() === 'grace' ? 2 : 1,
        };
      });
      setActiveNodes(initialActiveNodes);
      
      const otherTasks = data.tasks.filter((t: any) => t.agent.toLowerCase() !== 'grace');
      const graceTasks = data.tasks.filter((t: any) => t.agent.toLowerCase() === 'grace');

      const executeAgent = async (taskRecord: any) => {
        const agentName = taskRecord.agent;
        addLog(agentName, `Executing sub-task: ${taskRecord.instruction.substring(0, 40)}...`);
        try {
           const agentEndpoint = `/api/bristh/agents/${agentName.toLowerCase()}`;
           
           const agentRes = await fetch(agentEndpoint, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ taskId: taskRecord.id, locale: i18n.language })
           });

           if (!agentRes.ok) {
             if (agentRes.status === 404) {
                addLog(agentName, `(Mock) Completed task successfully.`);
                setActiveNodes(prev => prev.map(n => n.agent === agentName ? {...n, status: 'done'} : n));
                return;
             }
             throw new Error(`Failed with status ${agentRes.status}`);
           }

           const agentData = await agentRes.json();
           
           if (agentData.task?.thinkLog) {
             addLog(agentName, `[Thinking Completed]`);
           }
           if (agentData.task?.toolCallsLog) {
             addLog(agentName, `[Tool Dispatched: ${JSON.parse(agentData.task.toolCallsLog)[0]?.tool}]`);
           }

           addLog(agentName, `✅ Completed. Output payload saved to asset DB.`);
           // Extract summary for Kanban card display
           let summary = '';
           try {
             const payload = agentData.task?.resultPayload;
             if (payload) {
               const parsed = JSON.parse(payload);
               summary = parsed.summary || '';
             }
           } catch { summary = ''; }
           setActiveNodes(prev => prev.map(n => n.agent === agentName ? {...n, status: 'done', summary} : n));
        } catch (err: any) {
           addLog(agentName, `❌ Error: ${err.message}`);
           setActiveNodes(prev => prev.map(n => n.agent === agentName ? {...n, status: 'failed'} : n));
        }
      };

      await Promise.all(otherTasks.map((t:any) => executeAgent(t)));
      
      if (graceTasks.length > 0) {
         addLog('System', 'Dependencies met. Starting Grace...');
         await Promise.all(graceTasks.map((t:any) => executeAgent(t)));
      }

      addLog('Chief', 'All sub-tasks reported back. Pipeline finished.');
      setStatus('completed');
      
    } catch (err: any) {
      addLog('System', `Error: ${err.message}`);
      setStatus('failed');
    }
  };

  const terminateTask = () => {
    setStatus('idle');
    setActiveNodes([]);
    setInput('');
    setCurrentTaskDisplay('暂无活动任务。点击新增接入任务。');
    setLogs([]);
  };

  // --- Copilot Methods ---
  const openCopilot = async (agent: string, taskId: string) => {
    // For Edda, redirect to ToolboxView's mature PPT editor
    if (agent.startsWith('Edda') && onOpenPptCopilot) {
      try {
        const res = await fetch(`/api/bristh/tasks/${taskId}`);
        const data = await res.json();
        if (data.resultPayload) {
          const parsed = JSON.parse(data.resultPayload);
          if (parsed.rawSlides) {
            onOpenPptCopilot({
              slides: parsed.rawSlides,
              fileUrl: parsed.fileUrl || '',
              topic: data.instruction || 'Edda PPT',
            });
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load Edda PPT data:', e);
      }
    }
    // For all other agents, open DocumentEditorView
    if (onOpenDocCopilot) {
      onOpenDocCopilot({ taskId, agent });
      return;
    }
    // Fallback: modal copilot
    setCopilotNode({ agent, taskId });
    setCopilotOpen(true);
    setCopilotData(null);
    try {
      const res = await fetch(`/api/bristh/tasks/${taskId}`);
      const data = await res.json();
      setCopilotData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const sendCopilotMessage = async () => {
    if (!copilotMessage.trim() || !copilotNode) return;
    const msg = copilotMessage;
    setCopilotMessage('');
    setCopilotLoading(true);

    // Optimistically update history
    setCopilotData((prev: any) => {
      const hist = prev.copilotHistory ? JSON.parse(prev.copilotHistory) : [];
      hist.push({ role: 'user', content: msg });
      return { ...prev, copilotHistory: JSON.stringify(hist) };
    });

    try {
      const res = await fetch('/api/bristh/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: copilotNode.taskId, message: msg, locale: i18n.language })
      });
      const data = await res.json();
      if (res.ok) {
        setCopilotData(data.task);
      }
    } catch (e) {
      console.error(e);
    }
    setCopilotLoading(false);
  };

  // Render preview based on payload type
  const renderPreview = (payload: string | null) => {
    if (!payload) return <div className="text-gray-400">No output generated.</div>;
    
    // Check if it's JSON (e.g. Edda or Bob output)
    if (payload.trim().startsWith('{') || payload.trim().startsWith('[')) {
       try {
         const json = JSON.parse(payload);
         if (json.fileUrl) {
            const slides = json.rawSlides || [];
            return (() => {
              const [viewSlide, setViewSlide] = React.useState(0);
              const currentS = slides[viewSlide];
              return (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
                    <span className="text-xs font-bold text-gray-500">{json.summary}</span>
                    <a href={json.fileUrl} download className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-blue-700 shadow-sm">
                      <Download className="w-3 h-3" /> 下载 .pptx
                    </a>
                  </div>
                  <div className="flex gap-2 px-4 py-2 border-b border-gray-100 overflow-x-auto shrink-0 bg-gray-50/50">
                    {slides.map((s: any, i: number) => {
                      const titleEl = s.elements?.find((e: any) => e.style?.fontWeight === 'bold' && e.style?.fontSize >= 1.8);
                      return (
                        <button key={i} onClick={() => setViewSlide(i)}
                          className={`shrink-0 w-24 rounded-lg border-2 overflow-hidden transition-all ${viewSlide === i ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="aspect-[16/9] bg-white relative p-1">
                            <div className="text-[5px] font-bold text-gray-800 truncate">{titleEl?.content || `Slide ${i+1}`}</div>
                          </div>
                          <div className="px-1 py-0.5 bg-gray-50 border-t border-gray-100">
                            <span className={`text-[8px] font-bold ${viewSlide === i ? 'text-blue-600' : 'text-gray-400'}`}>第 {i+1} 页</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex-1 flex items-center justify-center p-4 bg-gray-100/30 overflow-auto">
                    {currentS && (
                      <div className="w-full max-w-2xl">
                        <div className="aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-gray-200 relative"
                          style={{ backgroundColor: currentS.backgroundColor || '#ffffff' }}>
                          {currentS.elements?.map((el: any) => (
                            <div key={el.id} style={{
                              position: 'absolute',
                              left: `${el.x}%`, top: `${el.y}%`,
                              width: `${el.width}%`, height: `${el.height}%`,
                              fontSize: `${(el.style?.fontSize || 1) * 0.6}rem`,
                              fontWeight: el.style?.fontWeight || 'normal',
                              textAlign: el.style?.textAlign || 'left',
                              color: el.style?.color || '#333',
                              backgroundColor: el.style?.backgroundColor === 'transparent' ? undefined : el.style?.backgroundColor,
                              padding: el.style?.padding ? `${el.style.padding * 0.5}%` : undefined,
                              borderRadius: el.style?.borderRadius ? `${el.style.borderRadius}px` : undefined,
                              overflow: 'hidden', whiteSpace: 'pre-wrap', lineHeight: 1.5,
                            }}>
                              {el.content}
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-center gap-3 mt-3">
                          <button onClick={() => setViewSlide(Math.max(0, viewSlide - 1))} disabled={viewSlide === 0}
                            className="p-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 shadow-sm">
                            <ChevronLeft className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <span className="text-[11px] font-bold text-gray-500">{viewSlide + 1} / {slides.length}</span>
                          <button onClick={() => setViewSlide(Math.min(slides.length - 1, viewSlide + 1))} disabled={viewSlide === slides.length - 1}
                            className="p-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-30 shadow-sm">
                            <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })();
          } else if (json.icsContent) {
            return (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
                  <span className="text-xs font-bold text-gray-500">{json.summary || '日历邀请已生成'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(json.icsContent)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-gray-200">
                      <Copy className="w-3 h-3" /> 复制
                    </button>
                    <button onClick={() => { const blob = new Blob([json.icsContent], { type: 'text/calendar' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'meeting.ics'; a.click(); URL.revokeObjectURL(url); }}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-emerald-100">
                      <Download className="w-3 h-3" /> 下载 .ics
                    </button>
                  </div>
                </div>
                <pre className="flex-1 bg-gray-800 text-green-400 p-4 rounded-b-xl text-xs overflow-auto font-mono whitespace-pre-wrap m-0">
                  {json.icsContent}
                </pre>
              </div>
            );
          } else if (json.content) {
            // Markdown agents (Alice, David, Eric, Fiona, Grace)
            return (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 shrink-0">
                  <span className="text-xs font-bold text-gray-500">{json.summary}</span>
                  <div className="flex gap-2">
                    <button onClick={() => navigator.clipboard.writeText(json.content)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-gray-200">
                      <Copy className="w-3 h-3" /> 复制
                    </button>
                    <button onClick={() => { const blob = new Blob([json.content], { type: 'text/markdown' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'document.md'; a.click(); URL.revokeObjectURL(url); }}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold flex items-center gap-1.5 hover:bg-indigo-100">
                      <Download className="w-3 h-3" /> 下载 .md
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-a:text-blue-600"
                    dangerouslySetInnerHTML={{ __html: marked.parse(json.content) }} />
                </div>
              </div>
            );
          }
       } catch (e) {
         // Fallback to markdown below if parsing fails
       }
    }

    // Markdown render
    return (
      <div 
        className="prose prose-sm max-w-none prose-headings:text-blue-900 prose-a:text-blue-600"
        dangerouslySetInnerHTML={{ __html: marked.parse(payload) }} 
      />
    );
  };

  return (
    <div className="w-full h-auto md:h-full flex flex-col md:flex-row overflow-visible md:overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>

      {/* 左侧中枢区 (Command Center) */}
      <div className="w-full md:w-[380px] h-auto md:h-full border-b md:border-b-0 md:border-r border-gray-200/80 bg-white flex flex-col z-20 shadow-sm relative shrink-0">
        
        <div className="p-5 border-b border-gray-200 bg-white">
          <div className="flex justify-between items-center mb-3">
             <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
               当前任务卡片 <ChevronRight className="w-3 h-3 mx-1"/> {status === 'idle' ? '待命' : status === 'completed' ? '已完成' : status === 'failed' ? '遇到异常' : '执行中'}
             </h2>
             {(status !== 'idle' && status !== 'failed' && status !== 'completed') && (
               <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
             )}
          </div>
          <p className="font-mono text-[12px] text-gray-800 font-medium bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px] line-clamp-3">
             {currentTaskDisplay}
          </p>
          
          <div className="mt-4 flex space-x-2">
            {status === 'idle' ? (
              <>
                <button onClick={() => setIsModalOpen(true)} className="flex-1 flex items-center justify-center py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-xs font-bold hover:from-indigo-500 hover:to-violet-500 shadow-md shadow-indigo-500/20">
                  <Plus className="w-3 h-3 mr-1" /> 新增 / 管理接入
                </button>
                <button onClick={() => loadHistory('latest')} className="flex-1 flex items-center justify-center py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100 shadow-sm border border-purple-200">
                  <History className="w-3 h-3 mr-1" /> 加载最新后台执行
                </button>
              </>
            ) : (
              <>
                <button onClick={terminateTask} className="flex-1 flex items-center justify-center py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100">
                  <StopCircle className="w-3 h-3 mr-1" /> 终止复位
                </button>
                {status === 'failed' && (
                  <button onClick={handleDispatch} className="flex-1 flex items-center justify-center py-2 bg-orange-50 text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-100 shadow-sm border border-orange-200">
                    <Activity className="w-3 h-3 mr-1" /> 重试任务
                  </button>
                )}
                {status === 'completed' && (
                  <button onClick={terminateTask} className="flex-1 flex items-center justify-center py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200">
                    归档复位
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-5 border-b border-gray-200">
          <div className={`relative w-full rounded-2xl bg-white border-2 shadow-lg transition-all duration-300 overflow-hidden flex items-center p-3 ${
              status === 'idle' ? 'border-gray-200' :
              (status === 'analyzing' || status === 'dispatching') ? 'border-blue-500 shadow-blue-500/20' : 'border-gray-200'
            }`}
          >
            <div className="w-20 h-20 bg-gray-50 rounded-xl flex items-center justify-center mr-4">
              <img src="/pixel_worker_analysis.png" alt="Chief AI" className="h-[90%] object-contain filter drop-shadow-md scale-125" style={{ imageRendering: 'pixelated' }} />
            </div>
            <div className="flex-1">
              <h3 className="font-extrabold text-base text-gray-900 leading-tight">Chief, 总裁特助</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wide">任务总管 / Orchestrator</p>
              <div className="mt-2 flex items-center space-x-1">
                 <div className={`w-2 h-2 rounded-full ${status !== 'idle' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                 <span className="text-[10px] font-bold text-gray-500">{status !== 'idle' ? 'ONLINE' : 'IDLE'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-5 overflow-hidden">
           <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center">
             <Terminal className="w-3 h-3 mr-1" /> 任务执行 Log
           </h3>
           <div className="flex-1 bg-[#1e1b2e] rounded-xl p-4 overflow-y-auto font-mono text-[11px] text-gray-300 space-y-2 shadow-inner border border-[#2d2845] scrollbar-thin scrollbar-thumb-[#3d3660]">
             {logs.length === 0 ? (
               <div className="text-slate-600 italic">Waiting for incoming tasks...</div>
             ) : (
               logs.map(log => (
                 <div key={log.id} className="leading-relaxed">
                   <span className="text-slate-600">[{log.time}]</span>{' '}
                    <span className={log.source === 'Chief' ? 'text-indigo-400 font-bold' : log.source === 'System' ? 'text-emerald-400' : 'text-violet-400'}>
                     [{log.source}]
                   </span>{' '}
                   <span className="text-slate-200">{log.message}</span>
                 </div>
               ))
             )}
             <div ref={logEndRef} />
           </div>
        </div>
      </div>

      {/* 中间动态参与区 — Kanban Pipeline */}
      <div className="flex-1 flex flex-col p-4 md:p-6 relative z-20 min-h-[300px] overflow-y-auto">

        {activeAIs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center flex flex-col items-center max-w-md">
              <img src="/pixel-office.png" alt="BEP Virtual Office" className="w-96 h-96 object-contain mb-4" />
              <p className="text-gray-400 font-medium text-sm">暂无参与的智能体，等待 Chief 分派...</p>
              <p className="text-gray-300 text-xs mt-1">在上方输入框中提交任务，Chief 将自动调度 AI 团队</p>
            </div>
          </div>
        ) : (() => {
          // Group nodes by depth for Kanban columns
          const depthMap = new Map<number, typeof activeNodes>();
          activeNodes.forEach(n => {
            const list = depthMap.get(n.depth) || [];
            list.push(n);
            depthMap.set(n.depth, list);
          });
          const maxDepth = Math.max(...Array.from(depthMap.keys()));
          const columns: { depth: number; label: string; nodes: typeof activeNodes }[] = [
            { depth: 0, label: '编排', nodes: [{ agent: 'Chief', instruction: `分析意图 → 分派 ${activeNodes.length} 个任务`, status: status === 'completed' || status === 'dispatching' ? 'done' : 'working', taskId: '', depth: 0, summary: `参与: ${activeNodes.map(n => n.agent).join(', ')}` }] },
          ];
          for (let d = 1; d <= maxDepth; d++) {
            columns.push({ depth: d, label: d === 1 ? '并发执行' : `阶段 ${d}`, nodes: depthMap.get(d) || [] });
          }

          const AGENT_ROLES: Record<string, string> = {};
          subAIs.forEach(ai => { AGENT_ROLES[ai.id] = ai.desc; });

          return (
            <div className="flex gap-4 md:gap-6 flex-1 min-h-0 items-start overflow-x-auto pb-4">
              {columns.map((col, colIdx) => (
                <div key={col.depth} className="flex items-start gap-0 shrink-0">
                  {/* Column */}
                  <div className="flex flex-col w-[200px] md:w-[240px]">
                    {/* Column header */}
                    <div className={`text-center mb-3 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      col.depth === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {col.label}
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      {col.nodes.map((node) => {
                        const ai = subAIs.find(a => a.id === node.agent);
                        const isDone = node.status === 'done';
                        const isFailed = node.status === 'failed';
                        const isWorking = node.status === 'working';
                        const isChief = node.agent === 'Chief';

                        return (
                          <div
                            key={node.agent}
                            onClick={() => {
                              if (isDone && node.taskId && !isChief) {
                                openCopilot(ai?.name || node.agent, node.taskId);
                              }
                            }}
                            className={`rounded-xl border-2 overflow-hidden transition-all duration-300 group relative ${
                              isChief ? 'bg-gradient-to-br from-indigo-50 to-white border-indigo-300 shadow-indigo-100/50 shadow-md' :
                              isFailed ? 'bg-red-50/50 border-red-300' :
                              isDone ? 'bg-white border-emerald-400 cursor-pointer hover:shadow-emerald-200/60 hover:shadow-lg hover:-translate-y-0.5' :
                              isWorking ? 'bg-white border-indigo-300 animate-pulse' :
                              'bg-gray-50 border-gray-200 border-dashed'
                            }`}
                          >
                            {/* Card Header */}
                            <div className={`px-3 py-2 flex items-center gap-2 border-b ${
                              isChief ? 'border-indigo-100 bg-indigo-50/50' :
                              isDone ? 'border-emerald-50' :
                              isFailed ? 'border-red-100' :
                              'border-gray-100'
                            }`}>
                              {isChief ? (
                                <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[9px] font-black shrink-0">C</div>
                              ) : ai?.image ? (
                                <img src={ai.image} alt={node.agent} className="w-6 h-6 rounded-lg object-contain bg-white border border-gray-100" style={{ imageRendering: 'pixelated' }} />
                              ) : (
                                <div className="w-6 h-6 rounded-lg bg-gray-200 flex items-center justify-center text-[9px] font-black text-gray-600 shrink-0">{node.agent[0]}</div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-gray-800 truncate">{node.agent}</p>
                              </div>
                              {isDone && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] shrink-0">✓</div>}
                              {isFailed && <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[9px] shrink-0">✗</div>}
                              {isWorking && <Activity className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />}
                            </div>

                            {/* Card Body: instruction */}
                            <div className="px-3 py-2">
                              <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{node.instruction}</p>
                            </div>

                            {/* Card Footer: summary or status */}
                            <div className={`px-3 py-1.5 text-[10px] font-medium border-t ${
                              isDone ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' :
                              isFailed ? 'bg-red-50/50 border-red-100 text-red-600' :
                              isWorking ? 'bg-indigo-50/50 border-indigo-100 text-indigo-600' :
                              'bg-gray-50 border-gray-100 text-gray-400'
                            }`}>
                              {isDone && node.summary ? (
                                <p className="truncate">{node.summary}</p>
                              ) : isDone ? (
                                <p>✅ 已完成</p>
                              ) : isFailed ? (
                                <p>❌ 执行失败</p>
                              ) : isWorking ? (
                                <p>🔄 执行中...</p>
                              ) : (
                                <p>⏳ 等待执行</p>
                              )}
                            </div>

                            {/* Hover overlay for Copilot */}
                            {isDone && !isChief && (
                              <div className="absolute inset-0 bg-indigo-900/80 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white z-10 rounded-xl">
                                <MessageSquare className="w-5 h-5 mb-1 text-violet-300" />
                                <span className="text-[10px] font-bold">进入 Copilot</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Arrow between columns */}
                  {colIdx < columns.length - 1 && (
                    <div className="flex flex-col justify-center self-stretch px-1 md:px-2 shrink-0">
                      {col.nodes.map((_, rowIdx) => {
                        const nextCol = columns[colIdx + 1];
                        const hasTarget = nextCol && (rowIdx === col.nodes.length - 1 || rowIdx < nextCol.nodes.length);
                        return (
                          <div key={rowIdx} className="flex items-center h-full flex-1">
                            {hasTarget && (
                              <div className="flex items-center">
                                <div className="w-6 md:w-10 h-[2px] bg-gradient-to-r from-indigo-300 to-indigo-400 relative">
                                  {status === 'dispatching' && (
                                    <div className="absolute inset-0 overflow-hidden">
                                      <div className="w-2 h-full bg-indigo-500 rounded-full animate-pulse" style={{ animation: 'flowRight 1s linear infinite' }} />
                                    </div>
                                  )}
                                </div>
                                <ChevronRight className="w-3 h-3 text-indigo-400 -ml-1" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* 右侧闲置区 (Idle Agents) */}
      <div className="hidden md:flex w-[380px] bg-white/80 backdrop-blur-xl border-l border-gray-200/80 flex-col p-6 z-20 shadow-sm shrink-0">
        <h2 className="text-base font-black text-gray-600 text-center mb-6">闲置 AI</h2>
        
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
          <div className="flex flex-wrap justify-center gap-4">
            {idleAIs.map((ai) => (
              <div key={ai.id} className="w-[140px] flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity cursor-default filter grayscale hover:grayscale-0 relative">
                
                {/* Info Icon for Idle AIs */}
                <div className="absolute top-1 right-1 z-30">
                  <Tooltip title={ai.desc} placement="top">
                    <div className="p-1 cursor-pointer hover:bg-gray-100 rounded-full transition-colors bg-white/80">
                      <Info className="w-4 h-4 text-gray-500 hover:text-blue-600" />
                    </div>
                  </Tooltip>
                </div>

                <div className="w-full bg-white rounded-xl border-2 border-gray-200 overflow-hidden flex flex-col shadow-sm">
                  <div className="h-[120px] bg-white flex items-center justify-center p-2 relative">
                    <img 
                      src={ai.image} 
                      alt={ai.name} 
                      className="max-h-[90%] max-w-[90%] object-contain filter drop-shadow-sm scale-125 pt-2" 
                      style={{ imageRendering: 'pixelated' }} 
                    />
                  </div>
                  <div className="pb-3 text-center bg-white border-t border-gray-50 pt-2 px-1">
                    <h4 className="font-extrabold text-[12px] text-gray-500 leading-tight">{ai.name.split(',')[0]}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 新增/管理接入 Modal */}
      <Modal
        title={
          <div className="flex items-center text-lg font-black">
            <Plus className="w-5 h-5 mr-2 text-blue-600" /> 新增 / 管理接入
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={650}
        centered
      >
        <div className="mt-4">
          <div className="flex border-b border-gray-200 mb-5 space-x-6">
            <button 
              onClick={() => setInputMode('text')} 
              className={`pb-3 font-bold text-sm transition-colors ${inputMode === 'text' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Edit className="w-4 h-4 inline mr-1 -mt-0.5"/> 粘贴文本
            </button>
            <button 
              onClick={() => setInputMode('file')} 
              className={`pb-3 font-bold text-sm transition-colors ${inputMode === 'file' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <UploadCloud className="w-4 h-4 inline mr-1 -mt-0.5"/> 上传文件
            </button>
            <button 
              onClick={() => setInputMode('email')} 
              className={`pb-3 font-bold text-sm transition-colors ${inputMode === 'email' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Link2 className="w-4 h-4 inline mr-1 -mt-0.5"/> 关联邮件 (CRM)
            </button>
          </div>

          {inputMode === 'text' && (
            <div className="relative">
              <textarea
                className="w-full h-40 p-4 pb-10 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                placeholder="[Meeting Transcript] Client agreed to proceed. We need a proposal draft, a legal contract, and an internal sync..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <div className="absolute bottom-3 left-3">
                <VoiceInputButton
                  onTranscript={(text) => setInput(prev => prev + text)}
                  lang={i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US'}
                />
              </div>
            </div>
          )}

          {inputMode === 'file' && (
            <div 
               className="w-full h-40 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer relative"
               onClick={() => fileInputRef.current?.click()}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileUpload} 
                 className="hidden" 
                 accept=".txt,.json,.md"
               />
               <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
               <p className="text-sm font-bold text-gray-600">点击此处选择并读取纯文本文件</p>
               <p className="text-xs text-gray-400 mt-1">支持 .txt, .json, .md 格式读取为文本</p>
            </div>
          )}

          {inputMode === 'email' && (
            <div className="w-full h-64 border border-gray-200 rounded-xl flex flex-col bg-gray-50 overflow-hidden">
               <div className="p-3 bg-white border-b border-gray-200 flex justify-between items-center">
                 <span className="text-sm font-bold text-gray-600 flex items-center">
                   <Mail className="w-4 h-4 mr-2 text-gray-400"/> CRM 收件箱
                 </span>
                 <button onClick={fetchEmails} className="text-xs font-bold text-blue-600 hover:underline">
                   刷新收件箱
                 </button>
               </div>
               
               <div className="flex-1 overflow-y-auto">
                 {loadingEmails ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading emails...</div>
                 ) : emails.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-400">No emails found in CRM.</div>
                 ) : (
                    <div className="divide-y divide-gray-100">
                      {emails.map((email: any) => (
                        <div 
                          key={email.id} 
                          onClick={() => handleEmailSelect(email)}
                          className="p-3 hover:bg-blue-50 cursor-pointer transition-colors group"
                        >
                          <div className="font-bold text-sm text-gray-800 line-clamp-1 group-hover:text-blue-600">{email.summary}</div>
                          <div className="text-xs text-gray-500 mt-1 flex justify-between">
                            <span>From: {email.customer?.email || 'Unknown'}</span>
                            <span>{new Date(email.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                 )}
               </div>
            </div>
          )}

          <button
            onClick={handleDispatch}
            disabled={inputMode === 'text' && !input.trim()}
            className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-[15px]"
          >
            派发任务 / Dispatch <Send className="w-4 h-4 ml-2" />
          </button>
        </div>
      </Modal>

      {/* Copilot Mode Modal */}
      <Modal
        title={
          <div className="flex items-center text-lg font-black text-gray-800">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" /> 
            {copilotNode?.agent} Copilot 共创空间
          </div>
        }
        open={copilotOpen}
        onCancel={() => setCopilotOpen(false)}
        footer={null}
        width={1100}
        centered
        destroyOnClose
        bodyStyle={{ padding: 0 }}
      >
        {copilotData ? (
          <div className="flex h-[75vh] w-full border-t border-gray-200">
            {/* 左侧：产物预览区 */}
            <div className="w-[60%] bg-[#fcfcfc] border-r border-gray-200 flex flex-col">
               <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">产物预览 (Live Preview)</span>
                  <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-bold">Auto-Sync</span>
               </div>
               <div className="flex-1 overflow-y-auto p-6 relative">
                 {/* 加载遮罩 */}
                 {copilotLoading && (
                   <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center transition-all">
                      <Spin size="large" />
                   </div>
                 )}
                 {renderPreview(copilotData.resultPayload)}
               </div>
            </div>

            {/* 右侧：对话调教区 */}
            <div className="w-[40%] bg-white flex flex-col">
               <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">反馈与微调 (Agent Chat)</span>
               </div>
               
               {/* 聊天记录 */}
               <div className="flex-1 p-4 overflow-y-auto space-y-5 bg-white scrollbar-thin scrollbar-thumb-gray-200">
                 
                 {/* 初始 AI 消息与 Think+Work */}
                 <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3 shrink-0">AI</div>
                    <div className="w-[85%]">
                      {/* 初次执行的 Think+Work 过程 */}
                      {copilotData.thinkLog && <ThinkBlock content={copilotData.thinkLog} />}
                      {copilotData.toolCallsLog && <ToolCallsBlock calls={JSON.parse(copilotData.toolCallsLog)} />}
                      
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-3 text-sm text-gray-800">
                        你好，我是 {copilotNode?.agent.split(',')[0]}。我已经完成了初步的任务。在左侧您可以预览最终的产物，如果有任何需要修改的地方，请直接告诉我！
                      </div>
                    </div>
                 </div>

                 {/* 历史对话 */}
                 {copilotData.copilotHistory && JSON.parse(copilotData.copilotHistory).map((msg: any, idx: number) => (
                   <div key={idx} className={`flex items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        msg.role === 'user' ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white ml-3' : 'bg-indigo-50 text-indigo-600 mr-3'
                      }`}>
                        {msg.role === 'user' ? 'ME' : 'AI'}
                      </div>
                      
                      <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                         {/* 渲染 AI 回复时的 Think 和 ToolCalls 如果有的话 */}
                         {msg.role === 'assistant' && msg.think && <ThinkBlock content={msg.think} />}
                         {msg.role === 'assistant' && msg.toolCalls && <ToolCallsBlock calls={msg.toolCalls} />}
                         
                         <div className={`rounded-2xl p-3 text-sm inline-block text-left ${
                           msg.role === 'user' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-sm' : 'bg-gray-50 text-gray-800 rounded-tl-sm'
                         }`}>
                           {msg.content}
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 {copilotLoading && (
                   <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mr-3 shrink-0">AI</div>
                      <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-3 text-sm text-gray-800 flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                   </div>
                 )}
                 <div ref={chatEndRef} />
               </div>
               
               {/* 输入框 */}
               <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 shadow-inner focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                    <input 
                      type="text" 
                      className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400"
                      placeholder="告诉 AI 哪里需要修改..."
                      value={copilotMessage}
                      onChange={(e) => setCopilotMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendCopilotMessage()}
                      disabled={copilotLoading}
                    />
                    <button 
                      onClick={sendCopilotMessage}
                      disabled={copilotLoading || !copilotMessage.trim()}
                      className="ml-2 w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
                    >
                      <Send className="w-4 h-4 -ml-0.5 mt-0.5" />
                    </button>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
            <span className="ml-3 text-gray-500 font-bold">加载任务数据中...</span>
          </div>
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}

// ==========================================
// 1.5 Document Editor View (Copilot for text agents)
// ==========================================
function DocumentEditorView({ taskId, agent, onClose }: { taskId: string; agent: string; onClose: () => void }) {
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
function ToolboxView({ initialPpt, onPptConsumed }: { initialPpt?: { slides: any[]; fileUrl: string; topic: string } | null; onPptConsumed?: () => void }) {
  const [activeTool, setActiveTool] = useState<'ppt' | 'legal' | null>(initialPpt ? 'ppt' : null);

  // PPT State
  const [pptForm, setPptForm] = useState({ topic: initialPpt?.topic || '', slideCount: '约10页', theme: 'blue', density: 'standard', background: '', preferences: '' });
  const [pptResult, setPptResult] = useState<{ slides: any[]; fileUrl: string } | null>(initialPpt ? { slides: initialPpt.slides, fileUrl: initialPpt.fileUrl } : null);
  const [pptLoading, setPptLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [pptView, setPptView] = useState<'presentation' | 'outline'>('presentation');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [pptChatHistory, setPptChatHistory] = useState<{role: 'user'|'bot'; content: string}[]>(initialPpt ? [{ role: 'bot', content: `已从 Edda 加载 ${initialPpt.slides.length} 页 PPT，你可以在左侧输入修改指令。` }] : []);
  const [pptChatInput, setPptChatInput] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  // Consume initial data so it doesn't re-trigger on tab switch
  useEffect(() => {
    if (initialPpt && onPptConsumed) {
      onPptConsumed();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Legal State
  const [legalForm, setLegalForm] = useState({ docType: 'NDA', partyA: '', partyB: '', keyTerms: '', background: '', templateStyle: '标准英式' });
  const [legalResult, setLegalResult] = useState<string | null>(null);
  const [legalLoading, setLegalLoading] = useState(false);

  const handleGeneratePPT = async () => {
    setPptLoading(true); setPptResult(null);
    try {
      const res = await fetch('/api/toolbox/ppt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pptForm) });
      const data = await res.json();
      if (data.success) setPptResult({ slides: data.slides, fileUrl: data.fileUrl });
      else alert(data.error || 'Generation failed');
    } catch { alert('Network error'); }
    setPptLoading(false);
  };

  const handleGenerateLegal = async () => {
    setLegalLoading(true); setLegalResult(null);
    try {
      const res = await fetch('/api/toolbox/legal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(legalForm) });
      const data = await res.json();
      if (data.success) setLegalResult(data.document);
      else alert(data.error || 'Generation failed');
    } catch { alert('Network error'); }
    setLegalLoading(false);
  };

  const THEMES = [
    { id: 'graphite', name: 'Modern Graphite', colors: ['#2D3436', '#DFE6E9', '#0984E3'] },
    { id: 'blue', name: 'Professional Blue', colors: ['#1E3A8A', '#3B82F6', '#DBEAFE'] },
    { id: 'emerald', name: 'Creative Emerald', colors: ['#065F46', '#10B981', '#D1FAE5'] },
    { id: 'light', name: 'Minimalist Light', colors: ['#64748B', '#94A3B8', '#F1F5F9'] },
  ];
  const DENSITIES = [
    { id: 'comprehensive', name: '全面详尽', desc: '内容丰富，适合详细报告' },
    { id: 'standard', name: '标准均衡', desc: '图文并茂，适用于多数场景' },
    { id: 'concise', name: '简洁有力', desc: '突出重点，适合高层汇报' },
    { id: 'minimalist', name: '极简视觉', desc: '一图一言，适合演讲' },
  ];
  const DOC_TYPES = ['NDA', 'MOU', '服务协议', '合作合同', '劳动合同'];
  const STYLES = ['标准英式', '中英双语', '简约版'];

  return (
    <div className="w-full h-full bg-[#f8f9fc] flex flex-col md:flex-row overflow-hidden">
      {/* Tool Sidebar */}
      <div className="w-full md:w-56 bg-white border-b md:border-b-0 md:border-r border-gray-200/80 p-3 md:p-4 flex md:flex-col shrink-0 overflow-x-auto md:overflow-x-visible">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 md:mb-4 px-2 hidden md:block">原子工具库</h2>
        <div className="flex md:flex-col gap-2 md:space-y-0">
          <button onClick={() => { setActiveTool('ppt'); setPptResult(null); }} className={`w-full text-left p-3 rounded-xl transition-all ${activeTool === 'ppt' ? 'bg-indigo-50 border border-indigo-100' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}>
            <h3 className={`text-xs font-bold flex items-center ${activeTool === 'ppt' ? 'text-indigo-700' : 'text-gray-700'}`}>
              <Presentation className={`w-3.5 h-3.5 mr-2 ${activeTool === 'ppt' ? 'text-indigo-500' : 'text-gray-400'}`} /> PPT 生成器
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">物理渲染出可下载 .pptx 文件</p>
          </button>
          <button onClick={() => { setActiveTool('legal'); setLegalResult(null); }} className={`w-full text-left p-3 rounded-xl transition-all ${activeTool === 'legal' ? 'bg-violet-50 border border-violet-100' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}>
            <h3 className={`text-xs font-bold flex items-center ${activeTool === 'legal' ? 'text-violet-700' : 'text-gray-700'}`}>
              <FileText className={`w-3.5 h-3.5 mr-2 ${activeTool === 'legal' ? 'text-violet-500' : 'text-gray-400'}`} /> 法律文书生成器
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">NDA / MOU / 合同草案</p>
          </button>
          <div className="border border-gray-100 p-3 rounded-xl opacity-40 hidden md:block">
            <h3 className="text-xs font-bold text-gray-500 flex items-center"><Calendar className="w-3.5 h-3.5 mr-2 text-gray-300" /> ICS 日历工具</h3>
            <p className="text-[10px] text-gray-300 mt-1">即将上线</p>
          </div>
          <div className="border border-gray-100 p-3 rounded-xl opacity-40 hidden md:block">
            <h3 className="text-xs font-bold text-gray-500 flex items-center"><Mail className="w-3.5 h-3.5 mr-2 text-gray-300" /> 邮件发送工具</h3>
            <p className="text-[10px] text-gray-300 mt-1">即将上线</p>
          </div>
        </div>
        <div className="mt-auto pt-4 border-t border-gray-100 hidden md:block">
          <p className="text-[9px] text-gray-300 px-2">AI 在底层调用相同的入参结构</p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto">
        {!activeTool && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
              <Wrench className="w-9 h-9 text-indigo-400" />
            </div>
            <h2 className="text-xl font-black text-gray-800 mb-2">选择一个工具开始</h2>
            <p className="text-sm text-gray-400 max-w-md">Toolbox 是人工可视化测试台。在这里验证工具的输入输出后，AI Agent 将以相同的参数协议自动调用。</p>
          </div>
        )}

        {/* ===== PPT TOOL ===== */}
        {activeTool === 'ppt' && !pptResult && (
          <div className="max-w-3xl mx-auto p-8 pb-20">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-gray-900">PPT 生成器</h1>
              <p className="text-sm text-gray-400 mt-1">填写参数 → AI 生成大纲 → pptxgenjs 渲染物理文件</p>
            </div>

            <div className="space-y-5">
              {/* Step 1 */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">第 1 步：基本信息</h3></div>
                <div className="p-5 space-y-3">
                  <input value={pptForm.topic} onChange={e => setPptForm({...pptForm, topic: e.target.value})} placeholder="演示文稿主题 *" className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                  <input value={pptForm.slideCount} onChange={e => setPptForm({...pptForm, slideCount: e.target.value})} placeholder="页数" className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400" />
                  <textarea value={pptForm.preferences} onChange={e => setPptForm({...pptForm, preferences: e.target.value})} placeholder="偏好设定（语气、风格、目标受众...）" rows={3} className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400 resize-none" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">第 2 步：视觉风格</h3></div>
                <div className="p-5 space-y-4">
                  <p className="text-[11px] font-bold text-gray-500">主题色</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {THEMES.map(t => (
                      <button key={t.id} onClick={() => setPptForm({...pptForm, theme: t.id})} className={`p-3 rounded-xl border-2 text-left transition-all ${pptForm.theme === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className="flex gap-1 mb-2">{t.colors.map((c,i) => <div key={i} className="w-3.5 h-3.5 rounded-full" style={{backgroundColor:c}} />)}</div>
                        <span className="text-[10px] font-bold text-gray-700">{t.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] font-bold text-gray-500 mt-4">信息密度</p>
                  <div className="grid grid-cols-2 gap-3">
                    {DENSITIES.map(d => (
                      <button key={d.id} onClick={() => setPptForm({...pptForm, density: d.id})} className={`p-3 rounded-xl border-2 text-left transition-all ${pptForm.density === d.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                        <span className="text-xs font-bold text-gray-700 block">{d.name}</span>
                        <span className="text-[10px] text-gray-400">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">第 3 步：背景资料</h3></div>
                <div className="p-5">
                  <textarea value={pptForm.background} onChange={e => setPptForm({...pptForm, background: e.target.value})} placeholder="在此粘贴背景资料、会议纪要、项目描述等..." rows={6} className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400 resize-none" />
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button onClick={handleGeneratePPT} disabled={!pptForm.topic || pptLoading} className="px-10 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-full shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
                  {pptLoading ? <><Spin size="small" /> 生成中...</> : <><Presentation className="w-4 h-4" /> 生成 PPT</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PPT Result — WYSIWYG Editor */}
        {activeTool === 'ppt' && pptResult && (() => {
          const slides = pptResult.slides;
          const slide = slides[currentSlide];
          const selectedElement = slide?.elements?.find((el: any) => el.id === selectedElementId);

          const updateElement = (elementId: string, updates: any) => {
            const newSlides = [...slides];
            const s = newSlides[currentSlide];
            s.elements = s.elements.map((el: any) => {
              if (el.id !== elementId) return el;
              const { style, ...rest } = updates;
              return { ...el, ...rest, style: style ? { ...el.style, ...style } : el.style };
            });
            setPptResult({ ...pptResult, slides: newSlides });
          };

          const updateStyle = (key: string, value: any) => {
            if (!selectedElementId) return;
            updateElement(selectedElementId, { style: { [key]: value } });
          };

          const handleCopilotSend = async () => {
            if (!pptChatInput.trim()) return;
            const msg = pptChatInput;
            setPptChatInput('');
            setPptChatHistory(prev => [...prev, { role: 'user', content: msg }]);
            setPptLoading(true);
            try {
              const res = await fetch('/api/toolbox/ppt', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slides, instruction: msg })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.slides) {
                  setPptResult({ ...pptResult, slides: data.slides });
                }
                setPptChatHistory(prev => [...prev, { role: 'bot', content: data.reply || '已更新幻灯片。' }]);
              } else {
                setPptChatHistory(prev => [...prev, { role: 'bot', content: '修改失败，请重试。' }]);
              }
            } catch {
              setPptChatHistory(prev => [...prev, { role: 'bot', content: '网络错误。' }]);
            }
            setPptLoading(false);
          };

          const insertSlideAt = (idx: number) => {
            const ts = Date.now();
            const newSlide = {
              backgroundColor: '#ffffff',
              elements: [
                { id: `title-${ts}`, type: 'TEXT_BOX', content: '新页面标题', x: 10, y: 10, width: 80, height: 15, style: { fontSize: 2.4, fontWeight: 'bold', textAlign: 'left', color: '#000000', backgroundColor: 'transparent', padding: 1, borderRadius: 0 } },
                { id: `body-${ts}`, type: 'TEXT_BOX', content: '在此输入内容...', x: 10, y: 30, width: 80, height: 60, style: { fontSize: 1.1, fontWeight: 'normal', textAlign: 'left', color: '#333333', backgroundColor: 'transparent', padding: 1, borderRadius: 0 } }
              ]
            };
            const ns = [...slides];
            ns.splice(idx, 0, newSlide);
            setPptResult({ ...pptResult, slides: ns });
          };

          return (
          <div className="h-full flex flex-col">
            {/* Top Bar */}
            <div className="px-4 md:px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => { setPptResult(null); setCurrentSlide(0); setPptChatHistory([]); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                <h2 className="text-sm font-black text-gray-900 hidden md:block">{pptForm.topic}</h2>
                {pptLoading && <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />}
              </div>
              <div className="flex bg-gray-100 p-0.5 rounded-xl">
                <button onClick={() => setPptView('presentation')} className={`px-4 py-1 rounded-lg text-[11px] font-black transition-all ${pptView === 'presentation' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>演示文稿</button>
                <button onClick={() => setPptView('outline')} className={`px-4 py-1 rounded-lg text-[11px] font-black transition-all ${pptView === 'outline' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>内容大纲</button>
              </div>
              <div className="flex gap-2">
                <a href={pptResult.fileUrl} download className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700 shadow-md"><Download className="w-3 h-3" /> 下载PPT</a>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left: Copilot Chat Panel */}
              <div className="hidden md:flex w-[300px] shrink-0 bg-white border-r border-gray-100 flex-col">
                <div className="p-4 border-b border-gray-50">
                  <h3 className="text-sm font-black text-gray-800">修改稿件</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {pptChatHistory.length === 0 && (
                    <div className="text-center text-gray-300 text-xs mt-10">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p>输入指令修改幻灯片</p>
                      <p className="mt-1 text-[10px]">如: "在第3页后加一页讲市场分析"</p>
                    </div>
                  )}
                  {pptChatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                      {msg.role === 'bot' && <div className="w-6 h-6 rounded-lg bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold">AI</div>}
                      <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-xs ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-50 border border-gray-100 text-gray-700'}`}>{msg.content}</div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t bg-white">
                  <div className="relative">
                    <textarea value={pptChatInput} onChange={e => setPptChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.metaKey || e.ctrlKey) && handleCopilotSend()} placeholder="输入指令 (如: '把第2页标题改成...')" rows={2} className="w-full p-3 pr-10 bg-gray-50 border rounded-xl text-xs outline-none resize-none focus:ring-2 focus:ring-indigo-500/20" />
                    <button onClick={handleCopilotSend} className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Send className="w-3 h-3" /></button>
                  </div>
                  <p className="text-[9px] text-gray-300 mt-1 px-1">Cmd + Enter 发送</p>
                </div>
              </div>

              {/* Right: Editor Area */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {pptView === 'presentation' ? (
                  /* ===== WYSIWYG Presentation Editor ===== */
                  <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Canvas */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex-1 flex items-center justify-center p-4 md:p-10 bg-gray-50 overflow-hidden relative group">
                        <div
                          style={{ backgroundColor: slide?.backgroundColor || '#fff', aspectRatio: '16 / 9' }}
                          className="w-full max-w-[900px] shadow-2xl relative rounded-sm overflow-hidden border border-gray-100"
                          onClick={() => setSelectedElementId(null)}
                        >
                          {slide?.elements?.map((element: any) => (
                            <div
                              key={element.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedElementId(element.id); }}
                              style={{
                                position: 'absolute',
                                left: `${element.x}%`, top: `${element.y}%`,
                                width: `${element.width}%`, height: `${element.height}%`,
                                color: element.style?.color || '#000',
                                backgroundColor: element.style?.backgroundColor || 'transparent',
                                fontSize: `clamp(0.4rem, ${element.style?.fontSize || 1}vw, ${element.style?.fontSize || 1}rem)`,
                                fontWeight: element.style?.fontWeight || 'normal',
                                textAlign: element.style?.textAlign || 'left',
                                padding: `${(element.style?.padding || 0) * 0.5}rem`,
                                borderRadius: `${element.style?.borderRadius || 0}px`,
                                display: 'flex', alignItems: 'center',
                                justifyContent: element.style?.textAlign === 'center' ? 'center' : element.style?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                                overflow: 'hidden', transition: 'all 0.1s ease-out',
                              }}
                              className={`cursor-pointer ${selectedElementId === element.id ? 'ring-2 ring-indigo-500 ring-offset-1' : 'hover:ring-1 hover:ring-indigo-300'}`}
                            >
                              <div className="w-full h-full whitespace-pre-wrap leading-snug">{element.content}</div>
                            </div>
                          ))}
                        </div>
                        {/* BG Color Float */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur p-1 rounded-lg shadow border border-white opacity-0 group-hover:opacity-100 transition-all">
                          <span className="text-[8px] font-bold text-gray-400 px-1">BG</span>
                          <input type="color" value={slide?.backgroundColor || '#ffffff'} onChange={e => { const ns = [...slides]; ns[currentSlide].backgroundColor = e.target.value; setPptResult({...pptResult, slides: ns}); }} className="w-6 h-6 rounded-full cursor-pointer border border-gray-100 bg-transparent" />
                        </div>
                      </div>
                      {/* Bottom Nav */}
                      <div className="h-14 bg-white border-t border-gray-100 flex items-center justify-center gap-4 px-4 shrink-0">
                        <button onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))} disabled={currentSlide === 0} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                        <span className="text-xs font-black text-gray-900">{currentSlide + 1} / {slides.length}</span>
                        <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))} disabled={currentSlide === slides.length - 1} className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>

                    {/* Property Panel */}
                    {selectedElement && (
                      <aside className="hidden md:flex w-[260px] bg-white border-l border-gray-100 flex-col shadow-lg shrink-0">
                        <div className="p-4 border-b flex items-center justify-between">
                          <h3 className="font-black text-gray-900 text-xs">元素编辑器</h3>
                          <button onClick={() => setSelectedElementId(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><XCircle className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                          {/* Layout */}
                          <div className="border-b pb-3">
                            <div className="px-3 py-2 flex items-center gap-2 bg-gray-50/50 rounded-lg mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Layout</span>
                            </div>
                            <div className="px-3 grid grid-cols-2 gap-3">
                              {(['x', 'y', 'width', 'height'] as const).map(key => (
                                <div key={key} className="space-y-0.5">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase">{key} (%)</label>
                                  <input type="number" value={selectedElement[key]} onChange={e => updateElement(selectedElementId!, { [key]: +e.target.value })} className="w-full p-1.5 bg-white border rounded-lg text-xs outline-none focus:border-indigo-500" />
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Text */}
                          <div className="border-b pb-3 pt-2">
                            <div className="px-3 py-2 flex items-center gap-2 bg-gray-50/50 rounded-lg mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Text</span>
                            </div>
                            <div className="px-3 space-y-3">
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-gray-400 uppercase">Size (rem)</label>
                                <input type="number" step="0.1" value={selectedElement.style?.fontSize || 1} onChange={e => updateStyle('fontSize', +e.target.value)} className="w-full p-1.5 bg-white border rounded-lg text-xs outline-none" />
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => updateStyle('fontWeight', selectedElement.style?.fontWeight === 'bold' ? 'normal' : 'bold')} className={`flex-1 p-2 rounded-lg border flex justify-center text-xs transition-all ${selectedElement.style?.fontWeight === 'bold' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-400'}`}>B</button>
                                <div className="flex bg-gray-100 p-0.5 rounded-lg flex-[2]">
                                  {(['left','center','right'] as const).map(a => (
                                    <button key={a} onClick={() => updateStyle('textAlign', a)} className={`flex-1 flex justify-center py-1.5 rounded-md text-[10px] transition-all ${selectedElement.style?.textAlign === a ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>{a === 'left' ? '◀' : a === 'center' ? '◆' : '▶'}</button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <label className="text-[8px] font-bold text-gray-400 uppercase">Text Color</label>
                                <input type="color" value={selectedElement.style?.color || '#000000'} onChange={e => updateStyle('color', e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-none p-0.5 bg-gray-50" />
                              </div>
                            </div>
                          </div>
                          {/* Style */}
                          <div className="pt-2">
                            <div className="px-3 py-2 flex items-center gap-2 bg-gray-50/50 rounded-lg mb-2">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Style</span>
                            </div>
                            <div className="px-3 space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-[8px] font-bold text-gray-400 uppercase">Background</label>
                                <button onClick={() => updateStyle('backgroundColor', 'transparent')} className="text-[8px] font-black text-indigo-600 underline">Transparent</button>
                              </div>
                              <input type="color" value={selectedElement.style?.backgroundColor === 'transparent' ? '#ffffff' : (selectedElement.style?.backgroundColor || '#ffffff')} onChange={e => updateStyle('backgroundColor', e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border-none p-0.5 bg-gray-50" />
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase">Padding</label>
                                  <input type="number" step="0.1" value={selectedElement.style?.padding || 0} onChange={e => updateStyle('padding', +e.target.value)} className="w-full p-1.5 bg-white border rounded-lg text-xs outline-none" />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-bold text-gray-400 uppercase">Radius</label>
                                  <input type="number" value={selectedElement.style?.borderRadius || 0} onChange={e => updateStyle('borderRadius', +e.target.value)} className="w-full p-1.5 bg-white border rounded-lg text-xs outline-none" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </aside>
                    )}
                  </div>
                ) : (
                  /* ===== Outline Editor ===== */
                  <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/30">
                    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-10">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-50">
                        <h2 className="text-lg font-black text-gray-900">内容大纲</h2>
                        <button onClick={() => insertSlideAt(slides.length)} className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold shadow hover:bg-indigo-700">
                          <Plus className="w-3 h-3" /> 尾部添加
                        </button>
                      </div>
                      <div className="space-y-3">
                        {slides.map((s: any, sIdx: number) => (
                          <React.Fragment key={s.elements?.[0]?.id || sIdx}>
                            {/* Insert button between slides */}
                            <div className="flex justify-center -my-1 opacity-0 hover:opacity-100 transition-opacity relative z-10">
                              <button onClick={() => insertSlideAt(sIdx)} className="bg-indigo-600 text-white p-0.5 rounded-full shadow hover:scale-125 transition-transform"><Plus className="w-3 h-3" /></button>
                            </div>
                            <div
                              draggable
                              onDragStart={() => setDragIdx(sIdx)}
                              onDragOver={e => e.preventDefault()}
                              onDrop={() => { if (dragIdx === null || dragIdx === sIdx) return; const ns = [...slides]; const [m] = ns.splice(dragIdx, 1); ns.splice(sIdx, 0, m); setPptResult({...pptResult, slides: ns}); setDragIdx(null); }}
                              className={`group relative p-5 bg-white border rounded-xl transition-all flex gap-4 ${dragIdx === sIdx ? 'opacity-30 border-dashed border-indigo-400' : 'border-gray-100 hover:border-indigo-400 hover:shadow-lg'}`}
                            >
                              <div className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing pt-1">
                                <div className="text-[9px] font-black text-gray-400 w-5 h-5 rounded-full border border-gray-100 flex items-center justify-center">{sIdx + 1}</div>
                                <span className="text-gray-200 text-[10px]">⋮⋮</span>
                              </div>
                              <div className="flex-1 space-y-3">
                                {s.elements?.slice(0, 2).map((el: any, eIdx: number) => (
                                  <textarea
                                    key={el.id}
                                    value={el.content}
                                    onChange={e => {
                                      const ns = [...slides];
                                      ns[sIdx].elements[eIdx] = { ...ns[sIdx].elements[eIdx], content: e.target.value };
                                      setPptResult({...pptResult, slides: ns});
                                    }}
                                    className={`w-full p-3 bg-gray-50/50 border border-gray-100 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all text-gray-800 resize-none ${eIdx === 0 ? 'font-bold text-sm h-12' : 'text-xs h-24 leading-relaxed'}`}
                                    placeholder={eIdx === 0 ? '幻灯片标题...' : '输入内容要点...'}
                                  />
                                ))}
                              </div>
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { const ns = [...slides]; ns.splice(sIdx, 1); setPptResult({...pptResult, slides: ns}); if (currentSlide >= ns.length) setCurrentSlide(Math.max(0, ns.length - 1)); }} className="p-1.5 text-gray-300 hover:text-red-500 transition-all rounded-lg hover:bg-red-50">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}









        {/* ===== LEGAL TOOL ===== */}
        {activeTool === 'legal' && !legalResult && (
          <div className="max-w-3xl mx-auto p-8 pb-20">
            <div className="mb-8">
              <h1 className="text-2xl font-black text-gray-900">法律文书生成器</h1>
              <p className="text-sm text-gray-400 mt-1">选择文书类型 → 填写各方信息 → 生成专业法律文书</p>
            </div>

            <div className="space-y-5">
              {/* Doc Type */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">文书类型</h3></div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {DOC_TYPES.map(t => (
                      <button key={t} onClick={() => setLegalForm({...legalForm, docType: t})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${legalForm.docType === t ? 'bg-violet-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">各方信息</h3></div>
                <div className="p-5 space-y-3">
                  <input value={legalForm.partyA} onChange={e => setLegalForm({...legalForm, partyA: e.target.value})} placeholder="甲方 (Party A) *" className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-violet-400" />
                  <input value={legalForm.partyB} onChange={e => setLegalForm({...legalForm, partyB: e.target.value})} placeholder="乙方 (Party B)" className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-violet-400" />
                </div>
              </div>

              {/* Key Terms */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">核心条款</h3></div>
                <div className="p-5">
                  <textarea value={legalForm.keyTerms} onChange={e => setLegalForm({...legalForm, keyTerms: e.target.value})} placeholder="核心条款描述（如：分成比例6:4、有效期3年、违约金10万）" rows={4} className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-violet-400 resize-none" />
                </div>
              </div>

              {/* Style */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">模板风格</h3></div>
                <div className="p-5">
                  <div className="flex gap-2">
                    {STYLES.map(s => (
                      <button key={s} onClick={() => setLegalForm({...legalForm, templateStyle: s})} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${legalForm.templateStyle === s ? 'bg-violet-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Background */}
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100"><h3 className="text-xs font-bold text-gray-600">背景资料（可选）</h3></div>
                <div className="p-5">
                  <textarea value={legalForm.background} onChange={e => setLegalForm({...legalForm, background: e.target.value})} placeholder="补充商业背景、谈判要点等" rows={4} className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none focus:border-violet-400 resize-none" />
                </div>
              </div>

              <div className="flex justify-center pt-4">
                <button onClick={handleGenerateLegal} disabled={!legalForm.partyA || legalLoading} className="px-10 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-full shadow-lg shadow-violet-500/20 hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2">
                  {legalLoading ? <><Spin size="small" /> 生成中...</> : <><FileText className="w-4 h-4" /> 生成文书</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Legal Result */}
        {activeTool === 'legal' && legalResult && (
          <div className="h-full flex flex-col">
            <div className="px-8 py-4 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-black text-gray-900">{legalForm.docType} — 生成完毕</h2>
                <p className="text-xs text-gray-400">甲方: {legalForm.partyA} | 乙方: {legalForm.partyB || '未指定'}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setLegalResult(null)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">重新生成</button>
                <button onClick={() => { navigator.clipboard.writeText(legalResult); alert('已复制到剪贴板'); }} className="px-5 py-2 bg-violet-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-violet-700 shadow-md">
                  <FileText className="w-3.5 h-3.5" /> 复制全文
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: marked(legalResult) as string }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 3. 技能管理视图 (Skills View)
// ==========================================
function SkillsView() {
  const { t } = useTranslation();
  const [selectedSkill, setSelectedSkill] = useState<number | null>(null);
  const skillDetails = [
    { icon: '🎓', title: '留学咨询标准流', desc: '串联 Alice(方案) -> Edda(宣讲PPT) -> Grace(发送邮件)', pipeline: ['Alice – 方案架构', 'Edda – PPT制作', 'Grace – 邮件分发'] },
    { icon: '🏢', title: '企业内控流', desc: '串联 David(审查) -> Fiona(通报Memo)', pipeline: ['David – 内控审查', 'Fiona – 通报宣发'] },
  ];
  if (selectedSkill !== null) {
    const s = skillDetails[selectedSkill];
    return (
      <div className="w-full h-full bg-white flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <button onClick={() => setSelectedSkill(null)} className="flex items-center text-sm text-gray-500 hover:text-gray-800 font-medium">
            <ChevronLeft className="w-4 h-4 mr-1" /> {t('bristh.skills.backToList')}
          </button>
        </div>
        <div className="flex-1 p-5 md:p-10 overflow-y-auto">
          <div className="text-4xl mb-3">{s.icon}</div>
          <h2 className="text-xl font-black text-gray-900 mb-2">{s.title}</h2>
          <p className="text-gray-500 mb-6">{s.desc}</p>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('bristh.skills.pipeline')}</h3>
          <div className="space-y-2">
            {s.pipeline.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-sm font-bold text-purple-600">{i+1}</div>
                <span className="text-sm font-medium text-gray-700">{a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="w-full h-full bg-white p-4 md:p-10 flex flex-col items-center justify-center text-center">
      <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
        <PenTool className="w-10 h-10 text-purple-600" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">{t('bristh.skills.title')}</h2>
      <p className="text-gray-500 max-w-md mb-8">{t('bristh.skills.desc')}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full text-left">
        <div className="border border-gray-200 p-5 rounded-xl hover:border-purple-500 transition-colors cursor-pointer" onClick={() => setSelectedSkill(0)}>
           <h3 className="font-bold text-gray-800 mb-1">🎓 留学咨询标准流</h3>
           <p className="text-xs text-gray-500">串联 Alice(方案) -> Edda(宣讲PPT) -> Grace(发送邮件)</p>
        </div>
        <div className="border border-gray-200 p-5 rounded-xl hover:border-purple-500 transition-colors cursor-pointer" onClick={() => setSelectedSkill(1)}>
           <h3 className="font-bold text-gray-800 mb-1">🏢 企业内控流</h3>
           <p className="text-xs text-gray-500">串联 David(审查) -> Fiona(通报Memo)</p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Others...
// ==========================================
function TaskHistoryView({ onOpenPptCopilot, onOpenDocCopilot }: { onOpenPptCopilot?: (data: { slides: any[]; fileUrl: string; topic: string }) => void; onOpenDocCopilot?: (data: { taskId: string; agent: string }) => void }) {
  const { t, i18n } = useTranslation();
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCtx, setSelectedCtx] = useState<any>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  // Copilot state (self-contained)
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotTask, setCopilotTask] = useState<any>(null);
  const [copilotMsg, setCopilotMsg] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/bristh/tasks?mode=history')
      .then(r => r.json())
      .then(data => { setContexts(Array.isArray(data) ? data : []); setLoading(false); if (data.length > 0) setSelectedCtx(data[0]); })
      .catch(() => { setContexts([]); setLoading(false); });
  }, []);

  const STATUS_BADGE: Record<string, { bg: string; text: string; label: string; dot: string }> = {
    COMPLETED: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: t('bristh.status.COMPLETED'), dot: 'bg-emerald-400' },
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-600', label: t('bristh.status.PENDING'), dot: 'bg-amber-400' },
    RUNNING: { bg: 'bg-blue-50', text: 'text-blue-600', label: t('bristh.status.RUNNING'), dot: 'bg-blue-400' },
    FAILED: { bg: 'bg-red-50', text: 'text-red-600', label: t('bristh.status.FAILED'), dot: 'bg-red-400' },
  };

  const SOURCE_MAP: Record<string, { label: string; icon: string }> = {
    EMAIL: { label: t('bristh.source.EMAIL'), icon: '📧' },
    TEXT_PASTE: { label: t('bristh.source.TEXT_PASTE'), icon: '✍️' },
    VOICE: { label: t('bristh.source.VOICE'), icon: '🎤' },
    API: { label: t('bristh.source.API'), icon: '🔗' },
  };

  const formatTime = (ts: string | number) => {
    try {
      const d = new Date(typeof ts === 'string' && !isNaN(Number(ts)) ? Number(ts) : ts);
      return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return String(ts); }
  };

  const formatDate = (ts: string | number) => {
    try {
      const d = new Date(typeof ts === 'string' && !isNaN(Number(ts)) ? Number(ts) : ts);
      return d.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return String(ts); }
  };

  const getOverallStatus = (tasks: any[]) => {
    if (tasks.every((t: any) => t.status === 'COMPLETED')) return 'COMPLETED';
    if (tasks.some((t: any) => t.status === 'FAILED')) return 'FAILED';
    if (tasks.some((t: any) => t.status === 'RUNNING')) return 'RUNNING';
    return 'PENDING';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const rerunTask = async (ctx: any) => {
    try {
      const res = await fetch('/api/bristh/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: ctx.source, rawContent: ctx.rawContent, locale: i18n.language })
      });
      if (res.ok) {
        // Reload history
        const data = await fetch('/api/bristh/tasks?mode=history').then(r => r.json());
        setContexts(data);
        setSelectedCtx(data[0]);
      }
    } catch (e) { console.error(e); }
  };

  const openCopilotForTask = async (task: any) => {
    // For Edda, redirect to ToolboxView's mature PPT editor
    if (task.agent === 'Edda' && onOpenPptCopilot) {
      try {
        const res = await fetch(`/api/bristh/tasks/${task.id}`);
        const data = await res.json();
        if (data.resultPayload) {
          const parsed = JSON.parse(data.resultPayload);
          if (parsed.rawSlides) {
            onOpenPptCopilot({
              slides: parsed.rawSlides,
              fileUrl: parsed.fileUrl || '',
              topic: data.instruction || 'Edda PPT',
            });
            return;
          }
        }
      } catch (e) {
        console.error('Failed to load Edda PPT data:', e);
      }
    }
    // For other agents, open DocumentEditorView
    if (onOpenDocCopilot) {
      onOpenDocCopilot({ taskId: task.id, agent: task.agent });
      return;
    }
    // Fallback: modal copilot
    setCopilotTask(null);
    setCopilotOpen(true);
    try {
      const res = await fetch(`/api/bristh/tasks/${task.id}`);
      const data = await res.json();
      setCopilotTask(data);
    } catch (e) { console.error(e); }
  };

  const sendCopilotMsg = async () => {
    if (!copilotMsg.trim() || !copilotTask) return;
    const msg = copilotMsg;
    setCopilotMsg('');
    setCopilotLoading(true);
    try {
      const res = await fetch(`/api/bristh/tasks/${copilotTask.id}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) {
        const updated = await fetch(`/api/bristh/tasks/${copilotTask.id}`).then(r => r.json());
        setCopilotTask(updated);
      }
    } catch (e) { console.error(e); }
    setCopilotLoading(false);
  };

  return (
    <div className="w-full h-full flex overflow-hidden bg-[#f8f9fc]">
      {/* Left: Task List */}
      <div className={`w-full md:w-80 border-r border-gray-200/80 bg-white flex-col shrink-0 ${mobileDetailOpen ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-black text-gray-800 flex items-center">
            <History className="w-4 h-4 mr-2 text-indigo-500" /> {t('bristh.history.title')}
          </h2>
          <p className="text-[10px] text-gray-400 mt-0.5">{contexts.length} 条任务记录</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40"><Spin /></div>
          ) : contexts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <History className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-xs">{t('bristh.history.noTask')}</p>
            </div>
          ) : (
            contexts.map((ctx: any) => {
              const overallStatus = getOverallStatus(ctx.tasks || []);
              const badge = STATUS_BADGE[overallStatus] || STATUS_BADGE.PENDING;
              const source = SOURCE_MAP[ctx.source] || { label: ctx.source, icon: '📄' };
              const isSelected = selectedCtx?.id === ctx.id;
              return (
                <button key={ctx.id} onClick={() => { setSelectedCtx(ctx); setMobileDetailOpen(true); }}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all ${isSelected ? 'bg-indigo-50/50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50 border-l-2 border-l-transparent'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{source.icon} {source.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>{badge.label}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-800 line-clamp-2">{ctx.rawContent?.slice(0, 80) || '无内容'}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-gray-400">{(ctx.tasks || []).length} 个子任务</span>
                    <span className="text-[10px] text-gray-300">{formatTime(ctx.createdAt)}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Detail Panel */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-6 ${!mobileDetailOpen ? 'hidden md:block' : ''}`}>
        <button onClick={() => setMobileDetailOpen(false)} className="md:hidden flex items-center text-sm text-gray-500 hover:text-gray-800 font-medium mb-4">
          <ChevronLeft className="w-4 h-4 mr-1" /> {t('bristh.history.backToList')}
        </button>
        {!selectedCtx ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <History className="w-16 h-16 mb-4 opacity-20" />
            <p className="font-medium">{t('bristh.history.selectToView')}</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Card 1: Task Info */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-gray-600 flex items-center"><FileText className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> {t('bristh.history.taskInfo')}</h3>
                <div className="flex gap-2">
                  <button onClick={() => copyToClipboard(selectedCtx.rawContent)} className="text-[10px] px-2 py-1 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 font-bold flex items-center gap-1">
                    <Copy className="w-3 h-3" /> {t('bristh.history.copy')}
                  </button>
                  <button onClick={() => rerunTask(selectedCtx)} className="text-[10px] px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> {t('bristh.history.rerun')}
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">{t('bristh.history.source')}</p>
                    <p className="text-xs font-medium text-gray-700">{(SOURCE_MAP[selectedCtx.source] || {}).icon} {(SOURCE_MAP[selectedCtx.source] || {}).label || selectedCtx.source}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">{t('bristh.history.time')}</p>
                    <p className="text-xs font-medium text-gray-700">{formatDate(selectedCtx.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">{t('bristh.history.subtaskCount')}</p>
                    <p className="text-xs font-medium text-gray-700">{(selectedCtx.tasks || []).length} 个</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">{t('bristh.history.status')}</p>
                    {(() => { const s = STATUS_BADGE[getOverallStatus(selectedCtx.tasks || [])] || STATUS_BADGE.PENDING; return <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${s.bg} ${s.text}`}>{s.label}</span>; })()}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">{t('bristh.history.modelUsed')}</p>
                    <p className="text-xs font-medium text-gray-700">{selectedCtx.modelUsed || <span className="text-gray-300">{t('bristh.history.noModel')}</span>}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 mb-1">{t('bristh.history.rawInput')}</p>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{selectedCtx.rawContent}</p>
                </div>
              </div>
            </div>

            {/* Card 2: Pipeline Timeline */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100">
                <h3 className="text-xs font-bold text-gray-600 flex items-center"><GitMerge className="w-3.5 h-3.5 mr-1.5 text-violet-400" /> {t('bristh.history.pipeline')}</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                  <div className="shrink-0 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">C</div>
                    <span className="text-[8px] text-gray-400 mt-1">Chief</span>
                  </div>
                  <div className="w-6 h-[2px] bg-gray-200 shrink-0" />
                  {(selectedCtx.tasks || []).map((task: any, idx: number) => {
                    const b = STATUS_BADGE[task.status] || STATUS_BADGE.PENDING;
                    return (
                      <React.Fragment key={task.id}>
                        <div className="shrink-0 flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${b.bg} ${b.text}`}>
                            {task.agent?.charAt(0)}
                          </div>
                          <span className="text-[8px] text-gray-400 mt-1">{task.agent}</span>
                        </div>
                        {idx < (selectedCtx.tasks || []).length - 1 && <div className="w-6 h-[2px] bg-gray-200 shrink-0" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Agent Cards */}
            <div className="space-y-3">
              {(selectedCtx.tasks || []).map((task: any) => {
                const badge = STATUS_BADGE[task.status] || STATUS_BADGE.PENDING;
                let resultSummary = '';
                let hasFile = false;
                let fileUrl = '';
                try {
                  const parsed = JSON.parse(task.resultPayload || '{}');
                  resultSummary = parsed.summary || '';
                  hasFile = !!parsed.fileUrl;
                  fileUrl = parsed.fileUrl || '';
                } catch { resultSummary = (task.resultPayload || '').slice(0, 200); }

                return (
                  <div key={task.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black ${badge.bg} ${badge.text}`}>
                          {task.agent?.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800">{task.agent}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${badge.bg} ${badge.text}`}>{badge.label}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">{task.instruction?.slice(0, 100)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {hasFile && (
                          <a href={fileUrl} download className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-bold flex items-center gap-1">
                            <Download className="w-3 h-3" /> 下载
                          </a>
                        )}
                        {task.status === 'COMPLETED' && (
                          <button onClick={() => openCopilotForTask(task)}
                            className="text-[10px] px-2 py-1 bg-violet-50 text-violet-600 rounded-lg hover:bg-violet-100 font-bold flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Copilot
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Result summary */}
                    {resultSummary && (
                      <div className="px-5 pb-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-gray-400 mb-1">执行产物</p>
                          <p className="text-xs text-gray-700">{resultSummary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Copilot Modal */}
      <Modal
        title={<div className="flex items-center text-lg font-black text-gray-800"><MessageSquare className="w-5 h-5 mr-2 text-violet-600" /> {copilotTask?.agent} Copilot</div>}
        open={copilotOpen}
        onCancel={() => setCopilotOpen(false)}
        footer={null}
        width={1000}
        centered
        destroyOnClose
      >
        {copilotTask ? (
          <div className="flex h-[70vh] border-t border-gray-200">
            <div className="w-[60%] bg-[#fcfcfc] border-r border-gray-200 flex flex-col">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">产物预览</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 relative">
                {renderPreviewStandalone(copilotTask.resultPayload)}
              </div>
            </div>
            <div className="w-[40%] bg-white flex flex-col">
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">反馈与微调</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {copilotTask.thinkLog && <ThinkBlock content={copilotTask.thinkLog} />}
                {copilotTask.toolCallsLog && <ToolCallsBlock calls={JSON.parse(copilotTask.toolCallsLog)} />}
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm p-3 text-sm text-gray-800">
                  我是 {copilotTask.agent}，任务已完成。如需修改请告诉我！
                </div>
                {copilotTask.copilotHistory && JSON.parse(copilotTask.copilotHistory).map((msg: any, idx: number) => (
                  <div key={idx} className={`flex items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white ml-2' : 'bg-blue-100 text-blue-600 mr-2'}`}>
                      {msg.role === 'user' ? 'ME' : 'AI'}
                    </div>
                    <div className={`max-w-[80%] rounded-2xl p-3 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-50 text-gray-800 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center bg-white border border-gray-300 rounded-full px-3 py-1.5 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
                  <input type="text" className="flex-1 outline-none text-sm bg-transparent placeholder-gray-400"
                    placeholder="告诉 AI 需要修改什么..."
                    value={copilotMsg} onChange={e => setCopilotMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendCopilotMsg()}
                    disabled={copilotLoading}
                  />
                  <button onClick={sendCopilotMsg} disabled={copilotLoading || !copilotMsg.trim()}
                    className="ml-2 w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white hover:bg-violet-500 disabled:opacity-50 shadow-sm">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64"><Spin size="large" /></div>
        )}
      </Modal>
    </div>
  );
}

function KnowledgeBaseView() {
  const { t } = useTranslation();
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    fetch('/api/bristh/kb')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContexts(data);
        } else {
          console.error('API returned non-array:', data);
          setContexts([]);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full h-full bg-[#f8faf9] flex overflow-hidden">
      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
          <Database className="w-6 h-6 mr-3 text-blue-600" /> {t('bristh.kb.title')}
        </h2>
        <p className="text-gray-500 mb-8 max-w-3xl">
          {t('bristh.kb.desc')}
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        ) : contexts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-50" />
            <p>{t('bristh.kb.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {contexts.map(ctx => (
              <div 
                key={ctx.id} 
                onClick={() => setSelectedItem(ctx)}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex flex-col h-56"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    ctx.source === 'TEXT' ? 'bg-blue-50 text-blue-600' :
                    ctx.source === 'FILE' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>
                    {ctx.source}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(ctx.createdAt).toLocaleDateString()} {new Date(ctx.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2 truncate">
                  {ctx.rawContent.substring(0, 40).replace(/\n/g, ' ')}{ctx.rawContent.length > 40 ? '...' : ''}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 flex-1">
                  {ctx.rawContent}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> 关联子任务: {ctx._count?.tasks || 0}
                  </span>
                  <span className="text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    查看原文 <ChevronRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center text-lg font-black text-gray-800">
            <Database className="w-5 h-5 mr-2 text-blue-600" /> 原始资产记录 (Raw Context)
          </div>
        }
        open={!!selectedItem}
        onCancel={() => setSelectedItem(null)}
        footer={null}
        width={800}
        centered
      >
        {selectedItem && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-sm font-bold text-gray-600">
                Asset ID: <span className="font-mono text-xs">{selectedItem.id}</span>
              </div>
              <div className="text-sm font-bold text-gray-600">
                Source: {selectedItem.source}
              </div>
            </div>
            <div className="bg-slate-900 text-gray-300 p-5 rounded-xl font-mono text-sm h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-700">
              {selectedItem.rawContent}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AISettingsView() {
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
