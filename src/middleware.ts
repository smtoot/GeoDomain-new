import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createEnhancedSecurityManager, createRateLimitResponse, createSecurityViolationResponse } from '@/lib/security-manager';
import { getClientIP } from '@/lib/security-utils';
import { createRateLimiter } from '@/lib/rate-limiter';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Create enhanced security manager for this request
  const securityManager = createEnhancedSecurityManager(request);
  
  // Apply security headers and basic security
  const response = securityManager.applySecurity(request, pathname);

  // Check rate limiting with enhanced rate limiter
  const rateLimiter = createRateLimiter();
  const rateLimitResult = await rateLimiter.checkRateLimit(pathname, ip, userAgent);
  if (!rateLimitResult.allowed) {
    return createRateLimitResponse(rateLimitResult.retryAfter || 60);
  }

  // Perform security checks (only in production)
  const securityChecks = securityManager.performSecurityChecks(request, ip, userAgent);
  if (!securityChecks.safe) {
    // Log suspicious activity
    console.warn('Suspicious activity detected:', {
      ip,
      userAgent,
      pathname,
      reason: securityChecks.reason,
    });

    return createSecurityViolationResponse(securityChecks.reason || 'Unknown security violation');
  }

  // Log request for debugging (development mode)
  if (securityManager.isDevelopment()) {
    console.log('Middleware called:', {
      pathname,
      nodeEnv: process.env.NODE_ENV,
      isDev: securityManager.isDevelopment(),
      ip,
      userAgent: userAgent.substring(0, 50) + '...',
    });
    console.log('Development mode detected, applying minimal security');
  }

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
