import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';

/**
 * Quick endpoint to check account by email
 * Usage: /api/debug/check-my-account?email=your@email.com
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({
        error: 'Please provide email parameter',
        usage: '/api/debug/check-my-account?email=your@email.com',
      });
    }
    
    console.log('🔍 Looking up account:', email);
    
    const user = await storage.getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        found: false,
        email: email,
        message: 'No account found with this email',
      });
    }
    
    return NextResponse.json({
      found: true,
      account: {
        id: user._id?.toString(),
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        isAdmin: user.isAdmin,
        accountType: user.accountType,
        userRole: user.userRole,
        subscriptionStatus: user.subscriptionStatus,
        createdAt: user.createdAt,
      },
      diagnosis: {
        canAccessAdmin: user.isAdmin === true,
        issue: user.isAdmin !== true ? '❌ isAdmin is not true - this is the problem!' : '✅ Account looks good!',
        solution: user.isAdmin !== true 
          ? `Run: npx ts-node scripts/fix-admin.ts ${email}`
          : 'Try logging in at /admin/login',
      },
    });
    
  } catch (error) {
    console.error('Check account error:', error);
    return NextResponse.json({
      error: 'Failed to check account',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
