'use client';
import React from 'react';
import { X, CheckCircle2, Bookmark, GraduationCap, MapPin, AlignLeft, Calendar } from 'lucide-react';

export function CaseModal({ selectedCase, onClose }: { selectedCase: any; onClose: any }) {
  if (!selectedCase) return null;

  return (
    <div className="talent-modal-overlay" onClick={onClose}>
      <div className="talent-modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} color="#666" />
        </button>
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="modal-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Bookmark size={40} color="#fff" />
            </div>
            <div className="modal-title-area">
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3>{selectedCase.program_name || selectedCase.feature_label || '未知案例'}</h3>
                {selectedCase.admission_result && (
                  <span className="modal-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                    {selectedCase.admission_result}
                  </span>
                )}
              </div>
              <p className="modal-subtitle">案例编号: {selectedCase.student_case_id || selectedCase.id}</p>
            </div>
          </div>
          <div className="modal-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat-item">
              <span className="stat-label"><Calendar size={14}/> 申请年份/学期</span>
              <span className="stat-value" style={{ fontSize: 13 }}>{selectedCase.year || ''} {selectedCase.term || ''}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><GraduationCap size={14}/> 申请学位</span>
              <span className="stat-value" style={{ fontSize: 13 }}>{selectedCase.apply_degree || '暂无信息'}</span>
            </div>
          </div>
          
          <div className="modal-tabs">
            <button className="m-tab-btn active">案例信息</button>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="modal-section card-style">
            <h4><AlignLeft size={16} /> 案例摘要</h4>
            <p>{selectedCase.feature_label || '暂无详细描述'}</p>
          </div>

          <div className="modal-section card-style">
            <h4><CheckCircle2 size={16} /> 详细申请数据</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>最高学历</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{selectedCase.highest_degree || '-'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>申请院校 ID</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{selectedCase.apply_institute_id || '-'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>录取结果</span>
                  <span style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>{selectedCase.admission_result || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
