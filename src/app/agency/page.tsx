'use client';

import { GraduationCap, Users, BookOpen, Megaphone, TrendingUp, Activity, Sparkles, Building, CheckCircle2, Clock, Cpu, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AgencyDashboard() {
  const { t } = useTranslation();

  const stats = [
    { name: t('agency.dashboard.metrics.schools', 'Managed Schools'), value: '8', icon: Building, trend: '+2 this month' },
    { name: t('agency.dashboard.metrics.students', 'Active Students'), value: '47', icon: Users, trend: '+5 this week' },
    { name: t('agency.dashboard.metrics.applications', 'Pending Apps'), value: '12', icon: GraduationCap, trend: '3 due this week' },
    { name: t('agency.dashboard.metrics.conversion', 'Conversion Rate'), value: '68%', icon: TrendingUp, trend: '+4% vs last month' },
  ];

  const recentStudents = [
    { name: 'Ziyi Chen', school: 'Myddelton College', stage: 'Interview Scheduled', stageColor: 'text-blue-600 bg-blue-50' },
    { name: 'Haoyu Wang', school: 'Ruthin School', stage: 'Offer Received', stageColor: 'text-emerald-600 bg-emerald-50' },
    { name: 'Yumeng Liu', school: 'Cardiff Sixth Form', stage: 'Documents Pending', stageColor: 'text-amber-600 bg-amber-50' },
    { name: 'Jiaqi Zhang', school: 'Concord College', stage: 'Application Sent', stageColor: 'text-violet-600 bg-violet-50' },
  ];

  const aiTasks = [
    { title: 'Matching: 3 new student profiles', status: 'Running', progress: 75 },
    { title: 'Generating Xiaohongshu post for Myddelton', status: 'Pending', progress: 20 },
    { title: 'KB Sync: Updated Cardiff policies', status: 'Completed', progress: 100 },
  ];

  const hotSchools = [
    { name: 'Myddelton College', inquiries: 34, trend: '+12%' },
    { name: 'Ruthin School', inquiries: 28, trend: '+8%' },
    { name: 'Cardiff Sixth Form', inquiries: 22, trend: '+5%' },
    { name: 'Concord College', inquiries: 18, trend: '-2%' },
    { name: 'Bellerbys College', inquiries: 15, trend: '+3%' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0c1829] p-8 shadow-xl border border-[#334155]/30">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
          <div className="absolute top-10 -right-24 w-96 h-96 bg-indigo-400 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-24 left-32 w-96 h-96 bg-sky-300 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
              {t('agency.dashboard.welcome', 'Agency Command Center')}
            </h1>
            <p className="text-blue-200 flex items-center font-medium">
              <span className="relative flex h-3 w-3 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              {t('agency.dashboard.status', 'Managing 8 school partnerships · 47 active students')}
            </p>
          </div>
          <div className="mt-6 md:mt-0">
            <div className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
              <Sparkles className="w-5 h-5 text-yellow-300 mr-2" />
              <span className="font-semibold text-sm tracking-wide">AI Consultant Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="group relative bg-white overflow-hidden rounded-2xl border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 transform hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <dt className="text-sm font-medium text-gray-500 mb-1">{stat.name}</dt>
                  <dd className="text-3xl font-bold text-[#0f172a]">{stat.value}</dd>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] shadow-lg shadow-blue-900/20 text-white ring-1 ring-white/20">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-blue-600 flex items-center font-semibold">
                  <Activity className="w-4 h-4 mr-1" />
                  {stat.trend}
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50 group-hover:bg-gray-100 transition-colors">
              <div className="h-full w-2/3 bg-gradient-to-r from-[#1e3a8a] to-blue-500 opacity-80"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Row: AI Tasks + Student Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* AI Task Center */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <h2 className="text-base font-bold text-[#0f172a] flex items-center tracking-wide">
              <Cpu className="w-5 h-5 text-blue-600 mr-2" />
              {t('agency.dashboard.aiTasks.title', 'AI Task Center')}
            </h2>
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Active</span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {aiTasks.map((task, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-[#0f172a]">{task.title}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    task.status === 'Running' ? 'bg-blue-50 text-blue-600' :
                    task.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-600'
                  }`}>
                    {task.status}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-1000 ${
                    task.status === 'Completed' ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#1e3a8a] to-blue-500'
                  }`} style={{ width: `${task.progress}%` }}></div>
                </div>
              </div>
            ))}
            <button className="w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-800 py-2 rounded-xl hover:bg-blue-50/50 transition-colors">
              View All Tasks →
            </button>
          </div>
        </div>

        {/* Student Pipeline */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <h2 className="text-base font-bold text-[#0f172a] flex items-center tracking-wide">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              {t('agency.dashboard.pipeline.title', 'Student Pipeline')}
            </h2>
            <button className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider flex items-center">
              View CRM <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentStudents.map((student, idx) => (
              <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#1e3a8a] to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0f172a] group-hover:text-blue-700 transition-colors">{student.name}</p>
                    <p className="text-xs text-gray-400 font-medium">{student.school}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${student.stageColor}`}>
                  {student.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Hot Schools + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Hot Schools Ranking */}
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h3 className="text-base font-bold text-[#0f172a] flex items-center tracking-wide">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              {t('agency.dashboard.hotSchools.title', 'Hot Schools')}
            </h3>
          </div>
          <div className="p-6 space-y-5">
            {hotSchools.map((school, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-gray-700">{school.name}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 font-medium">{school.inquiries} inquiries</span>
                    <span className={`text-xs font-bold ${school.trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{school.trend}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-blue-400 to-[#1e3a8a] h-1.5 rounded-full" style={{ width: `${(school.inquiries / 34) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30">
            <h3 className="text-base font-bold text-[#0f172a] flex items-center tracking-wide">
              <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
              {t('agency.dashboard.quickActions.title', 'AI Quick Actions')}
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: t('agency.dashboard.quickActions.match', 'Smart School Matching'), desc: t('agency.dashboard.quickActions.matchDesc', 'Input student profile and get Reach/Match/Safe recommendations'), icon: GraduationCap, href: '/agency/matching' },
              { title: t('agency.dashboard.quickActions.compare', 'Cross-School Comparison'), desc: t('agency.dashboard.quickActions.compareDesc', 'Compare tuition, programs, and rankings across schools'), icon: BookOpen, href: '/agency/consultant' },
              { title: t('agency.dashboard.quickActions.post', 'Generate Marketing Post'), desc: t('agency.dashboard.quickActions.postDesc', 'Create engaging Xiaohongshu or WeChat posts in seconds'), icon: Megaphone, href: '/agency/marketing' },
              { title: t('agency.dashboard.quickActions.report', 'Student Progress Report'), desc: t('agency.dashboard.quickActions.reportDesc', 'Auto-generate parent-facing progress updates'), icon: CheckCircle2, href: '/agency/crm' },
            ].map((action, idx) => (
              <a key={idx} href={action.href} className="group p-5 rounded-2xl border border-gray-100 hover:border-blue-200 bg-gray-50/30 hover:bg-blue-50/30 transition-all duration-300 cursor-pointer">
                <div className="flex items-start space-x-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-blue-500 text-white shadow-md group-hover:scale-105 transition-transform">
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#0f172a] group-hover:text-blue-700 transition-colors">{action.title}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{action.desc}</p>
                  </div>
                </div>
              </a>
            ))}
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
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}} />
    </div>
  );
}
