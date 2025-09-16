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

      // Authentication is handled by middleware, just show loading states
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

  // If unauthenticated, show loading (middleware will handle redirect)
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  // User has valid access, render children
  return <>{children}</>;
}
