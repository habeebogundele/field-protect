import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on all requests
export function middleware(request: NextRequest) {
  // Add CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Trust proxy headers (for Replit environment)
    response.headers.set('X-Forwarded-For', request.headers.get('x-forwarded-for') || '');
    response.headers.set('X-Forwarded-Proto', request.headers.get('x-forwarded-proto') || 'https');
    
    return response;
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.png$).*)',
  ],
};
