import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from './app/lib/session';
import { storage } from './app/lib/storage';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    "/", 
    "/login", 
    "/signup", 
    "/admin/login", 
    "/admin/signup",
    "/privacy",
    "/terms",
    "/api/auth/login", 
    "/api/auth/signup",
    "/api/admin/signup"
  ];
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  // Admin-only routes (excluding login/signup)
  const isAdminRoute = pathname.startsWith("/admin") && 
    !pathname.startsWith("/admin/login") && 
    !pathname.startsWith("/admin/signup");
  
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
  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Check admin access for admin routes (excluding login/signup)
  if (isAdminRoute && session?.userId) {
    try {
      console.log('🔐 Middleware: Checking admin access for:', pathname);
      console.log('👤 Session userId:', session.userId);
      console.log('📧 Session email:', session.email);
      console.log('👑 Session isAdmin:', session.isAdmin);
      
      const user = await storage.getUser(session.userId);
      console.log('📊 Database user found:', !!user);
      console.log('👑 Database isAdmin:', user?.isAdmin);
      
      if (!user?.isAdmin) {
        console.warn('❌ BLOCKED: User is not admin, redirecting to dashboard');
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      
      console.log('✅ ALLOWED: User is admin, allowing access to:', pathname);
    } catch (error) {
      console.error("❌ Middleware admin check error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
