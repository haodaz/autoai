'use client';

import { Megaphone, Sparkles, Image, FileText, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MarketingHubPage() {
  const { t } = useTranslation();

  const templates = [
    { title: '小红书 · 院校亮点种草', desc: '突出学校独特卖点，吸引家长关注', icon: Image, color: 'from-rose-500 to-pink-600' },
    { title: '微信公众号 · 成功案例', desc: '包装真实录取案例，增强信任感', icon: FileText, color: 'from-emerald-500 to-teal-600' },
    { title: '朋友圈 · 政策快讯', desc: '第一时间转发奖学金/签证新政', icon: Share2, color: 'from-blue-500 to-indigo-600' },
    { title: '短视频脚本 · 探校Vlog', desc: '生成探校视频口播稿和分镜', icon: Megaphone, color: 'from-amber-500 to-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] flex items-center">
          <Megaphone className="w-6 h-6 text-blue-600 mr-2" />
          {t('agency.nav.marketing', '营销物料中心')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered content generation for student recruitment marketing</p>
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl, idx) => (
          <div key={idx} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 cursor-pointer hover:-translate-y-1 duration-300">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${tpl.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                <tpl.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#0f172a] group-hover:text-blue-700 transition-colors">{tpl.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{tpl.desc}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600 font-semibold">
              <Sparkles className="w-4 h-4 mr-1" /> Click to generate
            </div>
          </div>
        ))}
      </div>

      {/* Generation Area */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <h2 className="font-bold text-[#0f172a]">Custom Generation</h2>
        </div>
        <div className="p-6">
          <textarea rows={3} placeholder="Describe what you need, e.g.: 'Write a Xiaohongshu post about Myddelton College's 2027 STEM scholarship, targeting parents of 14-16 year olds...'" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" />
          <div className="mt-4 flex justify-end">
            <button className="px-6 py-3 bg-gradient-to-r from-[#1e3a8a] to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>Generate Content</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
