import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserCircle, Briefcase, Calendar, MessageSquare, BrainCircuit, Lightbulb, Target, Sparkles, Clock, User, Bot, Database } from 'lucide-react';
import EmailReplyWidget from '@/components/crm/EmailReplyWidget';

export const dynamic = 'force-dynamic';

export default async function CRMDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      interactions: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!customer) {
    notFound();
  }

  const backgroundData = customer.background ? JSON.parse(customer.background) : null;
  const interaction = customer.interactions[0];
  const chatMessages = interaction?.messages ? JSON.parse(interaction.messages) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/internal/crm" className="p-2 hover:bg-gray-200 rounded-full transition-colors bg-white shadow-sm border border-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#141b38] flex items-center gap-3">
            {customer.name || '未知客户'}
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
              customer.type === 'STUDENT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {customer.type === 'STUDENT' ? 'STUDENT' : 'PARTNER'}
            </span>
          </h1>
          <div className="flex items-center text-sm text-gray-500 mt-1 gap-4">
            <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" /> 录入于 {customer.createdAt.toLocaleDateString()}</span>
            <span>来源: {customer.source || '未知'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: AI Profiling & Raw Data (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Insights Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10 blur-2xl opacity-60"></div>
            <div className="p-6 border-b border-indigo-50/50 bg-gradient-to-r from-indigo-50/30 to-transparent flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-indigo-950">AI 智能客情评估</h2>
              <span className="ml-auto text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md">Powered by {customer.sourceAI || 'AI'}</span>
            </div>
            <div className="p-6 space-y-6">
              
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center mb-3">
                  <Lightbulb className="w-4 h-4 mr-2 text-amber-500" /> Core Insights
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 leading-relaxed border border-gray-100">
                  {customer.insights || '暂无深度洞察数据。'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center mb-3">
                  <Target className="w-4 h-4 mr-2 text-emerald-500" /> Next Steps Recommendation
                </h3>
                <div className="bg-emerald-50/50 rounded-xl p-4 text-emerald-900 leading-relaxed border border-emerald-100 whitespace-pre-wrap font-medium">
                  {customer.nextSteps || '暂无下一步建议。'}
                </div>
              </div>

            </div>
          </div>

          {/* Raw Background Data Grid */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-50 flex items-center gap-2">
              <Database className="w-5 h-5 text-gray-400" />
              <h2 className="text-base font-bold text-[#141b38]">结构化背景档案 (Raw Data)</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">联系电话</p>
                  <p className="font-medium text-gray-900">{customer.phone || '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">电子邮箱</p>
                  <p className="font-medium text-gray-900">{customer.email || '--'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">意向方向</p>
                  <p className="font-medium text-gray-900">{customer.intent || '--'}</p>
                </div>
                
                {backgroundData && Object.entries(backgroundData).map(([key, value]) => (
                  <div key={key} className="col-span-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="font-medium text-gray-900">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email Reply Widget moved to left column for better visibility */}
          <EmailReplyWidget 
            customerId={customer.id}
            email={customer.email} 
            messages={chatMessages} 
            insights={customer.insights} 
            nextSteps={customer.nextSteps} 
          />

        </div>

        {/* Right Column: Interaction History (5 cols) */}
        <div className="lg:col-span-5 flex flex-col max-h-[800px]">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-bold text-[#141b38]">原始沟通溯源</h2>
              </div>
              <span className="text-xs text-gray-400 font-medium">{chatMessages.length} Messages</span>
            </div>
            
            {interaction?.summary && (
              <div className="p-4 bg-amber-50/50 border-b border-amber-100/50 flex gap-3 text-sm">
                <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-amber-900 leading-relaxed font-medium">
                  {interaction.summary}
                </p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8faf9] scrollbar-thin scrollbar-thumb-gray-200">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg: any, i: number) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div key={i} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                      <div className={`flex max-w-[85%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'} gap-3`}>
                        <div className="flex-shrink-0 mt-1">
                          {isAssistant ? (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                              <Bot className="w-4 h-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className={`p-4 rounded-2xl ${
                            isAssistant 
                              ? 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-tl-sm' 
                              : 'bg-blue-600 text-white shadow-md rounded-tr-sm'
                          }`}>
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {msg.timestamp && (
                            <div className={`text-[11px] text-gray-400 mt-1.5 flex items-center ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                  <MessageSquare className="w-8 h-8 opacity-20" />
                  <p>无可用对话记录</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
