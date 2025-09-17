'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * SessionSync component ensures session state consistency across the app
 * This component doesn't render anything but helps maintain session state
 */
export function SessionSync() {
  const { data: session, status, update } = useSession();

  useEffect(() => {
    // Force session update on mount to ensure consistency
    if (status === 'authenticated' && session?.user) {
      // Update session to ensure all components have the latest data
      update();
    }
  }, [status, session, update]);

  // This component doesn't render anything
  return null;
}
