'use client';

import React, { useState } from 'react';
import { BookOpen, Database, Cpu, Users, GitMerge, CheckCircle, Presentation, Calendar, Mail, FileText, Activity, Settings, Layers, Shield, ChevronRight } from 'lucide-react';

const SECTIONS = [
  { id: 'arch', label: '核心解耦架构', icon: GitMerge },
  { id: 'agents', label: '职能智能体阵列', icon: Users },
  { id: 'copilot', label: 'Copilot 覆写引擎', icon: CheckCircle },
  { id: 'think', label: 'Think+Work 范式', icon: Activity },
  { id: 'assembly', label: 'AI 装配系统', icon: Settings },
  { id: 'knowledge', label: '分层知识库', icon: Layers },
  { id: 'capability', label: 'Chief 能力字典', icon: Shield },
];

export default function LogicWhitepaper() {
  const [activeSection, setActiveSection] = useState('arch');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full w-full overflow-x-hidden">
      {/* Sidebar TOC */}
      <div className="hidden md:flex w-56 bg-white border-r border-gray-200/80 flex-col py-6 px-3 shrink-0">
        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-4">目录导航</h3>
        <nav className="space-y-1 flex-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                activeSection === s.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/80'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <s.icon className={`w-3.5 h-3.5 mr-2 ${activeSection === s.id ? 'text-indigo-500' : 'text-gray-400'}`} />
              {s.label}
            </button>
          ))}
        </nav>
        <div className="px-3 pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-300 font-medium">V2.0.0 — Updated with Assembly</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-10">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* Header */}
          <div className="pb-8 border-b border-gray-200">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center">
              <BookOpen className="w-8 h-8 text-indigo-500 mr-4" /> Bristh Multi-Agent 架构白皮书
            </h1>
            <p className="text-gray-400 mt-2 text-sm font-medium">
              V2.0.0 — 系统底层逻辑、AI 装配系统与知识库分层说明手册
            </p>
          </div>

          {/* Org Chart Illustration */}
          <div className="flex justify-center py-2">
            <img src="/pixel-org-chart.png" alt="BEP Organization - Boss + Chief + AI Workers" className="w-80 h-auto" />
          </div>

          {/* Section 1: Core Architecture */}
          <section id="arch">
            <h2 className="text-xl font-black flex items-center text-gray-900 mb-5">
              <GitMerge className="w-5 h-5 mr-3 text-blue-500" /> 1. 核心解耦架构 (Decoupled Orchestration)
            </h2>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-5 rounded-r-xl mb-5">
              <p className="text-gray-700 leading-relaxed text-sm">
                系统采用 <strong>"1个中枢大脑 (Chief) + N个职能单线程智能体 (Sub-AIs)"</strong> 的异步分发架构。所有原始输入材料先存入资产数据库，子节点按需自行提取，极大降低 Token 无意义传递，并允许并行处理。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm col-span-1 md:col-span-2">
                <h3 className="text-base font-bold text-gray-800 flex items-center mb-3">
                  <Cpu className="w-4 h-4 mr-2 text-indigo-500" /> Chief Orchestrator 与动态管线生成
                </h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <ul className="list-disc pl-5 space-y-2 text-gray-700 text-sm">
                    <li><strong>意图剥离</strong>：基于大模型对长段无结构输入进行多意图剥离。</li>
                    <li><strong>动态管线规划</strong>：Chief 持有<code className="bg-gray-200 px-1 mx-1 text-xs">agent_capabilities.yaml</code>能力字典，实时计算并生成独一无二的任务管线。</li>
                    <li><strong>独立指令下发</strong>：为每个 Sub-AI 撰写高度定制化的 instruction，千人千面。</li>
                    <li><strong>异步落库挂载</strong>：子任务转化为 Task 表记录，绑定同一份 TaskContext，前端无阻塞并发调度。</li>
                  </ul>
                </div>
              </div>
              <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm">
                <h3 className="text-base font-bold text-gray-800 flex items-center mb-3">
                  <Database className="w-4 h-4 mr-2 text-emerald-500" /> 资产落库 (Database Models)
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                  <li><code className="bg-gray-100 px-1 font-bold">TaskContext</code>: 只读源文件库。</li>
                  <li><code className="bg-gray-100 px-1 font-bold">Task</code>: 子AI单据，含 instruction 和 resultPayload。</li>
                </ul>
              </div>
              <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm">
                <h3 className="text-base font-bold text-gray-800 flex items-center mb-3">
                  <GitMerge className="w-4 h-4 mr-2 text-violet-500" /> 代码架构
                </h3>
                <ul className="space-y-1.5 text-sm text-gray-600 font-mono">
                  <li>📂 <code className="text-xs">api/bristh/orchestrate/</code> → Chief 总管</li>
                  <li>📂 <code className="text-xs">api/bristh/agents/{'{name}'}/</code> → 7 个 Agent</li>
                  <li>📂 <code className="text-xs">api/bristh/copilot/</code> → Copilot 覆写</li>
                  <li>📂 <code className="text-xs">api/bristh/agents/config/</code> → 配置 API</li>
                  <li>📂 <code className="text-xs">lib/bristh-config.ts</code> → 共用读取层</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2: Sub-Agents */}
          <section id="agents">
            <h2 className="text-xl font-black flex items-center text-gray-900 mb-5">
              <Users className="w-5 h-5 mr-3 text-purple-500" /> 2. 职能智能体阵列 (Sub-Agents)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Alice', title: '方案架构', icon: FileText, color: 'blue', format: 'Markdown 文本', desc: '结合长文本撰写项目企划书或商业提案。' },
                { name: 'Bob', title: '日程安排', icon: Calendar, color: 'emerald', format: '.ics 日历文件', desc: '提取时间意图，调用 ics 包生成标准日历邀请。' },
                { name: 'Edda', title: 'PPT制作', icon: Presentation, color: 'purple', format: '物理 .pptx 文件', desc: '两步走：大纲抽取→pptxgenjs 生成可下载文件。' },
                { name: 'David', title: '内控纪检', icon: Activity, color: 'red', format: 'Markdown 工单', desc: '反向扫描上下文，找出未兑现承诺和业务漏洞。' },
                { name: 'Fiona', title: '信息同步', icon: Users, color: 'amber', format: 'Internal Memo', desc: '打破信息孤岛，将核心决策同步给未在场人员。' },
                { name: 'Eric', title: '法务写作', icon: BookOpen, color: 'cyan', format: 'Markdown 合同', desc: '自动提取商务条件，套用法务 Boilerplate 输出草案。' },
                { name: 'Grace', title: '邮件分发', icon: Mail, color: 'pink', format: '物理邮件发送', desc: '等全部附件就绪后统一发出，调用 nodemailer。' },
              ].map(a => (
                <div key={a.name} className="border border-gray-200 p-4 rounded-2xl bg-white">
                  <h3 className="font-bold text-gray-900 flex items-center mb-1.5 text-sm">
                    <a.icon className={`w-4 h-4 mr-2 text-${a.color}-500`} /> {a.name} ({a.title})
                  </h3>
                  <p className="text-[11px] text-gray-400 mb-2">输出: {a.format}</p>
                  <p className="text-xs text-gray-600">{a.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Copilot */}
          <section id="copilot">
            <h2 className="text-xl font-black flex items-center text-gray-900 mb-5">
              <CheckCircle className="w-5 h-5 mr-3 text-emerald-500" /> 3. Copilot 调教与覆写引擎
            </h2>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
              <p className="text-gray-700 text-sm mb-5 leading-relaxed">
                系统集成 Copilot 工作流，Task 表引入 <code className="bg-gray-200 px-1 text-xs">copilotHistory</code> 字段实现长期对话记忆。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">前端双分屏交互</h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li className="flex items-start"><span className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center mr-2 shrink-0 font-bold text-[10px]">L</span> Live Preview：渲染 resultPayload</li>
                    <li className="flex items-start"><span className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 shrink-0 font-bold text-[10px]">R</span> Agent Chat：用户修改指令面板</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm">后端覆写逻辑</h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li>• <code className="bg-gray-200 px-1 text-[10px]">/api/bristh/copilot</code> 聚合上下文、历史对话和当前成果重新推理</li>
                    <li>• JSON 结构化输出返回全量新版本产物</li>
                    <li>• PPT 类任务自动重新执行 pptxgenjs 生成新物理文件</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Think+Work */}
          <section id="think">
            <h2 className="text-xl font-black flex items-center text-gray-900 mb-5">
              <Activity className="w-5 h-5 mr-3 text-orange-500" /> 4. Think+Work 与物理外挂
            </h2>
            <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200">
              <p className="text-gray-700 text-sm mb-5 leading-relaxed">
                引入 <strong>Tool Calling</strong> 和 <strong>Think+Work</strong> 双步走范式，AI 退化为纯决策者，业务执行交给底层稳定代码库。
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm text-orange-800">Toolbox 工具箱</h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li>• 物理能力封装为独立沙盒工具（pptx_generator、ics_scheduler）</li>
                    <li>• Toolbox 为"人工发包测试台"，允许手动驱动工具</li>
                    <li>• AI 通过完全一致的参数协议调用，能力底层对齐</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 text-sm text-orange-800">Think + Work 日志</h4>
                  <ul className="space-y-2 text-xs text-gray-600">
                    <li>• 🤔 <strong>Think</strong>: 模型先输出推理链路，UI 折叠展示</li>
                    <li>• 🛠️ <strong>Work</strong>: Tool Calling 执行，命令行瀑布流实时展示</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: AI Assembly System (NEW) */}
          <section id="assembly">
            <h2 className="text-xl font-black flex items-center text-gray-900 mb-5">
              <Settings className="w-5 h-5 mr-3 text-indigo-500" /> 5. AI 装配系统 (Agent Assembly)
            </h2>
            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-5 rounded-r-xl mb-5">
              <p className="text-gray-700 leading-relaxed text-sm">
                每个 AI Agent 的人格、技能标签和专属知识通过 <strong>config.json</strong> 文件进行结构化管理。运营人员可通过 UI 界面（AI配置与装配）实时微调 persona 和描述，修改后 Agent 下次执行自动生效。<strong>Tool Calling 和 Skill 的底层代码不受影响</strong>。
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Character 文件结构</h3>
                <div className="bg-gray-50 p-3 rounded-xl font-mono text-xs text-gray-600 space-y-1">
                  <p>📂 public/characters/bristh_alice/</p>
                  <p className="pl-4">├── config.json    <span className="text-gray-400"># 人格、技能、颜色</span></p>
                  <p className="pl-4">└── 📂 context/     <span className="text-gray-400"># 专属知识文档</span></p>
                  <p className="pl-8">└── proposal_standards.md</p>
                </div>
              </div>
              <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Config 可配置项</h3>
                <ul className="space-y-1.5 text-xs text-gray-600">
                  <li>• <strong>persona</strong> — 系统人格指令（运营可微调）</li>
                  <li>• <strong>description / title</strong> — 职能描述（影响 UI 展示）</li>
                  <li>• <strong>skills_preview</strong> — 技能标签列表</li>
                  <li>• <strong>enabled</strong> — 启用/禁用开关</li>
                  <li>• <strong>knowledge_scope</strong> — 知识访问范围</li>
                  <li>• <strong>output_format</strong> — 输出格式声明</li>
                </ul>
              </div>
              <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm col-span-1 md:col-span-2">
                <h3 className="text-sm font-bold text-gray-800 mb-3">数据流：UI → config.json → Agent 路由</h3>
                <div className="flex items-center justify-center gap-3 text-xs text-gray-600 py-3">
                  <span className="px-3 py-1.5 bg-indigo-50 rounded-lg font-bold text-indigo-600 border border-indigo-100">Settings UI 编辑</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <span className="px-3 py-1.5 bg-violet-50 rounded-lg font-bold text-violet-600 border border-violet-100">PUT /api/bristh/agents/config</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <span className="px-3 py-1.5 bg-emerald-50 rounded-lg font-bold text-emerald-600 border border-emerald-100">写入 config.json</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <span className="px-3 py-1.5 bg-blue-50 rounded-lg font-bold text-blue-600 border border-blue-100">buildAgentPrompt() 读取</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Layered Knowledge Base (NEW) */}
          <section id="knowledge">
            <h2 className="text-xl font-black flex items-center text-gray-900 mb-5">
              <Layers className="w-5 h-5 mr-3 text-amber-500" /> 6. 分层知识库 (Layered Knowledge)
            </h2>
            <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl mb-5">
              <p className="text-gray-700 leading-relaxed text-sm">
                知识库采用 <strong>全局 + 专属</strong> 两层结构。全局知识库所有 AI 均可检索；专属 context 文件仅装配在特定 AI 身上，避免不相关 Agent 索引无用信息。
              </p>
            </div>
            <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">两层知识分发模型</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="text-lg">🌐</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">全局知识层 (Global KB)</p>
                    <p className="text-xs text-gray-500">所有 Agent 共享。包含公司介绍、行业数据、通用模板等。</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl border border-violet-100">
                  <span className="text-lg">🔒</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">专属知识层 (Private Context)</p>
                    <p className="text-xs text-gray-500 mb-2">每个 Agent 独有。存储于 <code className="bg-violet-100 px-1 text-[10px]">characters/bristh_{'{agent}'}/context/</code></p>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <span className="px-2 py-1 bg-white rounded border border-gray-100">📝 Edda → design_guidelines.md</span>
                      <span className="px-2 py-1 bg-white rounded border border-gray-100">⚖️ Eric → legal_templates.md</span>
                      <span className="px-2 py-1 bg-white rounded border border-gray-100">🔍 David → audit_checklist.md</span>
                      <span className="px-2 py-1 bg-white rounded border border-gray-100">📋 Alice → proposal_standards.md</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Chief Capability Dictionary (NEW) */}
          <section id="capability">
            <h2 className="text-xl font-black flex items-center text-gray-900 mb-5">
              <Shield className="w-5 h-5 mr-3 text-violet-500" /> 7. Chief 能力字典 (Capability Dictionary)
            </h2>
            <div className="bg-violet-50 border-l-4 border-violet-500 p-5 rounded-r-xl mb-5">
              <p className="text-gray-700 leading-relaxed text-sm">
                Chief 总管的 Think/Plan 能力依赖一份 <strong>Agent 能力字典</strong>文件。该文件定义了每个 Agent 的能力范围、触发关键词和使用注意事项。Chief 在解析意图时，会参照此字典决定唤醒哪些 Agent。
              </p>
            </div>
            <div className="border border-gray-200 p-5 rounded-2xl bg-white shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">文件位置与结构</h3>
              <p className="text-xs text-gray-500 mb-3 font-mono">📂 public/characters/bristh_chief/agent_capabilities.yaml</p>
              <div className="bg-gray-50 p-4 rounded-xl font-mono text-xs text-gray-600 space-y-1 border border-gray-200 max-h-48 overflow-y-auto">
                <p className="text-violet-600 font-bold">agents:</p>
                <p className="pl-2">- name: "Alice"</p>
                <p className="pl-4">capabilities: [商业方案撰写, RAG检索增强, ...]</p>
                <p className="pl-4">trigger_keywords: ["方案", "提案", "proposal", ...]</p>
                <p className="pl-4">notes: "适合处理需要长篇专业文档的任务。"</p>
                <p className="pl-2">- name: "Grace"</p>
                <p className="pl-4">capabilities: [专业邮件撰写, SMTP发送, ...]</p>
                <p className="pl-4">notes: "应该始终是管线中最后执行的 Agent。"</p>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                运营人员可直接编辑此 YAML 文件来调整 Chief 的分发策略，无需修改代码。
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
