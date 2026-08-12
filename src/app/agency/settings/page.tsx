'use client';

import { Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AgencySettingsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] flex items-center">
          <Settings2 className="w-6 h-6 text-blue-600 mr-2" />
          {t('agency.nav.settings', '工作室设置')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Configure your agency workspace preferences</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Agency Name</label>
          <input type="text" defaultValue="Bright Future Education Studio" className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default AI Language</label>
          <select className="w-full max-w-md px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option>Chinese (Simplified)</option>
            <option>English</option>
            <option>Bilingual</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commission Tracking</label>
          <div className="flex items-center space-x-3">
            <input type="checkbox" className="w-5 h-5 rounded text-blue-600" defaultChecked />
            <span className="text-sm text-gray-600">Enable commission calculation and tracking per student</span>
          </div>
        </div>
      </div>
    </div>
  );
}
