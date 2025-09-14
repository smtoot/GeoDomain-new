"use client";

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Shield, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface DashboardGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function DashboardGuard({ children, fallback }: DashboardGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkDashboardAccess = () => {
      // Wait for session to load
      if (status === 'loading') {
        return;
      }

      // Check if user is authenticated
      if (status === 'unauthenticated' || !session?.user) {
        setIsChecking(false);
        // Redirect to login
        if (status !== 'loading') {
          window.location.href = '/login';
        }
        return;
      }

      // Check if user has valid role
      const userRole = (session.user as any).role;
      if (!['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
        setIsChecking(false);
        // Redirect to login
        if (status !== 'loading') {
          window.location.href = '/login';
        }
        return;
      }

      // Check if user is active
      const userStatus = (session.user as any).status;
      if (userStatus !== 'ACTIVE') {
        setIsChecking(false);
        // Redirect to login
        if (status !== 'loading') {
          window.location.href = '/login';
        }
        return;
      }

      // User has valid access
      setIsChecking(false);
    };

    checkDashboardAccess();
  }, [session, status, router]);

  // Show loading while checking
  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have valid access
  if (status === 'unauthenticated' || !session?.user || !['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role) || (session.user as any).status !== 'ACTIVE') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User has valid access, render children
  return <>{children}</>;
}
