import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/lib/storage';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get fresh user data
    const user = await storage.getUser(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user data (without sensitive fields)
    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      address: user.address,
      zipcode: user.zipcode,
      phoneNumber: user.phoneNumber,
      profileImageUrl: user.profileImageUrl,
      isAdmin: user.isAdmin,
      userRole: user.userRole,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionType: user.subscriptionType,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
