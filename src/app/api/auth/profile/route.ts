import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

// GET: fetch current user's full profile
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, username: true, role: true, displayName: true, phone: true, email: true, avatarUrl: true },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT: update profile fields
export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await req.json();
    const { displayName, phone, email, avatarUrl } = body;

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: { id: true, username: true, role: true, displayName: true, phone: true, email: true, avatarUrl: true },
    });

    // Update session cookie with new displayName
    const newSession = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    })).toString('base64');

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('autoffice_session', newSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: any) {
    console.error('[auth/profile] Error:', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

async function getSession() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('autoffice_session')?.value;
    if (!raw) return null;
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}
