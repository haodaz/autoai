'use client';
import React, { useState, useEffect } from 'react';
import { UserSquare2, ShieldCheck, Globe, Loader2, Users } from 'lucide-react';

// 缓存版本号：每次改动 API 返回结构后递增，自动清除旧缓存
const CACHE_VERSION = 3;

export function TalentListFetcher({ query, onSelectTalent }: { query: string; onSelectTalent: (talent: any) => void }) {
  const [list, setList] = useState<any[]>([]);
  const [webText, setWebText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchTalentList = async () => {
      const cacheKey = `zj_talent_list_v${CACHE_VERSION}_${query}`;
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const json = JSON.parse(cached);
          setList(json.data || []);
          setWebText(json.webResultText || null);
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore cache errors
      }

      try {
        const res = await fetch(`/api/talent/search?q=${encodeURIComponent(query)}&type=list`);
        const json = await res.json();
        if (active) {
          setList(json.data || []);
          setWebText(json.webResultText || null);
          setLoading(false);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify(json));
          } catch (e) {}
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    };
    fetchTalentList();
    return () => { active = false; };
  }, [query]);

  if (loading) {
    return (
      <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8, background: '#f8f9fa', borderRadius: 8, margin: '8px 0' }}>
        <Loader2 size={16} className="animate-spin" color="#427759" />
        <span style={{ fontSize: 13, color: '#666' }}>正在为您检索 "{query}" 相关的人才...</span>
      </div>
    );
  }

  if (!list.length) {
    if (webText) {
      return (
        <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 8, margin: '8px 0', fontSize: 13, color: '#333', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 600, color: '#427759', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={16} /> 互联网检索参考信息
          </div>
          <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {webText}
          </div>
        </div>
      );
    }
    return null; // 不要显示无结果白卡
  }

  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 14, fontWeight: 600, color: '#333' }}>
        <Users size={16} color="#427759" /> 检索到 {list.length} 位推荐专家
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((data, i) => (
          <div 
            key={i}
            onClick={() => onSelectTalent(data)}
            style={{ 
              padding: '12px 16px', border: '1px solid #eee', borderRadius: 10, background: '#fff', 
              cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8f9ff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 20, background: '#f0f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserSquare2 size={20} color="#427759" />
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>{data.name}</span>
                {data.title && <span style={{ fontSize: 11, padding: '2px 6px', background: '#f1f5f9', color: '#475569', borderRadius: 4 }}>{data.title}</span>}
              </div>
              <div style={{ fontSize: 12, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data.currentOrg || '无机构信息'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {data.hasPingfangData ? <span title="平方数据权威核验"><ShieldCheck size={16} color="#10b981" /></span> : null}
              {data.hasInternetData ? <span title="互联网补充信息"><Globe size={16} color="#3b82f6" /></span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
