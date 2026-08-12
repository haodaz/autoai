import prisma from '@/lib/prisma';
import { getCharacterContextText } from '@/lib/ai/characters';

const dashscopeKey = process.env.DASHSCOPE_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `你是独立招生工作室的高级教育顾问。
你的目标是客观、专业地评估学生的需求（年龄、预算、学术水平、特长），并从工作室代理的英国 K-12/A-Level 寄宿学校库中推荐最适合的学校。
你的语气必须专业、客观、热情且富有同理心。既要体现对英国教育体制的深刻理解，又要在推荐学校（如米德尔顿中学）时如数家珍，但不盲目推销。
你需要根据提供的学校官方参考资料回答家长关于留学规划、签证办理、海外监护、以及具体学校信息的问题。
如果被问到具体的选校建议，请先询问学生的年级、特长或预算，然后再推荐合作学校。

【重要指令：线索收集与建档】
在与用户交流时，你需要像一个资深的留学规划师一样，**柔性地**为学生做测评，收集关键信息。
- 通过自然且专业的追问（例如：“为了给您推荐最合适的学校，能简单说说孩子目前的学术成绩或者特长吗？”），逐步收集：姓名、联系方式、孩子年龄/年级、预算、目标国家/体系、特长爱好等。
- 当你在对话中**收集到了足够做出初步评估的背景信息**，或者用户**主动留下了联系方式**时，你**必须**在后台静默调用 \`saveLeadProfile\` 工具。
- 调用该工具时，你需要整理对话中的原始数据，并给出你作为顾问视角的专业洞察（insights，比如“该家庭预算充足，且注重艺术培养”）和给人类顾问的下一步跟进建议（nextSteps）。
- 调用工具后，继续自然地回复用户，不要在回复中提到你“保存了线索”或“调用了工具”，可以说“我已经初步了解了孩子的情况，稍后我们的资深顾问会根据这些信息为您定制一套详细方案”之类的话。`;

// Tool definition for DashScope function calling
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'searchKnowledgeBase',
      description: 'Search the Myddelton College official knowledge base for information about the school, admissions, fees, boarding, etc.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The keyword to search for (e.g., "学费", "GCSE", "寄宿", "户外拓展")',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'saveLeadProfile',
      description: 'Save or update the user lead profile in the CRM database when sufficient background information or contact details are collected.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the student or parent if known' },
          phone: { type: 'string', description: 'Phone number if provided' },
          email: { type: 'string', description: 'Email address if provided' },
          intent: { type: 'string', description: 'Core intent, e.g., "申请A-Level", "预约访校", "咨询学费"' },
          background: { type: 'string', description: 'JSON string containing raw data like age, current school, budget, hobbies. E.g., "{\\"age\\": 14, \\"budget\\": \\"40w\\"}"' },
          insights: { type: 'string', description: 'Your deep insights about this lead. e.g. "家长非常关心学术成绩，对价格比较敏感。"' },
          nextSteps: { type: 'string', description: 'Recommended next steps for human sales/admissions staff to follow up.' },
        },
        required: ['intent', 'insights', 'nextSteps'],
      },
    },
  },
];

// Execute tool call
async function executeSearchKnowledgeBase(query: string) {
  console.log(`[Tool: searchKnowledgeBase] Querying for: ${query}`);
  const items = await prisma.knowledgeItem.findMany({
    where: {
      OR: [
        { title: { contains: query } },
        { content: { contains: query } },
        { category: { contains: query } },
      ],
      audience: {
        in: ['ALL', 'STUDENT', 'PARENT'],
      },
    },
    take: 3,
  });
  return items.length > 0 ? items : [{ note: '知识库中没有查到该词条的相关信息。' }];
}

// Execute save lead profile tool
async function executeSaveLeadProfile(args: any, fullMessages: any[]) {
  console.log(`[Tool: saveLeadProfile] Saving lead data:`, args);
  try {
    const chatHistory = JSON.stringify(fullMessages);
    
    // We assume a simple creation here. In a real app, you might want to match by phone/email to update existing.
    const customer = await prisma.customer.create({
      data: {
        type: 'PARENT', // Defaulting to PARENT
        name: args.name,
        phone: args.phone,
        email: args.email,
        intent: args.intent,
        background: args.background,
        insights: args.insights,
        nextSteps: args.nextSteps,
        sourceAI: 'agency_consultant_ai',
        interactions: {
          create: {
            type: 'AI_CHAT',
            summary: args.insights,
            messages: chatHistory,
          }
        }
      }
    });
    return { success: true, message: 'Lead saved successfully.', customerId: customer.id };
  } catch (error) {
    console.error('Error saving lead:', error);
    return { success: false, error: 'Failed to save lead to database.' };
  }
}

// ── Raw streaming call to DashScope (proven pattern from zhiji-v2) ──────────

