"use client";

import { useState, useEffect } from "react";

export default function SimplePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/trpc/domains.getAll?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22limit%22%3A5%2C%22offset%22%3A0%7D%7D%7D');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
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
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p>Found {domains.length} domains</p>
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
