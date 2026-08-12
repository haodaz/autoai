'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import Link from 'next/link';
import ProChatArea from '@/components/chat/ProChatArea';
import { Users, BookOpen, Calendar, ShieldCheck } from 'lucide-react';

const AGENCY_CARDS = [
  { 
    id: 'assessment',
    title: '需求测评', 
    desc: '学生背景评估', 
    icon: <Users className="w-5 h-5 text-emerald-500" />, 
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    greeting: '你好！我是您的专属留学规划师。我可以帮您初步评估孩子的学术和特长背景，以推荐最合适的英国学校。',
    prompts: ['孩子初二，想去英国读A-Level，能做什么规划？', '我们希望找注重体育的寄宿学校', '去英国读书大概需要多少预算？']
  },
  { 
    id: 'matching',
    title: '院校匹配', 
    desc: '推荐顶尖名校', 
    icon: <BookOpen className="w-5 h-5 text-blue-500" />, 
    bg: 'bg-blue-50 hover:bg-blue-100',
    greeting: '您好！我们可以为您详细介绍各大学校的特色，并根据您的需求进行精准推荐。',
    prompts: ['有哪些理科比较强的英国公学？', '介绍一下米德尔顿中学', '全寄宿学校和周寄宿有什么区别？']
  },
  { 
    id: 'process',
    title: '申请流程', 
    desc: '规划时间线', 
    icon: <Calendar className="w-5 h-5 text-purple-500" />, 
    bg: 'bg-purple-50 hover:bg-purple-100',
    greeting: '您好！英国私校申请需要提前规划，我可以为您梳理关键的时间节点和准备事项。',
    prompts: ['英国高中申请一般要提前多久？', '需要参加什么入学考试？', '面试通常会问什么问题？']
  },
  { 
    id: 'visa',
    title: '签证与监护', 
    desc: '后续落地保障', 
    icon: <ShieldCheck className="w-5 h-5 text-orange-500" />, 
    bg: 'bg-orange-50 hover:bg-orange-100',
    greeting: '您好！从签证办理到寻找当地监护人，我们提供一站式的落地服务保障。',
    prompts: ['未成年孩子去英国必须找监护人吗？', '家长可以陪读吗？', '你们提供哪些签证办理服务？']
  },
];

export default function AgencyChatPage() {
  const [language, setLanguage] = useState<'zh' | 'en' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem('agency_chat_language');
    if (storedLang === 'zh' || storedLang === 'en') {
      setLanguage(storedLang);
    } else {
      setIsModalOpen(true);
    }
  }, []);

  const handleSelectLang = (lang: 'zh' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('agency_chat_language', lang);
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
            <Button type="primary" size="large" onClick={() => handleSelectLang('en')} style={{ background: '#f59e0b' }}>
              English
            </Button>
            <Button size="large" onClick={() => handleSelectLang('zh')}>
              中文
            </Button>
          </div>
        </div>
      </Modal>

      {/* Agency Studio Header */}
      <header className="flex-shrink-0 bg-gradient-to-r from-[#d97706] to-[#f59e0b] text-white px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between shadow-md relative z-10">
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center text-white/90 hover:text-white transition-colors cursor-pointer group">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium text-sm">返回</span>
          </Link>

          <Link href="/" className="flex items-center cursor-pointer space-x-3 border-l border-white/20 pl-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
              <span className="text-[#d97706] font-bold text-xl">颖</span>
            </div>
            <span className="font-bold text-xl tracking-wide text-white drop-shadow-md">留英颖姐工作室</span>
          </Link>
        </div>

        <div className="flex items-center space-x-2 bg-black/10 p-1 rounded-lg">
          <button
            onClick={() => handleSelectLang('en')}
            className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${language === 'en' ? 'bg-white text-[#d97706] shadow-sm' : 'text-amber-100 hover:text-white'}`}
          >
            En
          </button>
          <button
            onClick={() => handleSelectLang('zh')}
            className={`px-3 py-1 rounded text-[11px] font-semibold transition-colors ${language === 'zh' ? 'bg-white text-[#d97706] shadow-sm' : 'text-amber-100 hover:text-white'}`}
          >
            中
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden relative">
        {language && (
          <ProChatArea 
            key={componentKey} 
            api={`/api/chat/agency?lang=${language}`} 
            language={language} 
            customTitle={language === 'en' ? "Welcome to Ying's Agency" : "欢迎来到留英颖姐工作室"}
            customSubtitle={language === 'en' ? "Your dedicated UK education consultant. We match you with the best independent schools." : "我是您的专属留学规划师，客观测评、解答英国教育体系并智能匹配顶尖寄宿学校。"}
            customCards={AGENCY_CARDS}
            customLogo={<div className="w-full h-full bg-[#f59e0b] rounded-full flex items-center justify-center text-white font-bold text-xl">颖</div>}
            customDisclaimer={language === 'en' ? "AI generated content. Please verify with our consultants." : "AI 生成内容仅供参考，具体申请方案请与工作室顾问最终确认为准。"}
            customQuickPrompts={language === 'en' ? ["My child is 12, what are the options?", "Any schools good at sports?", "What's the budget for UK boarding?"] : ["孩子今年12岁，能做什么规划？", "有哪些注重体育的寄宿中学推荐？", "去英国读寄宿学校一年要多少预算？", "未成年去英国必须找监护人吗？"]}
          />
        )}
      </main>
    </div>
  );
}
