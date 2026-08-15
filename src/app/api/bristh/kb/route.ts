import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const contexts = await prisma.taskContext.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            agent: true,
            instruction: true,
            status: true,
            resultPayload: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        _count: {
          select: { tasks: true }
        }
      }
    });

    return NextResponse.json(contexts);
  } catch (error: any) {
    console.error('Failed to fetch knowledge base contexts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
