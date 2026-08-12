import Database from 'better-sqlite3';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import * as dotenv from 'dotenv';

// Load the postgres env vars so Prisma connects to Supabase
dotenv.config();

const prisma = new PrismaClient();

function parseDate(val: any) {
  if (!val) return val;
  // SQLite stores dates as strings or numbers, Prisma needs JS Date objects
  return new Date(val);
}

async function main() {
  console.log('Connecting to local SQLite database...');
  const sqlite = new Database(path.join(process.cwd(), 'prisma', 'dev.db'));

  try {
    // Migrate Customers
    console.log('Migrating Customers...');
    const customers = sqlite.prepare('SELECT * FROM Customer').all();
    for (const c of customers as any[]) {
      await prisma.customer.upsert({
        where: { id: c.id },
        update: {},
        create: {
          ...c,
          createdAt: parseDate(c.createdAt),
          updatedAt: parseDate(c.updatedAt),
        }
      });
    }

    // Migrate Interactions
    console.log('Migrating Interactions...');
    const interactions = sqlite.prepare('SELECT * FROM Interaction').all();
    for (const i of interactions as any[]) {
      await prisma.interaction.upsert({
        where: { id: i.id },
        update: {},
        create: {
          ...i,
          createdAt: parseDate(i.createdAt),
        }
      });
    }

    // Migrate KnowledgeItems
    console.log('Migrating KnowledgeItems...');
    const knowledge = sqlite.prepare('SELECT * FROM KnowledgeItem').all();
    for (const k of knowledge as any[]) {
      await prisma.knowledgeItem.upsert({
        where: { id: k.id },
        update: {},
        create: {
          ...k,
          createdAt: parseDate(k.createdAt),
          updatedAt: parseDate(k.updatedAt),
        }
      });
    }

    // Migrate Staff
    console.log('Migrating Staff...');
    const staff = sqlite.prepare('SELECT * FROM Staff').all();
    for (const s of staff as any[]) {
      await prisma.staff.upsert({
        where: { id: s.id },
        update: {},
        create: { ...s }
      });
    }

    // Migrate Meetings
    console.log('Migrating Meetings...');
    const meetings = sqlite.prepare('SELECT * FROM Meeting').all();
    for (const m of meetings as any[]) {
      await prisma.meeting.upsert({
        where: { id: m.id },
        update: {},
        create: {
          ...m,
          startTime: parseDate(m.startTime),
          endTime: parseDate(m.endTime),
          createdAt: parseDate(m.createdAt),
          updatedAt: parseDate(m.updatedAt),
        }
      });
    }

    // Migrate TaskContext
    console.log('Migrating TaskContext...');
    const contexts = sqlite.prepare('SELECT * FROM TaskContext').all();
    for (const tc of contexts as any[]) {
      await prisma.taskContext.upsert({
        where: { id: tc.id },
        update: {},
        create: {
          ...tc,
          createdAt: parseDate(tc.createdAt),
        }
      });
    }

    // Migrate Tasks
    console.log('Migrating Tasks...');
    const tasks = sqlite.prepare('SELECT * FROM Task').all();
    for (const t of tasks as any[]) {
      await prisma.task.upsert({
        where: { id: t.id },
        update: {},
        create: {
          ...t,
          createdAt: parseDate(t.createdAt),
          updatedAt: parseDate(t.updatedAt),
        }
      });
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqlite.close();
    await prisma.$disconnect();
  }
}

main();
