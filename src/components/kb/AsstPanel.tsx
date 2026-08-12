'use client';
import React, { useRef, useImperativeHandle, forwardRef, useState } from 'react';
import {
  LeftOutlined,
  SearchOutlined,
  BarChartOutlined,
  FolderOpenOutlined,
  EditOutlined,
  GlobalOutlined,
  PushpinOutlined,
} from '@ant-design/icons';

// ── 助理状态类型 ──────────────────────────────────────────────────────
export type AsstState = 'idle' | 'thinking' | 'talking' | 'working';
export interface AsstPanelRef { setState: (s: AsstState) => void; }

const ABILITIES = [
  { icon: <SearchOutlined />,     label: '查询文档内容',  color: '#427759' },
  { icon: <BarChartOutlined />,   label: '深度分析资料',  color: '#10a37f' },
  { icon: <FolderOpenOutlined />, label: '归纳整理知识点', color: '#f59e0b' },
  { icon: <EditOutlined />,       label: '基于内容创作',  color: '#ef4444' },
  { icon: <GlobalOutlined />,     label: '翻译资料内容',  color: '#3b82f6' },
  { icon: <PushpinOutlined />,    label: '写入我的笔记',  color: '#8b5cf6' },
];

interface Props {
  libId: string;
  libName: string;
  libEmoji: string;
  fileCount?: number;
  totalSizeKb?: number;
  collapsed?: boolean;
  onToggle?: () => void;
  onAbilityClick: (label: string) => void;
}

// ── 共用样式常量（与 CharacterPanel 保持一致）────────────────────────
const chipBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center',
  padding: '3px 10px', borderRadius: 20,
  fontSize: 12, fontWeight: 500,
};
const sectionHdrStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#a0aec0',
  letterSpacing: '.07em', textTransform: 'uppercase',
  marginBottom: 10,
};

