import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getServerAuthSession } from '@/lib/security/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const showSecrets = url.searchParams.get('secrets') === 'true';
    
    // Get JWT token from middleware
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });
    
    // Get server session
    const session = await getServerAuthSession();
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasToken: !!token,
      hasSession: !!session,
      tokenInfo: token ? {
        id: token.id,
        role: token.role,
        status: token.status,
        exp: token.exp,
        iat: token.iat,
        ...(showSecrets && { fullToken: token })
      } : null,
      sessionInfo: session ? {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role,
          status: (session.user as any).status,
        }
      } : null,
      environmentVariables: {
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        vercelUrl: process.env.VERCEL_URL,
        ...(showSecrets && {
          nextAuthSecret: process.env.NEXTAUTH_SECRET,
          databaseUrl: process.env.DATABASE_URL,
          nextAuthUrl: process.env.NEXTAUTH_URL,
        })
      },
      cookies: {
        sessionToken: request.cookies.get('next-auth.session-token')?.value ? 'Present' : 'Missing',
        csrfToken: request.cookies.get('next-auth.csrf-token')?.value ? 'Present' : 'Missing',
        callbackUrl: request.cookies.get('next-auth.callback-url')?.value ? 'Present' : 'Missing',
      },
      headers: {
        userAgent: request.headers.get('user-agent'),
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      }
    };
    
    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Auth debug error:', error);
    return NextResponse.json({
      error: 'Failed to get auth debug info',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
