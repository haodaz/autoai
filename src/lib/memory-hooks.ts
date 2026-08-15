/**
 * Post-task memory hook — extracts a memory entry after task completion.
 * Call this as fire-and-forget after saving task result.
 */
import { writeMemory, writeTaskMemory } from '@/lib/memory-engine';

export async function recordTaskCompletion(
  agentId: string,
  taskId: string,
  instruction: string,
  resultSummary: string
): Promise<void> {
  try {
    // 1. Write task memory file
    await writeTaskMemory(agentId, {
      taskId,
      agentId,
      instruction,
      summary: resultSummary,
      createdAt: new Date().toISOString(),
    });

    // 2. Write a memory entry about what was done
    await writeMemory(agentId, {
      type: 'task_summary',
      source: 'self',
      content: `完成任务: ${instruction.slice(0, 100)}${instruction.length > 100 ? '...' : ''} → ${resultSummary.slice(0, 100)}`,
      importance: 0.5,
      taskId,
    });
  } catch (e) {
    console.warn(`[memory-hook] Failed to record task completion for ${agentId}:`, e);
  }
}

export async function recordUserFeedback(
  agentId: string,
  feedback: string,
  taskId?: string
): Promise<void> {
  try {
    await writeMemory(agentId, {
      type: 'task_feedback',
      source: 'user',
      content: feedback,
      importance: 0.8, // User feedback is high importance
      taskId,
    });
  } catch (e) {
    console.warn(`[memory-hook] Failed to record user feedback for ${agentId}:`, e);
  }
}
