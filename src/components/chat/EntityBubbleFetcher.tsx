'use client';
import React, { useState, useEffect } from 'react';
import { Building2, UserSquare2, Loader2 } from 'lucide-react';

/**
 * 智能实体气泡：先查人才库，有则显示人才气泡（点击开人才抽屉）；
 * 没有再查机构库，有则显示机构气泡（点击开机构抽屉）；
 * 两者都没有则显示不可点的普通文字气泡。
 */
export function EntityBubbleFetcher({
  query,
  onSelectTalent,
  onSelectInstitute,
}: {
  query: string;
  onSelectTalent: (talent: any) => void;
  onSelectInstitute: (inst: any) => void;
}) {
  const [type, setType] = useState<'loading' | 'talent' | 'institute' | 'none'>('loading');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let active = true;
    const detect = async () => {
      // 1. 先查人才
      try {
        const res = await fetch(`/api/talent/search?q=${encodeURIComponent(query)}&type=card`);
        const json = await res.json();
        if (!active) return;
        if (json.ok && json.data && json.data.hasPingfangData) {
          setType('talent');
          setData(json.data);
          return;
        }
      } catch (_) {}

      if (!active) return;

      // 2. 再查机构
      try {
        const res = await fetch(`/api/institute/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (!active) return;
        if (json.ok && json.data) {
          setType('institute');
          setData(json.data);
          return;
        }
      } catch (_) {}

      if (active) setType('none');
    };
    detect();
    return () => { active = false; };
  }, [query]);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 8px', borderRadius: 20,
    fontSize: 11, transition: 'all 0.2s',
  };

  if (type === 'loading') {
    return (
      <span style={{ ...baseStyle, background: 'rgba(96,85,245,0.04)', border: '1px solid rgba(96,85,245,0.12)', color: 'rgba(0,0,0,0.50)' }}>
        <Loader2 size={10} className="animate-spin" style={{ display: 'inline-block', marginRight: 2, marginBottom: -1 }} />
        {query}
      </span>
    );
  }

  if (type === 'talent') {
    return (
      <span
        onClick={() => onSelectTalent(data)}
        style={{ ...baseStyle, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', color: '#059669', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.15)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
        title="点击查看人才档案"
      >
        <UserSquare2 size={11} />
        {data.name || query}
      </span>
    );
  }

  if (type === 'institute') {
    return (
      <span
        onClick={() => onSelectInstitute(data)}
        style={{ ...baseStyle, background: 'rgba(96,85,245,0.1)', border: '1px solid rgba(96,85,245,0.25)', color: '#427759', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96,85,245,0.16)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96,85,245,0.1)'; }}
        title="点击查看院校详情"
      >
        <Building2 size={11} />
        {data.name || query}
      </span>
    );
  }

  // none
  return (
    <span style={{ ...baseStyle, background: 'rgba(96,85,245,0.04)', border: '1px solid rgba(96,85,245,0.12)', color: 'rgba(0,0,0,0.50)' }}>
      {query}
    </span>
  );
}
