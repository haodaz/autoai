'use client';

import React from 'react';
import { MessageSquareText } from 'lucide-react';
import ProChatArea from '@/components/chat/ProChatArea';
import { useTranslation } from 'react-i18next';

export default function SecretaryAIPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-[#141b38] flex items-center">
        <MessageSquareText className="w-5 h-5 text-white mr-2" />
        <h2 className="font-semibold text-white">{t('secretary.title')}</h2>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <ProChatArea api="/api/chat/internal" variant="internal" />
      </div>
    </div>
  );
}
