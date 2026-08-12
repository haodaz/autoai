'use client';
import React, { useState, useEffect } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';

export function ProjectBubbleFetcher({ query, onSelectProject }: { query: string; onSelectProject: (p: any) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/public/entity/search?model=CRMProgram&q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (active && json.ok && json.data) {
          setData(json.data);
        }
      } catch (e) {
        console.error('Failed to fetch project', e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProject();
    return () => { active = false; };
  }, [query]);

  if (loading) {
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 20,
        background: 'rgba(59,130,246,0.04)',
        border: '1px solid rgba(59,130,246,0.12)',
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
        background: 'rgba(59,130,246,0.04)',
        border: '1px solid rgba(59,130,246,0.12)',
        fontSize: 11, color: 'rgba(0,0,0,0.50)',
      }}>
        {query}
      </span>
    );
  }

  return (
    <button 
      onClick={() => onSelectProject(data)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '2px 8px', borderRadius: 20, border: 'none', cursor: 'pointer',
        background: 'rgba(59,130,246,0.08)',
        boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.2)',
        fontSize: 11, color: '#2563eb', fontWeight: 500, transition: 'all 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.08)')}
    >
      <FolderOpen size={11} />
      {data.name || query}
    </button>
  );
}
