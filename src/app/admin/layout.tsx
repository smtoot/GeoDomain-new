'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { MobileAdminLayout } from '@/components/admin/MobileAdminLayout';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Get pending counts for navigation badges
  const { data: systemOverview, error: systemOverviewError } = trpc.admin.getSystemOverview.useQuery(undefined, {
    enabled: status === 'authenticated' && session?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role),
  });

  // Show loading state while session is being validated
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

  // If unauthenticated, show loading (middleware will handle redirect)
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileAdminLayout 
      systemOverview={systemOverview}
    >
      {children}
    </MobileAdminLayout>
  );
}
