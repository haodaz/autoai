'use client';

import React, { useState } from 'react';
import { Play, Clock, CheckCircle2, Bot, Loader2, X, Star, Sparkles } from 'lucide-react';
import { Modal } from 'antd';

export default function AITasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [isSocialRunning, setIsSocialRunning] = useState(false);
  const [socialResult, setSocialResult] = useState<any>(null);
  const [socialStep, setSocialStep] = useState<'input' | 'draft' | 'published' | 'leads'>('input');
  const [socialParams, setSocialParams] = useState({ topic: '', length: 'medium', language: 'mix' });
  const [socialImage, setSocialImage] = useState<string | null>(null);
  const [socialLeadsCount, setSocialLeadsCount] = useState(0);

  const tasks = [
    { id: 1, name: '自动打分：潜在学生意向分析', trigger: '每日 02:00', status: 'Ready', type: '分析', isDemo: true },
    { id: 2, name: '群发跟进：发送合作办学简介', trigger: '手动触发', status: 'Ready', type: '邮件群发' },
    { id: 3, name: '盯盘提醒：新留电用户通知', trigger: '实时监听', status: 'Active', type: '通知盯盘' },
    { id: 4, name: '📥 收件箱 AI 智能提纯', trigger: '手动触发', status: 'Ready', type: '数据接入', isSync: true },
    { id: 5, name: '📱 社交媒体：小红书爆款图文生成', trigger: '手动触发', status: 'Ready', type: '内容创作', isSocial: true },
  ];

  const handleRunDemoTask = async () => {
    setIsModalOpen(true);
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch('/api/tasks/analyze-leads', { method: 'POST' });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({ error: '执行失败，请检查网络或后端日志。' });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSyncInboxTask = async () => {
    setIsSyncModalOpen(true);
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/inbox/sync', { method: 'POST' });
      const data = await response.json();
      setSyncResult(data);
    } catch (error) {
      console.error(error);
      setSyncResult({ error: '同步失败，请检查网络或后端日志。' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenSocialModal = () => {
    setIsSocialModalOpen(true);
    setSocialStep('input');
    setSocialResult(null);
    setSocialImage(null);
    setSocialParams({ topic: '', length: 'medium', language: 'mix' });
  };

  const handleSocialPostTask = async () => {
    setIsSocialRunning(true);
    setSocialResult(null);
    setSocialStep('draft');

    try {
      const response = await fetch('/api/tasks/social-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(socialParams),
      });
      const data = await response.json();
      setSocialResult(data);
    } catch (error) {
      console.error(error);
      setSocialResult({ error: '生成失败，请重试。' });
    } finally {
      setIsSocialRunning(false);
    }
  };

  const handlePublish = () => {
    setSocialStep('published');
    // Simulated comments will be shown in UI
  };

  const handleExtractLeads = async () => {
    setIsSocialRunning(true);
    try {
      const mockComments = [
        "博主你好，孩子初三，成绩中等，雅思大概只有5分，能申请吗？",
        "求具体学费明细，坐标深圳",
        "请问有马术课吗？零基础可以报吗？"
      ];
      const response = await fetch('/api/tasks/social-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comments: mockComments }),
      });
      const data = await response.json();
      setSocialLeadsCount(data.count || 0);
      setSocialStep('leads');
    } catch (error) {
      console.error(error);
      alert('解析失败');
    } finally {
      setIsSocialRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#141b38]">AI Task Command Center</h1>
        <button className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium">
          <Bot className="w-4 h-4 mr-2" />
          创建新任务
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <p className="text-gray-500 text-sm mb-6">
            基于大模型的“龙虾类功能”引擎。在此处配置自动化工作流，例如让 AI 批量分析 CRM 信息并生成结论，或者群发个性化沟通邮件。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <div key={task.id} className="flex flex-col p-6 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm bg-white hover:shadow-md">
                {/* Image on top */}
                <div className="w-full bg-white rounded-xl overflow-hidden relative group mb-5 flex items-center justify-center">
                  <img src={task.id === 1 ? '/pixel_worker_analysis.png' : task.id === 2 ? '/pixel_worker_support.png' : task.id === 4 ? '/pixel_worker_filing.png' : task.id === 5 ? '/pixel_worker_social.png' : '/pixel_worker_presentation.png'} alt="AI Worker" className="h-40 object-contain transform group-hover:scale-105 transition-transform duration-500" style={{ imageRendering: 'pixelated' }} />
                </div>
                
                {/* Content below */}
                <div className="flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-[#141b38] mb-2 leading-tight">{task.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mb-5 space-x-3">
                    <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">{task.type}</span>
                    <span className="flex items-center font-medium"><Clock className="w-4 h-4 mr-1.5" /> {task.trigger}</span>
                  </div>
                  
                  {/* Action row at bottom */}
                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                    {task.status === 'Active' ? (
                      <span className="flex items-center text-emerald-600 text-sm font-semibold w-full justify-center bg-emerald-50 py-2.5 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5 mr-1.5" /> 运行中
                      </span>
                    ) : (
                      <button 
                        onClick={task.isSocial ? handleOpenSocialModal : task.isSync ? handleSyncInboxTask : (task.isDemo ? handleRunDemoTask : undefined)}
                        className="w-full text-sm font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 px-4 py-2.5 rounded-xl transition-colors border border-blue-200 hover:border-blue-600 flex justify-center items-center shadow-sm"
                      >
                        立即执行
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        title="AI 批量线索分析"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
      >
        <div className="min-h-[300px] flex flex-col py-4">
          {isRunning ? (
            <div className="flex flex-col items-center justify-center flex-1 h-full space-y-4 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p>AI 正在读取 CRM 线索池并进行交叉分析，请稍候...</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              {result.error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-lg">{result.error}</div>
              ) : (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start space-x-3">
                    <Bot className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">今日简报摘要</h4>
                      <p className="text-blue-800 text-sm">{result.summary}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-[#141b38] flex items-center">
                      <Star className="w-4 h-4 mr-1.5 text-amber-500" />
                      详细打分列表
                    </h4>
                    {result.results?.map((item: any, idx: number) => (
                      <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-[#141b38]">{item.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            item.score.includes('A') ? 'bg-red-100 text-red-700' :
                            item.score.includes('B') ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {item.score} 级意向
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2"><strong>分析理由：</strong>{item.reason}</p>
                        <p className="text-sm text-emerald-700 bg-emerald-50 p-2 rounded"><strong>建议动作：</strong>{item.action}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        title="📥 收件箱 AI 智能提纯"
        open={isSyncModalOpen}
        onCancel={() => setIsSyncModalOpen(false)}
        footer={null}
        width={600}
      >
        <div className="min-h-[250px] flex flex-col py-4">
          {isSyncing ? (
            <div className="flex flex-col items-center justify-center flex-1 h-full space-y-4 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
              <p>AI 正在连接邮箱读取最新邮件并提取线索，请稍候...</p>
            </div>
          ) : syncResult ? (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              {syncResult.error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-lg border border-red-100">{syncResult.error}</div>
              ) : (
                <>
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex items-start space-x-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 mb-1">同步完成</h4>
                      <p className="text-emerald-800 text-sm">
                        {syncResult.count > 0 
                          ? `成功解析并提纯了 ${syncResult.count} 封新邮件线索。详情请前往 CRM 客情池查看。` 
                          : '当前没有新的未读邮件需要同步。'}
                      </p>
                    </div>
                  </div>

                  {syncResult.count > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-[#141b38] text-sm">新增线索追踪</h4>
                      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                        {syncResult.leads?.map((lead: any, idx: number) => (
                          <div key={idx} className="p-3 bg-white flex justify-between items-center hover:bg-gray-50">
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{lead.name}</p>
                              <p className="text-xs text-gray-500">意向: {lead.intent}</p>
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                              已入库
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Social Media Generator Modal */}
      <Modal
        title="📱 小红书爆款图文运营"
        open={isSocialModalOpen}
        onCancel={() => setIsSocialModalOpen(false)}
        footer={null}
        width={500}
        centered
        className="social-modal"
      >
        <div className="min-h-[500px] flex flex-col bg-[#F9F9F9] -mx-6 -mb-6 p-6 rounded-b-lg overflow-y-auto max-h-[80vh]">
          {socialStep === 'input' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Bot className="w-5 h-5 mr-2 text-red-500" /> 告诉 AI 你想发什么</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">核心诉求 (选填)</label>
                    <input 
                      type="text" 
                      placeholder="例如：强调百年城堡和全人教育..."
                      value={socialParams.topic}
                      onChange={(e) => setSocialParams({...socialParams, topic: e.target.value})}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">篇幅</label>
                      <select 
                        value={socialParams.length}
                        onChange={(e) => setSocialParams({...socialParams, length: e.target.value})}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="short">短平快 (100-200字)</option>
                        <option value="medium">中等 (300字左右)</option>
                        <option value="long">长文干货 (500字以上)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">语言风格</label>
                      <select 
                        value={socialParams.language}
                        onChange={(e) => setSocialParams({...socialParams, language: e.target.value})}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                      >
                        <option value="zh">纯中文</option>
                        <option value="mix">中英夹杂 (更懂留学生)</option>
                        <option value="en">纯英文</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSocialPostTask}
                  className="w-full mt-6 bg-[#FF2442] hover:bg-[#E0203A] text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  让 AI 帮我写
                </button>
              </div>
            </div>
          )}

          {isSocialRunning && socialStep !== 'input' && (
            <div className="flex flex-col items-center justify-center flex-1 h-full space-y-4 my-12">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-red-200 border-t-red-500 rounded-full animate-spin"></div>
                <Bot className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-500 font-medium">
                {socialStep === 'draft' ? 'AI 正在疯狂码字并构思配图中...' : '正在利用 AI 提取评论意向并存入客情池...'}
              </p>
            </div>
          )}

          {!isSocialRunning && socialResult && (socialStep === 'draft' || socialStep === 'published') && (
            <div className="animate-in fade-in zoom-in duration-300">
              {socialResult.error ? (
                <div className="text-red-500 bg-red-50 p-4 rounded-lg">{socialResult.error}</div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
                  
                  {/* Mock Image Area */}
                  <div className="bg-gray-100 relative min-h-[250px] flex flex-col items-center justify-center group overflow-hidden">
                    {socialImage ? (
                      <img src={socialImage} className="absolute inset-0 w-full h-full object-cover" alt="Uploaded post image" />
                    ) : (
                      <div className="bg-white p-4 rounded-xl shadow-sm border border-dashed border-gray-300 text-sm text-gray-500 max-w-sm m-6 z-10 text-center">
                        <p className="font-bold text-gray-700 mb-2">📸 AI 配图建议</p>
                        <p className="italic mb-4">{socialResult.imagePrompt}</p>
                        {socialStep === 'draft' && (
                          <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold hover:bg-blue-100 transition-colors">
                            <span>点击上传真实照片</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setSocialImage(URL.createObjectURL(e.target.files[0]));
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Content Area */}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 leading-tight">{socialResult.title}</h2>
                    <div className="text-[15px] text-gray-700 whitespace-pre-wrap leading-relaxed mb-6">
                      {socialResult.content}
                    </div>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {socialResult.tags?.map((tag: string, idx: number) => (
                        <span key={idx} className="text-blue-600 font-medium text-[15px]">
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    {socialStep === 'draft' && (
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        <button 
                          onClick={handleSocialPostTask}
                          className="text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors"
                        >
                          换一种写法
                        </button>
                        <button 
                          onClick={handlePublish}
                          className="bg-[#FF2442] hover:bg-[#E0203A] text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-md"
                        >
                          一键发布 (模拟)
                        </button>
                      </div>
                    )}
                  </div>

                  {socialStep === 'published' && (
                    <div className="border-t border-gray-100 bg-gray-50/50 p-5 animate-in slide-in-from-bottom-5">
                      <h4 className="font-bold text-gray-800 mb-4 text-sm">互动留言区 (3)</h4>
                      <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-pink-200"></div>
                          <div>
                            <p className="text-xs font-bold text-gray-600">阳光妈妈</p>
                            <p className="text-sm text-gray-800 mt-0.5">博主你好，孩子初三，成绩中等，雅思大概只有5分，能申请吗？</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-200"></div>
                          <div>
                            <p className="text-xs font-bold text-gray-600">User9981</p>
                            <p className="text-sm text-gray-800 mt-0.5">求具体学费明细，坐标深圳</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-200"></div>
                          <div>
                            <p className="text-xs font-bold text-gray-600">周末去哪儿</p>
                            <p className="text-sm text-gray-800 mt-0.5">请问有马术课吗？零基础可以报吗？</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={handleExtractLeads}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center"
                      >
                        <Bot className="w-4 h-4 mr-2" />
                        一键分析留言，灌入 CRM 线索池
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {socialStep === 'leads' && (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-emerald-100 shadow-sm animate-in zoom-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">线索提取成功</h3>
              <p className="text-gray-500 mb-6">已成功从评论区提取并创建了 <span className="font-bold text-emerald-600">{socialLeadsCount}</span> 条高价值线索。</p>
              <a href="/internal/crm" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors shadow-sm">
                前往 CRM 客情池查看
              </a>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
