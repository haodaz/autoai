import { loadAgentConfig, loadAgentContext } from '@/lib/bristh-config';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';
import { getAgentTools, executeAgentTool } from '@/lib/agent-tools';

// ============================================
// /api/chat/agent — 1v1 Agent Chat (SSE stream)
// Mirrors the proven pattern from /api/chat/external
// ============================================

export const maxDuration = 60; // Vercel function timeout

export async function POST(req: Request) {
  try {
    const { agentId, messages } = await req.json();

    if (!agentId) {
      return new Response(JSON.stringify({ error: 'Missing agentId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Load agent config & context
    const config = await loadAgentConfig(agentId);
    if (!config) {
      return new Response(JSON.stringify({ error: `Agent "${agentId}" not found` }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const privateContext = await loadAgentContext(agentId);

    // 2. Build system prompt
    let systemPrompt = config.persona || `You are ${config.name}, an AI assistant at Bristh Enrollment Partners.`;
    systemPrompt += `\n\nYour name is ${config.name}, your title is "${config.title}".`;
    systemPrompt += `\nYou are in 1-on-1 chat mode with a user. Be helpful, conversational, and professional.`;
    systemPrompt += `\nWhen the user asks you to perform a concrete task (generate PPT, create calendar, draft email), use the appropriate tool.`;
    systemPrompt += `\nWhen answering knowledge-related questions, use the searchKnowledgeBase tool if needed.`;
    systemPrompt += `\nAlways respond in the same language the user uses (Chinese or English).`;

    if (privateContext) {
      systemPrompt += `\n\nAgent-specific reference knowledge:\n${privateContext}`;
    }

    // 3. Get tools for this agent
    const tools = getAgentTools(agentId);

    // 4. Get model client
    const { client, config: modelConfig } = await getModelClient();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const emit = (type: string, payload: Record<string, unknown> = {}) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`));
          } catch { /* controller may be closed */ }
        };

        try {
          // Build full message history
          const fullMessages: any[] = [
            { role: 'system', content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
          ];

          let loopCount = 0;
          const MAX_TOOL_LOOPS = 3;

          while (loopCount < MAX_TOOL_LOOPS) {
            loopCount++;

            // Stream LLM response
            const result = await streamCompletion(
              client,
              modelConfig,
              fullMessages,
              tools,
              (token) => emit('delta', { content: token }),
            );

            // No tool calls — we're done
            if (!result.tool_calls || result.tool_calls.length === 0) {
              break;
            }

            // Tool calls detected — execute them
            emit('reset');

            // Add assistant message with tool_calls
            fullMessages.push({
              role: 'assistant',
              content: result.content || '',
              tool_calls: result.tool_calls,
            });

            // Execute each tool
            for (const tc of result.tool_calls) {
              const toolName = tc.function.name;
              let args: Record<string, any>;
              try {
                args = JSON.parse(tc.function.arguments);
              } catch {
                args = {};
              }

              emit('tool_start', { taskId: tc.id, taskName: toolName });
              emit('tool_log', { taskId: tc.id, message: `正在执行 ${toolName}...` });

              try {
                const { result: toolResult, uiPayload } = await executeAgentTool(toolName, args);

                emit('tool_log', { taskId: tc.id, message: `✅ ${toolName} 执行完成` });
                emit('tool_end', { taskId: tc.id, status: 'success', uiPayload });

                fullMessages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: toolName,
                  content: JSON.stringify(toolResult),
                });
              } catch (err: any) {
                emit('tool_log', { taskId: tc.id, message: `❌ ${toolName} 执行失败: ${err.message}` });
                emit('tool_end', { taskId: tc.id, status: 'error' });

                fullMessages.push({
                  role: 'tool',
                  tool_call_id: tc.id,
                  name: toolName,
                  content: JSON.stringify({ error: err.message }),
                });
              }
            }
          }

          emit('final', { content: '', skip_overwrite: true });
        } catch (err: any) {
          console.error('[chat/agent] Error:', err);
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
    console.error('[chat/agent] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Generic streaming completion using model-registry ───────────────────────

async function streamCompletion(
  client: any,
  modelConfig: any,
  messages: any[],
  tools: any[],
  onToken: (token: string) => void,
): Promise<{ content: string; tool_calls?: any[] }> {
  // Build params using existing model-registry helper
  const params = buildCompletionParams(modelConfig, messages);
  params.stream = true;
  params.tools = tools;

  const response = await client.chat.completions.create(params);

  let assistantMessage = '';
  let toolCalls: any[] = [];

  for await (const chunk of response) {
    const choice = chunk.choices?.[0];
    if (!choice) continue;

    const delta = choice.delta;

    // Text content
    if (delta?.content) {
      assistantMessage += delta.content;
      onToken(delta.content);
    }

    // Tool calls (streamed incrementally)
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
  }

  return {
    content: assistantMessage,
    tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
  };
}
