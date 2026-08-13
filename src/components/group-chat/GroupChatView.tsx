'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Spin, Modal, Checkbox, message, Popconfirm } from 'antd';
import { Send, Plus, Users, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { ALL_AGENTS } from '@/lib/bristh-config';

// ── 聊天大厅卡片 ──
function GroupChatLobby({ onEnterChat }: { onEnterChat: (id: string) => void }) {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/bristh/group-chat');
      const data = await res.json();
      setChats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChats(); }, []);

  const handleCreate = async () => {
    if (!newChatName.trim()) return message.error('请输入群名称');
    if (selectedAgents.length === 0) return message.error('请选择至少一个 AI 员工');
    setCreating(true);
    try {
      const res = await fetch('/api/bristh/group-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newChatName, topic: '', agents: selectedAgents })
      });
      const data = await res.json();
      setCreateModalOpen(false);
      setNewChatName('');
      setSelectedAgents([]);
      fetchChats();
      onEnterChat(data.id);
    } catch (e) {
      message.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/bristh/group-chat/${id}`, { method: 'DELETE' });
      message.success('已删除');
      fetchChats();
    } catch (e) {
      message.error('删除失败');
    }
  };

  if (loading) return <div className="p-10 text-center"><Spin size="large" /></div>;

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50/50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-gray-800 flex items-center">
          <Users className="w-6 h-6 mr-2 text-indigo-500" /> AI 员工群聊 (Roundtable)
        </h2>
        <button 
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm font-bold text-sm"
        >
          <Plus className="w-4 h-4 mr-1" /> 新建群聊
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chats.map(chat => (
          <div key={chat.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow relative group">
            <Popconfirm title="确定解散此群吗？" onConfirm={() => handleDelete(chat.id)}>
              <button className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </Popconfirm>
            <h3 className="text-lg font-bold text-gray-800 mb-2">{chat.name}</h3>
            <div className="flex gap-2 mb-4">
              {chat.participants.map((p: any) => {
                const agent = ALL_AGENTS.find(a => a.id === p.agentId);
                if (!agent) return null;
                return (
                  <div key={p.id} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200" title={agent.name}>
                    {agent.avatar ? <img src={agent.avatar} className="w-full h-full rounded-full object-cover" /> : agent.name[0]}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
              {chat.messages?.[0]?.content || '暂无消息'}
            </p>
            <button 
              onClick={() => onEnterChat(chat.id)}
              className="mt-4 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100"
            >
              进入群聊
            </button>
          </div>
        ))}
        {chats.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 font-bold">
            暂无群聊，快去创建一个吧
          </div>
        )}
      </div>

      <Modal title="新建 AI 群聊" open={createModalOpen} onCancel={() => setCreateModalOpen(false)} onOk={handleCreate} confirmLoading={creating}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">群名称</label>
            <input 
              value={newChatName} onChange={e => setNewChatName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="例如：市场方案攻坚组"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">选择参与的 AI 员工</label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ALL_AGENTS.map(agent => (
                <label key={agent.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer border border-transparent hover:border-gray-100">
                  <Checkbox 
                    checked={selectedAgents.includes(agent.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedAgents([...selectedAgents, agent.id]);
                      else setSelectedAgents(selectedAgents.filter(id => id !== agent.id));
                    }}
                  />
                  <div className="ml-3">
                    <div className="font-bold text-gray-800 text-sm">{agent.name}</div>
                    <div className="text-xs text-gray-500">{agent.role}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── 聊天室窗口 ──
function ChatRoom({ chatId, onBack }: { chatId: string, onBack: () => void }) {
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [agentTyping, setAgentTyping] = useState<{ id: string, name: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/bristh/group-chat/${chatId}`)
      .then(res => res.json())
      .then(data => {
        setChatInfo(data);
        setMessages(data.messages || []);
        scrollToBottom();
      });
  }, [chatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msgText = input;
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`/api/bristh/group-chat/${chatId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText })
      });

      if (!res.body) throw new Error('No body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'start') {
                  setMessages(prev => [...prev, data.data]);
                  scrollToBottom();
                } else if (data.type === 'agent_start') {
                  setAgentTyping(data.data);
                  setMessages(prev => [...prev, { _temp: true, senderId: data.data.agentId, content: '' }]);
                  scrollToBottom();
                } else if (data.type === 'agent_chunk') {
                  setMessages(prev => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last && last._temp) {
                      last.content += data.data.text;
                    }
                    return next;
                  });
                  scrollToBottom();
                } else if (data.type === 'agent_done') {
                  setAgentTyping(null);
                  setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = data.data; // replace temp with real
                    return next;
                  });
                  scrollToBottom();
                }
              } catch (e) {}
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      message.error('发送失败');
    } finally {
      setSending(false);
      setAgentTyping(null);
    }
  };

  if (!chatInfo) return <div className="flex h-full items-center justify-center"><Spin size="large"/></div>;

  const participantsInfo = chatInfo.participants.map((p: any) => ALL_AGENTS.find(a => a.id === p.agentId)).filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center">
          <button onClick={onBack} className="mr-4 text-gray-400 hover:text-gray-700">返回</button>
          <h2 className="text-xl font-black text-gray-800">{chatInfo.name}</h2>
          <span className="ml-3 text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">
            {participantsInfo.length} Agents
          </span>
        </div>
        <div className="flex -space-x-2">
          {participantsInfo.map((a: any) => (
            <div key={a.id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 overflow-hidden" title={a.name}>
              {a.avatar ? <img src={a.avatar} className="w-full h-full object-cover"/> : a.name[0]}
            </div>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
        {messages.map((msg, idx) => {
          const isUser = msg.senderId === 'USER';
          const agentInfo = ALL_AGENTS.find(a => a.id === msg.senderId);
          
          return (
            <div key={msg.id || idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
                <div className="w-10 h-10 rounded-full flex-shrink-0 bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex justify-center items-center font-bold text-gray-500">
                  {isUser ? 'U' : (agentInfo?.avatar ? <img src={agentInfo.avatar} className="w-full h-full object-cover"/> : agentInfo?.name?.[0])}
                </div>
                <div>
                  {!isUser && <div className="text-xs font-bold text-gray-500 mb-1 ml-1">{agentInfo?.name}</div>}
                  <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'}`}>
                    {msg.content}
                    {msg.content.includes('Please confirm and I will execute it') && (
                      <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <span className="text-indigo-800 font-bold flex items-center text-xs"><CheckCircle className="w-4 h-4 mr-1 text-indigo-500"/> Action Requested</span>
                        <div className="space-x-2">
                          <button className="px-3 py-1 bg-white text-gray-600 font-bold text-xs rounded shadow-sm hover:text-red-500">Decline</button>
                          <button className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded shadow-sm hover:bg-indigo-700">Approve & Execute</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {agentTyping && (
          <div className="flex justify-start">
            <div className="flex items-center bg-white px-4 py-3 rounded-full shadow-sm border border-gray-100 text-sm text-gray-500 font-bold">
              <Spin size="small" className="mr-2" /> {agentTyping.name} is typing...
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={sending}
            placeholder="Type a message... Use @ to mention specific AI."
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
          />
          <button 
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="w-12 h-12 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GroupChatView() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  if (activeChatId) {
    return <ChatRoom chatId={activeChatId} onBack={() => setActiveChatId(null)} />;
  }
  return <GroupChatLobby onEnterChat={setActiveChatId} />;
}
