'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/useIsMobile';
import { Input, Button, Empty, Tooltip, Avatar, Divider, Drawer, Dropdown, message } from 'antd';
import {
  SearchOutlined,
  CloudDownloadOutlined,
  ClockCircleOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  EyeOutlined,
  DownloadOutlined,
  BankOutlined,
  UserOutlined,
  AppstoreOutlined,
  FilterOutlined,
  SwapOutlined
} from '@ant-design/icons';
import type { SharedKbFile } from '@/components/kb/SharedKbViewer';

// ── Portal 包装：挂到 body 上，绕过 overflow:hidden 祖先容器 ──────────────
function BodyPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

// ── 字段类型（对齐一答后台） ──────────────────────────────────────────────
export interface ThinkTankArticle extends SharedKbFile {
  category: string;
  scene: string;
  keywords: string[];
  author?: string;
  institution?: string;
  pageCount?: number;
  fileSize?: string;
  previewUrl?: string;
  fileName?: string;
}

// ── API 字段映射 ──────────────────────────────────────────────────────────
const SCENE_KEY_MAP: Record<string, string> = {
  higher_education: '高教一答',
  personal:         '个人发展',
  organizational:   '人才培养',
  international:    '国际化',
  educational_administration: '教务助手'
};

function mapApiItem(raw: Record<string, unknown>): ThinkTankArticle {
  const kinds      = (raw.kind_key as string[] | undefined) || [];
  const sceneKeys  = (raw.scene_key as string[] | undefined) || [];
  const sceneLabel = sceneKeys.map(s => SCENE_KEY_MAP[s] || s).join('、') || '高教一答';

  // 实际字段：description = 正文/摘要，es_highlight = 搜索高亮 HTML
  const description = (raw.description || '') as string;
  const esHighlight = (raw.es_highlight || '') as string;
  // content 优先用正文，fallback 到高亮
  const content = description || esHighlight;

  // 文件附件（有 PDF 的记录才有此字段，可能是 string 或 string[]）
  type FileRecord = { download_url?: string; name?: string };
  const rawFiles         = (raw.relevant_files_ids as FileRecord[] | undefined) || [];
  const rawFileUrl       = raw['relevant_files_ids.download_url'];
  const flatDownloadUrls: string[] = Array.isArray(rawFileUrl)
    ? rawFileUrl as string[]
    : (typeof rawFileUrl === 'string' && rawFileUrl ? [rawFileUrl] : []);
  const firstDownloadUrl = rawFiles[0]?.download_url || flatDownloadUrls[0] || '';
  const firstName        = rawFiles[0]?.name || '';

  // 代理 URL：将 Content-Disposition: attachment 转成 inline，支持 iframe 预览
  const proxyUrl = firstDownloadUrl
    ? `/api/higher-education/file-proxy?url=${encodeURIComponent(firstDownloadUrl)}`
    : '';

  return {
    id:            raw.id as number,
    title:         (raw.title || raw.name || '无标题') as string,
    type:          kinds[0] || '知识文章',
    category:      '高教知识',
    scene:         sceneLabel,
    keywords:      kinds,
    summary:       description.substring(0, 200) || esHighlight.substring(0, 200),
    content,
    fileDate:      ((raw.latest_modified as string) || '').substring(0, 10),
    allowDownload: !!firstDownloadUrl,
    externalLink:  firstDownloadUrl || undefined,
    previewUrl:    proxyUrl || undefined,
    fileName:      firstName || undefined,
    views:         (raw.view_count as number) || 0,
    downloads:     (raw.download_count as number) || 0,
  };
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  '研究报告':  { bg: 'rgba(96,85,245,0.08)',  color: '#427759' },
  '政策文件':  { bg: 'rgba(37,99,235,0.08)',  color: '#2563eb' },
  '高教数据':  { bg: 'rgba(5,150,105,0.08)',  color: '#059669' },
  '专家观点':  { bg: 'rgba(217,119,6,0.08)',  color: '#d97706' },
  '学术论文':  { bg: 'rgba(124,58,237,0.08)', color: '#7c3aed' },
};

const SCENE_OPTIONS = ['全部', '高教一答', '教务助手', '人才培养', '国际化'];
const TYPE_OPTIONS  = ['全部', '政策文件', '研究报告', '高教数据', '专家观点', '学术论文'];

