"use client";

import { useState, useEffect } from "react";

export default function TestFiltersPage() {
  const [filtersData, setFiltersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('🔍 [TEST] Fetching filters...');
        const response = await fetch('/api/search/filters');
        const data = await response.json();
        console.log('🔍 [TEST] Response:', data);
        
        if (data.success) {
          setFiltersData(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error('❌ [TEST] Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Filters API</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Categories ({filtersData?.categories?.length || 0})</h2>
        <div className="max-h-40 overflow-y-auto border p-2">
          {filtersData?.categories?.map((cat, index) => (
            <div key={index} className="text-sm">
              {cat.value} ({cat.count} domains)
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">States ({filtersData?.states?.length || 0})</h2>
        <div className="max-h-40 overflow-y-auto border p-2">
          {filtersData?.states?.map((state, index) => (
            <div key={index} className="text-sm">
              {state.value} ({state.count} domains)
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Price Ranges</h2>
        <div className="border p-2">
          <div>Min: ${filtersData?.priceRanges?.min}</div>
          <div>Max: ${filtersData?.priceRanges?.max}</div>
          <div>Average: ${filtersData?.priceRanges?.average?.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
