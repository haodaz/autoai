import fs from 'fs/promises';
import path from 'path';

export interface BristhAgentConfig {
  id: string;
  name: string;
  title: string;
  description: string;
  persona: string;
  avatar: string;
  color: string;
  skills_preview: string[];
  output_format: string;
  enabled: boolean;
  role: string;
  knowledge_scope: string;
}

/**
 * Read a Bristh agent's config.json from public/characters/bristh_{agentId}/
 * Also reads any private context files and concatenates them.
 */
export async function loadAgentConfig(agentId: string): Promise<BristhAgentConfig | null> {
  try {
    const configPath = path.join(process.cwd(), 'public', 'characters', `bristh_${agentId.toLowerCase()}`, 'config.json');
    const raw = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Read all private context files for an agent and return as concatenated string.
 * These are agent-specific knowledge files that supplement the global KB.
 */
export async function loadAgentContext(agentId: string): Promise<string> {
  try {
    const contextDir = path.join(process.cwd(), 'public', 'characters', `bristh_${agentId.toLowerCase()}`, 'context');
    const files = await fs.readdir(contextDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    if (mdFiles.length === 0) return '';
    
    const contents = await Promise.all(
      mdFiles.map(f => fs.readFile(path.join(contextDir, f), 'utf-8'))
    );
    
    return contents.join('\n\n---\n\n');
  } catch {
    return '';
  }
}

/**
 * Build the system prompt for an agent by combining:
 * 1. Persona from config.json (editable via UI)
 * 2. Task-specific instruction from Chief
 * 3. Raw context from TaskContext
 * 4. Agent-specific private knowledge (context/ files)
 * 5. Soul file (accumulated experience from Dreaming Agent)
 * 6. Recent memories (lessons learned, user feedback)
 */
export async function buildAgentPrompt(
  agentId: string,
  instruction: string,
  rawContent: string,
  fallbackPersona: string,
  locale?: string
): Promise<string> {
  const config = await loadAgentConfig(agentId);
  const privateContext = await loadAgentContext(agentId);
  
  // Import memory-engine dynamically to avoid circular deps
  let soulContent = '';
  let recentMemories: { type: string; content: string }[] = [];
  try {
    const { loadSoulFile, loadAgentMemories } = await import('./memory-engine');
    soulContent = await loadSoulFile(agentId);
    recentMemories = await loadAgentMemories(agentId, 10);
  } catch (e) {
    console.warn('Memory engine not available:', e);
  }
  
  const persona = config?.persona || fallbackPersona;
  
  let prompt = `${persona}\n\nYour specific instruction for this task from the Chief Orchestrator:\n"${instruction}"\n\nHere is the raw context provided by the client or meeting transcript:\n----------------\n${rawContent}\n----------------`;
  
  if (privateContext) {
    prompt += `\n\nAdditional reference knowledge (agent-specific):\n----------------\n${privateContext}\n----------------`;
  }

  if (soulContent) {
    prompt += `\n\n【Your accumulated experience and learnings (Soul File)】:\n----------------\n${soulContent}\n----------------`;
  }

  if (recentMemories.length > 0) {
    const memStr = recentMemories.map(m => `- [${m.type}] ${m.content}`).join('\n');
    prompt += `\n\n【Recent memories from past tasks — apply these lessons】:\n${memStr}`;
  }

  // Inject language instruction based on user's UI locale
  if (locale?.startsWith('zh')) {
    prompt += '\n\n【语言要求】请始终使用简体中文进行输出，所有内容请用简体中文撰写，不要使用英文。';
  } else if (locale?.startsWith('en')) {
    prompt += '\n\n【Language Requirement】Always respond entirely in English. Do not use Chinese.';
  }
  
  return prompt;
}

/**
 * Read all bristh agent configs.
 */
export async function loadAllAgentConfigs(): Promise<BristhAgentConfig[]> {
  try {
    const charsDir = path.join(process.cwd(), 'public', 'characters');
    const entries = await fs.readdir(charsDir, { withFileTypes: true });
    const bristhDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('bristh_'));
    
    const configs = await Promise.all(
      bristhDirs.map(async (dir) => {
        try {
          const raw = await fs.readFile(path.join(charsDir, dir.name, 'config.json'), 'utf-8');
          return JSON.parse(raw);
        } catch {
          return null;
        }
      })
    );
    
    return configs.filter(Boolean) as BristhAgentConfig[];
  } catch (err) {
    console.error('Failed to load all agent configs:', err);
    return [];
  }
}
