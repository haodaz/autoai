import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contextId = searchParams.get('contextId');
    const mode = searchParams.get('mode');

    // History mode: return contexts with their tasks
    if (mode === 'history') {
      const contexts = await prisma.taskContext.findMany({
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          tasks: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      return NextResponse.json(contexts);
    }

    if (!contextId) {
      const tasks = await prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { context: true }
      });
      return NextResponse.json(tasks);
    }

    let targetContextId = contextId;
    if (contextId === 'latest') {
      const latestTask = await prisma.task.findFirst({
        orderBy: { createdAt: 'desc' }
      });
      if (!latestTask) {
        return NextResponse.json([]);
      }
      targetContextId = latestTask.contextId;
    }

    const tasks = await prisma.task.findMany({
      where: { contextId: targetContextId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
