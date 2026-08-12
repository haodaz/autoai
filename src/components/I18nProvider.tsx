'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';
import { usePathname } from 'next/navigation';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force English in the internal dashboard, Chinese everywhere else
    if (pathname?.startsWith('/internal')) {
      i18n.changeLanguage('en');
    } else {
      i18n.changeLanguage('zh');
    }
  }, [pathname]);

  // Avoid hydration mismatch by only rendering after mount if needed,
  // but react-i18next handles SSR relatively well if fallbackLng is set.
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
