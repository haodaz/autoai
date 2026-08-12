'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Spin, Empty } from 'antd';
import { DeleteOutlined, ArrowLeftOutlined, RightOutlined } from '@ant-design/icons';
import { marked } from 'marked';

// ─── Types ──────────────────────────────────────────────────
export interface ProfileFragment {
  id: string;
  category: string;
  title: string;
  content: string;
  date?: string;
  ai_name?: string;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────
const PAGE_SIZE = 30;

const CATEGORY_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  '学习成绩': { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  '竞赛荣誉': { bg: '#fef9c3', color: '#92400e', dot: '#f59e0b' },
  '课外活动': { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  '认知发现': { bg: '#f3e8ff', color: '#6b21a8', dot: '#a855f7' },
  '测评结果': { bg: '#ffedd5', color: '#9a3412', dot: '#f97316' },
  '个人报告': { bg: '#cffafe', color: '#155e75', dot: '#06b6d4' },
  'AI观察':  { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' },
  '发展意向': { bg: '#ede9fe', color: '#5b21b6', dot: '#7c3aed' },
};

const getCatStyle = (cat: string) =>
  CATEGORY_COLORS[cat] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };

// 清除 AI 自定义的非标准 XML 标签（保留标准 HTML 标签不动）
const SAFE_HTML_TAGS = new Set([
  'p','h1','h2','h3','h4','h5','h6','ul','ol','li',
  'em','strong','b','i','u','code','pre','blockquote',
  'table','thead','tbody','tr','td','th','hr','br','img','a','span','div',
]);

function stripCustomXml(content: string): string {
  if (!content) return '';
  const cleaned = content.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9_-]*)(?:\s[^>]*)?\/?>|<!\[CDATA\[.*?\]\]>/g,
    (match, tagName) => {
      if (!tagName) return match;
      if (SAFE_HTML_TAGS.has(tagName.toLowerCase())) return match;
      return '\n';
    }
  );
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Helpers ────────────────────────────────────────────────
const fmtDate = (raw: string) => {
  if (!raw) return '';
  const d = new Date(raw);
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
};

const fmtDateFull = (raw: string) => {
  if (!raw) return '';
  return new Date(raw).toLocaleString('zh-CN');
};