// ── 文章卡片组件 ────────────────────────────────────────────────────────
function ArticleCard({ article, onClick }: { article: ThinkTankArticle; onClick: () => void }) {
  const typeStyle = TYPE_COLORS[article.type || ''] || { bg: '#f1f5f9', color: '#64748b' };
  
  return (
    <div
      onClick={onClick}
      className="group bg-white p-5 md:p-6 rounded-2xl border border-black/5 hover:border-[#427759]/30 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col gap-4 relative overflow-hidden mb-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold px-2.5 py-1 rounded-md" style={{ background: typeStyle.bg, color: typeStyle.color }}>
            {article.type}
          </span>
          <span className="text-[12px] bg-black/5 text-black/60 px-2.5 py-1 rounded-md">
            {article.scene}
          </span>
        </div>
        {article.allowDownload && (
          <Tooltip title="包含可下载附件">
            <div className="w-8 h-8 rounded-full bg-[#427759]/5 flex items-center justify-center text-[#427759] opacity-60 group-hover:opacity-100 transition-opacity">
              <CloudDownloadOutlined className="text-base" />
            </div>
          </Tooltip>
        )}
      </div>

      <div>
        <h3 className="text-[18px] font-bold text-black/85 group-hover:text-[#427759] transition-colors line-clamp-2 leading-snug mb-2">
          {article.title}
        </h3>
        <p className="text-[14px] text-black/60 line-clamp-2 leading-relaxed m-0">
          {article.summary}
        </p>
      </div>

      {(article.author || article.institution || article.pageCount || article.fileSize) && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-black/50 items-center bg-[#f8f9fa] p-3 rounded-xl border border-black/5">
          {article.author && <span className="flex items-center gap-1.5"><UserOutlined /> {article.author}</span>}
          {article.institution && <span className="flex items-center gap-1.5"><BankOutlined /> {article.institution}</span>}
          {article.pageCount && <span className="flex items-center gap-1.5"><FileTextOutlined /> {article.pageCount} 页</span>}
          {article.fileSize && <span className="flex items-center gap-1.5"><CloudDownloadOutlined /> {article.fileSize}</span>}
        </div>
      )}

      <div className="flex justify-between items-center mt-1 pt-4 border-t border-black/5">
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[12px] text-black/45">
          <span className="flex items-center gap-1.5 font-medium"><ClockCircleOutlined /> {article.fileDate}</span>
          <div className="w-[1px] h-3.5 bg-gray-300 hidden md:block" />
          <span className="flex items-center gap-1.5"><EyeOutlined /> {article.views?.toLocaleString()} 阅</span>
          <span className="flex items-center gap-1.5"><DownloadOutlined /> {article.downloads?.toLocaleString()} 载</span>
        </div>
        <div className="text-[13px] font-bold text-[#427759] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          阅读全文 <ArrowRightOutlined />
        </div>
      </div>
    </div>
  );
}

