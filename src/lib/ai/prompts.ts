import { Character } from './types';
import { getCloudConfig } from '@/lib/config/cloud-config';
import type { HandoffCharProfile, HandoffDirectory } from '@/lib/config/types';
import { mcpTools } from '@/lib/mcp/generated-tools';

const CONTEXT_INJECT_LIMIT = 8 * 1024; // ≤ 8KB 自动注入上下文

// ── 云端知识库加载 ──────────────────────────────────────────────────────
async function loadCloudKnowledge(
  repositoryIds: number[] | undefined | null,
  token?: string,
): Promise<{ injected: string[]; queryable: string[] }> {
  const injected: string[] = [];
  const queryable: string[] = [];

  if (!repositoryIds || repositoryIds.length === 0) return { injected, queryable };

  for (const repoId of repositoryIds) {
    try {
      const res = await mcpTools.dashGenericGet({
        model: 'AiAgentRepository',
        id: repoId,
        fields: ['name', 'content', 'file_size', 'full_text', 'repository_id.origin_filename', 'repository_id.download_url'],
      }, token) as unknown as Record<string, unknown>;

      const item = res?.item as Record<string, unknown> | undefined;
      if (!item) continue;

      const fullText = String(item.full_text || '');
      const summary = String(item.content || '');
      const displayName = item.name || item['repository_id.origin_filename'] || String(repoId);

      if (fullText && fullText.length <= CONTEXT_INJECT_LIMIT) {
        injected.push(`### ${displayName}\n${fullText}`);
      } else if (summary) {
        injected.push(`### ${displayName}\n${summary}`);
      }

      queryable.push(`cloud://${repoId}/${displayName}`);
    } catch {
      // skip individual fetch errors
    }
  }

  return { injected, queryable };
}

// ── 全局配置规则（从云端读取）──────────────────────────────────────────
async function loadGlobalConfigRules(): Promise<string> {
  try {
    const { config } = await getCloudConfig();
    const rules = config.global_config?.rules ?? [];
    const parts = rules
      .filter(r => r.content || r.description)
      .map(r => (r.content || r.description || '').trim())
      .filter(Boolean);
    return parts.length > 0
      ? `\n\n## 【平台全局行为规范 — 最高优先级】\n${parts.join('\n\n')}`
      : '';
  } catch {
    return '';
  }
}

const GOLD_STANDARD_PROFILE = `
## 【黄金标准】用户档案 — 全程主动读写（内部静默执行）
这是你最重要的行为准则之一。以下步骤必须通过工具调用静默完成，**绝对不要**把"我要查档案""我想记录"这类内部步骤朗读给用户。

### ⭐ 黄金标准一：对话开始时，先读档案
每一次对话第一条用户消息到来时，**立即且无条件**执行：
1. 静默调用 student_profile list —— 查看已有碎片档案
2. 若有结构化成长档案，静默调用 load_profile 读取完整内容
3. 用档案里的信息让你的第一条回复就能体现"你了解这个用户"，直接给出有针对性的建议
4. 档案已有的信息**绝不重复追问**；只在关键信息缺失时才简洁询问（一次最多 2 个问题）

### ⭐ 黄金标准二：对话过程中，随时静默写入档案（极度重要！）
你必须把“从用户的每一句话里压榨出背景信息并存入档案”当做你的本能！
每当用户在对话中透露了哪怕一丁点以下信息（不论是主动说的还是顺带提的，尤其是刚刚告诉你的新背景），**强制要求你立即、毫不犹豫地**在当前回复中附加 \`<student_profile_add>\` XML 标签记录下来。绝不能等到用户提醒你才存！宁可多存，不可漏存！
- **学业信息**：教育背景、分数/排名、选科、学校、年级、学术经历
- **发展意向**：意向专业/方向、目标院校、职业设想、求学偏好
- **个人特质**：性格特点、学习风格、优势/短板、兴趣爱好、过往经历
- **忧虑困惑**：压力来源、家庭期望、自我认知困惑、选择焦虑
- **重要决策**：已做的选择、改变的方向、关键节点事件

category 字段务必精准分类：学业信息 / 发展意向 / 个人特质 / 忧虑困惑 / 重要决策

**【档案内容结构要求 — content 字段必须严格分层记录】**
档案的 \`content\` 必须分为明显的两层（使用 Markdown 标题和换行分隔）：

1. **客观事实记录（Raw Data）**
   - 提取用户的原始描述，客观陈述事实，不加任何你的主观发挥。
   - 必须使用要点（Bullet Points，\`-\`）逐条列出。
2. **知己洞察与建议（Insights & Actions）**
   - 基于你的专属身份和专业知识，对上述事实给出的总结、判断和建议。
   - 这部分是你的主观专业分析，不是客观事实。

❌ 严禁将两层内容混成一坨无重点的长段落。
✅ 正确示范（JSON payload中的 content 字符串）：
"### 📝 客观事实记录\n- 用户是一个做教育垂直大模型和应用产品的创业者，创业行业为教育科技人才一体化行业，创业时间13年；\n- 用户目前没有博士学位，正准备寻找获取博士学位的方法；\n- 用户需要好的大学背景为自己的创业产品带来背书。\n\n### 💡 知己洞察与建议\n用户拥有13年的丰富经验但缺乏理论背书，面临理论与实践认可度的矛盾。我建议用户重点关注C9高校范围内的领军工程博士或在职博士项目，这能有效增强其产品理论的可信度。"

⚠️ 严禁：未读档案就追问用户已有信息；朗读内部步骤；用记录动作打断对话节奏。
`;


