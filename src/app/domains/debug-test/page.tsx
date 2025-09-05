"use client";

import { trpc } from "@/lib/trpc";

export default function DebugTestPage() {
  const { data: debugData, isLoading, error } = trpc.domains.debugDatabase.useQuery();
  const { data: testData, isLoading: testLoading, error: testError } = trpc.domains.testGetAll.useQuery();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Test Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">debugDatabase Endpoint:</h2>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error ? error.message : 'None'}</p>
        <p>Success: {debugData?.success ? 'Yes' : 'No'}</p>
        <p>Total Domains: {debugData?.totalDomains || 0}</p>
        <p>Message: {debugData?.message || 'None'}</p>
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto mt-2">
          {JSON.stringify(debugData, null, 2)}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">testGetAll Endpoint:</h2>
        <p>Loading: {testLoading ? 'Yes' : 'No'}</p>
        <p>Error: {testError ? testError.message : 'None'}</p>
        <p>Success: {testData?.success ? 'Yes' : 'No'}</p>
        <p>Total Domains: {testData?.totalDomains || 0}</p>
        <p>Message: {testData?.message || 'None'}</p>
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto mt-2">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