const AsstPanel = forwardRef<AsstPanelRef, Props>(function AsstPanel(
  { libName, libEmoji, fileCount = 0, totalSizeKb = 0, collapsed = false, onToggle, onAbilityClick },
  ref
) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768; // simple fallback
  const imgRef      = useRef<HTMLImageElement>(null);
  const [hoveredAbility, setHoveredAbility] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    setState(s: AsstState) {
      const img = imgRef.current;
      if (!img) return;
      if (img.src.includes('/assets/dog_')) img.src = `/assets/dog_${s}.png`;
    },
  }));

  const sizeValueKb = totalSizeKb;
  const isKb = sizeValueKb < 1024;
  const displaySize = isKb ? sizeValueKb.toFixed(1) : (sizeValueKb / 1024).toFixed(1);
  const displayUnit = isKb ? 'KB' : 'MB';

  // 气泡：固定的角色 state 文案（与 CharacterPanel 的 stateText 同理）
  const BUBBLE_TEXT = '有什么我能帮你的吗？';

  // 气泡样式 —— 完全照抄 CharacterPanel
  const bubbleStyle: React.CSSProperties = {
    flex: 1, background: '#fff',
    border: '1px solid rgba(224,228,242,0.9)',
    borderRadius: '4px 14px 14px 14px',
    padding: '9px 14px', fontSize: 14,
    color: '#4a4a5e', lineHeight: 1.55,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    position: 'relative', marginTop: 48,
  };

  return (
    <div style={{
      width: isMobile ? '100%' : (collapsed ? 0 : 380),
      flexShrink: 0,
      overflow: 'visible',
      transition: 'width 0.32s cubic-bezier(.4,0,.2,1)',
      position: 'relative',
      borderRadius: collapsed ? 0 : 16,
      border: collapsed ? 'none' : '1px solid rgba(224,228,242,0.6)',
      boxShadow: collapsed ? 'none' : '0 2px 20px rgba(96,85,245,0.09)',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>

      {/* ── 收起/展开 tab（完全照抄 CharacterPanel）── */}
      {!isMobile && <div onClick={onToggle} style={{
        position: 'absolute',
        left: collapsed ? -50 : -20,
        top: '50%',
        transform: 'translateY(-50%)',
        width: collapsed ? 50 : 20,
        paddingTop: collapsed ? 8 : 0,
        paddingBottom: collapsed ? 8 : 0,
        height: collapsed ? 'auto' : 52,
        background: '#fff',
        border: '1px solid rgba(223,227,245,1)',
        borderRight: 'none',
        borderRadius: '12px 0 0 12px',
        boxShadow: collapsed ? '-2px 0 12px rgba(0,0,0,0.10)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: collapsed ? 4 : 0,
        cursor: 'pointer',
        zIndex: 10,
        transition: 'width 0.32s cubic-bezier(.4,0,.2,1), left 0.32s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
      }}>
        {collapsed ? (
          // 收起状态：狗头像 + "助理" 文字
          <>
            <div style={{
              width: 34, height: 34, borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg, #ede9ff, #f4f0ff)',
              border: '2px solid rgba(124,92,246,0.2)',
              flexShrink: 0,
            }}>
              <img
                src="/assets/dog_idle.png"
                alt="助理"
                onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
              />
            </div>
            <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500, lineHeight: 1 }}>助理</span>
          </>
        ) : (
          <LeftOutlined style={{ fontSize: 10, color: 'rgba(128,128,128,1)' }} />
        )}
      </div>}

      {/* ── 展开内容 ── */}
      {(!collapsed || isMobile) && (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>

          {/* ══ 一、英雄图区 240px（hardcoded dog）══ */}
          <div style={{
            height: 240, flexShrink: 0, position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(175deg, #eaf4fd 0%, #e0e4f2 100%)',
          }}>
            <img
              ref={imgRef}
              id="asst-img"
              src="/assets/dog_idle.png"
              alt="知识助理"
              onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
                display: 'block',
              }}
            />
          </div>

          {/* ══ 二、信息卡区 ══ */}
          <div style={{ padding: '0 20px 20px' }}>

            {/* 2-1 头像（80×80 圆角方块）+ 气泡行 —— 与 CharacterPanel 完全一致 */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              marginTop: -40, marginBottom: 14,
              position: 'relative', zIndex: 5,
            }}>
              {/* 80×80 圆角方块头像（hardcoded 狗头） */}
              <div style={{
                width: 80, height: 80, borderRadius: 16, overflow: 'hidden',
                flexShrink: 0,
                background: 'linear-gradient(135deg, #ede9ff, #f4f0ff)',
                border: '3px solid #fff',
                boxShadow: '0 4px 16px rgba(0,0,0,.18)',
              }}>
                <img
                  src="/assets/dog_idle.png"
                  alt="知识助理"
                  onError={e => { (e.currentTarget as HTMLImageElement).src = '/assets/default-ai-robot.png'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                />
              </div>

              {/* 状态气泡（固定短文案）*/}
              <div style={bubbleStyle}>
                {/* 左侧尾巴 */}
                <div style={{
                  position: 'absolute', top: 14, left: -8,
                  width: 0, height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid rgba(224,228,242,0.9)',
                }} />
                <div style={{
                  position: 'absolute', top: 15, left: -6,
                  width: 0, height: 0,
                  borderTop: '7px solid transparent',
                  borderBottom: '7px solid transparent',
                  borderRight: '7px solid #fff',
                }} />
                {BUBBLE_TEXT}
              </div>
            </div>

            {/* 2-2 类型标签 */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '3px 11px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,.12)', color: '#4a4a5e',
              }}>
                知识管家
              </span>
            </div>

            {/* 2-3 知识库名称 */}
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', letterSpacing: '-.02em', marginBottom: 6, lineHeight: 1.2 }}>
              {libName}
            </div>

            {/* 2-4 tagline */}
            <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 14, lineHeight: 1.4 }}>
              基于知识库内容为你提供精准帮助
            </div>

            {/* 2-5 统计数据（文档数 + 知识量） */}
            <div style={{
              display: 'flex', marginBottom: 18,
              background: 'rgba(96,85,245,0.04)', borderRadius: 12,
              border: '1px solid rgba(223,227,245,0.9)',
              overflow: 'hidden',
            }}>
              <div style={{ flex: 1, padding: '12px 0', textAlign: 'center', borderRight: '1px solid rgba(223,227,245,0.8)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#427759', lineHeight: 1 }}>{fileCount}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>份文档</div>
              </div>
              <div style={{ flex: 1, padding: '12px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#427759', lineHeight: 1 }}>
                  {displaySize}<span style={{ fontSize: 12, fontWeight: 500 }}>{displayUnit}</span>
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>知识量</div>
              </div>
            </div>

            {/* 2-6 话题标签 */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
              {['查询文档', '分析资料', '整理笔记', '辅助创作'].map(tag => (
                <span key={tag} style={{ ...chipBase, background: 'rgba(96,85,245,.07)', color: 'rgba(96,85,245,1)', border: '1px solid rgba(96,85,245,.14)' }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* 2-7 我能帮你：能力按钮 */}
            <div style={{ marginBottom: 20 }}>
              <div style={sectionHdrStyle}>我能帮你</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {ABILITIES.map(({ icon, label, color }) => {
                  const isHov = hoveredAbility === label;
                  return (
                    <button
                      key={label}
                      onClick={() => onAbilityClick(label)}
                      onMouseEnter={() => setHoveredAbility(label)}
                      onMouseLeave={() => setHoveredAbility(null)}
                      style={{
                        textAlign: 'left', whiteSpace: 'normal', height: 'auto',
                        padding: '9px 14px', lineHeight: 1.4,
                        background: isHov ? `${color}08` : '#fff',
                        border: `1px solid ${isHov ? `${color}33` : 'rgba(224,228,242,0.9)'}`,
                        borderRadius: 10, cursor: 'pointer', fontSize: 13,
                        color: isHov ? color : '#374151',
                        display: 'flex', alignItems: 'center', gap: 10,
                        transition: 'all 0.15s', fontFamily: 'inherit',
                        width: '100%',
                      }}
                    >
                      <span style={{
                        width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                        background: isHov ? `${color}18` : 'rgba(0,0,0,0.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isHov ? color : '#a0aec0', fontSize: 12, transition: 'all 0.15s',
                      }}>
                        {icon}
                      </span>
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimwave {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
});

export default AsstPanel;
