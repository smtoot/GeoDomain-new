import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      // Check if user is authenticated
      if (!token) {
        console.log('🚨 Admin route access denied: No authentication token');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check if user has admin role
      const userRole = token.role;
      if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        // Log security violation
        console.error('🚨 SECURITY VIOLATION: Non-admin user attempted to access admin route', {
          userId: token.sub,
          userEmail: token.email,
          userRole: userRole,
          requestedPath: pathname,
          timestamp: new Date().toISOString()
        });
        
        // Redirect based on role
        if (userRole === 'SELLER') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else if (userRole === 'BUYER') {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
          return NextResponse.redirect(new URL('/login', request.url));
        }
      }
      
      // User has admin access, allow request
      return NextResponse.next();
    } catch (error) {
      console.error('Error in admin middleware:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*'
  ]
};