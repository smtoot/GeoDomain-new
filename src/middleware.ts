import { NextRequest, NextResponse } from 'next/server';
// import { getToken } from 'next-auth/jwt'; // Temporarily disabled due to import issues

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    try {
      const jwtModule = await import('next-auth/jwt');
      const getToken = (jwtModule as any).getToken;
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      // Check if user is authenticated
      if (!token) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check if user has admin role
      const userRole = token.role;
      if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        // Log security violation
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