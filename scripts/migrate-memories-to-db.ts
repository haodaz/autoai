/**
 * Migrate existing file-based memories and soul files to the database.
 * Run once: npx tsx scripts/migrate-memories-to-db.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const CHARS_DIR = path.join(process.cwd(), 'public', 'characters');

async function migrate() {
  const entries = await fs.readdir(CHARS_DIR, { withFileTypes: true });
  const bristhDirs = entries.filter(e => e.isDirectory() && e.name.startsWith('bristh_'));

  for (const dir of bristhDirs) {
    const agentId = dir.name.replace('bristh_', '');
    console.log(`\n🔄 Migrating ${agentId}...`);

    // 1. Migrate soul file
    try {
      const soulPath = path.join(CHARS_DIR, dir.name, 'memory', 'soul.md');
      const soulContent = await fs.readFile(soulPath, 'utf-8');
      if (soulContent.trim()) {
        await prisma.agentSoul.upsert({
          where: { agentId },
          update: { content: soulContent },
          create: { agentId, content: soulContent },
        });
        console.log(`  ✅ Soul file migrated (${soulContent.length} chars)`);
      }
    } catch { console.log(`  ⏭️ No soul file`); }

    // 2. Migrate JSONL memory entries
    try {
      const memDir = path.join(CHARS_DIR, dir.name, 'memory');
      const files = await fs.readdir(memDir);
      const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));

      let count = 0;
      for (const file of jsonlFiles) {
        const raw = await fs.readFile(path.join(memDir, file), 'utf-8');
        const lines = raw.trim().split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const entry = JSON.parse(line);
            // Check if already exists
            const existing = await prisma.agentMemory.findFirst({
              where: { agentId, content: entry.content }
            });
            if (!existing) {
              await prisma.agentMemory.create({
                data: {
                  agentId,
                  type: entry.type || 'task_summary',
                  source: entry.source || 'self',
                  content: entry.content,
                  importance: entry.importance || 0.5,
                  taskId: entry.taskId || null,
                  archived: entry.archived || false,
                  createdAt: entry.ts ? new Date(entry.ts) : new Date(),
                }
              });
              count++;
            }
          } catch (e) {
            console.log(`  ⚠️ Skipped bad entry: ${line.slice(0, 50)}`);
          }
        }
      }
      console.log(`  ✅ ${count} memory entries migrated`);
    } catch { console.log(`  ⏭️ No memory files`); }
  }

  // 3. Verify
  const totalMemories = await prisma.agentMemory.count();
  const totalSouls = await prisma.agentSoul.count();
  console.log(`\n📊 Migration complete: ${totalMemories} memories, ${totalSouls} soul files`);

  await prisma.$disconnect();
}

migrate().catch(console.error);
