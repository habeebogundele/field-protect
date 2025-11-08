import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'your-secret-key-at-least-32-characters-long'
);

export interface SessionData {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export async function createSession(data: SessionData) {
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);

  return token;
}

export async function getSession(request?: NextRequest): Promise<SessionData | null> {
  let token: string | undefined;

  if (request) {
    // From middleware or API routes with request object
    token = request.cookies.get('session')?.value;
  } else {
    // From server components
    const cookieStore = await cookies();
    token = cookieStore.get('session')?.value;
  }

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export function requireAuth(session: SessionData | null): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function requireAdmin(session: SessionData | null): NextResponse | null {
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  return null;
}
