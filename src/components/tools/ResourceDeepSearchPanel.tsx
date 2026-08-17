'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp, FlaskConical } from 'lucide-react';
import { marked } from 'marked';

interface LogEntry {
  step: string;
  message: string;
  status: 'loading' | 'success' | 'error';
}

const RESOURCE_TYPES = [
  { value: '', label: '全部类型' },
  { value: '科研耗材', label: '科研耗材' },
  { value: '科研仪器', label: '科研仪器' },
  { value: '科研试剂', label: '科研试剂' },
];

export function ResourceDeepSearchPanel() {
  const [query, setQuery] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [report, setReport] = useState('');
  const [logsExpanded, setLogsExpanded] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportRef.current && report) {
      reportRef.current.scrollTop = reportRef.current.scrollHeight;
    }
  }, [report]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setLogs([]);
    setReport('');

    try {
      const res = await fetch('/api/tools/resource-deep-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), resourceType, brandFilter: brandFilter.trim() }),
      });

      if (!res.body) throw new Error('No readable stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let aiText = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.type === 'log') {
                  const msg = data.data.message || '';
                  const status: LogEntry['status'] = msg.includes('✅') ? 'success' : msg.includes('❌') || msg.includes('⚠️') ? 'error' : 'loading';
                  setLogs(prev => [...prev, { step: data.data.step, message: msg, status }]);
                } else if (data.type === 'ai_chunk') {
                  aiText += data.data;
                  setReport(aiText);
                } else if (data.type === 'error') {
                  setLogs(prev => [...prev, { step: 'error', message: `错误: ${data.data.message}`, status: 'error' }]);
                }
              } catch { /* ignore */ }
            }
          }
        }
      }
    } catch (e) {
      setLogs(prev => [...prev, { step: 'error', message: `请求失败: ${String(e)}`, status: 'error' }]);
    }
    setLoading(false);
  };

  const getStatusIcon = (status: LogEntry['status']) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} className="text-green-400" />;
      case 'error': return <AlertTriangle size={14} className="text-amber-400" />;
      default: return <Loader2 size={14} className="text-blue-400 animate-spin" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <FlaskConical size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            placeholder="输入物资名称 (如: 低温冰箱, PCR仪, 移液器)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
              border: '1px solid #e5e7eb', background: '#fff',
              color: '#111827', fontSize: 14, outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          />
        </div>
        <select
          value={resourceType}
          onChange={e => setResourceType(e.target.value)}
          style={{
            flex: '0 0 120px', padding: '10px 12px', borderRadius: 8,
            border: '1px solid #e5e7eb', background: '#fff',
            color: '#111827', fontSize: 13, outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          {RESOURCE_TYPES.map(t => <option key={t.value} value={t.value} style={{ background: '#fff', color: '#111827' }}>{t.label}</option>)}
        </select>
        <input
          placeholder="品牌筛选 (选填)"
          value={brandFilter}
          onChange={e => setBrandFilter(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          style={{
            flex: '0 1 140px', padding: '10px 12px', borderRadius: 8,
            border: '1px solid #e5e7eb', background: '#fff',
            color: '#111827', fontSize: 14, outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: loading ? 'rgba(168,85,247,0.4)' : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
            color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            opacity: !query.trim() ? 0.5 : 1,
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? '检索中...' : '开始物资检索'}
        </button>
      </div>

      {/* Content Area */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, flexWrap: 'wrap' }}>
        {/* Logs */}
        <div style={{
          flex: '1 1 280px', background: '#fff', borderRadius: 12,
          border: '1px solid #e5e7eb', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: 500, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div
            onClick={() => setLogsExpanded(!logsExpanded)}
            style={{
              padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', borderBottom: '1px solid #e5e7eb',
              background: '#f9fafb',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>检索进度 ({logs.length})</span>
            {logsExpanded ? <ChevronUp size={14} color="#6b7280" /> : <ChevronDown size={14} color="#6b7280" />}
          </div>
          {logsExpanded && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', fontSize: 12, color: '#374151' }}>
                  <span style={{ marginTop: 2, flexShrink: 0 }}>{getStatusIcon(log.status)}</span>
                  <span>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && !loading && (
                <div style={{ color: '#9ca3af', fontSize: 12, padding: 8 }}>输入物资名称后点击搜索</div>
              )}
            </div>
          )}
        </div>

        {/* Report */}
        <div ref={reportRef} style={{
          flex: '2 1 400px', background: '#fff', borderRadius: 12,
          border: '1px solid #e5e7eb', padding: 20, overflowY: 'auto',
          maxHeight: 500, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 12, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>
            AI 物资检索报告
          </div>
          {report ? (
            <div
              className="prose prose-sm max-w-none"
              style={{ fontSize: 13, lineHeight: 1.7, color: '#1f2937' }}
              dangerouslySetInnerHTML={{ __html: marked(report) as string }}
            />
          ) : (
            <div style={{ color: '#9ca3af', fontSize: 13, marginTop: 20 }}>
              {loading ? '等待检索完成并生成报告...' : '暂无内容，请发起检索'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
