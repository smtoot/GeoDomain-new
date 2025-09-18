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
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const userRole = token.role as string;
    const userStatus = token.status as string;

    if (userStatus !== 'ACTIVE') {
      return NextResponse.redirect(new URL('/login?error=inactive', request.url));
    }

    if (pathname.startsWith('/admin')) {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest).*)',
  ],
};