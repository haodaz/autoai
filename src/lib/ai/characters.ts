import { Character } from './types';
import fs from 'fs';
import path from 'path';

const CHARS_DIR = path.join(process.cwd(), 'public', 'characters');

/** Ensure the characters directory exists */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** Scan public/characters/ for all character folders with config.json */
function scanLocalCharacters(): Character[] {
  ensureDir(CHARS_DIR);
  const folders = fs.readdirSync(CHARS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'));

  const chars: Character[] = [];
  for (const folder of folders) {
    const configPath = path.join(CHARS_DIR, folder.name, 'config.json');
    if (!fs.existsSync(configPath)) continue;
    try {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(raw);
      const char = buildCharacterFromConfig(folder.name, config);
      chars.push(char);
    } catch (e) {
      console.error(`[CharacterManager] Failed to parse ${configPath}:`, e);
    }
  }
  return chars;
}

/** Build a Character object from a local config.json */
function buildCharacterFromConfig(folderId: string, config: any): Character {
  const id = config.id || folderId;

  // Auto-detect assets from the assets/ folder
  const assetsDir = path.join(CHARS_DIR, folderId, 'assets');
  const detectedAssets: Record<string, string> = {};
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir).filter(f => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
    for (const file of files) {
      const stem = file.split('.')[0].toLowerCase();
      detectedAssets[stem] = `/characters/${folderId}/assets/${file}`;
    }
  }

  // Merge config.assets with detected assets (detected takes precedence)
  const mergedAssets = { ...(config.assets || {}), ...detectedAssets };

  // Auto-detect context files
  const contextDir = path.join(CHARS_DIR, folderId, 'context');
  const contextFiles: Record<string, string> = {};
  if (fs.existsSync(contextDir)) {
    const files = fs.readdirSync(contextDir).filter(f => !f.startsWith('.'));
    for (const file of files) {
      contextFiles[file] = `/characters/${folderId}/context/${file}`;
    }
  }

  return {
    id,
    name: config.name || folderId,
    description: config.description || '',
    tagline: config.tagline || '',
    intro: config.intro || '',
    ai_type: config.ai_type || 'custom',
    avatar: mergedAssets.avatar || config.avatar || '/default-avatar.png',
    assets: mergedAssets,
    skills_preview: config.skills_preview || [],
    topic_tags: config.topic_tags || [],
    visit_count: config.visit_count || 0,
    persona: config.persona || '',
    slug: config.slug || folderId,
    extra_prompt: config.extra_prompt || '',
    disable_handoff: !!config.disable_handoff,
    state_labels: config.state_labels || {},
    is_cloud: false,
    public: config.public !== false,
    context_files: contextFiles,
    linked_entities: config.linked_entities || [],
    theme_id: config.theme_id || config.collection || '',
    quick_prompts: config.quick_prompts || (config.quickChips || []).map((c: any) => typeof c === 'string' ? c : c.label),
    skills: config.skills || [],
    repository_ids: [],
    avatar_ids: [],
    // Extra fields
    memory_namespace: config.memory_namespace,
    tools: config.tools,
    badge: config.badge,
  } as unknown as Character;
}

/**
 * Read all context document contents for a character.
 * Returns concatenated text from .md and .txt files in the context/ folder.
 */
export function getCharacterContextText(charId: string): string {
  const contextDir = path.join(CHARS_DIR, charId, 'context');
  if (!fs.existsSync(contextDir)) return '';

  const files = fs.readdirSync(contextDir)
    .filter(f => /\.(md|txt)$/i.test(f))
    .sort();

  const parts: string[] = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(contextDir, file), 'utf-8');
      parts.push(`--- ${file} ---\n${content}`);
    } catch { /* skip unreadable files */ }
  }
  return parts.join('\n\n');
}

class CharacterManager {
  private _cache: Character[] | null = null;

  /** Invalidate in-memory cache */
  reload() {
    this._cache = null;
  }

  /** Get all local characters */
  async getAllCharacters(_token?: string): Promise<Character[]> {
    if (!this._cache) {
      this._cache = scanLocalCharacters();
    }
    return this._cache;
  }

  /** Get public characters only */
  async getPublicCharacters(): Promise<Character[]> {
    const all = await this.getAllCharacters();
    return all.filter(c => c.public);
  }

  /** Get a single character by ID or slug */
  async getCharacter(id: string): Promise<Character | null> {
    if (!id) return null;
    const all = await this.getAllCharacters();
    return all.find(c => c.id === id || c.slug === id) ?? null;
  }

  /** Save character config to local filesystem */
  async saveCharacter(character: Character): Promise<string> {
    const charId = character.id || character.slug || `char_${Date.now()}`;
    const charDir = path.join(CHARS_DIR, charId);
    ensureDir(charDir);
    ensureDir(path.join(charDir, 'assets'));
    ensureDir(path.join(charDir, 'context'));

    // Build config.json from character fields
    const config: any = {
      id: charId,
      name: character.name,
      description: character.description,
      tagline: character.tagline,
      intro: character.intro,
      ai_type: character.ai_type,
      persona: character.persona,
      extra_prompt: character.extra_prompt,
      slug: character.slug || charId,
      public: character.public,
      skills_preview: character.skills_preview,
      topic_tags: character.topic_tags,
      visit_count: character.visit_count,
      state_labels: character.state_labels,
      disable_handoff: character.disable_handoff,
      theme_id: character.theme_id,
      quick_prompts: character.quick_prompts,
      skills: character.skills,
      linked_entities: character.linked_entities,
      assets: character.assets,
    };

    // Preserve extra fields
    if ((character as any).memory_namespace) config.memory_namespace = (character as any).memory_namespace;
    if ((character as any).tools) config.tools = (character as any).tools;
    if ((character as any).badge) config.badge = (character as any).badge;

    fs.writeFileSync(path.join(charDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');

    // Invalidate cache
    this.reload();
    return charId;
  }

  /** Delete a character folder */
  async deleteCharacter(id: string): Promise<boolean> {
    const charDir = path.join(CHARS_DIR, id);
    if (!fs.existsSync(charDir)) return false;
    fs.rmSync(charDir, { recursive: true, force: true });
    this.reload();
    return true;
  }
}

export const characterManager = new CharacterManager();
