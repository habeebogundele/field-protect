import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  claims?: any;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthenticatedUser;
}

// Helper to get session from Next.js cookies
export async function getSession(): Promise<any | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('fieldshare.sid');
    
    if (!sessionCookie) {
      return null;
    }

    // In Next.js, we'll need to decode the session
    // For now, return basic session structure
    return sessionCookie.value;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Middleware to check authentication
export async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const sessionCookie = request.cookies.get('fieldshare.sid');
  
  if (!sessionCookie) {
    console.log('❌ No session cookie found');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // TODO: Decode session and extract user
  // For now, we'll need to parse the session from the cookie
  // This will need to be adapted based on your session store
  try {
    // Placeholder - you'll need to implement proper session decoding
    const user = {
      id: 'user-id', // Extract from session
      claims: {}
    };

    return { user: user as AuthenticatedUser };
  } catch (error) {
    console.error('Error decoding session:', error);
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}

// Middleware to check admin access
export async function requireAdmin(request: NextRequest): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  
  try {
    const isUserAdmin = await storage.isUserAdmin(user.id);
    
    if (!isUserAdmin) {
      console.log(`❌ Admin access denied for user: ${user.id}`);
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    return { user };
  } catch (error) {
    console.error('❌ Admin check error:', error);
    return NextResponse.json({ message: 'Internal server error during admin check' }, { status: 500 });
  }
}

// Sanitize user data for client
export function sanitizeUserForClient(user: any) {
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
