'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LoadingCard } from '@/components/ui/loading';

interface AuthGuardOptions {
  requiredRole?: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
  redirectTo?: string;
  loadingText?: string;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { requiredRole, redirectTo = '/login', loadingText = 'Checking authentication...' } = options;

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (status === 'unauthenticated') {
      router.push(redirectTo);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role;
      
      // Check role requirements
      if (requiredRole) {
        if (requiredRole === 'ADMIN' && userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
          router.push('/unauthorized');
          return;
        }
        
        if (requiredRole === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
          router.push('/unauthorized');
          return;
        }
        
        if (requiredRole === 'SELLER' && userRole !== 'SELLER') {
          router.push('/unauthorized');
          return;
        }
        
        if (requiredRole === 'BUYER' && userRole !== 'BUYER') {
          router.push('/unauthorized');
          return;
        }
      }

      // Redirect admins to admin dashboard
      if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
        if (!window.location.pathname.startsWith('/admin')) {
          router.push('/admin');
          return;
        }
      }
    }
  }, [status, session, router, requiredRole, redirectTo]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return {
      isLoading: true,
      session: null,
      user: null,
      LoadingComponent: () => <LoadingCard title={loadingText} />
    };
  }

  // Show loading while redirecting
  if (status === 'unauthenticated' || (requiredRole && session?.user && !checkRole(session.user, requiredRole))) {
    return {
      isLoading: true,
      session: null,
      user: null,
      LoadingComponent: () => <LoadingCard title="Redirecting..." />
    };
  }

  return {
    isLoading: false,
    session,
    user: session?.user,
    LoadingComponent: null
  };
}

function checkRole(user: any, requiredRole: string): boolean {
  const userRole = user.role;
  
  if (requiredRole === 'ADMIN') {
    return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  }
  
  return userRole === requiredRole;
}
