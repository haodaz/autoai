import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getModelClient, buildCompletionParams } from '@/lib/model-registry';
import { ALL_AGENTS } from '@/lib/bristh-config';

// Convert Next.js App Router Request to a readable stream for SSE
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message, locale = 'zh' } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const chat = await prisma.groupChat.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

    // 1. Save User Message
    const userMsg = await prisma.groupChatMessage.create({
      data: {
        groupChatId: id,
        senderId: 'USER',
        role: 'user',
        content: message
      }
    });

    // 2. Identify responding agents
    const participants = chat.participants.map(p => p.agentId).filter(id => id !== 'USER');
    const mentionMatches = [...message.matchAll(/@([^\s@，。！？,.!?《》【】、]+)/g)];
    const mentionedNames = mentionMatches.map(m => m[1].trim().toLowerCase());
    
    let respondingAgentIds = participants;
    if (mentionedNames.length > 0) {
      const filtered = participants.filter(agentId => {
        const config = ALL_AGENTS.find(a => a.id === agentId);
        if (!config) return false;
        return mentionedNames.some(n => 
          config.name.toLowerCase().includes(n) || 
          config.id.toLowerCase().includes(n) ||
          config.role.toLowerCase().includes(n)
        );
      });
      if (filtered.length > 0) respondingAgentIds = filtered;
    }

    if (respondingAgentIds.length === 0) {
      return NextResponse.json({ success: true, agentsResponded: 0 });
    }

    // Prepare streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', data: userMsg })}\n\n`));

          const currentRoundResponses: { agentId: string, name: string, content: string }[] = [];

          for (let i = 0; i < respondingAgentIds.length; i++) {
            const agentId = respondingAgentIds[i];
            const agentConfig = ALL_AGENTS.find(a => a.id === agentId);
            if (!agentConfig) continue;

            const isFirst = i === 0;

            // Notify UI that this agent is thinking/starting
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'agent_start', 
              data: { agentId, name: agentConfig.name } 
            })}\n\n`));

            // Fetch history up to this point
            const history = await prisma.groupChatMessage.findMany({
              where: { groupChatId: id },
              orderBy: { createdAt: 'asc' }
            });

            // Build messages for LLM
            const messagesForLLM: {role: string, content: string}[] = [];
            
            // Add system prompt
            const languagePrompt = locale === 'en' ? 'Respond in English.' : '用中文回复。';
            const executionPrompt = `If the user requests you to perform a specific action (like generating a presentation, drafting a document, or sending an email) that requires execution, you MUST ask for confirmation first. Do not just output the document directly if it's supposed to be an execution task. Say something like: "I understand you want me to [Action]. Please confirm and I will execute it."`;
            const critiquePrompt = `You are participating in a group chat with the user and other AI colleagues. 
Be highly professional and stay strictly in your character's role (${agentConfig.role}). 
You can agree or disagree with other colleagues based on your professional background. Do not argue pointlessly, but if a colleague suggests something that violates your professional domain (e.g. legal risks, high costs, bad scheduling), you should politely but firmly point it out.
Keep your responses concise, conversational, and fit for a group chat (1-2 short paragraphs).`;

            messagesForLLM.push({ 
              role: 'system', 
              content: `${agentConfig.persona}\n\n${languagePrompt}\n\n${executionPrompt}\n\n${critiquePrompt}` 
            });

            // Add history (limit to last 20 messages to save context)
            const recentHistory = history.slice(-20);
            for (const h of recentHistory) {
              if (h.role === 'user') {
                messagesForLLM.push({ role: 'user', content: h.content });
              } else if (h.role === 'ai') {
                if (h.senderId === agentId) {
                  messagesForLLM.push({ role: 'assistant', content: h.content });
                } else {
                  const colleague = ALL_AGENTS.find(a => a.id === h.senderId);
                  const cName = colleague ? colleague.name : 'A colleague';
                  messagesForLLM.push({ role: 'user', content: `[${cName}]: ${h.content}` });
                }
              }
            }

            // Append current round context if not first
            if (!isFirst && currentRoundResponses.length > 0) {
              const transcript = currentRoundResponses
                .map(r => `[${r.name}]: ${r.content}`)
                .join('\n\n');
              
              const lastMsg = messagesForLLM[messagesForLLM.length - 1];
              if (lastMsg && lastMsg.role === 'user') {
                 lastMsg.content += `\n\n--- Earlier in this turn ---\n${transcript}\n\nBased on your role, please provide your thoughts. You can comment on your colleagues' inputs.`;
              }
            }

            // Stream response
            const { client, config } = await getModelClient();
            const responseStream = await client.chat.completions.create(
              buildCompletionParams(config, messagesForLLM, { maxTokens: 1024, stream: true })
            );

            let fullContent = '';
            for await (const chunk of responseStream) {
              const text = chunk.choices[0]?.delta?.content || '';
              if (text) {
                fullContent += text;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                  type: 'agent_chunk', 
                  data: { agentId, text } 
                })}\n\n`));
              }
            }

            // Save agent response
            const aiMsg = await prisma.groupChatMessage.create({
              data: {
                groupChatId: id,
                senderId: agentId,
                role: 'ai',
                content: fullContent
              }
            });

            currentRoundResponses.push({
              agentId,
              name: agentConfig.name,
              content: fullContent
            });

            // Agent finish
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'agent_done', 
              data: aiMsg 
            })}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
          controller.close();
        } catch (err: any) {
          console.error('[GroupChat SSE Error]', err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', data: err.message })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
