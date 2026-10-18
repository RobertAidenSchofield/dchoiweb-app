import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { validateAdminPassword, getExpectedToken, COOKIE_NAME } from '@/lib/adminAuth';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (!password || !validateAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid studio administrative passcode.' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, getExpectedToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Authentication successful' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

