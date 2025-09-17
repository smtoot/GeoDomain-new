import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const GUEST_ROUTES = ['/login', '/register', '/forgot-password'];
const PROTECTED_ROUTES = ['/dashboard', '/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isGuestRoute = GUEST_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  if (isGuestRoute) {
    if (token) {
      // Authenticated users on guest routes are redirected to the dashboard.
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Unauthenticated users can access guest routes.
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    if (!token) {
      // Unauthenticated users on protected routes are redirected to the login page.
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Role-based access control for protected routes
    const userRole = token.role as string;
    const userStatus = token.status as string;

    if (userStatus !== 'ACTIVE') {
      // Inactive users are redirected to login with an error message.
      return NextResponse.redirect(new URL('/login?error=inactive', request.url));
    }

    if (pathname.startsWith('/admin')) {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        // Non-admins trying to access admin routes are redirected to their dashboard.
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    if (pathname.startsWith('/dashboard')) {
      if (!['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        // Users with invalid roles for the dashboard are sent to login.
        return NextResponse.redirect(new URL('/login?error=invalidrole', request.url));
      }
    }

    // User is authenticated and has the correct role, so allow access.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - site.webmanifest (webmanifest file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest).*)',
  ],
};