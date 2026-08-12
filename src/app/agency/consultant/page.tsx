'use client';

import { MessageSquare, Sparkles, GraduationCap, BookOpen, Megaphone, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProChatArea from '@/components/chat/ProChatArea';

export default function AgencyConsultantPage() {
  const { t } = useTranslation();

  const agencyCards = [
    { 
      id: 'match',
      title: '智能选校', 
      desc: '精准匹配学校',
      icon: <GraduationCap className="w-5 h-5 text-blue-500" />, 
      bg: 'bg-blue-50 hover:bg-blue-100',
      greeting: '你好！我是智能选校助手 🎓 我可以根据学生的背景条件和预算，精准推荐适合的学校。',
      prompts: ['帮我为这个学生做选校匹配：GPA 3.5，雅思 6.5，想学CS，预算40万/年以内', '这名学生适合申请哪些英国寄宿高中？']
    },
    { 
      id: 'compare',
      title: '竞品对比', 
      desc: '横向对比分析',
      icon: <BookOpen className="w-5 h-5 text-indigo-500" />, 
      bg: 'bg-indigo-50 hover:bg-indigo-100',
      greeting: '你好！我是竞品分析助手 📖 我可以帮你横向对比不同学校的优劣势和申请条件。',
      prompts: ['对比 Myddelton College 和 Ruthin School 的 A-Level 成绩、学费和住宿条件', '这两所学校各自的优势专业是什么？']
    },
    { 
      id: 'marketing',
      title: '营销文案', 
      desc: '生成引流内容',
      icon: <Megaphone className="w-5 h-5 text-violet-500" />, 
      bg: 'bg-violet-50 hover:bg-violet-100',
      greeting: '你好！我是营销文案助手 📢 我可以帮你快速生成适合小红书、朋友圈的招生引流文案。',
      prompts: ['根据 Myddelton College 最新的奖学金政策，帮我写一篇小红书引流文案', '写一段吸引家长报名夏令营的朋友圈文案']
    },
    { 
      id: 'report',
      title: '进度汇报', 
      desc: '家校沟通话术',
      icon: <FileText className="w-5 h-5 text-sky-500" />, 
      bg: 'bg-sky-50 hover:bg-sky-100',
      greeting: '你好！我是沟通与汇报助手 📝 我可以帮你撰写给家长的申请进度汇报和沟通话术。',
      prompts: ['帮我给家长写一封学生申请进度汇报信，涵盖面试准备和材料提交情况', '家长催问录取结果，我该怎么回复？']
    }
  ];

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center">
            <MessageSquare className="w-6 h-6 text-blue-600 mr-2" />
            {t('agency.consultant.title', 'AI Master Consultant')}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {t('agency.consultant.subtitle', 'Your intelligent partner for school matching, marketing, and student management')}
          </p>
        </div>
        <div className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm font-semibold">
          <Sparkles className="w-4 h-4 mr-1.5" />
          {t('agency.consultant.badge', 'Multi-School KB Enabled')}
        </div>
      </div>

      {/* Chat Area */}
      <div className="h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
        <ProChatArea
          api="/api/chat/internal"
          variant="internal"
          customTitle="AI 首席规划师"
          customSubtitle="您的智能选校、营销与学员管理合伙人"
          customCards={agencyCards}
        />
      </div>
    </div>
  );
}