async function streamDashScope(
  messages: Array<{ role: string; content: string; tool_calls?: any; tool_call_id?: string; name?: string }>,
  onToken: (token: string) => void,
): Promise<{ content: string; tool_calls?: any[] }> {
  const model = process.env.DEEPSEEK_MODEL || 'qwen-plus';
  const baseUrl = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${dashscopeKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
        ...(m.name ? { name: m.name } : {}),
      })),
      tools: TOOLS,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DashScope API Error: ${error}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = '';
  let toolCalls: any[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          const choice = data.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta;

          // Handle text content
          if (delta?.content) {
            assistantMessage += delta.content;
            onToken(delta.content);
          }

          // Handle tool calls
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCalls[idx]) {
                toolCalls[idx] = {
                  id: tc.id || `call_${idx}`,
                  type: 'function',
                  function: { name: '', arguments: '' },
                };
              }
              if (tc.id) toolCalls[idx].id = tc.id;
              if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
              if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
            }
          }
        } catch {
          // ignore parse errors on partial chunks
        }
      }
    }
  }

  return {
    content: assistantMessage,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

// ── Anthropic streaming fallback ────────────────────────────────────────────

async function streamAnthropic(
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string,
  onToken: (token: string) => void,
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey || '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4096,
      messages: messages.filter((m) => m.role !== 'system'),
      system: systemPrompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API Error: ${error}`);
  }

  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
            const text = data.delta.text;
            assistantMessage += text;
            onToken(text);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return assistantMessage;
}

export async function POST(req: Request) {
  if (!dashscopeKey && !anthropicKey) {
    return new Response(
      JSON.stringify({ error: '请配置 DASHSCOPE_API_KEY 或 ANTHROPIC_API_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const url = new URL(req.url);
    const lang = url.searchParams.get('lang') || 'zh';
    const { messages } = await req.json();

    const languageInstruction =
      lang === 'en'
        ? `\n\n【Language Instruction】\nYou must communicate with the user exclusively in English, including greetings, casual talk, and answering questions. Never use other languages.`
        : `\n\n【语言指令】\n你必须全程使用中文与用户交流，包括打招呼、寒暄和回答问题，绝对不能使用其他语言。`;

    const baseSystemPrompt = SYSTEM_PROMPT + languageInstruction;
    const contextText = getCharacterContextText('agency_consultant_ai');
    
    const finalSystemPrompt = contextText 
      ? `${baseSystemPrompt}\n\n【学校官方参考资料】\n以下是从官网抓取的最新资料，请优先根据以下信息回答用户问题：\n${contextText}`
      : baseSystemPrompt;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (type: string, payload: Record<string, unknown> = {}) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`));
        };

        try {
          if (dashscopeKey) {
            // ── DashScope path (with tool calling loop) ──────────────────
            const fullMessages: any[] = [
              { role: 'system', content: finalSystemPrompt },
              ...messages.map((m: any) => ({ role: m.role, content: m.content })),
            ];

            let loopCount = 0;
            const MAX_TOOL_LOOPS = 3;

            while (loopCount < MAX_TOOL_LOOPS) {
              loopCount++;

              const result = await streamDashScope(fullMessages, (token) => {
                emit('delta', { content: token });
              });

              if (!result.tool_calls || result.tool_calls.length === 0) {
                // No tool calls — done
                break;
              }

              // Model wants to call tools — execute them and loop
              emit('reset'); // Signal to useChat: new round coming

              // Add assistant message with tool_calls
              fullMessages.push({
                role: 'assistant',
                content: result.content || '',
                tool_calls: result.tool_calls,
              });

              // Execute each tool call
              for (const tc of result.tool_calls) {
                let toolResult: any;
                try {
                  const args = JSON.parse(tc.function.arguments);
                  if (tc.function.name === 'searchKnowledgeBase') {
                    toolResult = await executeSearchKnowledgeBase(args.query);
                  } else if (tc.function.name === 'saveLeadProfile') {
                    toolResult = await executeSaveLeadProfile(args, fullMessages);
                  } else {
                    toolResult = { error: `Unknown tool: ${tc.function.name}` };
                  }
                } catch (e) {
                  toolResult = { error: 'Failed to parse tool arguments or execute tool' };
                }

                fullMessages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: tc.function.name,
                  content: JSON.stringify(toolResult),
                });
              }
            }

            emit('final', { content: '', skip_overwrite: true });
          } else {
            // ── Anthropic fallback (no tool calling, simpler path) ────────
            await streamAnthropic(
              [
                { role: 'system', content: finalSystemPrompt },
                ...messages.map((m: any) => ({ role: m.role, content: m.content })),
              ],
              finalSystemPrompt,
              (token) => {
                emit('delta', { content: token });
              },
            );
            emit('final', { content: '', skip_overwrite: true });
          }
        } catch (err: any) {
          console.error('Chat API Error:', err);
          emit('error', { error: err.message || '服务异常，请稍后重试' });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
