"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export function RedirectGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Only redirect if we're on the login page and user is authenticated
    if (pathname === '/login' && status === 'authenticated' && session?.user && !hasRedirected) {
      console.log('🔍 [REDIRECT GUARD] User authenticated on login page, redirecting...', {
        user: session.user.email,
        role: (session.user as any).role,
        pathname
      });
      
      setHasRedirected(true);
      
      // Determine redirect URL based on role
      const redirectUrl = (session.user as any).role === 'ADMIN' || (session.user as any).role === 'SUPER_ADMIN' 
        ? "/admin" 
        : "/dashboard";
      
      console.log('🔍 [REDIRECT GUARD] Redirecting to:', redirectUrl);
      
      // Use router.replace to avoid adding to history
      router.replace(redirectUrl);
    }
  }, [session, status, pathname, hasRedirected, router]);

  return null; // This component doesn't render anything
}
