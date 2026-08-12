'use client';

import { useState, useEffect } from 'react';

// 模块级缓存：同一个页面内多个组件共享，避免重复请求
let cachedPromise: Promise<Record<string, string>> | null = null;
let cachedMap: Record<string, string> | null = null;

function fetchThemeNames(): Promise<Record<string, string>> {
  if (cachedMap) return Promise.resolve(cachedMap);
  if (cachedPromise) return cachedPromise;

  cachedPromise = fetch('/api/themes')
    .then(r => r.json())
    .then(data => {
      const map: Record<string, string> = {};
      (data.themes || []).forEach((t: { id: string; name: string }) => {
        map[t.id] = t.name;
      });
      cachedMap = map;
      return map;
    })
    .catch(() => {
      cachedPromise = null; // 失败不缓存，下次重试
      return {};
    });

  return cachedPromise;
}

/**
 * 获取 theme_id → 名称 的映射表
 * 模块级缓存，重复调用不会重复请求
 */
export function useThemeNames(): Record<string, string> {
  const [map, setMap] = useState<Record<string, string>>(cachedMap ?? {});

  useEffect(() => {
    if (cachedMap) {
      setMap(cachedMap);
      return;
    }
    let cancelled = false;
    fetchThemeNames().then(m => {
      if (!cancelled) setMap(m);
    });
    return () => { cancelled = true; };
  }, []);

  return map;
}

/**
 * 根据 theme_id 获取名称，无匹配时返回 id 本身
 */
export function useThemeName(id: string | undefined | null): string {
  const names = useThemeNames();
  if (!id) return '';
  return names[id] || id;
}
