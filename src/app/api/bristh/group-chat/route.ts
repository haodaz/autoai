import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const chats = await prisma.groupChat.findMany({
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(chats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, topic, agents } = await req.json(); // agents: string[] (e.g. ['alice', 'bob'])

    const chat = await prisma.groupChat.create({
      data: {
        name: name || 'New Group Chat',
        topic,
        participants: {
          create: agents.map((agentId: string) => ({ agentId }))
        }
      },
      include: {
        participants: true
      }
    });

    return NextResponse.json(chat);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
