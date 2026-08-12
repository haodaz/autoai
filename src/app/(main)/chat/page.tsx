'use client';

import React, { Suspense, useState } from 'react';
import { Spin } from 'antd';
import { useSearchParams } from 'next/navigation';
import ChatArea from '@/components/chat/ChatArea';
import CharacterPanel from '@/components/character/CharacterPanel';
import { AIStatus } from '@/lib/ai/types';

function ChatPageContent() {
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
  const searchParams = useSearchParams();

  // ── 关键：charId 变化时强制 React 完全卸载重挂 ChatArea ──────────
  // 只依赖 charId，不依赖 convId，以防新建对话时 stream 被卸载打断
  const charId = searchParams.get('charId') || '';
  const componentKey = `chat-char-${charId}`;

  return (
    <>
      {/* 聊天区 + 角色面板 */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* 中间聊天区 */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            <ChatArea
              key={componentKey}
              skillInput={skillInput}
              onStatusChange={setAiStatus}
            />
          </div>

          {/* 右侧角色面板 */}
          <CharacterPanel
            key={`panel-${charId}`}
            collapsed={panelCollapsed}
            onToggle={() => setPanelCollapsed(v => !v)}
            onSkillClick={skill => setSkillInput(skill + '\n')}
            aiStatus={aiStatus}
          />
        </div>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Spin size="large" /></div>}>
      <ChatPageContent />
    </Suspense>
  );
}
