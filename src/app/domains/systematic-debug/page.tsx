"use client";

import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function SystematicDebugPage() {
  const [selectedDomainId, setSelectedDomainId] = useState("");
  
  // Get all domains to see what IDs exist
  const { data: allDomainsData, isLoading: allLoading, error: allError } = trpc.domains.testGetAll.useQuery();
  
  // Test getById with selected domain ID
  const { data: domainByIdData, isLoading: byIdLoading, error: byIdError } = trpc.domains.getById.useQuery(
    { id: selectedDomainId },
    {
      enabled: !!selectedDomainId,
    }
  );

  const allDomains = allDomainsData?.json?.sampleDomains || allDomainsData?.sampleDomains || allDomainsData?.data || [];
  const domainById = domainByIdData?.json?.data || domainByIdData?.data || domainByIdData?.json;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Systematic Debug: Domain Details Issue</h1>
      
      {/* Step 1: Check what domains exist */}
      <div className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Step 1: Available Domains in Database</h2>
        <p>Loading: {allLoading ? 'Yes' : 'No'}</p>
        <p>Error: {allError ? allError.message : 'None'}</p>
        <p>Total Domains Found: {allDomains.length}</p>
        
        {allDomains.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Domain IDs and Names:</h3>
            <div className="space-y-2">
              {allDomains.map((domain: any, index: number) => (
                <div key={index} className="flex items-center gap-4 p-2 bg-white rounded border">
                  <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">
                    {domain.id}
                  </span>
                  <span className="font-medium">{domain.name}</span>
                  <span className="text-sm text-gray-600">Status: {domain.status}</span>
                  <button
                    onClick={() => setSelectedDomainId(domain.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Test This ID
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">Raw All Domains Response</summary>
          <pre className="bg-white p-4 rounded text-xs overflow-auto mt-2">
            {JSON.stringify(allDomainsData, null, 2)}
          </pre>
        </details>
      </div>

      {/* Step 2: Test getById endpoint */}
      <div className="mb-8 p-6 border rounded-lg bg-blue-50">
        <h2 className="text-xl font-semibold mb-4">Step 2: Test getById Endpoint</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Selected Domain ID:</label>
          <input
            type="text"
            value={selectedDomainId}
            onChange={(e) => setSelectedDomainId(e.target.value)}
            className="border rounded px-3 py-2 w-full max-w-md font-mono"
            placeholder="Enter domain ID to test"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Request Status:</h3>
            <p>Loading: {byIdLoading ? 'Yes' : 'No'}</p>
            <p>Error: {byIdError ? byIdError.message : 'None'}</p>
            <p>Domain Found: {domainById ? 'Yes' : 'No'}</p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Domain Details:</h3>
            {domainById ? (
              <div className="text-sm">
                <p><strong>Name:</strong> {domainById.name}</p>
                <p><strong>Status:</strong> {domainById.status}</p>
                <p><strong>Price:</strong> {domainById.price}</p>
                <p><strong>ID:</strong> {domainById.id}</p>
              </div>
            ) : (
              <p className="text-gray-600">No domain data</p>
            )}
          </div>
        </div>
        
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">Raw getById Response</summary>
          <pre className="bg-white p-4 rounded text-xs overflow-auto mt-2">
            {JSON.stringify(domainByIdData, null, 2)}
          </pre>
        </details>
      </div>

      {/* Step 3: Data Access Pattern Analysis */}
      <div className="mb-8 p-6 border rounded-lg bg-green-50">
        <h2 className="text-xl font-semibold mb-4">Step 3: Data Access Pattern Analysis</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Response Structure Analysis:</h3>
            <div className="text-sm space-y-1">
              <p>• domainByIdData?.json?.data: {domainByIdData?.json?.data ? 'EXISTS' : 'undefined'}</p>
              <p>• domainByIdData?.data: {domainByIdData?.data ? 'EXISTS' : 'undefined'}</p>
              <p>• domainByIdData?.json: {domainByIdData?.json ? 'EXISTS' : 'undefined'}</p>
              <p>• Final extracted domain: {domainById ? 'EXISTS' : 'undefined'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Response Type Analysis:</h3>
            <div className="text-sm space-y-1">
              <p>• typeof domainByIdData: {typeof domainByIdData}</p>
              <p>• domainByIdData keys: {domainByIdData ? Object.keys(domainByIdData).join(', ') : 'none'}</p>
              {domainByIdData?.json && (
                <p>• domainByIdData.json keys: {Object.keys(domainByIdData.json).join(', ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: URL Structure Test */}
      <div className="mb-8 p-6 border rounded-lg bg-yellow-50">
        <h2 className="text-xl font-semibold mb-4">Step 4: URL Structure Test</h2>
        
        {selectedDomainId && (
          <div>
            <p className="mb-2">If you click this link, it should take you to the domain details page:</p>
            <a 
              href={`/domains/${selectedDomainId}`}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              /domains/{selectedDomainId}
            </a>
            <p className="text-sm text-gray-600 mt-2">
              This is the same URL structure that the domains page generates for "View Details" buttons.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
