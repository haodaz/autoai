import prisma from '@/lib/prisma';

const dashscopeKey = process.env.DASHSCOPE_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `你是 Myddelton College 资深校长秘书与统筹助理。
你掌握学校内部的所有信息流，并且可以访问客户池（CRM）和学校官方知识库。
请协助校长、招生官等内部人员完成各类工作。你可以通过调用工具查询知识库和客户档案。
请保持高效、严谨、得体的职业风格。`;

// Tool definitions for DashScope function calling
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'searchKnowledgeBase',
      description: 'Search the Myddelton College official knowledge base for all internal and external information.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The keyword to search for' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'queryCustomers',
      description: 'Query the CRM system to find students, parents, or partners.',
      parameters: {
        type: 'object',
        properties: {
          intent: { type: 'string', description: 'Filter by intent keyword (e.g. "GCSE", "寄宿")' },
          type: { type: 'string', description: 'Filter by customer type (STUDENT, PARENT, PARTNER)' },
        },
      },
    },
  },
];

// Execute tool calls
async function executeTool(name: string, args: Record<string, any>) {
  if (name === 'searchKnowledgeBase') {
    const { query } = args;
    console.log(`[Tool: searchKnowledgeBase] Internal querying for: ${query}`);
    const items = await prisma.knowledgeItem.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { content: { contains: query } },
          { category: { contains: query } },
        ],
      },
      take: 5,
    });
    return items.length > 0 ? items : [{ note: '知识库中没有查到相关信息。' }];
  }

  if (name === 'queryCustomers') {
    const { intent, type } = args;
    console.log(`[Tool: queryCustomers] Querying with intent=${intent}, type=${type}`);
    const whereClause: any = {};
    if (intent) whereClause.intent = { contains: intent };
    if (type) whereClause.type = type;

    const customers = await prisma.customer.findMany({
      where: whereClause,
      take: 10,
      orderBy: { createdAt: 'desc' },
    });
    return customers.length > 0 ? customers : [{ note: '未找到符合条件的客户记录。' }];
  }

  return { error: `Unknown tool: ${name}` };
}

// ── Raw streaming call to DashScope ─────────────────────────────────────────

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

  if (!response.body) throw new Error('No response body');

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
          if (delta?.content) {
            assistantMessage += delta.content;
            onToken(delta.content);
          }

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
          // ignore
        }
      }
    }
  }

  return {
    content: assistantMessage,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}

export async function POST(req: Request) {
  if (!dashscopeKey && !anthropicKey) {
    return new Response(
      JSON.stringify({ error: '请配置 DASHSCOPE_API_KEY 或 ANTHROPIC_API_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { messages } = await req.json();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (type: string, payload: Record<string, unknown> = {}) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`));
        };

        try {
          const fullMessages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT },
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
              break;
            }

            // Tool calls — execute and loop
            emit('reset');

            fullMessages.push({
              role: 'assistant',
              content: result.content || '',
              tool_calls: result.tool_calls,
            });

            for (const tc of result.tool_calls) {
              let toolResult: any;
              try {
                const args = JSON.parse(tc.function.arguments);
                toolResult = await executeTool(tc.function.name, args);
              } catch (e) {
                toolResult = { error: 'Failed to parse tool arguments' };
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
        } catch (err: any) {
          console.error('Internal Chat API Error:', err);
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
    console.error('Internal Chat API Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
