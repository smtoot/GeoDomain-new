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

  // Check seller's domains to see what can be added to wholesale
  const { 
    data: sellerDomains, 
    error: sellerDomainsError,
    isLoading: sellerDomainsLoading 
  } = trpc.domains.getMyDomains.useQuery({
    page: 1,
    limit: 50,
  }, {
    retry: false,
  });

  useEffect(() => {
    if (configError) {
      setError({ type: 'config', error: configError });
    } else if (wholesaleError) {
      setError({ type: 'wholesale', error: wholesaleError });
    } else if (sellerDomainsError) {
      setError({ type: 'sellerDomains', error: sellerDomainsError });
    }
  }, [configError, wholesaleError, sellerDomainsError]);

  if (status === 'loading') {
    return <div>Loading session...</div>;
  }

  // Filter eligible domains for wholesale
  const eligibleDomains = sellerDomains?.data?.filter((domain) => {
    return ['VERIFIED', 'PUBLISHED', 'ACTIVE'].includes(domain.status) && 
           !['DRAFT', 'REJECTED', 'DELETED', 'PENDING_VERIFICATION'].includes(domain.status);
  }) || [];

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

        {/* Seller Domains Query */}
        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Your Domains</h2>
          <p><strong>Loading:</strong> {sellerDomainsLoading ? 'Yes' : 'Complete'}</p>
          <p><strong>Error:</strong> {sellerDomainsError ? sellerDomainsError.message : 'None'}</p>
          <p><strong>Total Domains:</strong> {sellerDomains?.data?.length || 0}</p>
          <p><strong>Eligible for Wholesale:</strong> {eligibleDomains.length}</p>
          
          {eligibleDomains.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Eligible Domains:</h3>
              <div className="space-y-2">
                {eligibleDomains.map((domain) => (
                  <div key={domain.id} className="bg-white p-2 rounded border">
                    <p><strong>Name:</strong> {domain.name}</p>
                    <p><strong>Status:</strong> {domain.status}</p>
                    <p><strong>Price:</strong> ${domain.price}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {sellerDomains?.data && sellerDomains.data.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">All Your Domains:</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sellerDomains.data.map((domain) => (
                  <div key={domain.id} className="bg-white p-2 rounded border text-sm">
                    <p><strong>{domain.name}</strong> - {domain.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
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

        {/* Solution */}
        <div className="bg-green-100 p-4 rounded">
          <h2 className="font-semibold mb-2 text-green-800">Solution</h2>
          <p className="text-green-700">
            {eligibleDomains.length > 0 
              ? `You have ${eligibleDomains.length} domains that can be added to wholesale. Go to the main wholesale page and click "Add Domain" to add them.`
              : sellerDomains?.data && sellerDomains.data.length > 0
                ? "You have domains but none are eligible for wholesale (need to be VERIFIED, PUBLISHED, or ACTIVE status)."
                : "You don't have any domains yet. Create some domains first, then add them to wholesale."
            }
          </p>
        </div>
      </div>
    </div>
  );
}