'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Modal, message } from 'antd';
import { BookOpen, ClipboardList, Brain, Plus, Trash2, FileText, ChevronRight, ChevronDown, User, Upload, Edit3, Save, X, Sparkles, Clock, Tag } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
interface KbLibrary { id: string; name: string; desc?: string; emoji?: string; fileCount?: number; updatedAt?: string; }
interface MemoryEntry { id: string; ts: string; type: string; source: string; content: string; importance: number; taskId?: string; }
interface AgentInfo { id: string; name: string; title: string; color: string; realistic_avatar?: string; }
interface AgentMemoryStats { hasSoul: boolean; todayCount: number; totalCount: number; lastMemoryDate: string | null; }

type TabKey = 'business' | 'task' | 'memory';

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  { key: 'business', label: '业务知识', icon: <BookOpen className="w-4 h-4" />, color: '#427759', desc: '公司、客户、行业的知识文档' },
  { key: 'task', label: '任务记忆', icon: <ClipboardList className="w-4 h-4" />, color: '#6366f1', desc: '从任务执行中积累的记录' },
  { key: 'memory', label: 'AI 私人记忆', icon: <Brain className="w-4 h-4" />, color: '#e11d48', desc: '每个 AI 的经验、教训和灵魂文件' },
];

// ── Business Knowledge Tab ─────────────────────────────────────────
function BusinessTab() {
  const router = useRouter();
  const [libs, setLibs] = useState<KbLibrary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLibs = async () => {
    try {
      const res = await fetch('/api/kb/libraries', { cache: 'no-store' });
      const data = await res.json();
      setLibs(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchLibs(); }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spin size="large" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">主动上传关于公司、客户和行业的知识文档</p>
        <button onClick={() => router.push('/kb')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md">
          <Plus className="w-3.5 h-3.5" /> 管理知识库
        </button>
      </div>
      {libs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">📚</div>
          <p className="text-gray-500 font-bold mb-1">还没有业务知识库</p>
          <p className="text-gray-400 text-sm">上传公司资料、客户信息、行业报告等</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {libs.map(lib => (
            <div key={lib.id} onClick={() => router.push(`/kb/${lib.id}?name=${encodeURIComponent(lib.name)}&emoji=${encodeURIComponent(lib.emoji || '📚')}`)}
              className="bg-white border border-gray-100 rounded-xl p-5 cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all group">
              <div className="text-3xl mb-3">{lib.emoji || '📚'}</div>
              <h3 className="font-bold text-gray-900 mb-1">{lib.name}</h3>
              {lib.desc && <p className="text-xs text-gray-400 mb-3">{lib.desc}</p>}
              <div className="text-[10px] text-gray-300">{lib.fileCount || 0} 个文档</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Task Memory Tab ────────────────────────────────────────────────
function TaskMemoryTab() {
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bristh/kb').then(r => r.json()).then(data => {
      setContexts(Array.isArray(data) ? data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Spin size="large" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">从 Office 管线任务执行中自动积累的记录</p>
      {contexts.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-3xl">📝</div>
          <p className="text-gray-500 font-bold mb-1">暂无任务记忆</p>
          <p className="text-gray-400 text-sm">在 Office 页面执行任务后，记忆会自动存入</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contexts.map((ctx: any) => (
            <div key={ctx.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-900 truncate">{ctx.title || '未命名任务'}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ctx.rawContent?.slice(0, 120)}...</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className="text-[10px] text-gray-300 bg-gray-50 px-2 py-1 rounded-lg">{ctx._count?.tasks || 0} 个子任务</span>
                  <span className="text-[10px] text-gray-300">{new Date(ctx.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AI Memory Tab ──────────────────────────────────────────────────
function AIMemoryTab() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [memories, setMemories] = useState<Record<string, MemoryEntry[]>>({});
  const [souls, setSouls] = useState<Record<string, string>>({});
  const [stats, setStats] = useState<Record<string, AgentMemoryStats>>({});
  const [editingSoul, setEditingSoul] = useState<string | null>(null);
  const [soulDraft, setSoulDraft] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bristh/agents/config').then(r => r.json()).then(data => {
      const agentList = (Array.isArray(data) ? data : []).filter((a: any) => a.id !== 'chief');
      setAgents(agentList);
      // Fetch stats for each agent
      agentList.forEach((a: AgentInfo) => {
        fetch(`/api/memory/${a.id}?type=stats`).then(r => r.json()).then(s => {
          setStats(prev => ({ ...prev, [a.id]: s }));
        }).catch(() => {});
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const loadAgentMemories = async (agentId: string) => {
    try {
      const [memRes, soulRes] = await Promise.all([
        fetch(`/api/memory/${agentId}?limit=30`),
        fetch(`/api/memory/soul/${agentId}`),
      ]);
      const memData = await memRes.json();
      const soulData = await soulRes.json();
      setMemories(prev => ({ ...prev, [agentId]: Array.isArray(memData) ? memData : [] }));
      setSouls(prev => ({ ...prev, [agentId]: soulData.content || '' }));
    } catch {}
  };

  const toggleAgent = (agentId: string) => {
    if (expandedAgent === agentId) {
      setExpandedAgent(null);
      setEditingSoul(null);
    } else {
      setExpandedAgent(agentId);
      loadAgentMemories(agentId);
    }
  };

  const saveSoul = async (agentId: string) => {
    try {
      await fetch(`/api/memory/soul/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: soulDraft }),
      });
      setSouls(prev => ({ ...prev, [agentId]: soulDraft }));
      setEditingSoul(null);
      message.success('灵魂文件已保存');
    } catch { message.error('保存失败'); }
  };

  const deleteMemory = async (agentId: string, memoryId: string) => {
    try {
      await fetch(`/api/memory/${agentId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId }),
      });
      setMemories(prev => ({
        ...prev,
        [agentId]: (prev[agentId] || []).filter(m => m.id !== memoryId),
      }));
      message.success('已删除');
    } catch { message.error('删除失败'); }
  };

  const typeLabels: Record<string, { label: string; color: string }> = {
    task_feedback: { label: '用户反馈', color: 'bg-amber-100 text-amber-700' },
    lesson_learned: { label: '经验教训', color: 'bg-blue-100 text-blue-700' },
    user_preference: { label: '用户偏好', color: 'bg-purple-100 text-purple-700' },
    task_summary: { label: '任务摘要', color: 'bg-emerald-100 text-emerald-700' },
    copilot_feedback: { label: 'Copilot', color: 'bg-cyan-100 text-cyan-700' },
    dreaming_insight: { label: '梦境洞察', color: 'bg-rose-100 text-rose-700' },
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Spin size="large" /></div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">每个 AI 从任务和交互中积累的经验、教训和灵魂文件</p>
      <div className="space-y-2">
        {agents.map(agent => {
          const agentStats = stats[agent.id];
          const isExpanded = expandedAgent === agent.id;
          const agentMemories = memories[agent.id] || [];
          const soulContent = souls[agent.id] || '';

          return (
            <div key={agent.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {/* Agent header */}
              <button onClick={() => toggleAgent(agent.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  {agent.realistic_avatar ? (
                    <img src={agent.realistic_avatar} alt={agent.name} className="w-9 h-9 rounded-xl object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <div className="text-left">
                    <h3 className="font-bold text-sm text-gray-900">{agent.name}</h3>
                    <p className="text-[10px] text-gray-400">{agent.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {agentStats && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-300">
                      {agentStats.hasSoul && <span className="bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-bold">🧠 灵魂</span>}
                      <span>{agentStats.totalCount} 条记忆</span>
                      {agentStats.todayCount > 0 && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">今日 +{agentStats.todayCount}</span>}
                    </div>
                  )}
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-gray-50 p-4 space-y-4 bg-gray-50/30">
                  {/* Soul file section */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-rose-50/50 border-b border-gray-100 flex items-center justify-between">
                      <h4 className="text-xs font-bold text-rose-700 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> 灵魂文件 (Soul File)
                      </h4>
                      {editingSoul === agent.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => saveSoul(agent.id)} className="text-[10px] px-3 py-1 bg-rose-600 text-white rounded-lg font-bold flex items-center gap-1">
                            <Save className="w-3 h-3" /> 保存
                          </button>
                          <button onClick={() => setEditingSoul(null)} className="text-[10px] px-3 py-1 bg-gray-100 text-gray-500 rounded-lg font-bold">取消</button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingSoul(agent.id); setSoulDraft(soulContent); }} className="text-[10px] px-3 py-1 bg-white text-rose-600 border border-rose-200 rounded-lg font-bold flex items-center gap-1 hover:bg-rose-50">
                          <Edit3 className="w-3 h-3" /> 编辑
                        </button>
                      )}
                    </div>
                    <div className="p-4">
                      {editingSoul === agent.id ? (
                        <textarea value={soulDraft} onChange={e => setSoulDraft(e.target.value)}
                          className="w-full h-48 text-xs leading-relaxed p-3 border border-gray-200 rounded-lg outline-none focus:border-rose-400 resize-none font-mono"
                          placeholder={`# ${agent.name} 的灵魂文件\n\n## 核心能力认知\n- ...\n\n## 已学教训\n- ...\n\n## 用户偏好\n- ...`} />
                      ) : soulContent ? (
                        <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{soulContent}</div>
                      ) : (
                        <div className="text-xs text-gray-300 text-center py-6">
                          暂无灵魂文件 — Dreaming Agent 会在每日总结时自动生成，你也可以手动编辑
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Memory entries */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-4 py-3 bg-blue-50/50 border-b border-gray-100">
                      <h4 className="text-xs font-bold text-blue-700 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> 记忆条目 ({agentMemories.length})
                      </h4>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {agentMemories.length === 0 ? (
                        <div className="text-xs text-gray-300 text-center py-8">暂无记忆 — 任务执行和用户反馈会自动写入</div>
                      ) : (
                        <div className="divide-y divide-gray-50">
                          {agentMemories.map(mem => {
                            const typeInfo = typeLabels[mem.type] || { label: mem.type, color: 'bg-gray-100 text-gray-600' };
                            return (
                              <div key={mem.id} className="px-4 py-3 hover:bg-gray-50/50 group">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${typeInfo.color}`}>{typeInfo.label}</span>
                                      <span className="text-[9px] text-gray-300">{new Date(mem.ts).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                      <span className="text-[9px] text-gray-200">重要性: {(mem.importance * 100).toFixed(0)}%</span>
                                    </div>
                                    <p className="text-xs text-gray-700 leading-relaxed">{mem.content}</p>
                                  </div>
                                  <button onClick={() => deleteMemory(agent.id, mem.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all shrink-0">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function AIKbPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('business');

  return (
    <div className="w-full h-full bg-[#f8f9fc] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-7 pb-2 shrink-0">
        <h1 className="text-xl font-black text-gray-900 tracking-tight">知识库</h1>
        <p className="text-xs text-gray-400 mt-1">AI 的大脑 — 业务知识 · 任务记忆 · 私人记忆</p>
      </div>

      {/* Tabs */}
      <div className="px-8 pt-3 pb-1 shrink-0">
        <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 w-fit shadow-sm">
          {TAB_CONFIG.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-5">
        {activeTab === 'business' && <BusinessTab />}
        {activeTab === 'task' && <TaskMemoryTab />}
        {activeTab === 'memory' && <AIMemoryTab />}
      </div>
    </div>
  );
}
