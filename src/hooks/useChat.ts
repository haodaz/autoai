import { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from '@/lib/ai/types';

export function useChat(initialMessages: Message[] = [], apiEndpoint: string = '/api/chat') {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [loading, setLoading] = useState(false);

  // ── 始终持有最新 messages，彻底消除 useCallback stale closure ────────────
  const messagesRef = useRef<Message[]>(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const sendMessage = useCallback(async (
    content: string,
    characterId?: string,
    convId?: string,
    onConvCreated?: (newId: string) => void,
    options?: { 
      model?: string; 
      handoff_from?: string; 
      handoff_context?: string; 
      return_from_name?: string; 
      return_context?: string;
      force_clear_history?: boolean;
      activeMode?: string;
    }
  ) => {
    if (!content.trim()) return;

    const userMessage: Message = { 
      id: Date.now().toString(),
      role: 'user', 
      content,
      timestamp: new Date().toISOString()
    };
    
    const assistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage, initialAssistantMsg]);
    setLoading(true);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 如果是交接或返回的强制清除，仅发送当前最后一条系统/触发消息，阻断污染
          messages: options?.force_clear_history ? [userMessage] : [...messagesRef.current, userMessage],
          characterId,
          convId,
          handoff_from: options?.handoff_from,
          handoff_context: options?.handoff_context,
          return_from_name: options?.return_from_name,
          return_context: options?.return_context,
          activeMode: options?.activeMode,
          options: { model: options?.model },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let currentContent = '';
      let networkBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        networkBuffer += decoder.decode(value, { stream: true });
        const lines = networkBuffer.split('\n');
        networkBuffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim().startsWith('data: ')) {
            try {
              const data = JSON.parse(line.trim().slice(6));
              
              if (data.type === 'delta') {
                currentContent += data.content;
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { ...msg, content: currentContent }
                      : msg
                  )
                );
              } else if (data.type === 'reset') {
                // 工具调用完成，开始第二轮真实回答——用占位符替代空白，避免用户看到空气泡
                currentContent = '';
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: '\u23f3' }
                      : msg
                  )
                );
              } else if (data.type === 'final') {
                if (!data.skip_overwrite) {
                  currentContent = data.content;
                }
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: currentContent, entity_used: !!data.entity_used }
                      : msg
                  )
                );
                if (data.convId && data.convId !== convId && onConvCreated) {
                  onConvCreated(data.convId);
                }
              } else if (data.type === 'error') {
                console.error('Chat API Error:', data.error);
                // 把空气泡替换成错误提示，而不是静默卡死
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: `（回复出错：${data.error || '请刷新后重试'}）` }
                      : msg
                  )
                );
              } else if (['work_start', 'tool_start', 'tool_log', 'tool_end', 'work_end'].includes(data.type)) {
                setMessages(prev => prev.map(msg => {
                  if (msg.id !== assistantMsgId) return msg;
                  const newMsg = { ...msg };
                  if (!newMsg.toolCalls) newMsg.toolCalls = {};

                  if (data.type === 'work_start') {
                    newMsg.isWorking = true;
                  } else if (data.type === 'tool_start') {
                    newMsg.toolCalls = {
                      ...newMsg.toolCalls,
                      [data.taskId]: { id: data.taskId, name: data.taskName, status: 'running', logs: [] }
                    };
                  } else if (data.type === 'tool_log') {
                    const t = newMsg.toolCalls[data.taskId];
                    if (t) {
                      newMsg.toolCalls = {
                        ...newMsg.toolCalls,
                        [data.taskId]: { ...t, logs: [...t.logs, data.message] }
                      };
                    }
                  } else if (data.type === 'tool_end') {
                    const t = newMsg.toolCalls[data.taskId];
                    if (t) {
                      newMsg.toolCalls = {
                        ...newMsg.toolCalls,
                        [data.taskId]: { ...t, status: data.status }
                      };
                    }
                  } else if (data.type === 'work_end') {
                    newMsg.isWorking = false;
                  }
                  return newMsg;
                }));
              }
            } catch (e) {
              // ignore parse errors on incomplete chunks
            }
          }
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('conversationsUpdated'));
      }
    } catch (err) {
      console.error(err);
      // 网络中断或解析失败时，在气泡里显示错误，保留用户消息，不把两条消息都删掉
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, content: '（网络异常，请稍后重试）' }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, []); // 无 messages 依赖，sendMessage 引用永久稳定

  return {
    messages,
    loading,
    sendMessage,
    setMessages
  };
}
