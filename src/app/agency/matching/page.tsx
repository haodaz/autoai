'use client';

import { GraduationCap, Search, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function SmartMatchingPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] flex items-center">
          <GraduationCap className="w-6 h-6 text-blue-600 mr-2" />
          {t('agency.nav.matching', '智能选校')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Input student profiles to receive AI-powered school recommendations</p>
      </div>

      {/* Student Profile Input */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
          <h2 className="font-bold text-[#0f172a]">Student Profile</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { label: 'Student Name', placeholder: 'e.g. Ziyi Chen' },
            { label: 'Age / Grade', placeholder: 'e.g. 15 / Grade 10' },
            { label: 'GPA / Score', placeholder: 'e.g. 3.5 / 90%' },
            { label: 'IELTS / TOEFL', placeholder: 'e.g. 6.5' },
            { label: 'Target Subject', placeholder: 'e.g. Computer Science' },
            { label: 'Budget (per year)', placeholder: 'e.g. ¥400,000' },
          ].map((field, idx) => (
            <div key={idx}>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{field.label}</label>
              <input type="text" placeholder={field.placeholder} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex items-center space-x-4">
          <textarea placeholder="Additional notes: e.g. prefers schools with strong sports programs, wants to stay in Wales..." rows={2} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none" />
          <button className="px-6 py-3 bg-gradient-to-r from-[#1e3a8a] to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all transform hover:-translate-y-0.5 flex items-center space-x-2">
            <Sparkles className="w-5 h-5" />
            <span>AI Match</span>
          </button>
        </div>
      </div>

      {/* Results Placeholder */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-400">Matching results will appear here</h3>
        <p className="text-sm text-gray-300 mt-2">Fill in the student profile above and click "AI Match" to generate recommendations</p>
      </div>
    </div>
  );
}
