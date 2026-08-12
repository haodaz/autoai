'use client';

import { Users, Search, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AgencyCrmPage() {
  const { t } = useTranslation();

  const students = [
    { name: 'Ziyi Chen', target: 'Myddelton College', stage: 'Interview Scheduled', stageColor: 'bg-blue-50 text-blue-700', parent: 'Mrs. Chen', phone: '138****5678' },
    { name: 'Haoyu Wang', target: 'Ruthin School', stage: 'Offer Received', stageColor: 'bg-emerald-50 text-emerald-700', parent: 'Mr. Wang', phone: '139****1234' },
    { name: 'Yumeng Liu', target: 'Cardiff Sixth Form', stage: 'Documents Pending', stageColor: 'bg-amber-50 text-amber-700', parent: 'Mrs. Liu', phone: '136****9012' },
    { name: 'Jiaqi Zhang', target: 'Concord College', stage: 'Application Sent', stageColor: 'bg-violet-50 text-violet-700', parent: 'Mr. Zhang', phone: '158****3456' },
    { name: 'Xinyi Li', target: 'Bellerbys College', stage: 'Initial Consultation', stageColor: 'bg-gray-100 text-gray-600', parent: 'Mrs. Li', phone: '137****7890' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-2" />
            {t('agency.nav.crm', '学员 CRM')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track all student applications and parent communications</p>
        </div>
        <button className="px-5 py-2.5 bg-gradient-to-r from-[#1e3a8a] to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Student</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Search students by name, school, or stage..." className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white shadow-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Target School</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Stage</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Parent</th>
              <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {students.map((s, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-[#1e3a8a] to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow">
                      {s.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-[#0f172a] group-hover:text-blue-700 transition-colors text-sm">{s.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.target}</td>
                <td className="px-6 py-4">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${s.stageColor}`}>{s.stage}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.parent}</td>
                <td className="px-6 py-4 text-sm text-gray-400">{s.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
