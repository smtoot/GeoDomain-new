'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function TestLoginPage() {
  const [email, setEmail] = useState('seller1@test.com');
  const [password, setPassword] = useState('seller123');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Attempting login with:', { email, password });
      
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      console.log('SignIn result:', result);
      setResult(result);

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        console.log('Login successful, redirecting...');
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Test Login Page
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Debug login issues
          </p>
        </div>

        {/* Session Status */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Session Status</h3>
          <p className="text-sm text-gray-600">
            Status: <span className="font-mono">{status}</span>
          </p>
          {session && (
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                User: <span className="font-mono">{session.user?.name}</span>
              </p>
              <p className="text-sm text-gray-600">
                Email: <span className="font-mono">{session.user?.email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Role: <span className="font-mono">{(session.user as any)?.role}</span>
              </p>
            </div>
          )}
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Results */}
        {result && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Login Result</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Environment Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Environment Info</h3>
          <p className="text-sm text-gray-600">
            Current URL: <span className="font-mono">{window.location.href}</span>
          </p>
          <p className="text-sm text-gray-600">
            Expected: <span className="font-mono">http://localhost:3002/test-login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
