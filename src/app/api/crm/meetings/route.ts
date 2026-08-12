import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        customer: {
          select: { name: true, email: true }
        }
      },
      orderBy: { startTime: 'asc' }
    });
    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Failed to fetch meetings:', error);
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}
