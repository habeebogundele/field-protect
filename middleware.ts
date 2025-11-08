import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './app/lib/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/api/auth/login", "/api/auth/signup"];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Admin-only routes
  const adminRoutes = ["/admin"];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  // Get session
  const session = await getSession(request);
  const isLoggedIn = !!session;
  
  // Add CORS headers for API routes
  const response = NextResponse.next();
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-Forwarded-For', request.headers.get('x-forwarded-for') || '');
    response.headers.set('X-Forwarded-Proto', request.headers.get('x-forwarded-proto') || 'https');
  }
  
  // Redirect to login if not authenticated and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to dashboard if logged in and trying to access auth pages
  if (isLoggedIn && (pathname === "/login" || pathname === "/signup" || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Check admin access for admin routes
  if (isAdminRoute && (!session || !session.isAdmin)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
