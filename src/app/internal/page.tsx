'use client';

import { BarChart3, Users, BookOpen, AlertCircle, Sparkles, Activity, ShieldCheck, Clock, TrendingUp, Cpu, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InternalDashboard() {
  const { t } = useTranslation();

  const stats = [
    { name: t('internal.dashboard.metrics.leads', '今日新增客情'), value: '12', icon: Users, color: 'from-[#427759] to-emerald-600', shadow: 'shadow-emerald-500/20' },
    { name: t('internal.dashboard.metrics.tasks', '高优跟进任务'), value: '3', icon: AlertCircle, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-teal-500/20' },
    { name: t('internal.dashboard.metrics.kb', '知识库条目'), value: '45', icon: BookOpen, color: 'from-teal-600 to-[#1b3827]', shadow: 'shadow-emerald-500/20' },
    { name: t('internal.dashboard.metrics.ai', 'AI 交互总数'), value: '892', icon: BarChart3, color: 'from-emerald-600 to-[#427759]', shadow: 'shadow-[#427759]/20' },
  ];

  // Dummy data for top 5 FAQs
  const top5Faqs = [
    { name: 'How to apply?', count: 320, percentage: 85 },
    { name: 'Tuition fees?', count: 280, percentage: 70 },
    { name: 'Scholarships?', count: 195, percentage: 48 },
    { name: 'Visa requirements?', count: 120, percentage: 30 },
    { name: 'Accommodation?', count: 85, percentage: 21 },
  ];

  // Dummy hot words for word cloud
  const hotWords = [
    { text: 'A-Level', weight: 8, color: 'text-emerald-700' },
    { text: 'Visa', weight: 5, color: 'text-[#427759]' },
    { text: 'Scholarship', weight: 9, color: 'text-emerald-500' },
    { text: 'Requirements', weight: 4, color: 'text-teal-600' },
    { text: 'Accommodation', weight: 6, color: 'text-[#1b3827]' },
    { text: 'Sports', weight: 3, color: 'text-emerald-600' },
    { text: 'Campus', weight: 7, color: 'text-teal-700' },
    { text: 'IELTS', weight: 5, color: 'text-emerald-500' },
    { text: 'Application', weight: 8, color: 'text-[#427759]' },
    { text: 'UKVI', weight: 4, color: 'text-teal-500' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Welcome Section (Glassmorphism) - Myddelton Theme */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b3827] via-[#244a33] to-[#0d1f14] p-8 shadow-xl border border-[#427759]/20">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-10 -right-24 w-96 h-96 bg-teal-400 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-24 left-32 w-96 h-96 bg-green-300 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              {t('internal.dashboard.welcome', '欢迎回来，校长')}
            </h1>
            <p className="text-emerald-100 flex items-center font-medium">
              <span className="relative flex h-3 w-3 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              {t('internal.dashboard.status', '系统状态：运行良好')}
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <div className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              <Sparkles className="w-5 h-5 text-yellow-300 mr-2" />
              <span className="font-semibold text-sm tracking-wide">HaoAI v2.4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="group relative bg-white overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{stat.name}</dt>
                  <dd className="text-3xl font-bold text-[#1b3827]">{stat.value}</dd>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow} text-white ring-1 ring-white/20`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-emerald-600 flex items-center font-semibold">
                  <Activity className="w-4 h-4 mr-1" />
                  +12%
                </span>
                <span className="text-gray-400 ml-2 font-medium">vs last week</span>
              </div>
            </div>
            {/* Sparkline decoration */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50 group-hover:bg-gray-100 transition-colors">
              <div className={`h-full w-2/3 bg-gradient-to-r ${stat.color} opacity-80`}></div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Task Command Center */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 overflow-hidden">
        <div className="px-8 py-5 border-b border-gray-50 bg-[#fafafa] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#1b3827] flex items-center tracking-wide">
            <Cpu className="w-5 h-5 text-[#427759] mr-2" />
            {t('internal.dashboard.ai_tasks.title', 'AI 任务中心')}
          </h2>
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">{t('internal.dashboard.ai_tasks.status', '自动化引擎运行中')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          
          {/* Radar Scan (Visualizing AI state) */}
          <div className="p-8 flex flex-col items-center justify-center relative overflow-hidden bg-white group">
            <div className="absolute inset-0 bg-[#f8faf9] opacity-50"></div>
            <div className="relative w-52 h-52 rounded-full border border-emerald-500/20 flex items-center justify-center shadow-[0_0_50px_rgba(66,119,89,0.05)]">
              <div className="absolute w-36 h-36 rounded-full border border-emerald-500/10"></div>
              <div className="absolute w-20 h-20 rounded-full border border-emerald-500/10 bg-[#427759]/5"></div>
              <div className="absolute w-3.5 h-3.5 rounded-full bg-[#427759] shadow-[0_0_15px_#427759] z-10"></div>
              <div className="absolute top-1/2 left-1/2 w-26 h-26 bg-gradient-to-tr from-emerald-500/30 to-transparent rounded-full origin-bottom-left animate-spin" style={{ transformOrigin: '0 0' }}></div>
              
              {/* Blips */}
              <div className="absolute top-10 left-12 w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
              <div className="absolute bottom-12 right-14 w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse animation-delay-1000"></div>
            </div>
            
            <div className="mt-8 text-center z-10">
              <p className="text-sm font-bold text-[#427759] animate-pulse">
                {t('internal.dashboard.radar.scanning', '意向扫描中...')}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-1.5 uppercase tracking-wide">
                {t('internal.dashboard.radar.processing', '正在处理 3 个后台任务')}
              </p>
            </div>
          </div>

          {/* Task Queue */}
          <div className="p-6 bg-white">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-5 flex items-center">
              <Activity className="w-4 h-4 mr-1.5" /> {t('internal.dashboard.ai_tasks.queue', '任务队列')}
            </h3>
            <div className="space-y-4">
              {[
                { name: t('internal.dashboard.task1.name', '线索 #892 的深度意向分析'), status: t('internal.dashboard.task1.status', '执行中'), progress: 'bg-emerald-500 w-3/4', color: 'text-emerald-600', bg: 'bg-emerald-50', image: '/pixel_worker_analysis.png' },
                { name: t('internal.dashboard.task2.name', '正在向量化 Tuition_2027.pdf'), status: t('internal.dashboard.task2.status', '等待中'), progress: 'bg-amber-400 w-1/4', color: 'text-amber-600', bg: 'bg-amber-50', image: '/pixel_worker_filing.png' },
                { name: t('internal.dashboard.task3.name', '生成本周客情汇总'), status: t('internal.dashboard.task3.status', '排队中'), progress: 'bg-gray-300 w-0', color: 'text-gray-500', bg: 'bg-gray-50', image: '/pixel_worker.png' },
              ].map((task, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors shadow-sm flex items-stretch overflow-hidden group min-h-[96px]">
                  <div className="w-24 flex-shrink-0 bg-blue-50/30 relative flex items-center justify-center border-r border-gray-100/50">
                    <img src={task.image} alt="AI Worker" className="w-full h-full p-2 object-contain transform group-hover:scale-110 transition-transform duration-500" style={{ imageRendering: 'pixelated' }} />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-[#1b3827] leading-tight pr-2">{task.name}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider whitespace-nowrap ${task.bg} ${task.color}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className={`${task.progress} h-1.5 rounded-full transition-all duration-1000`}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="p-6 bg-white">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> {t('internal.dashboard.recent.completed', '已完成任务')}
              </h3>
              <button className="text-xs font-bold text-[#427759] hover:text-emerald-700 uppercase tracking-wider">
                {t('internal.dashboard.recent.viewAll', '查看全部')}
              </button>
            </div>
            <ul className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
              {[
                { title: t('internal.dashboard.log1.title', '新线索已分析'), desc: t('internal.dashboard.log1.desc', '已根据邮件内容自动打上高意向标签'), time: t('internal.dashboard.log1.time', '2分钟前'), type: 'crm' },
                { title: t('internal.dashboard.log2.title', '知识库已同步'), desc: t('internal.dashboard.log2.desc', '已将5个新PDF处理入向量库'), time: t('internal.dashboard.log2.time', '1小时前'), type: 'kb' },
                { title: t('internal.dashboard.log3.title', '周报已生成'), desc: t('internal.dashboard.log3.desc', '已为校长起草汇总报告'), time: t('internal.dashboard.log3.time', '3小时前'), type: 'report' },
                { title: t('internal.dashboard.log4.title', '异常情况检测'), desc: t('internal.dashboard.log4.desc', '发现近期学生参与度下降'), time: t('internal.dashboard.log4.time', '5小时前'), type: 'alert' },
              ].map((log, idx) => (
                <li key={idx} className="group cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-3 mt-1 relative">
                      <div className="w-2 h-2 rounded-full bg-[#427759] ring-4 ring-[#427759]/10"></div>
                      {idx !== 3 && <div className="w-0.5 h-12 bg-gray-100 absolute top-2 mt-1"></div>}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex justify-between items-baseline">
                        <p className="text-[13px] font-bold text-[#1b3827] group-hover:text-emerald-600 transition-colors">
                          {log.title}
                        </p>
                        <span className="text-[10px] font-medium text-gray-400 uppercase">{log.time}</span>
                      </div>
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{log.desc}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Supplemental Insights (Bottom Row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top 5 FAQs */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-base font-bold text-[#1b3827] flex items-center tracking-wide">
              <TrendingUp className="w-5 h-5 text-[#427759] mr-2" />
              {t('internal.dashboard.charts.top5.title', 'Top 5 热门咨询类型')}
            </h3>
          </div>
          <div className="p-6 space-y-6">
            {top5Faqs.map((faq, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-700">{faq.name}</span>
                  <span className="text-gray-400 font-medium">{faq.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-emerald-400 to-[#427759] h-1.5 rounded-full" style={{ width: `${faq.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Word Cloud */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col justify-center">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="text-base font-bold text-[#1b3827] flex items-center tracking-wide">
              <Sparkles className="w-5 h-5 text-emerald-500 mr-2" />
              {t('internal.dashboard.charts.cloud.title', 'C 端高频意图与热词')}
            </h3>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded">Last 7 Days</span>
          </div>
          <div className="p-8 flex-1 flex flex-col justify-center bg-[#fafafa]/50">
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-4">
              {hotWords.map((word, i) => (
                <span key={i} className={`font-extrabold tracking-tight ${word.color} hover:scale-110 transition-transform cursor-pointer opacity-90 hover:opacity-100`} style={{ fontSize: `${0.9 + (word.weight * 0.15)}rem` }}>
                  {word.text}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}} />
    </div>
  );
}
