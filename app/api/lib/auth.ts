import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export interface AuthResult {
  userId: string;
  user?: any;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthResult | NextResponse> {
  const sessionCookie = request.cookies.get('fieldshare.sid');

  if (!sessionCookie) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );
    return { userId: sessionData.userId };
  } catch (error) {
    console.error('Error parsing session:', error);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult | NextResponse> {
  const authResult = await getUserFromRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const isAdmin = await storage.isUserAdmin(authResult.userId);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    return authResult;
  } catch (error) {
    console.error('Admin check error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export function sanitizeUser(user: any) {
  if (!user) return null;
  
  const {
    johnDeereAccessToken,
    johnDeereRefreshToken,
    leafAgricultureApiKey,
    stripeCustomerId,
    stripeSubscriptionId,
    ...safeUserData
  } = user;
  
  return safeUserData;
}
