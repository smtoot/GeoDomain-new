'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      if (status === 'authenticated') {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Session Debug Information</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Session Status:</h2>
            <p className="text-lg font-mono">{status}</p>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">Session Data:</h2>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg">
            <h2 className="font-semibold mb-2">User Information:</h2>
            {session?.user ? (
              <div className="space-y-2">
                <p><strong>ID:</strong> {session.user.id}</p>
                <p><strong>Email:</strong> {session.user.email}</p>
                <p><strong>Name:</strong> {session.user.name}</p>
                <p><strong>Role:</strong> {(session.user as any).role}</p>
                <p><strong>Status:</strong> {(session.user as any).status}</p>
              </div>
            ) : (
              <p>No user data available</p>
            )}
          </div>

          <div className="p-4 bg-blue-100 rounded-lg">
            <p className="text-blue-800">
              <strong>Note:</strong> This page will automatically redirect you to the appropriate dashboard in 5 seconds.
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
