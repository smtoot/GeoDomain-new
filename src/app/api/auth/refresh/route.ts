import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/security/auth';
import { getToken } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerAuthSession();
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No active session found'
      }, { status: 401 });
    }
    
    // Get current token
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No valid token found'
      }, { status: 401 });
    }
    
    // Check for token/session mismatch
    const tokenId = token.id;
    const sessionId = session.user.id;
    
    if (tokenId !== sessionId) {
      console.log('Token/Session mismatch detected:', {
        tokenId,
        sessionId,
        tokenRole: token.role,
        sessionRole: (session.user as any).role
      });
      
      // Return mismatch info for debugging
      return NextResponse.json({
        success: false,
        error: 'Token/Session mismatch',
        details: {
          tokenId,
          sessionId,
          tokenRole: token.role,
          sessionRole: (session.user as any).role,
          recommendation: 'Please log out and log back in to refresh your session'
        }
      }, { status: 400 });
    }
    
    // Session is valid and consistent
    return NextResponse.json({
      success: true,
      message: 'Session is valid and consistent',
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: (session.user as any).role,
        status: (session.user as any).status
      }
    });
    
  } catch (error) {
    console.error('Session refresh error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh session',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