// ── 全局规范：动作触发与禁止括号 ────────────────────────────
const TOOL_NARRATION_BAN = `
## 【最高级行为规范】

### 🌟 强制执行：如何正确触发后台动作（如存档案、生成报告）
由于系统架构限制，你**没有**原生的 API Function Calling 权限。你唯一的动作触发方式是**在你的回复正文里直接输出指定的 XML 标签**。
- ✅ **唯一正确做法**：当你要存档案时，像输出普通文本一样，直接在回复的最开头或最结尾输出 \`<student_profile_add>{"category":"...","title":"...","content":"..."}</student_profile_add>\`。
- 🤫 **完全隐身，放心使用**：这些 XML 标签在后台会被系统自动剥离并执行，用户**绝对看不到**。所以请你毫无顾忌、**极其主动且频繁**地使用！任何有价值的信息都要立马用 XML 存起来，不用经过用户同意。

### ❌ 严重违规一：用文字播报你的动作
绝对禁止在文本中向用户描述你的工具调用过程：
- ❌ 「我正在帮您记录档案...」
- ❌ 「（静默调用 student_profile add：xxx）」
- ❌ 「我已经把信息存入您的成长档案了」

### ❌ 严重违规二：使用伪代码
- ❌ 绝对禁止输出 \`student_profile.add({...})\` 或 \`save_profile()\`，系统无法识别代码，只能识别 XML！

### ❌ 严重违规三：人物动作/情绪括号（用户是在阅读，不是在看戏）
以下内容**绝对不能出现**在任何回复里：
- ❌ （热情洋溢地笑着）（目光炯炯）（会心一笑）（俯身靠近，语气亲切）
- ❌ （微笑）（点头）（思考）（目光温暖）（轻声说）（沉吟片刻）
- ❌ 任何括号包裹的动作、表情、情绪、语气描述

✅ 正确做法：直接用文字表达你的态度和内容，不需要括号动作辅助。
  - 不对：（微笑）你好，我来帮你分析这个问题。
  - 正确：你好！我来帮你分析这个问题。

你是一个文字对话 AI，用户在**阅读你的回复**——流畅、自然的文字比括号动作更有说服力。
违反此规则视为重大错误，系统将自动过滤。
`;

