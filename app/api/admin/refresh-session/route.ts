import { NextRequest, NextResponse } from 'next/server';
import { getSession, createSession } from '@/lib/session';
import { storage } from '@/lib/storage';

/**
 * Force refresh session with current database values
 * 
 * Usage:
 * 1. Login normally
 * 2. Visit: http://localhost:3000/api/admin/refresh-session
 * 3. Session will be recreated with fresh database values
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Refreshing session with database values...');
    
    // Get current session
    const session = await getSession(request);
    
    if (!session) {
      return NextResponse.json({
        error: 'Not logged in',
        instructions: 'Please login first at /admin/login',
      }, { status: 401 });
    }
    
    console.log('Current session:', session);
    
    // Get fresh user data from database
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      return NextResponse.json({
        error: 'User not found in database',
        instructions: 'Your account may have been deleted',
      }, { status: 404 });
    }
    
    console.log('Database user isAdmin:', user.isAdmin);
    
    // Create NEW session with fresh database values
    const newSessionToken = await createSession({
      userId: user._id.toString(),
      email: user.email!,
      isAdmin: user.isAdmin || false,
    });
    
    console.log('✅ New session created with isAdmin:', user.isAdmin);
    
    // Return response with new session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Session refreshed successfully!',
      before: {
        isAdmin: session.isAdmin,
      },
      after: {
        isAdmin: user.isAdmin,
      },
      instructions: user.isAdmin 
        ? '✅ You now have admin access! Go to /admin'
        : '❌ Your account is still not admin. Run: npx ts-node scripts/fix-admin.ts ' + user.email,
    });
    
    // Set new session cookie
    response.cookies.set('session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Error refreshing session:', error);
    return NextResponse.json({
      error: 'Failed to refresh session',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
