import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { applySecurityHeaders } from './lib/security/security-headers';

export async function middleware(request: NextRequest) {
  // By default, we continue the request chain.
  let response = NextResponse.next();

  try {
    const { pathname } = request.nextUrl;
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    // --- Route Protection ---

    // Protect /admin routes
    if (pathname.startsWith('/admin')) {
      if (!token || !['ADMIN', 'SUPER_ADMIN'].includes(token.role as string)) {
        // If auth fails, redirect to login.
        response = NextResponse.redirect(new URL('/login', request.url));
      }
    }
    // Protect /dashboard routes
    else if (pathname.startsWith('/dashboard')) {
      if (
        !token ||
        !['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(token.role as string) ||
        token.status !== 'ACTIVE'
      ) {
        // If auth fails, redirect to login.
        response = NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } catch (error) {
    // In case of any error during authentication, redirect to login as a failsafe.
    response = NextResponse.redirect(new URL('/login', request.url));
  }

  // --- Header Application ---
  // Apply security headers to the response, whether it's a redirect or the original request.
  return applySecurityHeaders(request, response);
}

export const config = {
  // This matcher ensures the middleware runs on all pages,
  // while excluding API routes, static files, and images
  // where security headers are not needed or are handled differently.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|site.webmanifest|robots.txt|icon.svg).*)',
  ],
};