import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user and verify admin status
    const user = await storage.getUser(session.userId);
    
    if (!user || !user.isAdmin) {
      // Log unauthorized admin access attempt
      console.warn(`Non-admin user attempted to access admin API: ${user?.email} (ID: ${session.userId})`);
      
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all users (excluding passwords)
    const users = await storage.getAllUsers();
    
    // Remove sensitive fields
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user as any;
      return userWithoutPassword;
    });

    return NextResponse.json(sanitizedUsers, { status: 200 });
    
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
