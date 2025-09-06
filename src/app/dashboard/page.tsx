'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from '@/lib/trpc';

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DashboardLayout } from "@/components/layout/main-layout";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import AdvancedAnalyticsDashboard from "@/components/AdvancedAnalyticsDashboard";
import LoadTestingDashboard from "@/components/LoadTestingDashboard";
// import ProductionMonitoringDashboard from "@/components/ProductionMonitoringDashboard";
import BuyerDashboard from "@/components/BuyerDashboard";
import { 
  Eye, 
  MessageSquare, 
  TrendingUp
} from 'lucide-react';

// Mock data removed - using real data from tRPC

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'BUYER' | 'SELLER' | 'ADMIN'>('SELLER');

  // Fetch real data from tRPC with optimized caching
  const { data: stats, isLoading: statsLoading, error: statsError } = trpc.dashboard.getSellerStats.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  );
  
  const { data: recentActivity, isLoading: activityLoading } = trpc.dashboard.getRecentActivity.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  );

  // const { data: domainPerformance } = trpc.dashboard.getDomainPerformance.useQuery(
  //   { limit: 5 },
  //   { 
  //     enabled: status === 'authenticated',
  //     staleTime: 5 * 60 * 1000, // 5 minutes
  //     cacheTime: 10 * 60 * 1000, // 10 minutes
  //     refetchOnWindowFocus: false
  //   }
  // );

  // Extract data from tRPC response structure
  const statsData = stats?.json || stats;
  const recentActivityData = recentActivity?.json || recentActivity;

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

  // Handle unauthenticated state with useEffect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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

  // Don't render anything if unauthenticated (navigation handled by useEffect)
  if (status === 'unauthenticated') {
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

        {/* Role-Based Dashboard */}
        {userRole === 'BUYER' ? (
          <BuyerDashboard />
        ) : (
          <>
            {/* Dashboard Overview Component */}
            <DashboardOverview 
              stats={stats ? {
                ...stats,
                totalRevenue: Number(stats.totalRevenue)
              } : {
                totalViews: 0,
                totalInquiries: 0,
                totalRevenue: 0,
                totalDomains: 0,
                viewsChange: 0,
                inquiriesChange: 0,
                revenueChange: 0,
                domainsChange: 0
              }}
              recentActivity={recentActivity || []}
              userRole={userRole}
            />

            {/* Quick Actions Section */}
            <div className="mt-8">
              <QuickActions 
                userRole={userRole}
                pendingActions={statsData?.totalInquiries || 0}
                unreadMessages={statsData?.totalInquiries || 0}
              />
            </div>
          </>
        )}

        {/* Domain Performance Insights - For Sellers and Admins */}
        {(userRole === 'SELLER' || userRole === 'ADMIN') && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Domain Performance Insights</CardTitle>
                <CardDescription>Key insights about your domain performance and sales</CardDescription>
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
                          {statsData?.totalDomains && statsData.totalDomains > 0 ? 'Portfolio Growing' : 'Get Started'}
                        </p>
                        <p className="text-xs text-green-600">
                          {statsData?.totalDomains ? `${statsData.totalDomains} domains listed` : 'Add your first domain'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Total Views</p>
                        <p className="text-xs text-blue-600">
                          {statsData?.totalViews || 0} views across all domains
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="text-sm font-medium text-purple-800">Active Inquiries</p>
                        <p className="text-xs text-purple-600">
                          {statsData?.totalInquiries || 0} total inquiries received
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* System Performance Dashboard - Admin Only */}
        {userRole === 'ADMIN' && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Performance
                </CardTitle>
                <CardDescription>Real-time system performance metrics and cache statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceDashboard />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Analytics Dashboard - Admin Only */}
        {userRole === 'ADMIN' && (
          <div className="mt-8">
            <AdvancedAnalyticsDashboard />
          </div>
        )}

        {/* Load Testing Dashboard - Admin Only */}
        {userRole === 'ADMIN' && (
          <div className="mt-8">
            <LoadTestingDashboard />
          </div>
        )}

        {/* Production Monitoring Dashboard - Temporarily disabled due to missing dependencies */}
        {/* <div className="mt-8">
          <ProductionMonitoringDashboard />
        </div> */}
      </div>
    </DashboardLayout>
  );
}
