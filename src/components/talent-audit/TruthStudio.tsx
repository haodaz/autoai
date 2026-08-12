import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, FileSearch, ArrowRight } from 'lucide-react';
import ResumeAIChat from './ResumeAIChat';
import { TalentAuditReportData } from './types';

export default function TruthStudio({ reportId, reportData, mode = 'all' }: { reportId: string, reportData: TalentAuditReportData, mode?: 'all' | 'buttons' | 'chat' }) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      
      {/* 顶部按钮区 */}
      {(mode === 'all' || mode === 'buttons') && (
        <div style={{ padding: '32px 32px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>求真工作室</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* 人才验真按钮 */}
            <button
              onClick={() => {
                if (reportData?.factItems && reportData.factItems.length > 0) {
                  router.push(`/talent-audit/${reportId}`);
                } else {
                  router.push(`/talent-audit/new?resumeId=talent_audit_report_${reportId}`);
                }
              }}
              style={{
                padding: '20px', borderRadius: 16, 
                border: reportData?.factItems?.length > 0 ? '1px solid #c7d2fe' : '1px solid #e0e7ff', 
                background: reportData?.factItems?.length > 0 ? '#fff' : '#eef2ff',
                boxShadow: reportData?.factItems?.length > 0 ? '0 4px 12px rgba(79,70,229,0.08)' : 'none',
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'left', position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              {reportData?.factItems?.length > 0 && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#4f46e5', color: '#fff', fontSize: 10, padding: '2px 8px', borderBottomLeftRadius: 8, fontWeight: 600 }}>
                  已出具
                </div>
              )}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: reportData?.factItems?.length > 0 ? '#eef2ff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSearch size={20} color="#4f46e5" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>人才验真</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#4f46e5', letterSpacing: 1 }}>VERIFY</div>
              </div>
            </button>

            {/* 测算真值按钮 */}
            <button
              onClick={() => router.push(`/talent-audit/${reportId}?tab=eval`)}
              style={{
                padding: '20px', borderRadius: 16, 
                border: reportData?.valueEvaluation ? '1px solid #f5d0fe' : '1px solid #fae8ff', 
                background: reportData?.valueEvaluation ? '#fff' : '#fdf4ff',
                boxShadow: reportData?.valueEvaluation ? '0 4px 12px rgba(192,38,211,0.08)' : 'none',
                display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', cursor: 'pointer',
                transition: 'all 0.2s', textAlign: 'left', position: 'relative', overflow: 'hidden'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
            >
              {reportData?.valueEvaluation && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: '#c026d3', color: '#fff', fontSize: 10, padding: '2px 8px', borderBottomLeftRadius: 8, fontWeight: 600 }}>
                  已出具
                </div>
              )}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: reportData?.valueEvaluation ? '#fdf4ff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={20} color="#c026d3" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#4a044e', marginBottom: 4 }}>检验真值</div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#c026d3', letterSpacing: 1 }}>EVALUATE</div>
              </div>
            </button>
          </div>

          {/* 一键AI扫描按钮 */}
          {(() => {
            const hasVerified = reportData?.factItems?.some((f: any) => f.status === 'match' || f.status === 'manual_review');
            return (
              <button
                onClick={() => hasVerified && router.push(`/talent-audit/${reportId}?tab=scan`)}
                disabled={!hasVerified}
                style={{
                  marginTop: 12, padding: '16px 20px', borderRadius: 16,
                  border: reportData?.aiScan ? '1px solid #c4b5fd' : '1px solid #ede9fe',
                  background: !hasVerified ? '#f1f5f9' : reportData?.aiScan ? '#fff' : 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                  boxShadow: reportData?.aiScan ? '0 4px 12px rgba(96,85,245,0.08)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 16, 
                  cursor: hasVerified ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', textAlign: 'left', position: 'relative' as const, overflow: 'hidden',
                  width: '100%', opacity: hasVerified ? 1 : 0.5,
                }}
                onMouseEnter={e => { if (hasVerified) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                {reportData?.aiScan && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#427759', color: '#fff', fontSize: 10, padding: '2px 8px', borderBottomLeftRadius: 8, fontWeight: 600 }}>
                    已出具
                  </div>
                )}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: reportData?.aiScan ? '#f5f3ff' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={22} color={hasVerified ? '#427759' : '#94a3b8'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: hasVerified ? '#1e1b4b' : '#94a3b8', marginBottom: 2 }}>全景AI扫描</div>
                  <div style={{ fontSize: 11, color: hasVerified ? '#64748b' : '#94a3b8' }}>
                    {hasVerified ? '基于人才全景信息进行判断' : '请先完成人才验真'}
                  </div>
                </div>
                <ArrowRight size={16} color={hasVerified ? '#a8a29e' : '#cbd5e1'} />
              </button>
            );
          })()}

          {/* 全景信息按钮 */}
          {(() => {
            const hasVerified = reportData?.factItems?.some((f: any) => f.status === 'match' || f.status === 'manual_review');
            const hasSourceData = reportData?.sourceData && Object.keys(reportData.sourceData).length > 0;
            return (
              <button
                onClick={() => hasVerified && router.push(`/talent-audit/${reportId}?tab=panorama`)}
                disabled={!hasVerified}
                style={{
                  marginTop: 8, padding: '16px 20px', borderRadius: 16,
                  border: hasSourceData ? '1px solid #99f6e4' : '1px solid #ccfbf1',
                  background: !hasVerified ? '#f1f5f9' : hasSourceData ? '#fff' : 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
                  boxShadow: hasSourceData ? '0 4px 12px rgba(13,148,136,0.08)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: hasVerified ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', textAlign: 'left', position: 'relative' as const, overflow: 'hidden',
                  width: '100%', opacity: hasVerified ? 1 : 0.5,
                }}
                onMouseEnter={e => { if (hasVerified) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
              >
                {hasSourceData && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: '#0d9488', color: '#fff', fontSize: 10, padding: '2px 8px', borderBottomLeftRadius: 8, fontWeight: 600 }}>
                    已采集
                  </div>
                )}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: hasSourceData ? '#f0fdfa' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileSearch size={22} color={hasVerified ? '#0d9488' : '#94a3b8'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: hasVerified ? '#134e4a' : '#94a3b8', marginBottom: 2 }}>全景信息</div>
                  <div style={{ fontSize: 11, color: hasVerified ? '#64748b' : '#94a3b8' }}>
                    {hasVerified ? '平方 · ORCID · Scholar · 百科 全渠道采集' : '请先完成人才验真'}
                  </div>
                </div>
                <ArrowRight size={16} color={hasVerified ? '#a8a29e' : '#cbd5e1'} />
              </button>
            );
          })()}
        </div>
      )}

      {/* 分割线 */}
      {mode === 'all' && (
        <div style={{ padding: '0 32px' }}>
          <div style={{ borderTop: '1px dashed #cbd5e1' }} />
        </div>
      )}

      {/* 底部 AI Chat 区 */}
      {(mode === 'all' || mode === 'chat') && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {mode === 'all' && (
            <div style={{ padding: '24px 32px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>一答 人才分析助手</div>
            </div>
          )}
          
          <div style={{ flex: 1, overflow: 'hidden', padding: mode === 'all' ? '0 16px 16px' : '0' }}>
            <ResumeAIChat reportData={reportData} />
          </div>
        </div>
      )}
      
    </div>
  );
}
