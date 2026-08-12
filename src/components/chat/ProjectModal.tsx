'use client';
import React from 'react';
import { X, FolderOpen, MapPin, AlignLeft, Calendar, Link as LinkIcon, Building2 } from 'lucide-react';

export function ProjectModal({ selectedProject, onClose }: { selectedProject: any; onClose: any }) {
  if (!selectedProject) return null;

  return (
    <div className="talent-modal-overlay" onClick={onClose}>
      <div className="talent-modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} color="#666" />
        </button>
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="modal-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <FolderOpen size={40} color="#fff" />
            </div>
            <div className="modal-title-area">
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3>{selectedProject.name || '未知项目'}</h3>
                {selectedProject.program_type && (
                  <span className="modal-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                    {selectedProject.program_type}
                  </span>
                )}
              </div>
              <p className="modal-subtitle">学位: {selectedProject.degree || '-'}</p>
            </div>
          </div>
          <div className="modal-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat-item">
              <span className="stat-label"><Building2 size={14}/> 学院/院系</span>
              <span className="stat-value" style={{ fontSize: 13 }}>{selectedProject.department || '暂无信息'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><Calendar size={14}/> 截止日期</span>
              <span className="stat-value" style={{ fontSize: 13 }}>{selectedProject.deadline || '暂无信息'}</span>
            </div>
          </div>
          
          <div className="modal-tabs">
            <button className="m-tab-btn active">项目信息</button>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="modal-section card-style">
            <h4><AlignLeft size={16} /> 项目简介</h4>
            <p>{selectedProject.description || '暂无详细介绍'}</p>
          </div>

          <div className="modal-section card-style">
            <h4><LinkIcon size={16} /> 申请与要求</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>学位要求</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{selectedProject.degree_requirement || '-'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>学制长度</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{selectedProject.duration || '-'}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>项目链接</span>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>
                    {selectedProject.program_admission_link ? (
                       <a href={selectedProject.program_admission_link} target="_blank" rel="noreferrer" style={{ color: '#427759' }}>点击访问</a>
                    ) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
