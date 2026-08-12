'use client';

import React, { useState } from 'react';
import { Bot, Send, Loader2, Sparkles, Languages, Calendar } from 'lucide-react';
import { Modal } from 'antd';

interface EmailReplyWidgetProps {
  customerId: string;
  email: string | null;
  messages: any[];
  insights: string | null;
  nextSteps: string | null;
}

export default function EmailReplyWidget({ customerId, email, messages, insights, nextSteps }: EmailReplyWidgetProps) {
  const [draft, setDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [language, setLanguage] = useState<'ZH' | 'EN'>('ZH');

  // Calendar Invite State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteParams, setInviteParams] = useState({
    subject: 'Admissions Interview / Meeting',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    durationMinutes: '30',
    location: 'Zoom Meeting',
    description: 'We are looking forward to our meeting to discuss your application.'
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/crm/reply/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, insights, nextSteps, language }),
      });
      const data = await res.json();
      if (res.ok) {
        setDraft(data.draft);
      } else {
        setStatusMsg({ text: '草稿生成失败: ' + data.error, type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: '网络错误，无法生成。', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!email) {
      setStatusMsg({ text: '客户邮箱为空，无法发送。', type: 'error' });
      return;
    }
    if (!draft.trim()) {
      setStatusMsg({ text: '请先生成或输入草稿正文。', type: 'error' });
      return;
    }

    setIsSending(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/crm/reply/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: email, 
          subject: language === 'ZH' ? '关于您咨询 Myddelton College 的回复' : 'Re: Your inquiry to Myddelton College', 
          text: draft 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: '发送成功！', type: 'success' });
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg({ text: '发送失败: ' + data.error, type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: '网络错误，无法发送。', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendInvite = async () => {
    if (!email) {
      setStatusMsg({ text: '客户邮箱为空，无法发送邀约。', type: 'error' });
      return;
    }

    setIsInviting(true);
    setStatusMsg(null);
    try {
      const startTime = `${inviteParams.date}T${inviteParams.time}:00`;
      const res = await fetch('/api/crm/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId,
          to: email, 
          subject: inviteParams.subject,
          description: inviteParams.description,
          location: inviteParams.location,
          startTime,
          durationMinutes: inviteParams.durationMinutes
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: '日历邀约发送成功！', type: 'success' });
        setIsInviteModalOpen(false);
        setTimeout(() => setStatusMsg(null), 3000);
      } else {
        setStatusMsg({ text: '邀约发送失败: ' + data.error, type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: '网络错误，无法发送邀约。', type: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col mt-6">
      <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-[#141b38]">智能邮件回复</h2>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            发送日历邀约
          </button>
          
          <button 
            onClick={() => setLanguage(language === 'ZH' ? 'EN' : 'ZH')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Languages className="w-3.5 h-3.5" />
            {language === 'ZH' ? '中' : 'EN'}
          </button>
          
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
            一键起草
          </button>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {statusMsg && (
          <div className={`p-3 rounded-lg text-sm font-medium ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {statusMsg.text}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-500 flex justify-between">
            <span>To: {email || <span className="text-red-400">未提供邮箱</span>}</span>
          </label>
          <textarea 
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="点击右上角“一键起草”，或手动输入回复内容..."
            className="w-full min-h-[160px] p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button 
            onClick={handleSend}
            disabled={isSending || !draft.trim() || !email}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#141b38] hover:bg-black text-white rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            直接发送邮件
          </button>
        </div>
      </div>

      <Modal
        title="📅 发送日历邀约 (.ics)"
        open={isInviteModalOpen}
        onCancel={() => setIsInviteModalOpen(false)}
        footer={null}
        width={450}
        centered
      >
        <div className="space-y-4 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">邀约主题</label>
            <input 
              type="text" 
              value={inviteParams.subject}
              onChange={(e) => setInviteParams({...inviteParams, subject: e.target.value})}
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
              <input 
                type="date" 
                value={inviteParams.date}
                onChange={(e) => setInviteParams({...inviteParams, date: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时间</label>
              <input 
                type="time" 
                value={inviteParams.time}
                onChange={(e) => setInviteParams({...inviteParams, time: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">时长</label>
              <select 
                value={inviteParams.durationMinutes}
                onChange={(e) => setInviteParams({...inviteParams, durationMinutes: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm bg-white"
              >
                <option value="15">15 分钟</option>
                <option value="30">30 分钟</option>
                <option value="45">45 分钟</option>
                <option value="60">60 分钟</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">会议地点/链接</label>
              <input 
                type="text" 
                value={inviteParams.location}
                onChange={(e) => setInviteParams({...inviteParams, location: e.target.value})}
                className="w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">补充说明 (正文)</label>
            <textarea 
              value={inviteParams.description}
              onChange={(e) => setInviteParams({...inviteParams, description: e.target.value})}
              className="w-full h-24 p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <button 
            onClick={handleSendInvite}
            disabled={isInviting || !inviteParams.date || !inviteParams.time}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center disabled:opacity-50"
          >
            {isInviting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            向客户发送日历邀请 (.ics)
          </button>
        </div>
      </Modal>
    </div>
  );
}
