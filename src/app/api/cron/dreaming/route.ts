import { NextResponse } from 'next/server';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';
import {
  listAgentsWithMemory,
  loadMemoriesByDate,
  loadSoulFile,
  writeSoulFile,
  purgeExpiredMemories,
} from '@/lib/memory-engine';
import { loadAgentConfig } from '@/lib/bristh-config';

export const maxDuration = 300; // Up to 5 minutes for all agents

/**
 * Dreaming Agent — 每日记忆整理系统
 * 
 * 灵感来源：海马体记忆回放 (Hippocampal Replay)
 * - NREM 巩固：归纳当日经验，更新灵魂文件
 * - REM 做梦：交叉关联不同任务的经验，发现模式
 * - 选择性遗忘：标记低价值记忆
 * 
 * 可通过 Vercel Cron 或手动 GET 触发
 */
export async function GET(req: Request) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const agents = await listAgentsWithMemory();
    const results: Record<string, any> = {};

    for (const agentId of agents) {
      if (agentId === 'chief') continue; // Skip orchestrator

      try {
        const todayMemories = await loadMemoriesByDate(agentId, today);
        
        // Skip if no memories today
        if (todayMemories.length === 0) {
          results[agentId] = { status: 'skipped', reason: 'no memories today' };
          continue;
        }

        const existingSoul = await loadSoulFile(agentId);
        const config = await loadAgentConfig(agentId);
        const agentName = config?.name || agentId;

        const memoriesText = todayMemories.map((m, i) => 
          `[${i + 1}] (${m.type}, importance=${m.importance}) ${m.content}`
        ).join('\n');

        // Dreaming prompt — inspired by hippocampal replay
        const dreamingPrompt = `你是 ${agentName} 的潜意识记忆整理系统（Dreaming Agent）。

你正在进入"做梦"模式——就像人类大脑在睡眠中进行海马体记忆回放一样。

今天 ${agentName} 经历了以下事件：
${memoriesText}

${existingSoul ? `${agentName} 当前的灵魂文件（长期记忆）：\n${existingSoul}` : `${agentName} 还没有灵魂文件，这是第一次做梦。`}

请执行以下记忆整理操作：

1. **NREM 巩固**：今天学到了什么？有什么重要模式？提取关键经验。
2. **REM 联想**：不同任务之间有什么关联？有什么创造性发现？
3. **更新灵魂文件**：合并今天的关键经验到长期记忆中。保持条理清晰。
4. **遗忘建议**：哪些记忆不重要（importance < 0.3），可以标记为过期？

输出格式（严格 JSON）：
{
  "soul": "完整的更新后灵魂文件内容（Markdown 格式）",
  "insights": "今日关键洞察总结（1-2 句话）",
  "pruneIds": ["要标记为过期的记忆ID列表"]
}

灵魂文件格式建议：
# ${agentName} 的灵魂文件
> 最后更新: ${today} by Dreaming Agent

## 核心能力认知
## 已学教训  
## 用户偏好
## 协作模式
## 工作记录

输出 ONLY valid JSON.`;

        const { client, config: modelConfig } = await getModelClient();
        const response = await client.chat.completions.create(
          buildCompletionParams(modelConfig, [
            { role: 'system', content: dreamingPrompt }
          ], { requireJson: true, maxTokens: 4096 })
        );

        const raw = response.choices[0].message.content || '';
        let dreamResult;
        try {
          const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
          dreamResult = JSON.parse(cleaned);
        } catch {
          const match = raw.match(/\{[\s\S]*\}/);
          dreamResult = match ? JSON.parse(match[0]) : null;
        }

        if (dreamResult?.soul) {
          await writeSoulFile(agentId, dreamResult.soul);
          // Purge expired memories based on retention policy
          const purged = await purgeExpiredMemories(agentId);
          results[agentId] = {
            status: 'success',
            memoriesProcessed: todayMemories.length,
            insights: dreamResult.insights || '',
            pruned: purged,
          };
        } else {
          results[agentId] = { status: 'failed', reason: 'Could not parse dream output' };
        }
      } catch (e: any) {
        results[agentId] = { status: 'error', error: e.message };
      }
    }

    return NextResponse.json({
      ok: true,
      date: today,
      agentsProcessed: Object.keys(results).length,
      results,
    });
  } catch (error: any) {
    console.error('Dreaming Agent error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
