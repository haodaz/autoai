'use client';
import React, { useState, useEffect } from 'react';
import { Bookmark, Loader2 } from 'lucide-react';

export function CaseBubbleFetcher({ query, onSelectCase }: { query: string; onSelectCase: (c: any) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchCase = async () => {
      try {
        const res = await fetch(`/api/public/entity/search?model=CRMCase&q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (active && json.ok && json.data) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch case', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchCase();
    return () => { active = false; };
  }, [query]);

  if (loading) {
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.12)',
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
        background: 'rgba(245,158,11,0.04)',
        border: '1px solid rgba(245,158,11,0.12)',
        fontSize: 11, color: 'rgba(0,0,0,0.50)',
      }}>
        {query}
      </span>
    );
  }

  const name = data.program_name || data.feature_label || query;
  return (
    <button 
      onClick={() => onSelectCase(data)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 20, border: 'none', cursor: 'pointer',
        background: 'rgba(245,158,11,0.08)',
        boxShadow: 'inset 0 0 0 1px rgba(245,158,11,0.2)',
        fontSize: 11, color: '#d97706', fontWeight: 500, transition: 'all 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.15)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}
    >
      <Bookmark size={11} />
      {name}
    </button>
  );
}
