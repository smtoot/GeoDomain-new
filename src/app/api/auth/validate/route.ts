import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from '@/lib/security/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    if (session) {
      return NextResponse.json({
        valid: true,
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          role: (session.user as any).role,
          status: (session.user as any).status,
        }
      });
    } else {
      return NextResponse.json({
        valid: false,
        error: 'No valid session found'
      }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: 'Session validation failed'
    }, { status: 500 });
  }
}
