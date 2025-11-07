import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { getUserFromRequest } from '../lib/auth';

export async function GET(request: NextRequest) {
  const authResult = await getUserFromRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const stats = await storage.getUserStats(authResult.userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { message: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
