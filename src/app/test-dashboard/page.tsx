'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // eslint-disable-next-line no-console
      console.log('Session data:', session);
      // eslint-disable-next-line no-console
      console.log('User role:', (session.user as { role: string }).role);
    }
  }, [session, status]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Dashboard Test</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Session Status:</h3>
            <p className="text-sm text-gray-600">Status: {status}</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <button
            onClick={handleGoToDashboard}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>

          <div className="text-center">
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Direct Link to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
