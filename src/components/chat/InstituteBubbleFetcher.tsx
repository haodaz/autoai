'use client';
import React, { useState, useEffect } from 'react';
import { Building2, Loader2 } from 'lucide-react';

export function InstituteBubbleFetcher({ query, onSelectInstitute }: { query: string; onSelectInstitute: (inst: any) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchInstitute = async () => {
      try {
        const res = await fetch(`/api/institute/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (active && json.ok && json.data) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch institute', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchInstitute();
    return () => { active = false; };
  }, [query]);

  if (loading) {
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
        background: 'rgba(96,85,245,0.04)',
        border: '1px solid rgba(96,85,245,0.12)',
        fontSize: 11, color: 'rgba(0,0,0,0.50)',
      }}>
        <Loader2 size={10} className="animate-spin" style={{ display: 'inline-block', marginRight: 4, marginBottom: -1 }} />
        {query}
      </span>
    );
  }

  if (!data) {
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
        background: 'rgba(96,85,245,0.04)',
        border: '1px solid rgba(96,85,245,0.12)',
        fontSize: 11, color: 'rgba(0,0,0,0.50)',
      }}>
        {query}
      </span>
    );
  }

  return (
    <span 
      onClick={() => onSelectInstitute(data)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20,
        background: 'rgba(96,85,245,0.1)',
        border: '1px solid rgba(96,85,245,0.25)',
        fontSize: 11, color: '#427759',
        cursor: 'pointer', transition: 'all 0.2s'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(96,85,245,0.16)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(96,85,245,0.1)';
      }}
      title="点击查看院校详情"
    >
      <Building2 size={12} />
      {data.name}
    </span>
  );
}
