import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('autoffice_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(Buffer.from(sessionCookie, 'base64').toString('utf-8'));

    if (!session.userId || !session.username || !session.role) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        username: session.username,
        role: session.role,
        displayName: session.displayName || session.username,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
