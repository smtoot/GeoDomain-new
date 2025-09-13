'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RefreshSessionPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      if (status === 'authenticated') {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [status, router]);

  const handleRefreshSession = async () => {
    setIsRefreshing(true);
    try {
      // Force session update
      await update();
      } catch (error) {
      } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    // Clear all cookies and session data
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
    
    // Sign out from NextAuth
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Session Refresh</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Current Session Status:</h2>
            <p className="text-lg font-mono">{status}</p>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Session Data:</h2>
            <pre className="text-sm overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Session'}
            </button>
            
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Go to Dashboard
            </button>
          </div>

          <div className="p-4 bg-blue-100 rounded-lg">
            <p className="text-blue-800">
              <strong>Note:</strong> This page will automatically redirect you in 3 seconds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
