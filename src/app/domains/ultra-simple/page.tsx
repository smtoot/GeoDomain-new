"use client";

import { useState, useEffect } from "react";

export default function UltraSimplePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 [ULTRA SIMPLE] Starting fetch...');
        const response = await fetch('/api/trpc/domains.ultraSimple?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%7D%7D%7D');
        console.log('🔍 [ULTRA SIMPLE] Response status:', response.status);
        const result = await response.json();
        console.log('🔍 [ULTRA SIMPLE] Response data:', result);
        setData(result);
        setLoading(false);
      } catch (err) {
        console.error('🔍 [ULTRA SIMPLE] Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8">Error: {error}</div>;
  }

  const domains = data?.[0]?.result?.data?.json?.data || [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Ultra Simple Test Page</h1>
      <p>Found {domains.length} domains</p>
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Raw Response:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      <ul className="mt-4">
        {domains.map((domain: any) => (
          <li key={domain.id} className="mb-2">
            {domain.name} - ${domain.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
