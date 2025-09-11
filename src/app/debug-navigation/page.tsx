'use client';

import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';

export default function DebugNavigationPage() {
  const { data: session, status } = useSession();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Navigation Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <div className="space-y-2">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>User ID:</strong> {session?.user?.id || 'Not available'}</p>
            <p><strong>Email:</strong> {session?.user?.email || 'Not available'}</p>
            <p><strong>Name:</strong> {session?.user?.name || 'Not available'}</p>
            <p><strong>Role:</strong> {(session?.user as any)?.role || 'Not available'}</p>
            <p><strong>Is Admin:</strong> {(session?.user as any)?.role === 'ADMIN' ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Navigation Links</h2>
          <div className="space-y-2">
            <p><strong>Admin Support:</strong> <a href="/admin/support" className="text-blue-600 hover:underline">/admin/support</a></p>
            <p><strong>User Support:</strong> <a href="/support" className="text-blue-600 hover:underline">/support</a></p>
            <p><strong>Admin Dashboard:</strong> <a href="/admin" className="text-blue-600 hover:underline">/admin</a></p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Support System Test</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Test Support Router</h3>
              <SupportTest />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SupportTest() {
  const { data, isLoading, error } = trpc.support.getUserTickets.useQuery();
  
  if (isLoading) return <p>Loading support test...</p>;
  if (error) return <p className="text-red-600">Error: {error.message}</p>;
  
  return (
    <div>
      <p className="text-green-600">✅ Support router is working!</p>
      <p>User tickets: {data?.tickets?.length || 0}</p>
    </div>
  );
}
