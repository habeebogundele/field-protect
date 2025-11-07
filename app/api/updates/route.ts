import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage';
import { getUserFromRequest } from '../lib/auth';

export async function GET(request: NextRequest) {
  const authResult = await getUserFromRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const updates = await storage.getRecentUpdatesForUser(authResult.userId, limit);
    return NextResponse.json(updates);
  } catch (error) {
    console.error('Error fetching updates:', error);
    return NextResponse.json(
      { message: 'Failed to fetch updates' },
      { status: 500 }
    );
  }
}
