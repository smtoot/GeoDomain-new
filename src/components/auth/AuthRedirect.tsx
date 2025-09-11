"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface AuthRedirectProps {
  children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { data: session, status } = useSession();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      console.log('🔍 [AUTH REDIRECT] User authenticated, preparing redirect...', {
        user: session.user.email,
        role: (session.user as any).role
      });
      
      setIsRedirecting(true);
      
      // Determine redirect URL based on role
      const redirectUrl = (session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPER_ADMIN' 
        ? "/admin" 
        : "/dashboard";
      
      console.log('🔍 [AUTH REDIRECT] Redirecting to:', redirectUrl);
      
      // Use setTimeout to ensure the redirect happens after the component renders
      const redirectTimer = setTimeout(() => {
        window.location.href = redirectUrl;
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [session, status]);

  // Show redirecting state if user is authenticated
  if (status === 'authenticated' && isRedirecting) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