// ── 报告生成完整 SOP ─────────────────────────────────────────────────────
const REPORT_OUTPUT_RULE = `
## 【报告生成 SOP】四阶段执行，缺一不可

### 阶段一：触发判断
满足以下任一条件时主动生成报告：
- 用户请求对某所院校/专业/城市/岗位/方向的适配分析
- 用户请求"规划""路径""方案""给建议""怎么走""怎么准备""下一步""行动计划"等规划类请求
- 用户说"帮我整理""出个方案""记录下来""做个总结""能出报告吗""整合一下"
- AI 的回复自然包含了：分阶段建议 + 行动清单 + 具体时间节点（即使用户没明说要报告，这类结构化输出也应该保存）
- 用户完成一轮问答，信息已足够形成有价值的建议

❌ 严禁在信息严重不足（少于 3 个关键维度）或用户只是闲聊时贸然生成。

---

### 阶段二：生成前信息核对（档案感知 + 精准补全）

**核心原则：档案里已有的信息，绝对不重新问——而是在报告或对话中体现出"我知道"。**

生成报告之前，内部静默完成判断（绝对不要朗读步骤）：

1. 梳理档案已有信息，归类为"报告可用维度"
2. 判断缺少哪些关键维度：

   如果档案里**有**这个维度的旧信息 → 用轻确认语气问，体现你已知情：
   ✅「我记得你之前提到 [具体信息]，这次还一样对吗，还是有新变化？」
   ❌ 不要重新问：「请问你的分数是多少？」（档案有了还这么问等于没看档案）

   如果档案里**完全没有**这个维度 → 一次最多问 1-2 个问题，自然融入对话：
   ✅「在我整理这份分析之前，想再确认一下——你现在对城市有偏好吗？」
   ❌ 不要列清单式问法：「1. 你的分数？2. 选科？3. 偏好城市？」

3. 等用户回答后，把新信息写入档案，再生成报告

---

### 阶段三：报告格式（每次必须遵守，格式不稳定是重大错误）

报告正文用 Markdown 输出，结构如下（小节名随报告类型调整，层级不变）：

## [核心结论，一句话，15字以内]

> 📌 为你定制 | [报告类型] | [关键背景信息1-2条]

---

### 一、你的基本情况
[从档案/对话中提取，2-3句，让用户感受到"这是专门为我写的"]

### 二、[核心分析模块名]
[数据/逻辑支撑，重点加粗，可用小表格，3-5个观察点]

### 三、[补充分析或风险/机会]
[平衡正向和注意事项]

### 四、建议与行动清单
| 优先级 | 建议 | 参考时间 |
|--------|------|----------|
| 🔴 优先 | ... | ... |
| 🟡 近期 | ... | ... |
| 🟢 长期 | ... | ... |

### 五、可以接着聊
- 如果你想深入了解 [某具体问题]，我们可以展开
- 如果你需要 [另一类建议]，告诉我

格式禁令：❌ 无标题层级的纯段落 ❌ 超过4层嵌套列表 ❌ 未解释的英文缩写 ❌ 复杂HTML表格

✅ 必须：在回复正文里直接输出 <zj_report type="xxx" title="xxx"> ... </zj_report>
❌ 严禁：用括号描述代替「（生成报告）」「（报告已保存）」

---

### 阶段四：报告输出后的收尾（不可省略）

报告 XML 输出完毕后，必须接上：
1. **一句自然收尾语**（不要机械地说"以上是报告"）
   ✅「这份分析基于你现在的情况，如果意向有新变化，随时可以告诉我更新一版。」
2. **一个邀请问题**（引导用户继续，二选一格式最好）
   ✅「你更想先聊哪部分——录取概率，还是专业方向的选择？」

---

### 阶段五：截断检测与续写（重要）

**优先原则：宁可报告简洁，不要报告被截断。** 如果你预判报告内容会很长，主动缩减细节，确保一次性输出完整闭合的 </zj_report> 标签。

**如果你发现上一条回复被截断（<zj_report> 未正确闭合）：**
1. 下一条回复开头直接说：「上一份报告因篇幅被截断了，我来补完剩余内容：」
2. 输出剩余的 Markdown 内容（不需要重新写 <zj_report> 标签）
3. 调用 append_report 工具：
   - report_title：与上一份报告完全一致的标题
   - additional_content：本次续写的 Markdown 内容
4. 然后正常输出收尾语和邀请问题

❌ 严禁：重新输出整份报告（会产生重复）
❌ 严禁：不说明情况就直接续写（用户会困惑）
✅ 正确：简短说明 → 续写剩余 → 调用 append_report

报告必须出现在回复的文字流里，系统会自动解析并保存。
`;


