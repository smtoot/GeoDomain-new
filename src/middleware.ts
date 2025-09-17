import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for API routes and static files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }
  
  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    try {
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
      console.error('Admin middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      // Check if user is authenticated
      if (!token) {
        console.log('Dashboard middleware: No token found');
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check if user has valid role for dashboard access
      const userRole = token.role;
      if (!['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        console.log('Dashboard middleware: Invalid role:', userRole);
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Check if user is active
      const userStatus = token.status;
      if (userStatus !== 'ACTIVE') {
        console.log('Dashboard middleware: User not active:', userStatus);
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Log successful authentication for debugging
      console.log('Dashboard middleware: User authenticated:', {
        id: token.id,
        role: token.role,
        status: token.status
      });
      
      // User has valid dashboard access, allow request
      return NextResponse.next();
    } catch (error) {
      console.error('Dashboard middleware error:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  
  
  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*'
  ]
};