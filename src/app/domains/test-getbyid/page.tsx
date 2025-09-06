"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function TestGetByIdPage() {
  const [testId, setTestId] = useState("cmf6jdqjz0009126h35bl2cxf"); // Known domain ID from debug page
  
  const { data: domainData, isLoading, error } = trpc.domains.getById.useQuery(
    { id: testId },
    {
      enabled: !!testId,
    }
  );

  const domain = domainData?.json?.data || domainData?.data || domainData?.json;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test getById Endpoint</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Test Domain ID:</label>
        <input
          type="text"
          value={testId}
          onChange={(e) => setTestId(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Enter domain ID to test"
        />
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">getById Test Results:</h2>
        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        <p>Error: {error ? error.message : 'None'}</p>
        <p>Domain Found: {domain ? 'Yes' : 'No'}</p>
        <p>Domain Name: {domain?.name || 'N/A'}</p>
        <p>Domain Status: {domain?.status || 'N/A'}</p>
        
        <h3 className="text-lg font-semibold mt-4 mb-2">Raw Response:</h3>
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto">
          {JSON.stringify(domainData, null, 2)}
        </pre>
        
        <h3 className="text-lg font-semibold mt-4 mb-2">Extracted Domain:</h3>
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto">
          {JSON.stringify(domain, null, 2)}
        </pre>
      </div>
    </div>
  );
}
