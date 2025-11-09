import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie
    const session = await getSession(request);
    
    console.log('📋 Debug Session Check:');
    console.log('Session exists:', !!session);
    console.log('Session data:', session);
    
    if (!session) {
      return NextResponse.json({
        error: 'No session found',
        cookieHeader: request.headers.get('cookie'),
        sessionCookie: request.cookies.get('session')?.value,
      });
    }
    
    // Get user from database
    const user = await storage.getUser(session.userId);
    
    console.log('User found:', !!user);
    console.log('User isAdmin:', user?.isAdmin);
    console.log('User email:', user?.email);
    
    return NextResponse.json({
      sessionExists: true,
      session: {
        userId: session.userId,
        email: session.email,
        isAdmin: session.isAdmin,
      },
      databaseUser: user ? {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        accountType: user.accountType,
        firstName: user.firstName,
        lastName: user.lastName,
      } : null,
      cookieHeader: request.headers.get('cookie'),
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({
      error: 'Failed to check session',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
