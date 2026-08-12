import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Search, UserCircle, Briefcase, Calendar, MessageSquare, ChevronRight, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CRMPage() {
  const customers = await prisma.customer.findMany({
    include: {
      interactions: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#141b38]">CRM 客情池</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索姓名、电话、意向..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <select className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
            <option value="">全部类型</option>
            <option value="STUDENT">学生/家长</option>
            <option value="PARTNER">合作方</option>
          </select>
        </div>

        <div className="divide-y divide-gray-100">
          {customers.map((customer) => (
            <Link href={`/internal/crm/${customer.id}`} key={customer.id} className="p-6 hover:bg-gray-50/50 transition-colors flex items-start gap-6 cursor-pointer group block">
              <div className="flex-shrink-0">
                {customer.type === 'STUDENT' ? (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <UserCircle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Briefcase className="w-6 h-6" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-[#141b38] truncate group-hover:text-blue-600 transition-colors">
                    {customer.name || '未知客户'}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    customer.type === 'STUDENT' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'
                  }`}>
                    {customer.type === 'STUDENT' ? '学生/家长' : '合作方'}
                  </span>
                  {customer.source === 'Email Auto-Sync' && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.4)] flex items-center gap-1">
                      <Mail className="w-3 h-3" /> 邮件自动提纯
                    </span>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-gray-500 mb-3">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                    {customer.createdAt.toLocaleDateString()}录入
                  </span>
                  {customer.phone && (
                    <span className="font-medium text-gray-700">{customer.phone}</span>
                  )}
                  {customer.intent && (
                    <span className="flex items-center text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                      意向：{customer.intent}
                    </span>
                  )}
                </div>

                {customer.interactions && customer.interactions.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">
                      <span className="font-medium text-gray-700">最新互动摘要：</span>
                      {customer.interactions[0].summary || '暂无摘要'}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex-shrink-0 flex flex-col items-end gap-2 text-sm">
                <span className="text-gray-400 group-hover:text-blue-500 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </span>
                <span className="text-xs text-gray-400">来源: {customer.source || '未知'}</span>
              </div>
            </Link>
          ))}

          {customers.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              暂无客户数据
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
