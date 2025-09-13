import { NextRequest, NextResponse } from 'next/server';
import { getServerAuthSession } from './auth';

/**
 * Server-side admin protection middleware
 * This ensures only ADMIN and SUPER_ADMIN users can access admin routes
 */
export async function requireAdminAccess(request: NextRequest) {
  try {
    const session = await getServerAuthSession();
    
    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Check if user has admin role
    const userRole = (session.user as any).role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      // Log security violation
      // Redirect to appropriate dashboard based on role
      if (userRole === 'SELLER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else if (userRole === 'BUYER') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    
    // User has admin access
    return null;
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

/**
 * Client-side admin access check
 * This can be used in React components to verify admin access
 */
export function isAdminUser(session: any): boolean {
  if (!session?.user) return false;
  const userRole = (session.user as any).role;
  return ['ADMIN', 'SUPER_ADMIN'].includes(userRole);
}

/**
 * Get user role safely
 */
export function getUserRole(session: any): string | null {
  if (!session?.user) return null;
  return (session.user as any).role || null;
}
