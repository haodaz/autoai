/**
 * Bootstrap script: Write initial memory entries for all agents
 * based on accumulated knowledge from user interactions.
 * 
 * Run once: npx tsx scripts/seed-memories.ts
 */

const SEED_MEMORIES: Record<string, { type: string; source: string; content: string; importance: number }[]> = {
  alice: [
    { type: 'user_preference', source: 'user', content: '署名统一使用 "BEP office AI team"，不用个人名字署名', importance: 0.9 },
    { type: 'user_preference', source: 'user', content: '文档默认使用中文撰写', importance: 0.8 },
    { type: 'lesson_learned', source: 'self', content: '中英双语任务中不要翻译人名和学校名，保持原文', importance: 0.85 },
    { type: 'lesson_learned', source: 'self', content: '方案格式应为：先背景 → 再方案 → 最后时间表，确保前3段包含核心要点方便 Edda 提取', importance: 0.8 },
    { type: 'task_summary', source: 'self', content: '擅长撰写结构清晰的商业方案和招生策划，英国教育市场任务可参考 Myddelton College 和 Bournemouth 案例', importance: 0.7 },
    { type: 'lesson_learned', source: 'self', content: '产出通常会传给 Edda 做 PPT 和 Grace 发邮件，需确保关键信息在开头', importance: 0.75 },
  ],
  bob: [
    { type: 'task_summary', source: 'self', content: '负责 CRM 数据处理和客户管理相关任务', importance: 0.6 },
    { type: 'lesson_learned', source: 'self', content: '处理客户数据时注意数据隐私合规', importance: 0.7 },
  ],
  david: [
    { type: 'task_summary', source: 'self', content: '负责合同审查和合规文档审核', importance: 0.7 },
    { type: 'lesson_learned', source: 'self', content: '审查产出通常传给 Fiona 做通报 Memo', importance: 0.65 },
    { type: 'user_preference', source: 'user', content: '合规审查要细致，宁多勿少', importance: 0.8 },
  ],
  edda: [
    { type: 'lesson_learned', source: 'self', content: 'PPT 生成时 JSON 嵌套引号转义容易出错，需要特别检查', importance: 0.85 },
    { type: 'lesson_learned', source: 'self', content: '执行时间较长（GPT-4o JSON 输出慢），上游完成后才应开始，避免被 Grace 抢先发送', importance: 0.9 },
    { type: 'task_summary', source: 'self', content: '专注 PPT 幻灯片生成，使用 pptxgenjs 库，支持图表和数据可视化', importance: 0.7 },
    { type: 'user_preference', source: 'user', content: 'PPT 风格要专业简洁，使用公司品牌色', importance: 0.75 },
  ],
  eric: [
    { type: 'task_summary', source: 'self', content: '负责社交媒体内容和市场推广文案撰写', importance: 0.6 },
  ],
  fiona: [
    { type: 'task_summary', source: 'self', content: '负责内部通报 Memo 和行政文件', importance: 0.6 },
    { type: 'lesson_learned', source: 'self', content: '通常接收 David 审查结果后生成通报', importance: 0.65 },
  ],
  grace: [
    { type: 'lesson_learned', source: 'self', content: '必须等所有上游 Agent（特别是 Edda）完成后再发送邮件，之前出过 Edda 还在执行就提前发出的问题', importance: 0.95 },
    { type: 'user_preference', source: 'user', content: '邮件应使用英文正式格式', importance: 0.85 },
    { type: 'user_preference', source: 'user', content: '署名使用 BEP office AI team', importance: 0.9 },
    { type: 'task_summary', source: 'self', content: '负责邮件分发，通常是管线的最后一环（最高 depth）', importance: 0.7 },
  ],
  hugo: [
    { type: 'task_summary', source: 'self', content: '专注财务数据分析，包括 ROI、预算、成本收益分析', importance: 0.7 },
    { type: 'lesson_learned', source: 'self', content: '财务分析结果通常传给 Edda 生成含图表的 PPT', importance: 0.75 },
    { type: 'user_preference', source: 'user', content: '财务数据要准确，使用实际数字而非估算', importance: 0.85 },
  ],
  iris: [
    { type: 'task_summary', source: 'self', content: '负责生成多页 HTML 营销网站，使用 Tailwind CSS，产出可发布到 /sites/slug', importance: 0.7 },
    { type: 'user_preference', source: 'user', content: '网页应包含图片占位符，用户可手动替换', importance: 0.8 },
    { type: 'lesson_learned', source: 'self', content: '适用场景：市场宣传页、招生画册、品牌官网。站点自动发布后链接可传给 Grace 发邮件', importance: 0.75 },
  ],
};

async function seedMemories() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5859';
  
  for (const [agentId, memories] of Object.entries(SEED_MEMORIES)) {
    console.log(`\n📝 Writing ${memories.length} memories for ${agentId}...`);
    
    for (const mem of memories) {
      try {
        const res = await fetch(`${baseUrl}/api/memory/write`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId, ...mem }),
        });
        const data = await res.json();
        if (data.ok) {
          console.log(`  ✅ [${mem.type}] ${mem.content.slice(0, 50)}...`);
        } else {
          console.log(`  ❌ ${data.error}`);
        }
      } catch (e: any) {
        console.log(`  ❌ ${e.message}`);
      }
    }
  }
  
  console.log('\n\n🧠 Triggering Dreaming Agent...');
  try {
    const res = await fetch(`${baseUrl}/api/cron/dreaming`);
    const data = await res.json();
    console.log('Dreaming result:', JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.log('Dreaming error:', e.message);
  }
  
  console.log('\n✅ Done!');
}

seedMemories();
