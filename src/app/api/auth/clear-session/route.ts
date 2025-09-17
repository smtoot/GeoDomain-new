import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create response that clears all auth cookies
    const response = NextResponse.json({
      success: true,
      message: 'All authentication cookies cleared successfully. Please refresh the page and log in again.',
      timestamp: new Date().toISOString(),
      instructions: [
        '1. Refresh this page or go to the login page',
        '2. Log in with your credentials',
        '3. The dashboard pages should now work correctly'
      ]
    });
    
    // Clear all NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token',
      'next-auth.session-token.sig',
      'next-auth.csrf-token.sig'
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Also try to clear with different domain settings
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });
    });
    
    // Set cache headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error('Session clear error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear session',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
