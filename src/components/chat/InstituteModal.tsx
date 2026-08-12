'use client';
import React from 'react';
import { Building2, X, MapPin, Mail, Globe, AlignLeft, Info } from 'lucide-react';

export function InstituteModal({ selectedInstitute, onClose }: { selectedInstitute: any; onClose: any }) {
  if (!selectedInstitute) return null;

  // 所在位置：国家·省/州·城市（使用 SelectionOptions.name）
  const location = [selectedInstitute.country, selectedInstitute.state, selectedInstitute.city].filter(Boolean).join(' · ');

  return (
    <div className="talent-modal-overlay" onClick={onClose}>
      <div className="talent-modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} color="#666" />
        </button>
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="modal-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <Building2 size={40} color="#fff" />
            </div>
            <div className="modal-title-area">
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3>{selectedInstitute.name}</h3>
                {/* 国家标签：使用 CRMCountry.name */}
                {selectedInstitute.country_label && (
                  <span className="modal-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                    {selectedInstitute.country_label}
                  </span>
                )}
              </div>
              <p className="modal-subtitle">{selectedInstitute.name_en}</p>
              {selectedInstitute.native_name && selectedInstitute.native_name !== selectedInstitute.name && (
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>{selectedInstitute.native_name}</div>
              )}
            </div>
          </div>
          <div className="modal-stats-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="stat-item">
              <span className="stat-label"><MapPin size={14}/> 所在位置</span>
              <span className="stat-value" style={{ fontSize: 13 }}>{location || '暂无信息'}</span>
            </div>
          </div>
          
          <div className="modal-tabs">
            <button className="m-tab-btn active">院校信息</button>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="modal-section card-style">
            <h4><AlignLeft size={16} /> 院校简介</h4>
            <p>{selectedInstitute.description || '暂无简介信息'}</p>
          </div>

          <div className="modal-section card-style">
            <h4><Info size={16} /> 联系方式与官方渠道</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <MapPin size={16} color="#6b7280" style={{ marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                    {selectedInstitute.address || '暂无详细地址'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Globe size={16} color="#6b7280" />
                <div style={{ flex: 1 }}>
                  {selectedInstitute.homepage ? (
                    <a href={selectedInstitute.homepage} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#427759', textDecoration: 'none' }}>
                      {selectedInstitute.homepage}
                    </a>
                  ) : (
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>暂无官方主页</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Mail size={16} color="#6b7280" />
                <div style={{ flex: 1 }}>
                  {selectedInstitute.email ? (
                    <a href={`mailto:${selectedInstitute.email}`} style={{ fontSize: 13, color: '#427759', textDecoration: 'none' }}>
                      {selectedInstitute.email}
                    </a>
                  ) : (
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>暂无邮箱信息</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
