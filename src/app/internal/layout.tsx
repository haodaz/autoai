'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, BookOpen, Database, MessageSquare, LayoutDashboard, Settings2, Bot, ChevronLeft, ChevronRight, ArrowLeft, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: t('internal.nav.dashboard'), href: '/internal', icon: LayoutDashboard },
    { name: t('internal.nav.crm'), href: '/internal/crm', icon: Users },
    { name: t('internal.nav.kb_files'), href: '/internal/kb-files', icon: BookOpen },
    { name: t('internal.nav.kb'), href: '/internal/kb', icon: Database },
    { name: 'Calendar', href: '/internal/calendar', icon: Calendar },
    { name: t('internal.nav.secretary'), href: '/internal/secretary', icon: MessageSquare },
    { name: t('internal.nav.ai_manage'), href: '/internal/ai-manage', icon: Settings2 },
    { name: t('internal.nav.ai_tasks'), href: '/internal/ai-tasks', icon: Bot },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-20' : 'w-[330px]'} bg-gradient-to-br from-[#1b3827] to-[#0d1f14] border-r border-[#2e5941]/30 flex flex-col transition-all duration-300 relative z-20`}>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-6 bg-white border border-gray-200 rounded-full p-1 shadow-md z-50 text-gray-500 hover:text-[#427759] focus:outline-none"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <Link href="/" className={`h-16 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6 space-x-3'} border-b border-[#2e5941]/30 hover:bg-white/5 transition-colors cursor-pointer overflow-hidden`}>
          <img src="/logo.webp" alt="Myddelton Logo" className="h-8 object-contain brightness-110 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-lg font-bold text-white whitespace-nowrap">
              {t('internal.title')}
            </span>
          )}
        </Link>

        <nav className="flex-1 overflow-y-auto py-4 overflow-x-hidden scrollbar-none">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center py-3 text-[15px] font-medium rounded-xl transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-4'} ${
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    <item.icon
                      className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'} ${
                        isActive ? 'text-emerald-400' : 'text-white/40 group-hover:text-white/60'
                      }`}
                    />
                    {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={`p-4 border-t border-[#2e5941]/30 flex flex-col space-y-4 ${isCollapsed ? 'items-center' : ''}`}>
          <button 
            onClick={() => {
              const nextLang = i18n.language === 'en' ? 'zh' : 'en';
              i18n.changeLanguage(nextLang);
            }}
            title={isCollapsed ? "Switch Language" : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center w-10' : 'justify-between px-3'} py-2 text-sm text-white/70 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-colors border border-white/10 min-h-[38px]`}
          >
            <span suppressHydrationWarning>{i18n.language === 'en' ? (isCollapsed ? '🇨🇳' : '🇨🇳 切换至中文') : (isCollapsed ? '🇬🇧' : '🇬🇧 Switch to English')}</span>
          </button>
          <Link href="/" title={isCollapsed ? t('internal.back') : undefined} className={`text-[13px] text-white/50 hover:text-white/90 font-medium flex items-center transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
            {isCollapsed ? <ArrowLeft className="w-5 h-5" /> : t('internal.back')}
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <main className="p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
