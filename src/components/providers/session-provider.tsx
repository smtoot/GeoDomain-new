"use client";

import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider 
      refetchInterval={0} // Disable automatic refetching to prevent race conditions
      refetchOnWindowFocus={false} // Disable refetch on window focus to prevent inconsistencies
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </SessionProvider>
  );
}
