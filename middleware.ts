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
    "/api/admin/signup",
    "/api/debug"
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
    // Redirect to appropriate login page based on route
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Handle logged-in users trying to access login/signup pages
  if (isLoggedIn && session?.userId) {
    try {
      const user = await storage.getUser(session.userId);
      const isAdmin = user?.isAdmin || false;
      
      // Logged-in users trying to access regular login/signup
      if (pathname === "/login" || pathname === "/signup") {
        console.log('🔒 Logged-in user accessing auth page - isAdmin:', isAdmin);
        // Admins should NEVER go to /dashboard, only to /admin
        if (isAdmin) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        // Regular users go to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      
      // Logged-in users trying to access admin login/signup
      if (pathname === "/admin/login" || pathname === "/admin/signup") {
        console.log('🔒 Logged-in user accessing admin auth page - isAdmin:', isAdmin);
        // Admins already logged in should go to admin dashboard
        if (isAdmin) {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        // Regular users should NEVER access admin pages - redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      console.error("Error checking user admin status in middleware:", error);
    }
  }
  
  // Check admin access for admin routes (excluding login/signup)
  if (isAdminRoute) {
    console.log('🔐 Middleware: Admin route detected:', pathname);
    console.log('🔐 Session exists:', !!session);
    console.log('🔐 Session userId:', session?.userId);
    console.log('🔐 Session isAdmin:', session?.isAdmin);
    
    // First check: Must have session
    if (!session || !session.userId) {
      console.warn('❌ BLOCKED: No session, redirecting to admin login');
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    
    try {
      // Second check: Verify admin status from database
      const user = await storage.getUser(session.userId);
      console.log('📊 Database user found:', !!user);
      console.log('📊 Database user email:', user?.email);
      console.log('📊 Database isAdmin:', user?.isAdmin);
      
      if (!user) {
        console.warn('❌ BLOCKED: User not found in database, redirecting to admin login');
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }
      
      if (!user.isAdmin) {
        console.warn('❌ BLOCKED: User is not admin, redirecting to dashboard');
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      
      console.log('✅ ALLOWED: Admin access granted to:', pathname);
    } catch (error) {
      console.error("❌ Middleware admin check error:", error);
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }
  
  // Prevent admins from accessing regular user routes
  const regularUserRoutes = ["/dashboard", "/fields", "/adjacent-fields", "/profile", "/subscription"];
  const isRegularUserRoute = regularUserRoutes.some(route => pathname.startsWith(route));
  
  if (isRegularUserRoute && isLoggedIn && session?.userId) {
    try {
      const user = await storage.getUser(session.userId);
      if (user?.isAdmin) {
        console.warn('❌ BLOCKED: Admin trying to access regular user page, redirecting to /admin');
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } catch (error) {
      console.error("❌ Middleware user route check error:", error);
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
