import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';
import { cookies } from 'next/headers';
import { loadAgentConfig } from '@/lib/bristh-config';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';

/**
 * Phase 1 of 2-step orchestration:
 * Chief AI analyzes the input, decomposes into sub-tasks with complexity scoring.
 * Creates a DRAFT TaskContext but does NOT create Task records yet.
 * Returns the analysis for the user to review and configure approval nodes.
 */

// Read the Agent Capability Dictionary
async function loadCapabilityDict(): Promise<string> {
  try {
    const yamlPath = path.join(process.cwd(), 'public', 'characters', 'bristh_chief', 'agent_capabilities.yaml');
    return await fs.readFile(yamlPath, 'utf-8');
  } catch {
    return `Available Agents:
- "Alice": 方案架构 (Proposal writing)
- "Bob": 日程安排 (Calendar invites)
- "Edda": PPT制作 (Generate PPTs)
- "David": 内控纪检 (Internal audits)
- "Fiona": 组织宣发 (Memos for absent stakeholders)
- "Eric": 法务写作 (Contract drafts / NDAs)
- "Grace": 邮件分发 (Email dispatch - always last)`;
  }
}

// Extract userId from session cookie
async function getSessionUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('autoffice_session')?.value;
    if (!raw) return null;
    const session = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    return session.userId || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const { source, rawContent, locale } = await req.json();

    if (!rawContent) {
      return NextResponse.json({ error: 'Missing rawContent' }, { status: 400 });
    }

    const { config: modelConfig } = await getModelClient();
    const userId = await getSessionUserId();

    // Create a DRAFT context (no tasks yet)
    const context = await prisma.taskContext.create({
      data: {
        source: source || 'TEXT_PASTE',
        rawContent,
        modelUsed: modelConfig.name,
        userId,
        pipelineStatus: 'DRAFT',
      }
    });

    // Load Chief's persona + capability dictionary
    const chiefConfig = await loadAgentConfig('chief');
    const capabilityDict = await loadCapabilityDict();
    const chiefPersona = chiefConfig?.persona || 'You are the Chief Master AI (Task Orchestrator).';

    const langInstruction = locale?.startsWith('zh')
      ? '\n\n【语言要求】所有 instruction 和 reason 字段请使用中文撰写。'
      : locale?.startsWith('en')
        ? '\n\n【Language Requirement】Write all "instruction" and "reason" fields in English.'
        : '';

    const systemPrompt = `${chiefPersona}

Here is your Agent Capability Dictionary — use it to decide which agents to dispatch:
---
${capabilityDict}
---

Output format: JSON object with a "tasks" array.
Each task object must have:
- "agent": The EXACT name of the agent (e.g. "Alice", "Bob")
- "instruction": Specific, actionable instruction for this agent based on the input text.
- "complexity": "high" | "medium" | "low" — assess how complex and risky this sub-task is.
- "reason": A short explanation of why this complexity level was assigned, to help the user decide whether to add human approval.

Complexity guidelines:
- "high": Legal documents, financial commitments, external-facing materials, audit/compliance tasks. Recommend human review.
- "medium": Internal memos, presentations, scheduling. May benefit from review.
- "low": Simple, routine tasks with low risk. Usually safe to auto-approve.
${langInstruction}`;

    let tasksAnalysis: any[] = [];
    let parsedJson: any = {};

    // Demo safeguard
    if (rawContent.includes('Global Edu Group')) {
      tasksAnalysis = [
        { agent: 'Alice', instruction: '根据纪要第1点，撰写一份详细的《国际教育合作企划书》，凸显转化率优势和市场覆盖面。', complexity: 'medium', reason: '商业方案内容需要准确表达合作意图' },
        { agent: 'Edda', instruction: '根据纪要第2点，提取重点并制作一份约5页的高质量演示PPT，风格偏向商务蓝。', complexity: 'low', reason: '演示文稿属于常规输出' },
        { agent: 'Bob', instruction: '根据纪要第3点，生成8月15日下午2点的日历邀请（时长1小时）。', complexity: 'low', reason: '日程安排简单明确' },
        { agent: 'David', instruction: '根据纪要第6点，审视"首月保底招生100人"的承诺，分析违约风险并给出整改意见。', complexity: 'high', reason: '涉及风险评估和合规审计，建议人工复核' },
        { agent: 'Eric', instruction: '根据纪要第4点，起草一份标准的NDA和合作草案，条款为收益6:4分成，期限3年。', complexity: 'high', reason: '法律文书需要确保条款准确，建议人工审批' },
        { agent: 'Fiona', instruction: '根据纪要第5点，撰写一份给技术部和市场部的通报Memo，同步合作敲定并分配数据对接和物料准备任务。', complexity: 'medium', reason: '内部通报需要信息准确' },
        { agent: 'Grace', instruction: '等所有材料就绪后，起草一封正式邮件发给Mr. Smith，并附带所有附件，语气专业诚恳。', complexity: 'high', reason: '外部沟通邮件代表公司形象，建议审核' },
      ];
      parsedJson = { tasks: tasksAnalysis };
    } else {
      const { client, config } = await getModelClient();
      const response = await client.chat.completions.create(
        buildCompletionParams(config, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Input Context:\n\n${rawContent}` }
        ], { requireJson: true })
      );
      let rawResponse = response.choices[0].message.content || '{"tasks":[]}';
      console.log('[Orchestrate/Analyze] Raw AI response:', rawResponse.substring(0, 300));
      
      // Remove DeepSeek <think> blocks
      rawResponse = rawResponse.replace(/<think>[\s\S]*?<\/think>/g, '');

      // Robust JSON extraction
      rawResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        parsedJson = JSON.parse(rawResponse);
      } catch {
        const objMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try {
            parsedJson = JSON.parse(objMatch[0]);
          } catch {
            console.error('[Orchestrate/Analyze] Failed to parse JSON from:', rawResponse.substring(0, 500));
            throw new Error('AI 未能返回有效的 JSON 任务分派。请重试。');
          }
        } else {
          throw new Error('AI 未能返回有效的 JSON 任务分派。请重试。');
        }
      }
      tasksAnalysis = (parsedJson as any).tasks || [];
    }

    // Save analysis to context (but don't create Task records yet)
    await prisma.taskContext.update({
      where: { id: context.id },
      data: { parsedData: JSON.stringify(parsedJson) }
    });

    return NextResponse.json({
      success: true,
      contextId: context.id,
      tasks: tasksAnalysis, // Analysis only, not DB records
    });

  } catch (error: any) {
    console.error('Orchestration analyze error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
