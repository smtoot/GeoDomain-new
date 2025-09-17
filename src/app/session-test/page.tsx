'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function SessionTestPage() {
  const { data: session, status } = useSession();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signIn('credentials', {
        email: 'seller1@test.com',
        password: 'seller123',
        redirect: false,
      });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
  };

  const testSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      console.log('Session API response:', data);
      alert(`Session API Response: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('Session test error:', error);
      alert(`Session test error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Session Test</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Current Session:</h3>
            <p>Status: <span className={status === 'authenticated' ? 'text-green-600' : 'text-red-600'}>{status}</span></p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="space-y-2">
            {status === 'unauthenticated' ? (
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoggingIn ? 'Logging in...' : 'Login as Seller'}
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
              >
                Logout
              </button>
            )}
            
            <button
              onClick={testSession}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Test Session API
            </button>
          </div>

          <div className="text-center space-x-4">
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Go to Dashboard
            </a>
            <a href="/diagnose" className="text-purple-600 hover:underline">
              Run Diagnostics
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
