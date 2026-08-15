
'use client';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Tooltip, Spin } from 'antd';
import { marked } from 'marked';
import { useWorkspace } from '@/components/layout/WorkspaceContext';
import { ThinkBlock, ToolCallsBlock, renderPreviewStandalone, COLOR_BORDER_MAP } from '@/components/shared/UIBlocks';
import { Building2, Cpu, Activity, History, BookOpen, Settings, Send, CheckCircle2, ChevronRight, ChevronLeft, Users, Layout, Plus, FileText, Calendar, Presentation, AlertTriangle, Scale, Mail, StopCircle, Edit, Edit3, Link2, UploadCloud, Terminal, Info, Download, MessageSquare, Wrench, PenTool, CheckCircle, XCircle, Hourglass, ChevronDown, ChevronUp, Database, Menu, X, Copy, RefreshCw, GitMerge, LogOut, UserCircle, Phone, AtSign, Camera, Save, ArrowLeft, ArrowRight, SaveAll, Loader2 } from 'lucide-react';

export default function KnowledgeBaseView() {
  const { t } = useTranslation();
  const [contexts, setContexts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    fetch('/api/bristh/kb')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setContexts(data);
        } else {
          console.error('API returned non-array:', data);
          setContexts([]);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full h-full bg-[#f8faf9] flex overflow-hidden">
      <div className="flex-1 p-4 md:p-10 overflow-y-auto">
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center">
          <Database className="w-6 h-6 mr-3 text-blue-600" /> {t('bristh.kb.title')}
        </h2>
        <p className="text-gray-500 mb-8 max-w-3xl">
          {t('bristh.kb.desc')}
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        ) : contexts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <BookOpen className="w-16 h-16 mb-4 opacity-50" />
            <p>{t('bristh.kb.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {contexts.map(ctx => (
              <div 
                key={ctx.id} 
                onClick={() => setSelectedItem(ctx)}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex flex-col h-56"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    ctx.source === 'TEXT' ? 'bg-blue-50 text-blue-600' :
                    ctx.source === 'FILE' ? 'bg-emerald-50 text-emerald-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>
                    {ctx.source}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(ctx.createdAt).toLocaleDateString()} {new Date(ctx.createdAt).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 mb-2 truncate">
                  {ctx.rawContent.substring(0, 40).replace(/\n/g, ' ')}{ctx.rawContent.length > 40 ? '...' : ''}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-3 flex-1">
                  {ctx.rawContent}
                </p>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> 关联子任务: {ctx._count?.tasks || 0}
                  </span>
                  <span className="text-xs text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    查看原文 <ChevronRight className="w-3 h-3 ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center text-lg font-black text-gray-800">
            <Database className="w-5 h-5 mr-2 text-blue-600" /> 原始资产记录 (Raw Context)
          </div>
        }
        open={!!selectedItem}
        onCancel={() => setSelectedItem(null)}
        footer={null}
        width={800}
        centered
      >
        {selectedItem && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="text-sm font-bold text-gray-600">
                Asset ID: <span className="font-mono text-xs">{selectedItem.id}</span>
              </div>
              <div className="text-sm font-bold text-gray-600">
                Source: {selectedItem.source}
              </div>
            </div>
            <div className="bg-slate-900 text-gray-300 p-5 rounded-xl font-mono text-sm h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-700">
              {selectedItem.rawContent}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