// ── 侧边栏菜单组件 ────────────────────────────────────────────────────────
const SidebarMenu = ({ title, options, value, onChange }: { title: string, options: string[], value: string, onChange: (v: string) => void }) => (
  <div style={{ padding: '0 12px 16px' }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', marginBottom: 6, padding: '0 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
      {title}
    </div>
    {options.map(opt => {
      const isActive = value === opt;
      return (
        <div
          key={opt}
          onClick={() => onChange(opt)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 10px', borderRadius: 10, cursor: 'pointer', marginBottom: 1,
            background: isActive ? 'rgba(96,85,245,0.10)' : 'transparent',
            color: isActive ? '#427759' : 'rgba(0,0,0,0.68)',
            fontWeight: isActive ? 600 : 400, fontSize: 13,
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}
          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {opt}
        </div>
      );
    })}
  </div>
);

// ── 主组件 ─────────────────────────────────────────────────────────────────
export default function ThinkTankTab({ onDetailChange }: { onDetailChange?: (isDetail: boolean) => void }) {
  const isMobile = useIsMobile();
  const router   = useRouter();
  const [search, setSearch]     = useState('');
  const [scene, setScene]       = useState('全部');
  const [type, setType]         = useState('全部');
  const [sort, setSort]         = useState<'platform' | 'doc' | 'name'>('platform');
  const [nameSortAsc, setNameSortAsc] = useState(true);
  const [articles, setArticles] = useState<ThinkTankArticle[]>([]);
  const [loading, setLoading]   = useState(true);
  const [total, setTotal]       = useState(0);

  // 移动端专用状态
  const [searchMode, setSearchMode] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // 拉取知识库数据（搜索防抖 400ms）
  const fetchArticles = useCallback(async (q: string, currentSort: 'platform' | 'doc' | 'name') => {
    setLoading(true);
    try {
      const sortby = currentSort === 'doc' ? '-published_date' : (currentSort === 'name' ? '' : '-release_date');
      const url = sortby
        ? `/api/higher-education/search?query=${encodeURIComponent(q)}&size=50&sortby=${sortby}`
        : `/api/higher-education/search?query=${encodeURIComponent(q)}&size=50`;
      const res  = await fetch(url);
      const data = await res.json();
      const items = (data.items || []) as Record<string, unknown>[];
      setArticles(items.map(mapApiItem));
      setTotal(data.total || items.length);
    } catch (e) {
      console.error('ThinkTankTab fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchArticles(search, sort), search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [search, sort, fetchArticles]);

  // 点击文章 → 进入专属知识库页面
  const openArticle = (a: ThinkTankArticle) => {
    router.push(`/kb/thinktank?id=${a.id}`);
  };

  // 本地过滤（场景 + 类型 + 严格搜索）+ 名称排序
  const filtered = articles.filter(a => {
    const matchSc = scene === '全部' || a.scene.includes(scene) || a.keywords.some(k => k === scene);
    const matchTy = type  === '全部' || a.type === type || a.keywords.includes(type);
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.summary.toLowerCase().includes(search.toLowerCase());
    return matchSc && matchTy && matchSearch;
  }).sort((a, b) => {
    if (sort !== 'name') return 0;
    return a.title.localeCompare(b.title, 'zh-CN', { sensitivity: 'base' }) * (nameSortAsc ? 1 : -1);
  });

  // 列表页视图 (左侧边栏 + 右侧内容)
  return (
    <div className="flex h-full overflow-hidden bg-transparent">
      
      {/* ── 左侧边栏 ── */}
      {!isMobile && (
        <div className="w-[260px] shrink-0 h-full p-4 pr-0 flex flex-col">
          <div className="flex-1 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
          {/* 搜索框 */}
          <div style={{ padding: '18px 14px 14px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: '#fff', borderRadius: 12, padding: '10px 14px',
              border: '1.5px solid rgba(223,227,245,1)',
              boxShadow: '0 1px 6px rgba(96,85,245,0.07)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}>
              <SearchOutlined style={{ color: '#a0aec0', fontSize: 14, flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索文献、作者…"
                style={{
                  flex: 1, border: 'none', background: 'none',
                  fontSize: 14, outline: 'none', color: '#1a202c',
                  fontFamily: 'inherit', lineHeight: 1.5,
                }}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ border: 'none', background: 'rgba(0,0,0,0.06)', cursor: 'pointer',
                    color: '#9ca3af', width: 18, height: 18, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, lineHeight: 1, flexShrink: 0, padding: 0 }}>
                  ×
                </button>
              )}
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 4 }}>
            <SidebarMenu title="内容场景" options={SCENE_OPTIONS} value={scene} onChange={setScene} />
            <SidebarMenu title="文献类型" options={TYPE_OPTIONS} value={type} onChange={setType} />
          </div>
        </div>
        </div>
      )}

      {/* ── 右侧主体 ── */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-[1000px] mx-auto p-4 md:p-8">
          
          {/* 移动端顶栏（紧凑型标签 + 搜索栏切换） */}
          {isMobile && (
            <div style={{ margin: '-16px -16px 20px -16px', borderBottom: '1px solid rgba(223,227,245,0.4)', background: 'transparent' }}>
              {!searchMode ? (
                <div style={{ display: 'flex', alignItems: 'center', height: 46 }}>
                  {/* 左侧：搜索 + 筛选按钮 */}
                  <div style={{ display: 'flex', gap: 6, padding: '0 8px 0 12px', flexShrink: 0,
                    borderRight: '1px solid rgba(223,227,245,0.5)', height: '100%', alignItems: 'center' }}>
                    <button onClick={() => setSearchMode(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
                        border: '1.5px solid rgba(223,227,245,0.9)', background: 'rgba(255,255,255,0.6)', color: '#555', fontSize: 12.5,
                        fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <SearchOutlined style={{ fontSize: 12 }} />搜索
                    </button>
                    <button onClick={() => setShowFilter(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, position: 'relative',
                        border: `1.5px solid ${(scene !== '全部' || type !== '全部') ? '#427759' : 'rgba(223,227,245,0.9)'}`,
                        background: (scene !== '全部' || type !== '全部') ? '#f0edf9' : 'rgba(255,255,255,0.6)',
                        color: (scene !== '全部' || type !== '全部') ? '#427759' : '#555',
                        fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <FilterOutlined style={{ fontSize: 12 }} />
                      筛选
                      {(scene !== '全部' || type !== '全部') && <div style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, borderRadius: '50%', background: '#427759' }} />}
                    </button>
                  </div>
                  {/* 右侧：场景 + 类型 Tags 合并滚动（单选，一个全部） */}
                  <div style={{ display: 'flex', gap: 7, padding: '0 12px 0 8px', overflowX: 'auto',
                    scrollbarWidth: 'none', alignItems: 'center', flex: 1 }} className="hide-scrollbar">
                    {/* 全部 - 一个公共入口 */}
                    <button key="all" onClick={() => { setScene('全部'); setType('全部'); }}
                      style={{ padding: '5px 12px', borderRadius: 20,
                        border: `1.5px solid ${scene === '全部' && type === '全部' ? '#427759' : '#e5e7eb'}`,
                        background: scene === '全部' && type === '全部' ? '#f0edf9' : 'transparent',
                        color: scene === '全部' && type === '全部' ? '#427759' : '#555', fontSize: 12.5,
                        fontWeight: scene === '全部' && type === '全部' ? 600 : 500, whiteSpace: 'nowrap', flexShrink: 0,
                        cursor: 'pointer', transition: 'all .2s' }}>
                      全部
                    </button>
                    {/* 内容场景（不含全部） */}
                    {SCENE_OPTIONS.filter(o => o !== '全部').map(opt => {
                      const isActive = scene === opt;
                      return (
                        <button key={`scene-${opt}`} onClick={() => { setScene(opt); setType('全部'); }}
                          style={{ padding: '5px 12px', borderRadius: 20,
                            border: `1.5px solid ${isActive ? '#427759' : '#e5e7eb'}`,
                            background: isActive ? '#f0edf9' : 'transparent',
                            color: isActive ? '#427759' : '#555', fontSize: 12.5,
                            fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', flexShrink: 0,
                            cursor: 'pointer', transition: 'all .2s' }}>
                          {opt}
                        </button>
                      );
                    })}
                    {/* 文献类型（不含全部） */}
                    {TYPE_OPTIONS.filter(o => o !== '全部').map(opt => {
                      const isActive = type === opt;
                      return (
                        <button key={`type-${opt}`} onClick={() => { setType(opt); setScene('全部'); }}
                          style={{ padding: '5px 12px', borderRadius: 20,
                            border: `1.5px solid ${isActive ? '#427759' : '#e5e7eb'}`,
                            background: isActive ? '#f0edf9' : 'transparent',
                            color: isActive ? '#427759' : '#555', fontSize: 12.5,
                            fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', flexShrink: 0,
                            cursor: 'pointer', transition: 'all .2s' }}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* 搜索输入模式 */
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 46 }}>
                  <SearchOutlined style={{ color: '#9ca3af', fontSize: 14 }} />
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder={`搜索 ${total} 篇文献…`}
                    style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 14, color: '#1a202c' }} />
                  <button onClick={() => { setSearchMode(false); setSearch(''); }}
                    style={{ border: 'none', background: 'none', color: '#427759', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                    取消
                  </button>
                </div>
              )}

              {/* 移动端高级筛选 - 通过 BodyPortal 挂到 body，绕过 overflow:hidden 祖先 */}
              <BodyPortal>
                <>
                  {showFilter && (
                    <div onClick={() => setShowFilter(false)}
                      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                        paddingBottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}>
                      <div onClick={e => e.stopPropagation()}
                        style={{ background: '#fff', borderRadius: '20px 20px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column', animation: 'ttSlideUp 0.28s ease-out' }}>
                        <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '12px auto 0', flexShrink: 0 }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 12px', flexShrink: 0 }}>
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>筛选</div>
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => { setScene('全部'); setType('全部'); }}
                              style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: 13, cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit' }}>取消选择</button>
                            <button onClick={() => setShowFilter(false)}
                              style={{ border: 'none', background: 'none', color: '#9ca3af', fontSize: 20, cursor: 'pointer', lineHeight: '1' }}>×</button>
                          </div>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '0 20px', flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12 }}>内容场景</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                            {SCENE_OPTIONS.map(opt => {
                              const isActive = scene === opt;
                              return (
                                <button key={opt} onClick={() => setScene(opt)}
                                  style={{ padding: '8px 16px', borderRadius: 20, border: isActive ? '1px solid #fca5a5' : '1px solid transparent', background: isActive ? '#fef2f2' : '#f1f5f9', color: isActive ? '#ef4444' : '#475569', fontSize: 14, fontWeight: isActive ? 500 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12 }}>文献类型</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                            {TYPE_OPTIONS.map(opt => {
                              const isActive = type === opt;
                              return (
                                <button key={opt} onClick={() => setType(opt)}
                                  style={{ padding: '8px 16px', borderRadius: 20, border: isActive ? '1px solid #fca5a5' : '1px solid transparent', background: isActive ? '#fef2f2' : '#f1f5f9', color: isActive ? '#ef4444' : '#475569', fontSize: 14, fontWeight: isActive ? 500 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ padding: '12px 20px 28px', flexShrink: 0, background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                          <button onClick={() => setShowFilter(false)}
                            style={{ width: '100%', padding: 14, background: 'linear-gradient(135deg, #427759, #8b5cf6)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                            确认
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <style>{`@keyframes ttSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
                </>
              </BodyPortal>
            </div>
          )}

          {/* 标题区：改为极简风格的找到数量与排序 */}
          <div className="flex items-center justify-between mb-4 mt-2">
            <div className="text-[14px] font-bold text-black/70">
              {loading
                ? <span style={{ color: '#9ca3af' }}>加载中…</span>
                : <>找到 <span className="text-[#427759]">{filtered.length}</span> 篇相关文献{total > articles.length ? `（共 ${total} 条）` : ''}</>
              }
            </div>
            <Dropdown
              menu={{
                items: [
                  { key: 'platform', label: '按平台更新排序' },
                  { key: 'doc', label: '按文档发布排序' },
                  { key: 'name', label: `按文档名称排序${sort === 'name' ? (nameSortAsc ? ' (A→Z)' : ' (Z→A)') : ''}` }
                ],
                onClick: (e) => {
                  const key = e.key as 'platform' | 'doc' | 'name';
                  if (key === 'name' && sort === 'name') {
                    setNameSortAsc(prev => !prev);
                  } else {
                    setSort(key);
                    setNameSortAsc(true);
                  }
                },
                selectedKeys: [sort]
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center gap-1.5 cursor-pointer text-black/50 hover:text-[#427759] transition-colors text-[13px] font-bold">
                <SwapOutlined className="rotate-90" /> 排序
              </div>
            </Dropdown>
          </div>

          {/* 列表区 */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 16, padding: '24px',
                  border: '1px solid rgba(0,0,0,0.05)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}>
                  <div style={{ width: '60%', height: 16, background: '#f1f5f9', borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ width: '90%', height: 12, background: '#f8fafc', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ width: '75%', height: 12, background: '#f8fafc', borderRadius: 6 }} />
                </div>
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
              <Empty description={<span className="text-black/40 font-bold">没有找到符合条件的文献</span>} />
              <Button type="primary" onClick={() => { setScene('全部'); setType('全部'); setSearch(''); }} className="mt-4 bg-[#427759] rounded-xl font-bold shadow-sm">
                清空筛选条件
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map(a => (
                <ArticleCard key={a.id} article={a} onClick={() => openArticle(a)} />
              ))}
            </div>
          )}
          
          {filtered.length > 0 && (
            <div className="text-center py-12 text-black/30 text-[13px] font-bold">
              —— 已经到底啦 ——
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
