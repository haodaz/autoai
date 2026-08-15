/**
 * Memory Engine — AI 记忆系统核心
 * 
 * 文件系统结构:
 *   public/characters/bristh_{agent}/
 *   ├── memory/
 *   │   ├── soul.md              (灵魂文件 — Dreaming Agent 维护)
 *   │   └── 2025-08-15.jsonl     (当日原始记忆条目)
 *   └── task_memory/
 *       └── {taskId}.md          (任务摘要)
 */

import fs from 'fs/promises';
import path from 'path';

// ── Types ────────────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  ts: string;
  type: 'task_feedback' | 'lesson_learned' | 'user_preference' | 'task_summary' | 'copilot_feedback' | 'dreaming_insight';
  source: 'user' | 'self' | 'system' | 'dreaming';
  content: string;
  importance: number; // 0.0 - 1.0
  taskId?: string;
  archived?: boolean;
}

export interface TaskMemory {
  taskId: string;
  agentId: string;
  instruction: string;
  summary: string;
  createdAt: string;
}

// ── Paths ────────────────────────────────────────────────────────────

function agentDir(agentId: string): string {
  return path.join(process.cwd(), 'public', 'characters', `bristh_${agentId.toLowerCase()}`);
}

function memoryDir(agentId: string): string {
  return path.join(agentDir(agentId), 'memory');
}

function taskMemoryDir(agentId: string): string {
  return path.join(agentDir(agentId), 'task_memory');
}

function todayFile(agentId: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(memoryDir(agentId), `${today}.jsonl`);
}

function soulFilePath(agentId: string): string {
  return path.join(memoryDir(agentId), 'soul.md');
}

// ── Ensure directories ──────────────────────────────────────────────

async function ensureDir(dirPath: string): Promise<void> {
  try { await fs.mkdir(dirPath, { recursive: true }); } catch {}
}

// ── Write Operations ────────────────────────────────────────────────

/**
 * Write a single memory entry for an agent (appends to today's JSONL)
 */
export async function writeMemory(agentId: string, entry: Omit<MemoryEntry, 'id' | 'ts'>): Promise<MemoryEntry> {
  await ensureDir(memoryDir(agentId));
  
  const fullEntry: MemoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    ...entry,
  };

  const filePath = todayFile(agentId);
  await fs.appendFile(filePath, JSON.stringify(fullEntry) + '\n', 'utf-8');
  
  return fullEntry;
}

/**
 * Save a task memory summary
 */
export async function writeTaskMemory(agentId: string, memory: TaskMemory): Promise<void> {
  await ensureDir(taskMemoryDir(agentId));
  
  const content = `# 任务摘要: ${memory.instruction.slice(0, 60)}
> Agent: ${memory.agentId} | Task: ${memory.taskId} | 时间: ${memory.createdAt}

${memory.summary}
`;

  await fs.writeFile(
    path.join(taskMemoryDir(agentId), `${memory.taskId}.md`),
    content,
    'utf-8'
  );
}

/**
 * Update the soul file (used by Dreaming Agent)
 */
export async function writeSoulFile(agentId: string, content: string): Promise<void> {
  await ensureDir(memoryDir(agentId));
  await fs.writeFile(soulFilePath(agentId), content, 'utf-8');
}

// ── Read Operations ─────────────────────────────────────────────────

/**
 * Load agent's soul file
 */
export async function loadSoulFile(agentId: string): Promise<string> {
  try {
    return await fs.readFile(soulFilePath(agentId), 'utf-8');
  } catch {
    return '';
  }
}

/**
 * Load memory entries for a specific date
 */
export async function loadMemoriesByDate(agentId: string, date: string): Promise<MemoryEntry[]> {
  try {
    const filePath = path.join(memoryDir(agentId), `${date}.jsonl`);
    const raw = await fs.readFile(filePath, 'utf-8');
    return raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  } catch {
    return [];
  }
}

/**
 * Load recent memories (across multiple days), newest first
 */
export async function loadAgentMemories(agentId: string, limit: number = 20): Promise<MemoryEntry[]> {
  try {
    const dir = memoryDir(agentId);
    const files = await fs.readdir(dir);
    const jsonlFiles = files
      .filter(f => f.endsWith('.jsonl'))
      .sort()
      .reverse(); // newest first

    const entries: MemoryEntry[] = [];
    for (const file of jsonlFiles) {
      if (entries.length >= limit) break;
      try {
        const raw = await fs.readFile(path.join(dir, file), 'utf-8');
        const fileEntries = raw.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
        entries.push(...fileEntries);
      } catch {}
    }

    return entries
      .filter(e => !e.archived)
      .sort((a, b) => b.importance - a.importance) // highest importance first
      .slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * Load all task memories for an agent
 */
export async function loadTaskMemories(agentId: string): Promise<{ id: string; title: string; content: string; date: string }[]> {
  try {
    const dir = taskMemoryDir(agentId);
    const files = await fs.readdir(dir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const items = await Promise.all(mdFiles.map(async f => {
      const content = await fs.readFile(path.join(dir, f), 'utf-8');
      const titleMatch = content.match(/^# (.+)/m);
      const stat = await fs.stat(path.join(dir, f));
      return {
        id: f.replace('.md', ''),
        title: titleMatch ? titleMatch[1] : f,
        content,
        date: stat.mtime.toISOString(),
      };
    }));
    
    return items.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

/**
 * List all agents that have memory directories
 */
export async function listAgentsWithMemory(): Promise<string[]> {
  try {
    const charsDir = path.join(process.cwd(), 'public', 'characters');
    const entries = await fs.readdir(charsDir, { withFileTypes: true });
    const agents: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith('bristh_')) {
        const agentId = entry.name.replace('bristh_', '');
        agents.push(agentId);
      }
    }
    
    return agents;
  } catch {
    return [];
  }
}

/**
 * Get memory stats for an agent (for KB UI display)
 */
export async function getAgentMemoryStats(agentId: string): Promise<{
  hasSoul: boolean;
  todayCount: number;
  totalCount: number;
  lastMemoryDate: string | null;
}> {
  const soul = await loadSoulFile(agentId);
  const today = new Date().toISOString().split('T')[0];
  const todayMems = await loadMemoriesByDate(agentId, today);
  
  let totalCount = 0;
  let lastMemoryDate: string | null = null;
  
  try {
    const dir = memoryDir(agentId);
    const files = await fs.readdir(dir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl')).sort().reverse();
    
    if (jsonlFiles.length > 0) {
      lastMemoryDate = jsonlFiles[0].replace('.jsonl', '');
    }
    
    for (const file of jsonlFiles) {
      const raw = await fs.readFile(path.join(dir, file), 'utf-8');
      totalCount += raw.trim().split('\n').filter(Boolean).length;
    }
  } catch {}
  
  return {
    hasSoul: soul.length > 0,
    todayCount: todayMems.length,
    totalCount,
    lastMemoryDate,
  };
}

/**
 * Delete a specific memory entry by ID
 */
export async function deleteMemory(agentId: string, memoryId: string): Promise<boolean> {
  try {
    const dir = memoryDir(agentId);
    const files = await fs.readdir(dir);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    
    for (const file of jsonlFiles) {
      const filePath = path.join(dir, file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const lines = raw.trim().split('\n').filter(Boolean);
      const filtered = lines.filter(line => {
        try { const entry = JSON.parse(line); return entry.id !== memoryId; } catch { return true; }
      });
      
      if (filtered.length < lines.length) {
        await fs.writeFile(filePath, filtered.join('\n') + (filtered.length ? '\n' : ''), 'utf-8');
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}
