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
