'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen">Loading API Documentation...</div>,
});

export default function ApiDocsPage() {
  const [openApiSpec, setOpenApiSpec] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpenApiSpec = async () => {
      try {
        const response = await fetch('/api/docs');
        if (!response.ok) {
          throw new Error(`Failed to fetch API spec: ${response.status}`);
        }
        const spec = await response.json();
        setOpenApiSpec(spec);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load API documentation');
      } finally {
        setLoading(false);
      }
    };

    fetchOpenApiSpec();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Documentation</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!openApiSpec) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Documentation Available</h1>
          <p className="text-gray-600">API documentation could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-blue-600 text-white py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">GeoDomainLand API Documentation</h1>
          <p className="text-blue-100 mt-1">
            Comprehensive API reference for the GeoDomainLand domain marketplace platform
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <SwaggerUI
          spec={openApiSpec}
          docExpansion="list"
          defaultModelsExpandDepth={2}
          defaultModelExpandDepth={2}
          displayRequestDuration={true}
          tryItOutEnabled={true}
          requestInterceptor={(request) => {
            // Add authentication headers if available
            const token = localStorage.getItem('auth-token');
            if (token) {
              request.headers.Authorization = `Bearer ${token}`;
            }
            return request;
          }}
          responseInterceptor={(response) => {
            // Handle responses
            return response;
          }}
        />
      </div>
    </div>
  );
}
