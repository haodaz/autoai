'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Plus, Pencil, Trash2, Settings2, Eye, FileText, Image as ImageIcon, ChevronLeft } from 'lucide-react';

const PRIMARY = '#427759';

interface CharacterItem {
  id: string;
  name: string;
  tagline?: string;
  ai_type?: string;
  persona?: string;
  intro?: string;
  description?: string;
  avatar?: string;
  assets?: Record<string, string>;
  slug?: string;
  public?: boolean;
  skills_preview?: string[];
  topic_tags?: string[];
  quick_prompts?: string[];
  extra_prompt?: string;
  disable_handoff?: boolean;
  theme_id?: string;
  memory_namespace?: string;
  skills?: { name: string; content: string }[];
  context_files?: Record<string, string>;
}

type ViewMode = 'list' | 'edit';

export default function AIManagePage() {
  const [chars, setChars] = useState<CharacterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editChar, setEditChar] = useState<CharacterItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Assets & Context docs state (for detail view)
  const [assets, setAssets] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);

  const loadChars = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/characters');
      const data = await res.json();
      setChars(Array.isArray(data) ? data : []);
    } catch { setChars([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadChars(); }, [loadChars]);

  const loadAssets = async (id: string) => {
    const r = await fetch(`/api/characters/${id}/assets`).then(r => r.json()).catch(() => []);
    setAssets(Array.isArray(r) ? r : []);
  };
  const loadDocs = async (id: string) => {
    const r = await fetch(`/api/characters/${id}/context`).then(r => r.json()).catch(() => []);
    setDocs(Array.isArray(r) ? r : []);
  };

  const openEditor = (char: CharacterItem) => {
    setEditChar({ ...char });
    setViewMode('edit');
    loadAssets(char.id);
    loadDocs(char.id);
  };

  const openNew = () => {
    setEditChar({
      id: '', name: '', tagline: '', description: '', persona: '',
      intro: '', extra_prompt: '', ai_type: 'official', slug: '',
      public: true, skills_preview: [], topic_tags: [], quick_prompts: [],
      skills: [],
    });
    setViewMode('edit');
    setAssets([]);
    setDocs([]);
  };

  const handleSave = async () => {
    if (!editChar) return;
    setSaving(true);
    try {
      const isNew = !editChar.id;
      const url = isNew ? '/api/admin/characters' : `/api/admin/characters/${editChar.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editChar),
      });
      if (res.ok) {
        await fetch('/api/characters/reload', { method: 'POST' }).catch(() => {});
        await loadChars();
        setViewMode('list');
      }
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此智能体？此操作不可撤销。')) return;
    await fetch(`/api/admin/characters/${id}`, { method: 'DELETE' });
    await fetch('/api/characters/reload', { method: 'POST' }).catch(() => {});
    loadChars();
  };

  const uploadAsset = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editChar?.id || !e.target.files?.length) return;
    const file = e.target.files[0];
    const fd = new FormData(); fd.append('file', file);
    await fetch(`/api/characters/${editChar.id}/assets`, { method: 'POST', body: fd });
    loadAssets(editChar.id);
    e.target.value = '';
  };

  const deleteAsset = async (name: string) => {
    if (!editChar?.id) return;
    await fetch(`/api/characters/${editChar.id}/assets/${encodeURIComponent(name)}`, { method: 'DELETE' });
    loadAssets(editChar.id);
  };

  const uploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editChar?.id || !e.target.files?.length) return;
    const file = e.target.files[0];
    const fd = new FormData(); fd.append('file', file);
    await fetch(`/api/characters/${editChar.id}/context`, { method: 'POST', body: fd });
    loadDocs(editChar.id);
    e.target.value = '';
  };

  const deleteDoc = async (docId: number | string) => {
    if (!editChar?.id) return;
    await fetch(`/api/characters/${editChar.id}/context/${encodeURIComponent(String(docId))}`, { method: 'DELETE' });
    loadDocs(editChar.id);
  };

  const set = (key: string, val: any) => setEditChar(prev => prev ? { ...prev, [key]: val } : null);

  // ── LIST VIEW ──
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#141b38]">智能体管理</h1>
            <p className="text-sm text-gray-500 mt-1">管理和配置平台的 AI 智能体角色</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors"
            style={{ background: PRIMARY }}
          >
            <Plus className="w-4 h-4 mr-2" />
            新建智能体
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">加载中…</div>
        ) : chars.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Bot className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400">暂无智能体，点击「新建智能体」开始</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {chars.map(c => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => openEditor(c)}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                      {(c.assets?.avatar || c.avatar) ? (
                        <img
                          src={c.assets?.avatar || c.avatar}
                          alt={c.name}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Bot className="w-7 h-7 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-semibold text-[#141b38] truncate">{c.name}</h3>
                        {c.public && (
                          <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: PRIMARY }}>
                            公开
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{c.tagline || c.description || '暂无介绍'}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {(c.skills_preview && c.skills_preview.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {c.skills_preview.slice(0, 4).map(s => (
                        <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom bar */}
                <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <span className="text-[11px] text-gray-400 font-mono">ID: {c.id}</span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); openEditor(c); }}
                      className="text-xs text-gray-500 hover:text-[#427759] flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" /> 编辑
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> 删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── EDIT VIEW ──
  const isNew = !editChar?.id;

  return (
    <div className="space-y-6 max-w-[900px]">
      {/* Top bar */}
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <button
          onClick={() => setViewMode('list')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          返回列表
        </button>
        <span className="text-gray-300">›</span>
        <span className="text-[15px] font-semibold text-[#141b38]">
          {isNew ? '新建智能体' : editChar?.name}
        </span>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: PRIMARY }}
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      {/* ── Section: 基本信息 ── */}
      <SectionCard icon={<Bot className="w-4 h-4" />} title="基本信息">
        {!isNew && <FormRow label="ID"><input value={editChar?.id || ''} disabled className="input-field bg-gray-50 text-gray-400" /></FormRow>}
        <FormRow label="名称"><input value={editChar?.name || ''} onChange={e => set('name', e.target.value)} className="input-field" placeholder="如：米德尔顿招生AI" /></FormRow>
        <FormRow label="一句话介绍"><input value={editChar?.tagline || ''} onChange={e => set('tagline', e.target.value)} className="input-field" placeholder="简短标签行" maxLength={60} /></FormRow>
        <FormRow label="描述"><textarea value={editChar?.description || ''} onChange={e => set('description', e.target.value)} className="input-field h-20" placeholder="完整介绍" /></FormRow>
        <FormRow label="Slug"><input value={editChar?.slug || ''} onChange={e => set('slug', e.target.value)} className="input-field" placeholder="url-friendly-id" /></FormRow>
        <FormRow label="记忆命名空间"><input value={(editChar as any)?.memory_namespace || ''} onChange={e => set('memory_namespace', e.target.value)} className="input-field" placeholder="如 admissions_ai（留空不启用）" /></FormRow>
        <FormRow label="">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={!!editChar?.public} onChange={e => set('public', e.target.checked)} className="rounded text-[#427759]" />
            公开可见
          </label>
        </FormRow>
      </SectionCard>

      {/* ── Section: 人格 & 提示词 ── */}
      <SectionCard icon={<Settings2 className="w-4 h-4" />} title="人格 & 提示词">
        <FormRow label="开场白 (intro)">
          <textarea value={editChar?.intro || ''} onChange={e => set('intro', e.target.value)} className="input-field h-20" placeholder="用户进入对话后看到的第一段话" />
        </FormRow>
        <FormRow label="系统人格 (persona)" hint="核心人设指令，知识库文档自动注入其中">
          <textarea value={editChar?.persona || ''} onChange={e => set('persona', e.target.value)} className="input-field h-48 font-mono text-[13px]" placeholder="【身份设定】你是一位……" />
        </FormRow>
        <FormRow label="额外提示词" hint="追加到 persona 之后，用于工具调用提示等">
          <textarea value={editChar?.extra_prompt || ''} onChange={e => set('extra_prompt', e.target.value)} className="input-field h-24 font-mono text-[13px]" placeholder="当被问及……时，请使用 xxx 工具……" />
        </FormRow>
      </SectionCard>

      {/* ── Section: 快捷提问 ── */}
      <SectionCard icon="💬" title="快捷提问">
        <div className="space-y-2">
          {(editChar?.quick_prompts || []).map((q, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={q}
                onChange={e => {
                  const arr = [...(editChar?.quick_prompts || [])];
                  arr[i] = e.target.value;
                  set('quick_prompts', arr);
                }}
                className="input-field flex-1"
              />
              <button onClick={() => set('quick_prompts', (editChar?.quick_prompts || []).filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          ))}
          <button
            onClick={() => set('quick_prompts', [...(editChar?.quick_prompts || []), ''])}
            className="text-sm flex items-center gap-1 hover:text-[#427759] text-gray-500"
          >
            <Plus className="w-3.5 h-3.5" /> 添加提问
          </button>
        </div>
      </SectionCard>

      {/* ── Section: 技能标签 ── */}
      <SectionCard icon="🏷️" title="技能标签">
        <TagsEditor
          value={editChar?.skills_preview || []}
          onChange={v => set('skills_preview', v)}
          placeholder="输入标签，回车添加"
        />
      </SectionCard>

      {/* ── Section: 形象素材 ── */}
      {!isNew && (
        <SectionCard icon={<ImageIcon className="w-4 h-4" />} title={`形象素材 (${assets.length} 张)`}>
          <div className="mb-3">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#427759] hover:text-[#427759] cursor-pointer transition-colors">
              <Plus className="w-3.5 h-3.5" /> 上传图片
              <input type="file" accept="image/*" className="hidden" onChange={uploadAsset} />
            </label>
          </div>
          {assets.length === 0 ? (
            <p className="text-sm text-gray-400">暂无素材</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {assets.map(a => (
                <div key={a.name} className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img src={a.url} alt={a.name} className="w-full h-24 object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => deleteAsset(a.filename || a.name)} className="text-white text-xs bg-red-500/80 px-2 py-1 rounded-lg">删除</button>
                  </div>
                  <p className="text-center text-[11px] text-gray-500 py-1 truncate px-1">{a.filename || a.name}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Section: 背景文档 ── */}
      {!isNew && (
        <SectionCard icon={<FileText className="w-4 h-4" />} title={`背景文档 (${docs.length} 个)`}>
          <div className="mb-3">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-[#427759] hover:text-[#427759] cursor-pointer transition-colors">
              <Plus className="w-3.5 h-3.5" /> 添加文档
              <input type="file" accept=".txt,.md,.csv,.json,.pdf,.docx" className="hidden" onChange={uploadDoc} />
            </label>
          </div>
          {docs.length === 0 ? (
            <p className="text-sm text-gray-400">暂无文档</p>
          ) : (
            <div className="space-y-2">
              {docs.map(d => (
                <div key={d.id || d.name} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">{d.name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{d.size > 1024 ? `${(d.size/1024).toFixed(1)}KB` : `${d.size}B`}</span>
                  </div>
                  <button onClick={() => deleteDoc(d.id)} className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">删除</button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Bottom save */}
      <div className="flex justify-end pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50"
          style={{ background: PRIMARY }}
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>
    </div>
  );
}

// ── Reusable sub-components ──

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50 bg-gray-50/40 flex items-center gap-2">
        <span className="text-[#427759]">{icon}</span>
        <h3 className="text-sm font-semibold text-[#141b38]">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 items-start">
      <div className="pt-2 text-sm text-gray-500 text-right">{label}</div>
      <div>
        {children}
        {hint && <p className="text-[11px] text-gray-400 mt-1">{hint}</p>}
      </div>
    </div>
  );
}

function TagsEditor({ value, onChange, placeholder }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  };
  return (
    <div className="border border-gray-200 rounded-lg p-2 min-h-[38px] bg-white">
      <div className="flex flex-wrap gap-1.5">
        {value.map(v => (
          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] bg-[#427759]/10 text-[#427759]">
            {v}
            <button onClick={() => onChange(value.filter(x => x !== v))} className="opacity-60 hover:opacity-100">×</button>
          </span>
        ))}
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          onBlur={add}
          placeholder={value.length ? '' : placeholder}
          className="border-none outline-none text-sm text-gray-700 bg-transparent min-w-[100px] flex-1"
        />
      </div>
    </div>
  );
}