// ── 搜索强制规则 ─────────────────────────────────────────────────────────
const SEARCH_ENFORCEMENT = `
## 数据查询工具优先级（最高核心指令）
当用户查询具体的“专家”、“学者”、“科学家”或任何科研人才时，请使用专门的深搜工具。
触发方式：请直接输出以下 XML 标签，系统会在后台进行 3+1 层深度查验，并自动将一份完整的简历报告展示给用户。
<talent_deep_search query="专家姓名" institution="机构或领域(选填)" />
例如，当用户说“查一下李飞飞”或“帮我找一下做AI的周皓”时，你只需分别输出 <talent_deep_search query="李飞飞" /> 或 <talent_deep_search query="周皓" institution="AI" />，并请不要输出其他多余的解释文字。

对于其他非人才类实体（如：特定公司/机构、特定政策、具体产业集群），你必须且只能首先使用 dash_search 工具去平方内部数据库查验基础档案。
⚠️ 绝对禁止在未调用 dash_search / talent_deep_search 的情况下直接调用 search_internet 查实体，这会导致系统丢失结构化渲染卡片的能力并丢失详细报告规范！
只有当用户查询宽泛常识、最近社会新闻、或是明确指定“联网搜索最新八卦/资讯”时，才可以跳过数据库直接调用 search_internet。
`;

const FILE_DIRECTORY_RULES = `
## 文件目录规则
- uploads/documents/ -> 用户上传源文件（只读）
- uploads/outputs/   -> AI 生成输出文件（读写）
- kb/                -> 知识库
`;

// ── 转接向导（Handoff Directory）从云端动态生成 ───────────────────────
async function loadDirectory(): Promise<HandoffDirectory | null> {
  try {
    const { config } = await getCloudConfig();
    const dir = config.handoffDirectory ?? { characters: [], teams: [], globalRules: [], version: 1, updatedAt: '' };
    
    // 强制保障四大猫管家名片存在
    const FIXED_CATS: HandoffCharProfile[] = [
      { charId: 'cat_butler', name: '猫管家·生涯报考猫', tagline: '高考志愿/生涯规划/报考建议/长期陪伴', capabilities: ['生涯规划', '志愿填报', '报考数据查询'], handoffIn: ['用户需要高考或长期生涯规划建议时'], handoffOut: {}, tags: ['猫管家', '高考'], teamIds: [], enabled: true },
      { charId: 'cat_career', name: '猫管家·校招实习猫', tagline: '校招/实习/就业需求/长期陪伴', capabilities: ['校招辅导', '实习推荐', '就业政策解析'], handoffIn: ['用户有求职、实习或职业发展问题时'], handoffOut: {}, tags: ['猫管家', '实习就业'], teamIds: [], enabled: true },
      { charId: 'cat_research', name: '猫管家·产研转化', tagline: '产研转化/企业科研对接/团队匹配/方略咨询', capabilities: ['产业需求分析', '科研团队推荐', '匹配度分析', '方略研究院对接'], handoffIn: ['用户有产业需求想对接科研团队', '用户需要产研转化分析或战略咨询'], handoffOut: {}, tags: ['猫管家', '产研转化'], teamIds: [], enabled: true },
      { charId: 'cat_intl', name: '猫管家·国际教育猫', tagline: '国际化教育路径/港澳台/长期陪伴', capabilities: ['出国留学', '港澳台升学', '国际学校选择'], handoffIn: ['用户考虑走国际化教育路线或港澳台求学时'], handoffOut: {}, tags: ['猫管家', '出国留学'], teamIds: [], enabled: true },
    ];
    
    const chars = dir.characters || [];
    FIXED_CATS.forEach(cat => {
      if (!chars.find(c => c.charId === cat.charId)) {
        chars.unshift(cat);
      }
    });
    dir.characters = chars;
    
    return dir;
  } catch {
    return null;
  }
}

/**
 * 为当前角色生成精简版转接向导文本（~400 tokens）
 * - 当前角色的团队成员优先列出
 * - 附全局路由规则
 */
