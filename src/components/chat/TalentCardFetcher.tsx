'use client';
import React, { useState, useEffect } from 'react';
import { UserSquare2, ShieldCheck, Globe, Loader2 } from 'lucide-react';

// 缓存版本号：每次改动 API 返回结构后递增，自动清除旧缓存
const CACHE_VERSION = 5;

export function TalentCardFetcher({ query, onSelectTalent }: { query: string; onSelectTalent: (talent: any) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchTalent = async () => {
      const cacheKey = `zj_tc_v${CACHE_VERSION}_${query}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const json = JSON.parse(cached);
          setData(json.data);
          setLoading(false);
          return;
        }
      } catch (e) {}

      try {
        const res = await fetch(`/api/talent/search?q=${encodeURIComponent(query)}&type=card`);
        const json = await res.json();
        if (active) {
          setData(json.data);
          setLoading(false);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(json));
          } catch (e) {}
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    };
    fetchTalent();
    return () => { active = false; };
  }, [query]);

  if (loading) {
    return (
      <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8, background: '#f8f9fa', borderRadius: 8, margin: '8px 0' }}>
        <Loader2 size={16} className="animate-spin" color="#427759" />
        <span style={{ fontSize: 13, color: '#666' }}>正在检索人才档案：{query}...</span>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div 
      onClick={() => onSelectTalent(data)}
      style={{ 
        padding: '12px 14px', border: '1px solid #eee', borderRadius: 12, background: '#fff', 
        margin: '8px 0', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'transform 0.2s, box-shadow 0.2s'
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 22, background: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        {data.avatar ? (
          <img src={data.avatar} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <UserSquare2 size={22} color="#427759" />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111', flexShrink: 0 }}>{data.name}</span>
          {data.title && (
            <span
              style={{
                fontSize: 11,
                padding: '1px 6px',
                background: '#f1f5f9',
                color: '#475569',
                borderRadius: 4,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                minWidth: 0,
                cursor: 'help',
              }}
              title={data.titleFull || data.title}
            >
              {data.title}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={data.currentOrgFull || data.currentOrg || '未知'}>
          {data.currentOrg || '未知'}
        </div>
        {/* 数据源标记：紧凑不换行 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#aaa' }}>
          {data.hasPingfangData && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
              <ShieldCheck size={12} color="#10b981" />平方核验
            </span>
          )}
          {data.hasInternetData && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
              <Globe size={12} color="#3b82f6" />互联网补充
            </span>
          )}
          {data.hasOrcidData && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
              <Globe size={12} color="#10b981" />ORCID档案
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
