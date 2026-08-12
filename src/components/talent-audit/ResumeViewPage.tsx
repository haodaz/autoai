'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, X, ShieldCheck } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';
import { TalentAuditReportData } from './types';
import StructuredResumeView from './StructuredResumeView';
import TruthStudio from './TruthStudio';

export default function ResumeViewPage({ id }: { id: string }) {
  const router = useRouter();
  const [reportData, setReportData] = useState<TalentAuditReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [showStudioMobile, setShowStudioMobile] = useState(false);
  const [showAIChatMobile, setShowAIChatMobile] = useState(false);

  useEffect(() => {
    fetch(`/api/reports/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.data?.content) {
          try {
            setReportData(JSON.parse(data.data.content));
          } catch { /* ignore */ }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ fontSize: 16, color: '#64748b', marginBottom: 16 }}>找不到对应的记录</div>
        <button
          onClick={() => router.push('/talent-audit')}
          style={{ padding: '8px 16px', borderRadius: 8, background: '#427759', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: '#f1f5f9' }}>
      {/* 顶部 Header */}
      <div style={{
        flexShrink: 0, padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push('/talent-audit')}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #427759, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                {reportData.resume?.name ? `${reportData.resume.name}的验真空间` : '验真空间'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区 (PC双栏，移动单栏) */}
      <div className="flex-1 flex overflow-hidden mx-auto w-full max-w-[1400px]" style={{
        gap: isMobile ? 0 : 24, 
        padding: isMobile ? 0 : 24, 
      }}>
        {/* 结构化简历 (在移动端作为主体) */}
        <div className={`flex-1 min-w-0 bg-white flex flex-col overflow-hidden ${isMobile ? '' : 'rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)]'}`}>
          <StructuredResumeView 
            resume={reportData.resume} 
            factItems={reportData.factItems} 
            reportId={id} 
          />
        </div>

        {/* 右侧求真工作室 (PC 端并排) */}
        {!isMobile && (
          <div style={{ width: 420, flexShrink: 0, background: '#fff', borderRadius: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TruthStudio reportId={id} reportData={reportData} />
          </div>
        )}
      </div>

      {/* 移动端底部横条导航 */}
      {isMobile && !showStudioMobile && !showAIChatMobile && (
        <div className="fixed bottom-6 left-4 right-4 z-40 flex items-center gap-3 animate-fade-in">
          <div 
            onClick={() => setShowStudioMobile(true)}
            className="flex-1 h-14 bg-gradient-to-r from-[#427759] to-[#7c3aed] rounded-full shadow-[0_8px_24px_rgba(96,85,245,0.4)] border border-[#7c3aed]/20 flex items-center justify-center gap-2 text-white font-bold active:scale-95 transition-transform"
          >
            <ShieldCheck size={20} className="text-white" />
            <span className="text-[16px] tracking-wide shadow-sm">求真工作室</span>
          </div>
          <div 
            onClick={() => setShowAIChatMobile(true)}
            className="w-14 h-14 bg-white rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center text-[#427759] active:scale-95 transition-transform shrink-0 overflow-hidden"
          >
            <img src="/assets/characters/yida_main/avatar_cropped.jpeg" alt="AI助手" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* 移动端工作室弹窗 (半屏卡片) */}
      {isMobile && showStudioMobile && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowStudioMobile(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up flex flex-col pb-safe">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-[18px] font-bold text-[#1e293b] flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#427759]" /> 求真工作室
              </h2>
              <button onClick={() => setShowStudioMobile(false)} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full bg-gray-100 active:scale-95">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 pb-8">
              <TruthStudio reportId={id} reportData={reportData} mode="buttons" />
            </div>
          </div>
        </>
      )}

      {/* 移动端 AI 助手弹窗 (抽屉) */}
      {isMobile && showAIChatMobile && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowAIChatMobile(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up flex flex-col" style={{ height: '88vh' }}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shadow-sm rounded-t-3xl">
              <div className="flex items-center gap-2">
                <img src="/assets/characters/yida_main/avatar_cropped.jpeg" alt="AI" className="w-8 h-8 rounded-full border border-gray-100 object-cover" />
                <h2 className="text-[16px] font-bold text-[#1e293b]">一答 人才分析助手</h2>
              </div>
              <button onClick={() => setShowAIChatMobile(false)} className="w-8 h-8 flex items-center justify-center text-gray-500 rounded-full bg-gray-100 active:scale-95">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col bg-[#f8fafc] pb-safe">
              <TruthStudio reportId={id} reportData={reportData} mode="chat" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
