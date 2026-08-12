'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SharedKbViewer, { SharedKbFile } from '@/components/kb/SharedKbViewer';
import { Spin } from 'antd';

// 字段映射（与 ThinkTankTab 保持一致）
const SCENE_KEY_MAP: Record<string, string> = {
  higher_education: '高教一答',
  personal:         '个人发展',
  organizational:   '人才培养',
};

type ThinkTankArticle = SharedKbFile & {
  keywords: string[];
  scene: string;
  category?: string;
  fileName?: string;
};

function mapApiItem(raw: Record<string, unknown>): ThinkTankArticle {
  const kinds      = (raw.kind_key as string[] | undefined) || [];
  const sceneKeys  = (raw.scene_key as string[] | undefined) || [];
  const sceneLabel = sceneKeys.map(s => SCENE_KEY_MAP[s] || s).join('、') || '高教一答';
  const description = (raw.description || '') as string;
  const esHighlight = (raw.es_highlight || '') as string;
  const content = description || esHighlight;

  type FileRecord = { download_url?: string; name?: string };
  const rawFiles         = (raw.relevant_files_ids as FileRecord[] | undefined) || [];
  const rawFileUrl       = raw['relevant_files_ids.download_url'];
  const flatDownloadUrls: string[] = Array.isArray(rawFileUrl)
    ? rawFileUrl as string[]
    : (typeof rawFileUrl === 'string' && rawFileUrl ? [rawFileUrl] : []);
  const firstDownloadUrl = rawFiles[0]?.download_url || flatDownloadUrls[0] || '';
  const firstName        = rawFiles[0]?.name;

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

// ── 内层组件（使用 useSearchParams，必须包在 Suspense 内）────────────────
function ThinkTankInner() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const targetId     = searchParams.get('id');

  const [articles, setArticles]         = useState<ThinkTankArticle[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedFile, setSelectedFile] = useState<ThinkTankArticle | null>(null);

  const fetchArticles = useCallback(async (q: string) => {
    try {
      const res  = await fetch(`/api/higher-education/search?query=${encodeURIComponent(q)}&size=50`);
      const data = await res.json();
      const items = (data.items || []) as Record<string, unknown>[];
      return items.map(mapApiItem);
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchArticles('').then(list => {
      setArticles(list);
      setLoading(false);
    });
  }, [fetchArticles]);

  useEffect(() => {
    if (articles.length === 0) return;
    if (targetId) {
      const found = articles.find(a => String(a.id) === targetId);
      setSelectedFile(found || articles[0] || null);
    } else {
      setSelectedFile(articles[0] || null);
    }
  }, [articles, targetId]);

  const handleSelect = (file: SharedKbFile) => {
    const article = file as ThinkTankArticle;
    setSelectedFile(article);
    router.replace(`/kb/thinktank?id=${article.id}`, { scroll: false });
  };

  // 左侧列表搜索 → 重新请求后端
  const handleSearch = useCallback((q: string) => {
    fetchArticles(q).then(list => {
      setArticles(list);
      if (list.length > 0 && !list.find(a => a.id === selectedFile?.id)) {
        setSelectedFile(list[0]);
      }
    });
  }, [fetchArticles, selectedFile]);

  if (loading && articles.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin size="large" description="加载中…" />
      </div>
    );
  }

  return (
    <SharedKbViewer
      title="官方知识库 · 专家智库"
      files={articles}
      selectedFile={selectedFile}
      onSelectFile={handleSelect}
      onClose={() => router.back()}
      onSearch={handleSearch}
    />
  );
}

// ── 页面入口（包裹 Suspense 以满足 useSearchParams 要求）────────────────
export default function ThinkTankPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Spin size="large" tip="加载中…" />
      </div>
    }>
      <ThinkTankInner />
    </Suspense>
  );
}
