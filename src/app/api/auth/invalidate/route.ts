import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/security/auth';

export async function GET(request: NextRequest) {
  return handleSessionInvalidation(request);
}

export async function POST(request: NextRequest) {
  return handleSessionInvalidation(request);
}

async function handleSessionInvalidation(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active session found'
      }, { status: 401 });
    }
    
    // Create response that clears all auth cookies
    const response = NextResponse.json({
      success: true,
      message: 'Session invalidated successfully. Please log in again.',
      redirectTo: '/login'
    });
    
    // Clear all NextAuth cookies
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token'
    ];
    
    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });
    
    return response;
    
  } catch (error) {
    console.error('Session invalidation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to invalidate session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
