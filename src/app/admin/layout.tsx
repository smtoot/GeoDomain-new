'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Header } from '@/components/layout/header';
import { AdminNavigation } from '@/components/admin/AdminNavigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Get pending counts for navigation badges
  const { data: systemOverview } = trpc.admin.getSystemOverview.useQuery(undefined, {
    enabled: status === 'authenticated' && session?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role),
  });

  // Handle unauthenticated or non-admin state with useEffect
  useEffect(() => {
    if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      router.push('/login');
    }
  }, [status, session, router]);

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if unauthenticated or not admin (navigation handled by useEffect)
  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-56 bg-gray-800 text-white">
          <AdminNavigation 
            pendingInquiries={systemOverview?.pendingInquiries || 0}
            pendingMessages={systemOverview?.pendingMessages || 0}
          />
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto lg:ml-56">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
