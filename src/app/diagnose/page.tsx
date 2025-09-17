'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

export default function DiagnosePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [testResults, setTestResults] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);

  // Test tRPC connection
  const { data: statsData, isLoading: statsLoading, error: statsError } = trpc.dashboard.getSellerStats.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const { data: activityData, isLoading: activityLoading, error: activityError } = trpc.dashboard.getRecentActivity.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const runDiagnostics = async () => {
    setIsTesting(true);
    const results: any = {};

    try {
      // Test 1: Session Status
      results.sessionStatus = status;
      results.sessionData = session;

      // Test 2: API Endpoints
      const apiTests = await Promise.allSettled([
        fetch('/api/auth/session'),
        fetch('/api/trpc/dashboard.getSellerStats'),
        fetch('/api/trpc/dashboard.getRecentActivity'),
      ]);

      results.apiTests = apiTests.map((test, index) => ({
        endpoint: ['/api/auth/session', '/api/trpc/dashboard.getSellerStats', '/api/trpc/dashboard.getRecentActivity'][index],
        status: test.status,
        result: test.status === 'fulfilled' ? test.value.status : test.reason,
      }));

      // Test 3: tRPC Queries
      results.trpcStats = {
        loading: statsLoading,
        error: statsError,
        data: statsData,
      };

      results.trpcActivity = {
        loading: activityLoading,
        error: activityError,
        data: activityData,
      };

      // Test 4: Dashboard Access
      try {
        const dashboardResponse = await fetch('/dashboard', { method: 'HEAD' });
        results.dashboardAccess = {
          status: dashboardResponse.status,
          headers: Object.fromEntries(dashboardResponse.headers.entries()),
        };
      } catch (error) {
        results.dashboardAccess = { error: error.message };
      }

    } catch (error) {
      results.error = error.message;
    }

    setTestResults(results);
    setIsTesting(false);
  };

  useEffect(() => {
    if (status === 'authenticated') {
      runDiagnostics();
    }
  }, [status]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Dashboard Access Diagnostics</h1>
        
        <div className="grid gap-6">
          {/* Session Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Session Status</h2>
            <div className="space-y-2">
              <p><strong>Status:</strong> {status}</p>
              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>

          {/* tRPC Status */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">tRPC Query Status</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">Seller Stats</h3>
                <p>Loading: {statsLoading ? 'Yes' : 'No'}</p>
                <p>Error: {statsError ? 'Yes' : 'No'}</p>
                {statsError && (
                  <pre className="text-xs bg-red-100 p-2 rounded mt-2">
                    {JSON.stringify(statsError, null, 2)}
                  </pre>
                )}
                {statsData && (
                  <pre className="text-xs bg-green-100 p-2 rounded mt-2">
                    {JSON.stringify(statsData, null, 2)}
                  </pre>
                )}
              </div>
              <div>
                <h3 className="font-semibold">Recent Activity</h3>
                <p>Loading: {activityLoading ? 'Yes' : 'No'}</p>
                <p>Error: {activityError ? 'Yes' : 'No'}</p>
                {activityError && (
                  <pre className="text-xs bg-red-100 p-2 rounded mt-2">
                    {JSON.stringify(activityError, null, 2)}
                  </pre>
                )}
                {activityData && (
                  <pre className="text-xs bg-green-100 p-2 rounded mt-2">
                    {JSON.stringify(activityData, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Diagnostic Results</h2>
            <button
              onClick={runDiagnostics}
              disabled={isTesting}
              className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isTesting ? 'Running Tests...' : 'Run Diagnostics'}
            </button>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-x-4">
              <button
                onClick={handleGoToDashboard}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Try Dashboard Access
              </button>
              <a
                href="/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 inline-block"
              >
                Direct Dashboard Link
              </a>
              <a
                href="/test-dashboard"
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 inline-block"
              >
                Test Dashboard Page
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
