import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const CHARACTERS_DIR = path.join(process.cwd(), 'public', 'characters');

// GET: Read all bristh_* agent configs
export async function GET() {
  try {
    const entries = await fs.readdir(CHARACTERS_DIR, { withFileTypes: true });
    const bristhDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('bristh_'));
    
    const configs = await Promise.all(
      bristhDirs.map(async (dir) => {
        try {
          const configPath = path.join(CHARACTERS_DIR, dir.name, 'config.json');
          const raw = await fs.readFile(configPath, 'utf-8');
          const config = JSON.parse(raw);
          
          // Read context files list
          const contextDir = path.join(CHARACTERS_DIR, dir.name, 'context');
          let contextFiles: string[] = [];
          try {
            const contextEntries = await fs.readdir(contextDir);
            contextFiles = contextEntries.filter(f => !f.startsWith('.'));
          } catch { /* no context dir */ }
          
          return { ...config, _folder: dir.name, _contextFiles: contextFiles };
        } catch {
          return null;
        }
      })
    );
    
    // Sort: orchestrator first, then alphabetically
    const sorted = configs
      .filter(Boolean)
      .sort((a: any, b: any) => {
        if (a.role === 'orchestrator') return -1;
        if (b.role === 'orchestrator') return 1;
        return a.name.localeCompare(b.name);
      });
    
    return NextResponse.json(sorted);
  } catch (error: any) {
    console.error('Failed to read bristh configs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Save a single agent config
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...configData } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Missing agent id' }, { status: 400 });
    }
    
    const folderName = `bristh_${id}`;
    const configPath = path.join(CHARACTERS_DIR, folderName, 'config.json');
    
    // Ensure directory exists
    await fs.mkdir(path.join(CHARACTERS_DIR, folderName), { recursive: true });
    await fs.mkdir(path.join(CHARACTERS_DIR, folderName, 'context'), { recursive: true });
    
    // Remove internal fields before saving
    const { _folder, _contextFiles, ...cleanConfig } = configData;
    const toSave = { id, ...cleanConfig };
    
    await fs.writeFile(configPath, JSON.stringify(toSave, null, 2), 'utf-8');
    
    return NextResponse.json({ success: true, config: toSave });
  } catch (error: any) {
    console.error('Failed to save bristh config:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