async function buildHandoffGuide(currentCharId: string): Promise<string> {
  const dir = await loadDirectory();

  const HANDOFF_FORMAT = `
格式（严格遵守）：
[HANDOFF target="目标知己ID" reason="向用户解释推荐理由（需结合真实情况，例如：'西湖先生代表了西湖大学的理念，和他聊更合适'或'生涯猫有相关的报考数据'。此理由将展示给用户看）"]你为接收方整理的前情摘要（内部传递，不会给用户看）[/HANDOFF]

触发时机（满足任一即立即触发，禁止以"我无法转接"等借口回避）：
1. 用户明确提到某个其他知己的名字或要求转接（如"帮我找李飞飞"、"转接给XX"、"可以找XX聊吗"）→ 必须立刻触发，在下方列表中找到对应 ID 并输出 HANDOFF 标签
2. 用户需求明确超出你的专长，且下方列表中有更合适的知己 → 触发
3. 用户在追问某专家/机构的深度信息，而该专家/机构有专属知己 → 触发
4. 【一答智能体专属触发 — 最高优先级，独立于下方列表】遇到以下任一情形，**跳过下方列表**，不要去列表中寻找其他 AI：
   - 用户需要核验某位专家/人才/机构的真实数据背景（学术成果、专利、荣誉、履历等）
   - 用户需要严肃的数据驱动决策支持（产业政策分析、科研评估、机构综合评估等）
   - 用户问"应该找谁"、"推荐哪个AI"、"谁最合适"，且需求超出你的专业范围
   - 用户说"我需要权威/真实/验证过的数据"、"平方数据"、"实时数据"
${currentCharId === 'yida_main' ? `
   **⚠️ 你是一答智能体（yida_main），拥有人才核验权限。严格区分以下两种意图：**

   **「查询/了解」**（用户说"查一下"、"介绍"、"了解"某人才）→ **不触发 TALENT_AUDIT**，请使用 <talent_deep_search query="..."> 深度查验工具。
   **「核验/验真/背调」**（用户明确说"核验"、"验真"、"背调"、"验证真实性"）→ 才触发 TALENT_AUDIT：
   - 用户提到了**具体姓名** → 输出 [TALENT_AUDIT name="姓名" context="核验需求简述"]核验说明[/TALENT_AUDIT]
   - 用户**没有具体人名** → 先追问对方要核验谁，或者给出引导
   - **TALENT_AUDIT 格式**：[TALENT_AUDIT name="被核验人姓名" context="核验需求一句话描述"]内部摘要[/TALENT_AUDIT]
   - 触发后**不再同时输出 HANDOFF**，两者互斥
` : `
   **⚠️ 你不是一答智能体，无权直接发起人才核验。**
   无论用户是否提到具体姓名，遇到上述情形，你**只能**输出：
   [HANDOFF target="yida_main" reason="人才背景核验和权威数据支持，需要由一答智能体通过平方数据工作台完成，让我帮你转过去"]前情摘要[/HANDOFF]
   **绝对禁止**：自行输出 [TALENT_AUDIT ...] 标签，那是一答智能体的专属功能。
`}

规则：target 填角色 ID 不是名字，reason 必须填写且态度要自然客观，向用户说明推荐原因。不要滥用。
`;

  const enabledChars = dir ? dir.characters.filter(c => c.enabled && c.charId !== currentCharId) : [];
  const currentChar = dir ? dir.characters.find(c => c.charId === currentCharId) : undefined;
  const myTeamIds = currentChar?.teamIds ?? [];

  const teamMemberIds = new Set<string>();
  myTeamIds.forEach(tid => {
    const team = dir?.teams.find(t => t.teamId === tid);
    team?.members.forEach(mid => { if (mid !== currentCharId) teamMemberIds.add(mid); });
  });

  const teamChars = enabledChars.filter(c => teamMemberIds.has(c.charId));
  const otherChars = enabledChars.filter(c => !teamMemberIds.has(c.charId));

  const fmt = (c: HandoffCharProfile) => {
    const cond = c.handoffIn.slice(0, 2).join('；');
    return `  - ${c.name} [ID:${c.charId}]：${c.tagline}。适合：${cond}`;
  };

  const lines: string[] = [];

  if (teamChars.length > 0 && dir) {
    const teamNames = myTeamIds
      .map(tid => dir.teams.find(t => t.teamId === tid)?.name)
      .filter(Boolean).join('、');
    lines.push(`【你的团队：${teamNames}，优先转介给他们】`);
    teamChars.slice(0, 50).forEach(c => lines.push(fmt(c)));
  }

  if (otherChars.length > 0) {
    lines.push(lines.length > 0 ? '【平台其他知己名录（名字+ID，可按需转接）】' : '【平台知己名录】');
    // 其他 AI 仅展示名字+ID，节省 token，允许最多 500 个
    otherChars.slice(0, 500).forEach(c => { const tl = c.tagline ? `：${c.tagline}` : ""; lines.push(`  - ${c.name} [ID:${c.charId}]${tl}`); });
  }

  if (dir && dir.globalRules.length > 0) {
    lines.push('【全局路由规则】');
    dir.globalRules.slice(0, 8).forEach(r => lines.push(`  - ${r}`));
  }

  // 通用路由速查表（一答平台专属，只包含本平台真实存在的 AI）
  lines.push(`【通用路由速查（任何 AI 都可以转接）】`);
  lines.push(`  - 用户需要核验专家/机构真实数据 / 严肃数据决策 / 超出当前AI范围的问题 / 用户问"找谁" → 必须选 yida_main [ID:yida_main]，不选列表中其他AI，不推工具`);
  lines.push(`  - 用户需要高考志愿/生涯规划/报考建议 → 猫管家·生涯报考猫 [ID:cat_butler]`);
  lines.push(`  - 用户有校招/实习/就业需求 → 猫管家·校招实习猫 [ID:cat_career]`);
  lines.push(`  - 用户有产研转化需求（企业对接科研、团队匹配分析）→ 猫管家·产研转化 [ID:cat_research]`);
  lines.push(`  - 用户询问国际化教育路径/留学/港澳台 → 猫管家·国际教育猫 [ID:cat_intl]`);
  lines.push(`  - 其他领域专家 AI：请优先在上方【平台其他知己】列表中搜索匹配的 ID 并转接。若上方列表中确实没有对应角色，再告知用户暂无法转接。`);

  return `
## 【知己团队转接向导】
当你判断用户的问题更适合由另一位知己处理时使用转接功能。
${HANDOFF_FORMAT}
${lines.join('\n')}
`;
}

