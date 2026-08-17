'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, CheckCircle, Loader2, AlertTriangle, ChevronDown, ChevronUp, FileText, MapPin } from 'lucide-react';
import { marked } from 'marked';

interface LogEntry {
  step: string;
  message: string;
  status: 'loading' | 'success' | 'error';
}

export function PolicySearchPanel() {
  const [topic, setTopic] = useState('');
  const [region, setRegion] = useState('');
  const [userProfile, setUserProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [report, setReport] = useState('');
  const [logsExpanded, setLogsExpanded] = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportRef.current && report) {
      reportRef.current.scrollTop = reportRef.current.scrollHeight;
    }
  }, [report]);

  const handleSearch = async () => {
    if (!topic.trim() && !region.trim()) return;
    setLoading(true);
    setLogs([]);
    setReport('');

    try {
      const res = await fetch('/api/tools/policy-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          region: region.trim(),
          userProfile: userProfile.trim(),
        }),
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
              } catch { /* ignore incomplete chunks */ }
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
          <FileText size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            placeholder="政策主题 (如: 海外人才引进)"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
              color: '#e8e8e8', fontSize: 14, outline: 'none',
            }}
          />
        </div>
        <div style={{ position: 'relative', flex: '0 1 160px' }}>
          <MapPin size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            placeholder="地区 (选填)"
            value={region}
            onChange={e => setRegion(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{
              width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
              color: '#e8e8e8', fontSize: 14, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={() => setShowProfile(!showProfile)}
          style={{
            padding: '10px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
            background: showProfile ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.06)',
            color: showProfile ? '#667eea' : '#888', fontSize: 12, cursor: 'pointer',
          }}
        >
          {showProfile ? '收起背景' : '+ 个人背景'}
        </button>
        <button
          onClick={handleSearch}
          disabled={loading || (!topic.trim() && !region.trim())}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none', cursor: loading ? 'wait' : 'pointer',
            background: loading ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            opacity: (!topic.trim() && !region.trim()) ? 0.5 : 1,
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? '检索中...' : '开始政策检索'}
        </button>
      </div>

      {/* Profile Input */}
      {showProfile && (
        <textarea
          placeholder="填写个人背景可获得个性化政策匹配分析 (如: 博士学历, 计算机专业, 3年海外经历, 30岁...)"
          value={userProfile}
          onChange={e => setUserProfile(e.target.value)}
          rows={3}
          style={{
            width: '100%', padding: 12, borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)',
            color: '#e8e8e8', fontSize: 13, outline: 'none', resize: 'vertical',
          }}
        />
      )}

      {/* Content Area */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, flexWrap: 'wrap' }}>
        {/* Logs */}
        <div style={{
          flex: '1 1 280px', background: 'rgba(255,255,255,0.04)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          maxHeight: 500,
        }}>
          <div
            onClick={() => setLogsExpanded(!logsExpanded)}
            style={{
              padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: '#aaa' }}>
              检索进度 ({logs.length})
            </span>
            {logsExpanded ? <ChevronUp size={14} color="#888" /> : <ChevronDown size={14} color="#888" />}
          </div>
          {logsExpanded && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 0', fontSize: 12, color: '#bbb' }}>
                  <span style={{ marginTop: 2, flexShrink: 0 }}>{getStatusIcon(log.status)}</span>
                  <span>{log.message}</span>
                </div>
              ))}
              {logs.length === 0 && !loading && (
                <div style={{ color: '#666', fontSize: 12, padding: 8 }}>输入政策主题后点击搜索</div>
              )}
            </div>
          )}
        </div>

        {/* Report */}
        <div ref={reportRef} style={{
          flex: '2 1 400px', background: 'rgba(255,255,255,0.04)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)', padding: 20, overflowY: 'auto',
          maxHeight: 500,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#aaa', marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
            AI 政策分析报告
          </div>
          {report ? (
            <div
              className="prose prose-invert prose-sm max-w-none"
              style={{ fontSize: 13, lineHeight: 1.7, color: '#ddd' }}
              dangerouslySetInnerHTML={{ __html: marked(report) as string }}
            />
          ) : (
            <div style={{ color: '#555', fontSize: 13, marginTop: 20 }}>
              {loading ? '等待检索完成并生成报告...' : '暂无内容，请发起检索'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
