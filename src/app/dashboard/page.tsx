'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from '@/lib/trpc';

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardLayout } from "@/components/layout/main-layout";
import { 
  Eye, 
  MessageSquare, 
  TrendingUp,
  DollarSign,
  Globe
} from 'lucide-react';

// Mock data - replace with real API calls
const mockStats = {
  totalViews: 1247,
  totalInquiries: 12,
  totalRevenue: 45000,
  totalDomains: 3,
  viewsChange: 15.3,
  inquiriesChange: -2.1,
  revenueChange: 8.7,
  domainsChange: 0
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'inquiry' as const,
    title: 'New inquiry for techstartup.com',
    description: 'Buyer interested in purchasing the domain',
    timestamp: '2 hours ago',
    status: 'success' as const
  },
  {
    id: '2',
    type: 'verification' as const,
    title: 'Domain verification completed',
    description: 'realestatepro.net is now verified',
    timestamp: '1 day ago',
    status: 'success' as const
  },
  {
    id: '3',
    type: 'payment' as const,
    title: 'Payment received for financehub.com',
    description: 'Transaction completed successfully',
    timestamp: '3 days ago',
    status: 'success' as const
  }
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'BUYER' | 'SELLER' | 'ADMIN'>('SELLER');

  // Fetch real data from tRPC
  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.dashboard.getSellerStats.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      retry: 2,
      refetchOnWindowFocus: false
    }
  );
  
  const { data: recentActivity, isLoading: activityLoading } = trpc.dashboard.getRecentActivity.useQuery(
    undefined,
    { enabled: status === 'authenticated' }
  );

  const { data: domainPerformance } = trpc.dashboard.getDomainPerformance.useQuery(
    { limit: 5 },
    { enabled: status === 'authenticated' }
  );

  // Check user role and redirect admins to admin dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        router.push('/admin');
        return;
      }
      setUserRole(role as 'BUYER' | 'SELLER' | 'ADMIN');
    }
  }, [session, status, router]);

  // Show loading while checking authentication or fetching data
  if (status === 'loading' || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {session?.user?.name || 'User'}! Here&apos;s an overview of your account.
          </p>
          {/* Debug info - remove in production */}
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer">Debug Info</summary>
            <pre className="text-xs text-gray-600 mt-1">
              Status: {status}, User: {(session?.user as any)?.id}, Role: {(session?.user as any)?.role}
            </pre>
          </details>
        </div>

        {/* Error State */}
        {statsError && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Failed to load dashboard data. Please try refreshing the page.</p>
            <details className="mt-2">
              <summary className="text-sm text-red-600 cursor-pointer">View error details</summary>
              <pre className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto">
                {JSON.stringify(statsError, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Dashboard Overview Component */}
        <DashboardOverview 
          stats={stats || mockStats}
          recentActivity={recentActivity || mockRecentActivity}
          userRole={userRole}
        />

        {/* Quick Actions Section */}
        <div className="mt-8">
          <QuickActions 
            userRole={userRole}
            pendingActions={stats?.totalInquiries || 2}
            unreadMessages={stats?.totalInquiries || 3}
          />
        </div>

        {/* Performance Insights */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key insights about your domain performance</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">
                        {stats?.totalDomains && stats.totalDomains > 0 ? 'Portfolio Growing' : 'Get Started'}
                      </p>
                      <p className="text-xs text-green-600">
                        {stats?.totalDomains ? `${stats.totalDomains} domains listed` : 'Add your first domain'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Total Views</p>
                      <p className="text-xs text-blue-600">
                        {stats?.totalViews || 0} views across all domains
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Active Inquiries</p>
                      <p className="text-xs text-purple-600">
                        {stats?.totalInquiries || 0} total inquiries received
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
