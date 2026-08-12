'use client';
import React from 'react';

const PRIMARY = '#427759';

interface AssessmentIntroCardProps {
  typeName: string;
  typeIcon: string;
  openingIntro: string;
  avatarUrl?: string | null;
  charName?: string;
  onConfirm: () => void;
  onDismiss: () => void;
  /** 确认按鈕文字，默认「✨ 开始测评」 */
  confirmLabel?: string;
  /** 拒绝按鈕文字，默认「聊点别的」 */
  dismissLabel?: string;
}

/**
 * 测评引导卡片
 * 在聊天流中以 AI 消息的形式插入，显示测评说明并等待用户确认
 */
export default function AssessmentIntroCard({
  typeName, typeIcon, openingIntro,
  avatarUrl, charName,
  onConfirm, onDismiss,
  confirmLabel = '✨ 开始测评',
  dismissLabel = '聊点别的',
}: AssessmentIntroCardProps) {
  /** 把引导语按行渲染：• 开头 → 要点，空行 → 间距，其余 → 普通段落 */
  const renderIntro = (text: string) =>
    text.split('\n').map((line, i) => {
      if (line.startsWith('•')) {
        return <div key={i} className="pl-1 py-0.5 text-sm" style={{ color: '#374151' }}>{line}</div>;
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return <div key={i} className="text-sm leading-relaxed" style={{ color: '#374151' }}>{line}</div>;
    });

  return (
    /* 与普通 AI 消息布局一致：左侧头像 + 右侧内容 */
    <div className="max-w-[800px] px-[22px] mx-auto mb-4" style={{ animation: 'msg-in 0.22s ease-out' }}>
      {/* 头像行 */}
      <div className="flex items-center gap-[10px] mb-2">
        <div
          className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-lg font-bold border-2"
          style={{ borderColor: 'rgba(223,227,245,1)', background: avatarUrl ? 'transparent' : 'linear-gradient(135deg,#7c6dde,#a78bfa)' }}
        >
          {avatarUrl
            ? <img src={avatarUrl} alt={charName || ''} className="w-full h-full object-cover" />
            : <span>{typeIcon}</span>
          }
        </div>
        <span className="text-sm font-semibold" style={{ color: 'rgba(0,0,0,0.70)' }}>
          {charName || typeName}
        </span>
      </div>

      {/* 卡片主体 */}
      <div className="pl-[46px]">
        <div
          className="rounded-[4px_16px_16px_16px] p-4 border"
          style={{
            background: '#fff',
            borderColor: '#e8e3f5',
            boxShadow: '0 2px 12px rgba(96,85,245,.08)',
          }}
        >
          {/* 引导文案 */}
          <div className="flex flex-col gap-0.5">
            {renderIntro(openingIntro)}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-[10px] mt-[14px] flex-wrap">
            <button
              onClick={onConfirm}
              className="px-[18px] py-2 rounded-[10px] text-[13px] font-semibold text-white border-none cursor-pointer transition-opacity duration-150"
              style={{
                background: `linear-gradient(135deg, ${PRIMARY}, #8b5cf6)`,
                boxShadow: '0 2px 8px rgba(96,85,245,.3)',
              }}
            >
              ✨ {confirmLabel || '开始测评'}
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 rounded-[10px] text-[13px] font-medium border cursor-pointer transition-colors duration-150"
              style={{
                background: '#f1f0ff',
                color: PRIMARY,
                borderColor: '#ddd9ff',
              }}
            >
              {dismissLabel || '聊点别的'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
