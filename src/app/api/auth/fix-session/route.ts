import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/security/auth';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  return handleSessionFix(request);
}

export async function POST(request: NextRequest) {
  return handleSessionFix(request);
}

async function handleSessionFix(request: NextRequest) {
  try {
    // Get current session and token
    const session = await getServerAuthSession();
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!session || !token) {
      return NextResponse.json({
        success: false,
        error: 'No active session or token found'
      }, { status: 401 });
    }
    
    // Check for mismatch
    const tokenId = token.id;
    const sessionId = session.user.id;
    const tokenRole = token.role;
    const sessionRole = (session.user as any).role;
    
    const hasMismatch = tokenId !== sessionId || tokenRole !== sessionRole;
    
    if (hasMismatch) {
      console.log('Session mismatch detected:', {
        tokenId,
        sessionId,
        tokenRole,
        sessionRole
      });
      
      // Create response that will force session refresh
      const response = NextResponse.json({
        success: true,
        hasMismatch: true,
        message: 'Session mismatch detected. Forcing session refresh.',
        tokenData: {
          id: tokenId,
          role: tokenRole,
          status: token.status
        },
        sessionData: {
          id: sessionId,
          role: sessionRole,
          status: (session.user as any).status
        },
        recommendation: 'Session will be refreshed automatically'
      });
      
      // Force session refresh by clearing and resetting cookies
      response.cookies.set('next-auth.session-token', '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      return response;
    }
    
    // No mismatch, session is consistent
    return NextResponse.json({
      success: true,
      hasMismatch: false,
      message: 'Session is consistent',
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
        status: (session.user as any).status
      }
    });
    
  } catch (error) {
    console.error('Session fix error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fix session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