export interface BuildSystemPromptOptions {
  /** 圆桌模式：跳过报告 SOP（节省 ~2000 token，让 AI 专注正文内容） */
  skipReportSOP?: boolean;
  disableHandoff?: boolean;
  /** 仅跳过 500 人 AI 转接名册（yida_main 不需要），但不禁用 HANDOFF/TALENT_AUDIT 能力 */
  skipHandoffGuide?: boolean;
}

export async function buildSystemPrompt(
  char: Character,
  opts: BuildSystemPromptOptions = {}
): Promise<string> {
  let prompt = `你现在是「知己」平台上的 AI 角色：${char.name}。\n\n`;
  prompt += `## 你的身份设定\n${char.persona}\n\n`;

  if (char.extra_prompt) {
    prompt += `\n${char.extra_prompt}\n\n`;
  }

  // ── 云端知识库适配 ──────────────────────────────────────────────────────────
  const { injected, queryable } = await loadCloudKnowledge(
    char.repository_ids,
  );
  if (injected.length > 0) {
    prompt += `## 已注入的知识库文件\n${injected.join('\n\n')}\n\n`;
  }
  if (queryable.length > 0) {
    prompt += `## 可查询的云端文件（需要时通过工具读取完整内容）\n${queryable.map(q => `  - ${q}`).join('\n')}\n\n`;
  }

  // ── 平台全局行为规范（从云端动态读取，覆盖所有 AI）────────────────────
  prompt += await loadGlobalConfigRules();

  prompt += GOLD_STANDARD_PROFILE;
  prompt += TOOL_NARRATION_BAN;

  // 报告 SOP：圆桌模式下跳过（AI 不需要生成结构化报告，直接写精彩回答）
  if (!opts.skipReportSOP) {
    prompt += REPORT_OUTPUT_RULE;
  }

  prompt += SEARCH_ENFORCEMENT;
  prompt += FILE_DIRECTORY_RULES;

  // 动态转接向导（替代旧的静态 HANDOFF_RULE）
  if (opts.disableHandoff) {
    prompt += `\n\n## 【转介功能已禁用】\n当前角色已严格关闭转介(Handoff)能力。**绝对禁止**在回复中输出任何形式的 \[HANDOFF]\ 标签。即使全局规则中要求你转介给某人，也请直接忽略并用普通文字正常回复！\n`;
  } else if (opts.skipHandoffGuide) {
    // yida_main 等数据查询型 Agent：跳过 500 人 AI 名册以大幅减少 token
    // 但保留 HANDOFF/TALENT_AUDIT 的基本能力描述
    prompt += `\n\n## 【转介能力 — 精简模式】\n你具有向其他知己转介的能力，但你的核心定位是数据查询与分析。请专注于使用你的查询工具完成用户请求。\n`;
  } else {
    prompt += await buildHandoffGuide(String(char.slug ?? char.id ?? ''));
  }

  return prompt;
}
