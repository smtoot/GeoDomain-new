'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';

export default function WholesaleDebugPage() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<any>(null);

  // Test wholesale config query
  const { data: config, error: configError } = trpc.wholesaleConfig.getConfig.useQuery(undefined, {
    retry: false,
  });

  // Test wholesale domains query
  const { 
    data: wholesaleData, 
    error: wholesaleError,
    isLoading: wholesaleLoading 
  } = trpc.wholesale.getMyWholesaleDomains.useQuery({
    page: 1,
    limit: 10,
  }, {
    retry: false,
  });

  useEffect(() => {
    if (configError) {
      setError({ type: 'config', error: configError });
    } else if (wholesaleError) {
      setError({ type: 'wholesale', error: wholesaleError });
    }
  }, [configError, wholesaleError]);

  if (status === 'loading') {
    return <div>Loading session...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Wholesale Debug Page</h1>
      
      <div className="space-y-6">
        {/* Session Info */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Session Info</h2>
          <pre className="text-sm">
            {JSON.stringify({
              status,
              user: session?.user ? {
                id: session.user.id,
                email: session.user.email,
                role: (session.user as any).role
              } : null
            }, null, 2)}
          </pre>
        </div>

        {/* Config Query */}
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Config Query</h2>
          <p><strong>Loading:</strong> {config !== undefined ? 'Complete' : 'Loading...'}</p>
          <p><strong>Error:</strong> {configError ? configError.message : 'None'}</p>
          <pre className="text-sm mt-2">
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>

        {/* Wholesale Query */}
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Wholesale Query</h2>
          <p><strong>Loading:</strong> {wholesaleLoading ? 'Yes' : 'Complete'}</p>
          <p><strong>Error:</strong> {wholesaleError ? wholesaleError.message : 'None'}</p>
          <pre className="text-sm mt-2">
            {JSON.stringify(wholesaleData, null, 2)}
          </pre>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 p-4 rounded">
            <h2 className="font-semibold mb-2 text-red-800">Error Detected</h2>
            <p><strong>Type:</strong> {error.type}</p>
            <pre className="text-sm text-red-700">
              {JSON.stringify(error.error, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
