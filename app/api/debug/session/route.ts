import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/lib/storage';

/**
 * Debug endpoint to check session status
 * Visit: http://localhost:3000/api/debug/session
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Checking session...');
    
    // Check if session cookie exists
    const sessionCookie = request.cookies.get('session');
    console.log('📝 Session cookie exists:', !!sessionCookie);
    
    if (!sessionCookie) {
      return NextResponse.json({
        error: 'No session cookie found',
        authenticated: false,
        instructions: 'Please login at /admin/login',
      });
    }
    
    // Try to get session
    const session = await getSession(request);
    console.log('🔑 Session data:', session);
    
    if (!session) {
      return NextResponse.json({
        error: 'Session cookie exists but could not be decoded',
        authenticated: false,
        possibleCauses: [
          'Invalid session token',
          'Expired session',
          'SESSION_SECRET mismatch',
        ],
        instructions: 'Logout and login again',
      });
    }
    
    // Get user from database
    console.log('👤 Looking up user ID:', session.userId);
    const user = await storage.getUser(session.userId);
    console.log('📊 User found:', !!user);
    console.log('👑 User isAdmin:', user?.isAdmin);
    
    if (!user) {
      return NextResponse.json({
        error: 'Session valid but user not found in database',
        sessionData: session,
        authenticated: false,
        instructions: 'User may have been deleted. Create account again.',
      });
    }
    
    // Return complete debug info
    return NextResponse.json({
      success: true,
      authenticated: true,
      session: {
        userId: session.userId,
        email: session.email,
        isAdmin: session.isAdmin,
      },
      database: {
        userId: user._id?.toString(),
        email: user.email,
        isAdmin: user.isAdmin,
        accountType: user.accountType,
        userRole: user.userRole,
      },
      match: {
        sessionIsAdmin: session.isAdmin,
        databaseIsAdmin: user.isAdmin,
        matches: session.isAdmin === user.isAdmin,
      },
      diagnosis: session.isAdmin 
        ? '✅ Session shows admin - should work!' 
        : '❌ Session does NOT show admin - this is the problem!',
      solution: !session.isAdmin && user.isAdmin
        ? 'Logout and login again to update session with database values'
        : session.isAdmin
        ? 'Everything looks good! Check browser console for other errors.'
        : 'Database isAdmin is false - run: npx ts-node scripts/fix-admin.ts ' + user.email,
    });
    
  } catch (error) {
    console.error('❌ Debug session error:', error);
    return NextResponse.json({
      error: 'Error checking session',
      details: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false,
    });
  }
}
