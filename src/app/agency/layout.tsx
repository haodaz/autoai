'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, GraduationCap, BookOpen, Users, Megaphone, MessageSquare, Settings2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();

  const navigation = [
    { name: t('agency.nav.dashboard', 'Dashboard'), href: '/agency', icon: LayoutDashboard },
    { name: t('agency.nav.matching', 'Smart Matching'), href: '/agency/matching', icon: GraduationCap },
    { name: t('agency.nav.kb', 'Multi-School KB'), href: '/agency/kb', icon: BookOpen },
    { name: t('agency.nav.crm', 'Student CRM'), href: '/agency/crm', icon: Users },
    { name: t('agency.nav.marketing', 'Marketing Hub'), href: '/agency/marketing', icon: Megaphone },
    { name: t('agency.nav.consultant', 'AI Consultant'), href: '/agency/consultant', icon: MessageSquare },
    { name: t('agency.nav.settings', 'Settings'), href: '/agency/settings', icon: Settings2 },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — Deep Ocean Blue */}
      <div className="w-[330px] bg-gradient-to-br from-[#0f172a] to-[#1e293b] border-r border-[#334155]/50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[#334155]/50 space-x-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#3b82f6] to-[#1e3a8a] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            {t('agency.title', 'Agency Studio')}
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-[15px] font-medium rounded-xl transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-blue-400' : 'text-white/40'
                      }`}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-[#334155]/50 flex flex-col space-y-4">
          <button
            onClick={() => {
              const nextLang = i18n.language === 'en' ? 'zh' : 'en';
              i18n.changeLanguage(nextLang);
            }}
            className="flex items-center justify-between px-3 py-2 text-sm text-white/70 bg-white/5 hover:bg-white/10 hover:text-white rounded-lg transition-colors border border-white/10 min-h-[38px]"
          >
            <span suppressHydrationWarning>{i18n.language === 'en' ? '🇨🇳 切换至中文' : '🇬🇧 Switch to English'}</span>
          </button>
          <Link href="/" className="text-[13px] text-white/50 hover:text-white/90 font-medium flex items-center transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('agency.back', 'Back to Homepage')}
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
