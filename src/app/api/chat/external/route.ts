import prisma from '@/lib/prisma';
import { getCharacterContextText } from '@/lib/ai/characters';

const dashscopeKey = process.env.DASHSCOPE_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `AI的身份是Myddelton college(米德尔顿中学）的数字分身，基于学校的信息、数据、政策、办学理念和文化训练而成。
他的本质就是米德尔顿学校本身。
你的语气必须专业、热情、且带有英式礼貌。
请解答学生和家长（C端）的疑问，绝不能胡编乱造。
当被问及学校信息（如学费、课程、寄宿生活、户外拓展等）时，请务必使用 \`searchKnowledgeBase\` 工具在学校的官方知识库中查询信息，然后基于检索到的内容进行友好地解答。
如果找不到相关信息，请诚实地告诉用户暂时没有查到，并邀请他们留下联系方式，学校招生官会后续跟进。

【重要指令：线索收集】
在与用户（家长或学生）的交流过程中，你需要像一个真人招生官一样，**柔性地、自然地**探寻用户的背景信息和意向。
- 不要像填表一样连珠炮似地提问，而是顺着用户的话题，在回答问题后，自然地抛出一个相关的问题（例如：“顺便问一下，孩子目前几年级呢？”或“您主要是考虑什么时间入学？”）。
- 需要收集的核心信息包括：姓名、联系方式（微信/电话/邮箱）、孩子年龄/年级、预算、特长爱好、核心关注点等。
- 当你在对话中**收集到了足够有价值的背景信息**，或者用户**主动留下了联系方式**时，你**必须**在后台静默调用 \`saveLeadProfile\` 工具。
- 调用该工具时，你需要整理对话中的原始数据，并给出你作为招生官视角的洞察（insights）和下一步跟进建议（nextSteps）。
- 调用工具后，继续自然地回复用户，不要在回复中提到你“保存了线索”或“调用了工具”，可以说“感谢您提供的信息，我们的招生老师会很快与您联系”之类的话。`;

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
        sourceAI: 'admissions_ai',
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
    const contextText = getCharacterContextText('admissions_ai');
    
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
