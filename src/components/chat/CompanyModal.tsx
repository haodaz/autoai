'use client';
import React from 'react';
import { Building2, X, MapPin, Globe, Hash, AlignLeft, Info } from 'lucide-react';

export function CompanyModal({ selectedCompany, onClose }: { selectedCompany: any; onClose: any }) {
  if (!selectedCompany) return null;

  const location = [selectedCompany.province, selectedCompany.city].filter(Boolean).join(' · ');

  return (
    <div className="talent-modal-overlay" onClick={onClose}>
      <div className="talent-modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} color="#666" />
        </button>
        <div className="modal-header">
          <div className="modal-header-top">
            <div className="modal-avatar" style={{ background: 'linear-gradient(135deg, #1677ff, #0958d9)' }}>
              <Building2 size={40} color="#fff" />
            </div>
            <div className="modal-title-area">
              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                <h3>{selectedCompany.name}</h3>
                {selectedCompany.city && (
                  <span className="modal-badge" style={{ background: 'rgba(22, 119, 255, 0.1)', color: '#0958d9', borderColor: 'rgba(22, 119, 255, 0.2)' }}>
                    {selectedCompany.city}
                  </span>
                )}
              </div>
              <p className="modal-subtitle">{selectedCompany.brief_name || '公司简称'}</p>
            </div>
          </div>
          <div className="modal-stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div className="stat-item">
              <span className="stat-label"><MapPin size={14}/> 所在位置</span>
              <span className="stat-value" style={{ fontSize: 13 }}>{location || '暂无信息'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label"><Hash size={14}/> 统一社会信用代码</span>
              <span className="stat-value" style={{ fontSize: 13 }}>{selectedCompany.unified_social_credit_code || '暂无信息'}</span>
            </div>
          </div>
          
          <div className="modal-tabs">
            <button className="m-tab-btn active">企业档案</button>
          </div>
        </div>
        
        <div className="modal-body">
          <div className="modal-section card-style">
            <h4><AlignLeft size={16} /> 简介与主营业务</h4>
            <p>{selectedCompany.introduction || selectedCompany.business_range || '暂无详细介绍信息。'}</p>
          </div>

          {(selectedCompany.official_website) && (
            <div className="modal-section card-style">
              <h4><Info size={16} /> 官方信息</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {selectedCompany.official_website && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                    <Globe size={16} color="#64748b" style={{ marginTop: 2 }}/>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#64748b', fontSize: 12 }}>官方网站</span>
                      <a href={selectedCompany.official_website.startsWith('http') ? selectedCompany.official_website : `http://${selectedCompany.official_website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1677ff', textDecoration: 'none', wordBreak: 'break-all' }}>
                        {selectedCompany.official_website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
