'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Sparkles } from 'lucide-react';
import AgentChat from './AgentChat';

interface AgentConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  avatar: string;
  color: string;
  skills_preview: string[];
  role: string;
  enabled: boolean;
  greeting?: string;
  quick_prompts?: string[];
}

const COLOR_MAP: Record<string, { bg: string; border: string; tag: string; gradient: string; shadow: string }> = {
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200', tag: 'bg-blue-100 text-blue-700',       gradient: 'from-blue-500 to-blue-600',    shadow: 'shadow-blue-500/20' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', tag: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/20' },
  purple:  { bg: 'bg-purple-50',  border: 'border-purple-200', tag: 'bg-purple-100 text-purple-700',   gradient: 'from-purple-500 to-purple-600', shadow: 'shadow-purple-500/20' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200', tag: 'bg-red-100 text-red-700',         gradient: 'from-red-500 to-red-600',      shadow: 'shadow-red-500/20' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200', tag: 'bg-amber-100 text-amber-700',     gradient: 'from-amber-500 to-amber-600',  shadow: 'shadow-amber-500/20' },
  cyan:    { bg: 'bg-cyan-50',    border: 'border-cyan-200', tag: 'bg-cyan-100 text-cyan-700',       gradient: 'from-cyan-500 to-cyan-600',    shadow: 'shadow-cyan-500/20' },
  pink:    { bg: 'bg-pink-50',    border: 'border-pink-200', tag: 'bg-pink-100 text-pink-700',       gradient: 'from-pink-500 to-pink-600',    shadow: 'shadow-pink-500/20' },
  indigo:  { bg: 'bg-indigo-50',  border: 'border-indigo-200', tag: 'bg-indigo-100 text-indigo-700',   gradient: 'from-indigo-500 to-indigo-600', shadow: 'shadow-indigo-500/20' },
};

export default function AIEmployeesView() {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bristh/agents/config')
      .then(r => r.json())
      .then((data: AgentConfig[]) => {
        // Filter out orchestrator (Chief) — they don't do 1v1 chat
        setAgents(data.filter(a => a.role !== 'orchestrator' && a.enabled));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // If an agent is selected, show chat
  if (selectedAgent) {
    return (
      <div className="h-full flex flex-col">
        <AgentChat agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
      </div>
    );
  }

  // Roster grid
  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 tracking-tight">AI 员工</h1>
            <p className="text-xs text-gray-400 font-medium">选择一位 AI 员工开始对话</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {agents.map(agent => {
              const colors = COLOR_MAP[agent.color] || COLOR_MAP.blue;
              return (
                <div
                  key={agent.id}
                  className={`group relative bg-white rounded-2xl border ${colors.border} overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  {/* Avatar banner */}
                  <div className={`h-32 bg-gradient-to-br ${colors.gradient} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/5" />
                    <img
                      src={agent.avatar}
                      alt={agent.name}
                      className="absolute bottom-0 right-2 h-28 w-28 object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Online badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-white/90 backdrop-blur rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-gray-700">在线</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-sm font-black text-gray-900 mb-0.5">{agent.name}</h3>
                    <p className="text-[11px] font-semibold text-gray-400 mb-2">{agent.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">{agent.description}</p>

                    {/* Skills tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {agent.skills_preview.slice(0, 3).map(skill => (
                        <span key={skill} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.tag}`}>
                          {skill}
                        </span>
                      ))}
                      {agent.skills_preview.length > 3 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          +{agent.skills_preview.length - 3}
                        </span>
                      )}
                    </div>

                    {/* CTA Button */}
                    <button
                      className={`w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${colors.gradient} text-white rounded-xl text-xs font-bold shadow-lg ${colors.shadow} hover:opacity-90 transition-opacity`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      开始对话
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
