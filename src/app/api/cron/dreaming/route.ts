import { NextResponse } from 'next/server';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';
import {
  listAgentsWithMemory,
  loadAgentMemories,
  loadSoulFile,
  writeSoulFile,
  purgeExpiredMemories,
} from '@/lib/memory-engine';
import { loadAgentConfig } from '@/lib/bristh-config';
import prisma from '@/lib/prisma';

export const maxDuration = 300; // Up to 5 minutes for all agents

// Use database for last dream times (Vercel filesystem is read-only)
async function getLastDreamTimes(): Promise<Record<string, string>> {
  try {
    const meta = await prisma.systemMeta.findUnique({ where: { key: 'last_dream_times' } });
    return meta ? JSON.parse(meta.value) : {};
  } catch {
    return {};
  }
}

async function saveLastDreamTimes(times: Record<string, string>): Promise<void> {
  await prisma.systemMeta.upsert({
    where: { key: 'last_dream_times' },
    update: { value: JSON.stringify(times) },
    create: { key: 'last_dream_times', value: JSON.stringify(times) },
  });
}

/**
 * Dreaming Agent — 每日记忆整理系统
 * 
 * 灵感来源：海马体记忆回放 (Hippocampal Replay)
 * - NREM 巩固：归纳经验，更新灵魂文件
 * - REM 做梦：交叉关联不同任务的经验
 * - 选择性遗忘：标记低价值记忆
 * 
 * ?force=true 可强制处理所有记忆（首次初始化用）
 * 否则只处理上次做梦之后的新记忆
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const forceAll = url.searchParams.get('force') === 'true';
    const now = new Date().toISOString();
    const agents = await listAgentsWithMemory();
    const lastDreamTimes = await getLastDreamTimes();
    const results: Record<string, any> = {};

    for (const agentId of agents) {
      if (agentId === 'chief') continue;

      try {
        const allMemories = await loadAgentMemories(agentId, 100);
        const lastDream = lastDreamTimes[agentId];

        const newMemories = forceAll
          ? allMemories
          : allMemories.filter(m => !lastDream || m.ts > lastDream);

        if (newMemories.length === 0) {
          results[agentId] = { status: 'skipped', reason: 'no new memories since last dream' };
          continue;
        }

        const existingSoul = await loadSoulFile(agentId);
        const config = await loadAgentConfig(agentId);
        const agentName = config?.name || agentId;

        const memoriesText = newMemories.map((m, i) => 
          `[${i + 1}] (${m.type}, importance=${m.importance}) ${m.content}`
        ).join('\n');

        const dreamingPrompt = `你是 ${agentName} 的潜意识记忆整理系统（Dreaming Agent）。

你正在进入"做梦"模式——就像人类大脑在睡眠中进行海马体记忆回放一样。

以下是 ${agentName} 需要整理的${forceAll ? '全部' : '新增'}记忆（共 ${newMemories.length} 条）：
${memoriesText}

${existingSoul ? `${agentName} 当前的灵魂文件（长期记忆）：\n${existingSoul}` : `${agentName} 还没有灵魂文件，这是第一次做梦。请根据以上记忆创建初始灵魂文件。`}

请执行以下记忆整理操作：

1. **NREM 巩固**：提取关键经验和模式，有什么重要教训？
2. **REM 联想**：不同任务之间有什么关联？有什么创造性发现？
3. **更新灵魂文件**：将新的关键经验合并到灵魂文件中。${existingSoul ? '保留现有有价值的内容，新增/修改有变化的部分。' : ''}
4. **遗忘建议**：哪些记忆不重要（importance < 0.3），可以淡化？

输出格式（严格 JSON）：
{
  "soul": "完整的更新后灵魂文件内容（Markdown 格式）",
  "insights": "本次整理的关键洞察总结（1-2 句话）"
}

灵魂文件格式：
# ${agentName} 的灵魂文件
> 最后更新: ${now.split('T')[0]} by Dreaming Agent

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
          const purged = await purgeExpiredMemories(agentId);
          lastDreamTimes[agentId] = now;
          results[agentId] = {
            status: 'success',
            memoriesProcessed: newMemories.length,
            insights: dreamResult.insights || '',
            purged,
          };
        } else {
          results[agentId] = { status: 'failed', reason: 'Could not parse dream output' };
        }
      } catch (e: any) {
        results[agentId] = { status: 'error', error: e.message };
      }
    }

    // Save last dream times to database
    await saveLastDreamTimes(lastDreamTimes);

    return NextResponse.json({
      ok: true,
      timestamp: now,
      forceAll,
      agentsProcessed: Object.keys(results).length,
      results,
    });
  } catch (error: any) {
    console.error('Dreaming Agent error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