const getTitle = (frag: ProfileFragment) => {
  if (frag.title) return frag.title;
  let c = frag.content || '';
  c = c.replace(/\\n/g, '\n');
  c = c.replace(/^[#\s📝💡*\-]+/, '').trim();
  const firstLine = c.split('\n')[0].trim();
  return firstLine.length > 28 ? firstLine.slice(0, 28) + '…' : firstLine || '记录';
};

// ─── Profile Timeline ───────────────────────────────────────
interface ProfileTimelineProps {
  fragments: ProfileFragment[];
  loading: boolean;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export default function ProfileTimeline({ fragments, loading, onDelete }: ProfileTimelineProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedFrag, setSelectedFrag] = useState<ProfileFragment | null>(null);
  const [activeId, setActiveId]         = useState('');
  const sentinelRef = useRef<HTMLDivElement>(null);
  const rightRef    = useRef<HTMLDivElement>(null);
  const cardRefs    = useRef<Record<string, HTMLDivElement | null>>({});

  const visible = useMemo(() => fragments.slice(0, visibleCount), [fragments, visibleCount]);
  const hasMore  = visibleCount < fragments.length;

  // 滚到底 → 加载更多
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(c => c + PAGE_SIZE);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore]);

  // 右侧滚动时更新左侧高亮
  useEffect(() => {
    const ids = Object.keys(cardRefs.current).filter(id => !!cardRefs.current[id]);
    if (!ids.length) return;
    const obs = new IntersectionObserver(entries => {
      const topmost = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (topmost) {
        const id = (topmost.target as HTMLElement).dataset.fragId;
        if (id) setActiveId(id);
      }
    }, { threshold: 0.3, rootMargin: '0px 0px -50% 0px' });
    ids.forEach(id => cardRefs.current[id] && obs.observe(cardRefs.current[id]!));
    return () => obs.disconnect();
  }, [visible]);

  // 左侧小卡片点击 → 滚动到右侧对应卡片
  const scrollToCard = useCallback((id: string) => {
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setActiveId(id);
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Spin size="large" /></div>;
  }
  if (!fragments.length) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <Empty description="还没有用户档案，开始和知己聊天吧～" />
      </div>
    );
  }

  // ── 移动端：详情层 ─────────────────────────────────────────
  if (selectedFrag) {
    const cat = getCatStyle(selectedFrag.category);
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-white md:hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 flex-shrink-0 justify-between">
          <button onClick={() => setSelectedFrag(null)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#427759] transition-colors">
            <ArrowLeftOutlined style={{ fontSize: 13 }} /> 返回档案
          </button>
          <button onClick={e => {
            onDelete(e, selectedFrag.id || selectedFrag.createdAt);
            setSelectedFrag(null);
          }}
            className="p-1 rounded text-slate-400 hover:text-red-400">
            <DeleteOutlined style={{ fontSize: 15 }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: cat.bg, color: cat.color }}>{selectedFrag.category || '其他'}</span>
            <span className="text-xs text-slate-400">{fmtDateFull(selectedFrag.date || selectedFrag.createdAt)}</span>
          </div>
          <h1 className="text-xl font-bold text-[#141b38] mb-1 leading-snug">{getTitle(selectedFrag)}</h1>
          <p className="text-xs text-slate-400 mb-5">{selectedFrag.ai_name || '知己 · AI'}</p>
          <div className="text-[15px] text-slate-700 leading-relaxed whitespace-pre-wrap profile-content" dangerouslySetInnerHTML={{ __html: marked.parse(stripCustomXml(selectedFrag.content || '暂无详细内容')) as string }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ━━ 左侧小卡片导航（仅桌面）━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="hidden md:flex flex-col flex-shrink-0 border-r border-slate-200/60 overflow-y-auto"
        style={{ width: 300, background: 'linear-gradient(160deg, #eef2ff 0%, #e4eaf8 100%)' }}>
        <div className="px-4 py-3 border-b border-white/60 flex-shrink-0">
          <span className="text-[12px] font-bold text-slate-400 tracking-widest uppercase">成长轨迹</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-0">
          {visible.map(frag => {
            const cat = getCatStyle(frag.category);
            const fallbackId = frag.id || frag.createdAt;
            const isActive = activeId === fallbackId;
            return (
              <div key={fallbackId} onClick={() => scrollToCard(fallbackId)}
                style={{
                  borderLeft: `3px solid ${isActive ? cat.dot : 'transparent'}`,
                  boxShadow: isActive
                    ? `0 2px 8px rgba(96,85,245,0.14), 0 1px 2px rgba(0,0,0,0.04)`
                    : '0 1px 3px rgba(0,0,0,0.06)',
                }}
                className="mx-2 mb-1.5 px-3 py-3 rounded-xl cursor-pointer bg-white transition-all hover:shadow-md group">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: cat.bg, color: cat.color }}>{frag.category || '其他'}</span>
                  <span className="text-[11px] text-slate-400 ml-auto">
                    {fmtDate(frag.date || frag.createdAt)}
                  </span>
                </div>
                <div className="text-[16px] font-bold leading-snug mb-1 line-clamp-1"
                  style={{ color: isActive ? cat.color : '#1e293b' }}>
                  {getTitle(frag)}
                </div>
                {frag.content && (
                  <div className="text-[12px] text-slate-400 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(stripCustomXml(frag.content)) as string }} />
                )}
              </div>
            );
          })}
          {hasMore && <div className="text-center text-[11px] text-slate-400 py-2">↓ 向下加载更多</div>}
        </div>
      </div>

      {/* ━━ 右侧内容区 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div ref={rightRef} className="flex-1 overflow-y-auto bg-slate-50">

        {/* ── 桌面：全量内联展开 feed ──────────────────── */}
        <div className="hidden md:block relative px-6 py-6">
          {/* Timeline 竖线 */}
          <div style={{
            position: 'absolute', left: 38, top: 24, bottom: 24,
            width: 2,
            background: 'linear-gradient(to bottom, rgba(96,85,245,0.4), rgba(96,85,245,0.05))',
          }} />

          <div className="flex flex-col gap-5 max-w-[750px]">
            {visible.map(frag => {
              const cat = getCatStyle(frag.category);
              return (
                <div key={frag.id || frag.createdAt}
                  data-frag-id={frag.id || frag.createdAt}
                  ref={el => { cardRefs.current[frag.id || frag.createdAt] = el; }}
                  className="flex gap-4">
                  {/* Dot */}
                  <div className="flex-shrink-0 flex flex-col items-center" style={{ width: 30 }}>
                    <div style={{
                      marginTop: 22, width: 12, height: 12, borderRadius: '50%',
                      background: cat.dot, border: '2.5px solid white',
                      boxShadow: `0 0 0 2px ${cat.dot}50`,
                      zIndex: 1,
                    }} />
                  </div>

                  {/* 展开卡片（全量内容）*/}
                  <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-5 shadow-sm
                    hover:shadow-md hover:border-slate-200 transition-all duration-150 group">
                    {/* 顶部元信息 */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cat.bg, color: cat.color }}>
                        {frag.category || '其他'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {frag.ai_name || '知己 · AI'} · {fmtDateFull(frag.date || frag.createdAt)}
                      </span>
                      <button onClick={e => onDelete(e, frag.id || frag.createdAt)}
                        className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-slate-300 hover:text-red-400">
                        <DeleteOutlined style={{ fontSize: 12 }} />
                      </button>
                    </div>
                    {/* 标题 */}
                    <h3 className="text-[16px] font-bold text-[#141b38] mb-3 leading-snug">
                      {getTitle(frag)}
                    </h3>
                    {/* 全文内容 */}
                    {frag.content && (
                      <div className="text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap profile-content" dangerouslySetInnerHTML={{ __html: marked.parse(stripCustomXml(frag.content)) as string }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 懒加载 sentinel */}
          <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
            {hasMore && <Spin size="small" />}
            {!hasMore && fragments.length > PAGE_SIZE && (
              <span className="text-xs text-slate-300">— 全部 {fragments.length} 条 · 记录了你的成长 —</span>
            )}
          </div>
        </div>

        {/* ── 移动端：紧凑 timeline 列表（点击进详情）──── */}
        <div className="md:hidden relative">
          <div style={{
            position: 'absolute', left: 28, top: 18, bottom: 0,
            width: 2,
            background: 'linear-gradient(to bottom, rgba(96,85,245,0.35), rgba(96,85,245,0.05))',
          }} />

          <div className="flex flex-col py-3">
            {visible.map(frag => {
              const cat = getCatStyle(frag.category);
              return (
                <div key={frag.id || frag.createdAt}
                  onClick={() => setSelectedFrag(frag)}
                  className="flex gap-3 px-4 py-3 cursor-pointer group">
                  {/* Dot */}
                  <div className="flex-shrink-0" style={{ width: 24 }}>
                    <div style={{
                      marginTop: 6, width: 10, height: 10, borderRadius: '50%',
                      background: cat.dot, border: '2px solid white',
                      boxShadow: `0 0 0 2px ${cat.dot}40`,
                    }} />
                  </div>
                  {/* 内容卡片 */}
                  <div className="flex-1 min-w-0 bg-white p-3 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 group-active:border-[#427759] group-active:shadow-[0_2px_12px_rgba(96,85,245,0.15)] transition-all flex items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: cat.bg, color: cat.color }}>
                          {frag.category || '其他'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {frag.ai_name || '知己 · AI'} · {fmtDate(frag.date || frag.createdAt)}
                        </span>
                      </div>
                      <div className="text-[13px] font-semibold text-slate-800 line-clamp-1">{getTitle(frag)}</div>
                      {frag.content && (
                        <div className="text-[12px] text-slate-400 line-clamp-2 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: marked.parse(stripCustomXml(frag.content)) as string }} />
                      )}
                    </div>
                    <div className="ml-3 flex-shrink-0 text-slate-300 group-active:text-[#427759] transition-colors">
                      <RightOutlined className="text-[12px]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={sentinelRef} className="h-8 flex items-center justify-center">
            {hasMore && <Spin size="small" />}
            {!hasMore && fragments.length > PAGE_SIZE && (
              <span className="text-xs text-slate-300 pb-4">— 已加载全部 {fragments.length} 条 —</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
