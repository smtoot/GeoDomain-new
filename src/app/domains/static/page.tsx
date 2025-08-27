"use client";

export default function StaticPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Static Test Page</h1>
      <p>This is a static page to test if React is working.</p>
      <ul className="mt-4">
        <li className="mb-2">Domain 1 - $1000</li>
        <li className="mb-2">Domain 2 - $2000</li>
        <li className="mb-2">Domain 3 - $3000</li>
      </ul>
    </div>
  );
}
