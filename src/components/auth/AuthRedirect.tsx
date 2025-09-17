"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AuthRedirectProps {
  children: React.ReactNode;
}

export function AuthRedirect({ children }: AuthRedirectProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if we're authenticated and haven't redirected yet
    if (status === 'authenticated' && session?.user && !hasRedirected) {
      setHasRedirected(true);
      
      // Determine redirect URL based on role
      const redirectUrl = (session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPER_ADMIN' 
        ? "/admin" 
        : "/dashboard";
      
      // Use router.push for client-side navigation
      router.push(redirectUrl);
    }
  }, [session, status, hasRedirected, router]);

  // Show redirecting state if user is authenticated and we're redirecting
  if (status === 'authenticated' && session?.user && hasRedirected) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
