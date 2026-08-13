'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n/config';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Priority: localStorage > browser language > fallback 'en'
    const stored = localStorage.getItem('bristh_lang');
    if (stored && (stored === 'zh' || stored === 'en')) {
      i18n.changeLanguage(stored);
    } else {
      const browserLang = navigator.language?.startsWith('zh') ? 'zh' : 'en';
      i18n.changeLanguage(browserLang);
      localStorage.setItem('bristh_lang', browserLang);
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
