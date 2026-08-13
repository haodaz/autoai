import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const chat = await prisma.groupChat.findUnique({
      where: { id },
      include: {
        participants: true,
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    return NextResponse.json(chat);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.groupChat.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Update simple fields on GroupChat
    const updateData: any = {};
    if (body.speakingOrder !== undefined) updateData.speakingOrder = body.speakingOrder;
    if (body.responseLength !== undefined) updateData.responseLength = body.responseLength;
    if (body.name !== undefined) updateData.name = body.name;

    if (Object.keys(updateData).length > 0) {
      await prisma.groupChat.update({
        where: { id },
        data: updateData
      });
    }

    // Update participants if provided
    if (body.participants && Array.isArray(body.participants)) {
      // Get current
      const current = await prisma.groupChatParticipant.findMany({ where: { groupChatId: id } });
      const currentIds = current.map(p => p.agentId);
      
      const newIds = body.participants;
      
      const toAdd = newIds.filter((aid: string) => !currentIds.includes(aid));
      const toRemove = currentIds.filter(aid => !newIds.includes(aid));
      
      if (toRemove.length > 0) {
        await prisma.groupChatParticipant.deleteMany({
          where: { groupChatId: id, agentId: { in: toRemove } }
        });
      }
      
      if (toAdd.length > 0) {
        await prisma.groupChatParticipant.createMany({
          data: toAdd.map((aid: string) => ({ groupChatId: id, agentId: aid }))
        });
      }
    }

    const updated = await prisma.groupChat.findUnique({
      where: { id },
      include: { participants: true }
    });
    
    return NextResponse.json({ success: true, chat: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
