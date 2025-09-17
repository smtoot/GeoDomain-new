'use client';

import { useSession, signIn } from 'next-auth/react';
import { useState } from 'react';

export default function DebugLoginPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        email: 'seller1@test.com',
        password: 'seller123',
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        console.log('Login successful:', result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Debug Login</h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Session Status:</h3>
            <p className="text-sm text-gray-600">Status: {status}</p>
            <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold">Test Login:</h3>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login as John Seller'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          )}

          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:underline">
              Go to Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
