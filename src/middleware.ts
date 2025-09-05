import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Simple logging for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware called:', {
      pathname,
      nodeEnv: process.env.NODE_ENV,
      isDev: process.env.NODE_ENV === 'development',
      userAgent: userAgent.substring(0, 50) + '...',
    });
    console.log('Development mode detected, applying minimal security');
  }

  // Create response with basic security headers
  const response = NextResponse.next();

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
