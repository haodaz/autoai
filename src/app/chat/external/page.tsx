'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import Link from 'next/link';
import ProChatArea from '@/components/chat/ProChatArea';

export default function ExternalChatPage() {
  const [language, setLanguage] = useState<'zh' | 'en' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('external_chat_language');
    if (storedLang === 'zh' || storedLang === 'en') {
      setLanguage(storedLang);
    } else {
      setIsModalOpen(true);
    }
  }, []);

  const handleSelectLang = (lang: 'zh' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('external_chat_language', lang);
    setIsModalOpen(false);
  };

  const componentKey = `chat-ext-${language || 'zh'}`;

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc]">
      <Modal
        title="Welcome / 欢迎"
        open={isModalOpen}
        closable={false}
        footer={null}
        centered
        maskClosable={false}
      >
        <div style={{ padding: '20px 0', textAlign: 'center' }}>
          <p style={{ marginBottom: 24, color: '#666' }}>Please select your preferred language / 请选择您的首选语言</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Button type="primary" size="large" onClick={() => handleSelectLang('en')} style={{ background: '#427759' }}>
              English
            </Button>
            <Button size="large" onClick={() => handleSelectLang('zh')}>
              中文
            </Button>
          </div>
        </div>
      </Modal>

      {/* Myddelton College Header */}
      <header className="flex-shrink-0 bg-[#427759] text-white px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between shadow-md relative z-10">
        <Link href="/" className="flex items-center cursor-pointer">
          <img src="/logo.webp" alt="Myddelton Logo" className="h-8 md:h-10 w-auto object-contain" />
        </Link>

        <div className="flex items-center space-x-2 bg-black/10 p-1 rounded-lg">
          <button
            onClick={() => handleSelectLang('en')}
            className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${language === 'en' ? 'bg-white text-[#427759] shadow-sm' : 'text-emerald-100 hover:text-white'}`}
          >
            En
          </button>
          <button
            onClick={() => handleSelectLang('zh')}
            className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${language === 'zh' ? 'bg-white text-[#427759] shadow-sm' : 'text-emerald-100 hover:text-white'}`}
          >
            中
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden relative">
        {language && (
          <ProChatArea key={componentKey} api={`/api/chat/external?lang=${language}`} language={language} />
        )}
      </main>
    </div>
  );
}
