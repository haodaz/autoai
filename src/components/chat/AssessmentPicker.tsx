'use client';
import React, { useState } from 'react';
import type { AssessmentType } from '@/lib/assessment/types';

const PRIMARY = '#427759';

interface AssessmentPickerProps {
  charId: string;
  types: AssessmentType[];
  onSelect: (typeId: string) => void;
  onClose: () => void;
  /** 副标题，不传时用默认学生版文案 */
  subtitle?: string;
}

/** 测评类型选择器 —— 浮层弹窗 */
export default function AssessmentPicker({ types, onSelect, onClose, subtitle }: AssessmentPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    /* 遮罩层 */
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      {/* 卡片容器 —— 阻止冒泡 */}
      <div
        className="w-[360px] max-w-[92vw] rounded-[20px] p-6 shadow-2xl"
        style={{ background: '#fff' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-start justify-between mb-[18px]">
          <div>
            <div className="text-base font-bold" style={{ color: '#1a1a2e' }}>选择分析类型</div>
            <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{subtitle || '通过对话完成专业测评，生成个人报告'}</div>
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none border-none bg-none cursor-pointer p-1"
            style={{ color: '#9ca3af', background: 'none', border: 'none' }}
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 测评类型列表 */}
        <div className="flex flex-col gap-[10px]">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => { onSelect(t.id); onClose(); }}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              className="flex items-center gap-3 px-4 py-[14px] text-left cursor-pointer rounded-xl border transition-shadow duration-200"
              style={{
                border: `1.5px solid ${hovered === t.id ? PRIMARY : '#e0defe'}`,
                background: hovered === t.id ? '#f5f3ff' : '#faf9ff',
                boxShadow: hovered === t.id ? '0 4px 16px rgba(96,85,245,.18)' : 'none',
              }}
            >
              <span className="text-[26px] leading-none flex-shrink-0">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold" style={{ color: '#1a1a2e' }}>{t.name}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: '#6b7280' }}>{t.intro}</div>
              </div>
              {/* 右箭头 */}
              <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
