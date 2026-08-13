import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { username, password, displayName } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    if (username.length < 3 || password.length < 4) {
      return NextResponse.json({ error: '用户名至少3位，密码至少4位' }, { status: 400 });
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: '该用户名已被注册' }, { status: 409 });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: 'user', // All new registrations are "user"
        displayName: displayName || username,
      },
    });

    // Set session cookie
    const session = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username,
      role: user.role,
      displayName: user.displayName,
    })).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        displayName: user.displayName,
      },
    });

    response.cookies.set('autoffice_session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('[auth/register] Error:', err);
    return NextResponse.json({ error: '注册失败，请稍后重试' }, { status: 500 });
  }
}
