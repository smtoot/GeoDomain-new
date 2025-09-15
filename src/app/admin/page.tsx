'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AdminPageLayout, 
  AdminStatsCard, 
  AdminSectionHeader,
  AdminActionGroup 
} from '@/components/admin/AdminDesignSystem';
import { 
  Users, 
  Globe, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Settings,
  BarChart3,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { WholesaleAnalytics } from '@/components/admin/WholesaleAnalytics';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle unauthenticated or non-admin state with useEffect
  useEffect(() => {
    if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      router.push('/login');
    }
  }, [status, session, router]);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // Don't render anything if unauthenticated or not admin (navigation handled by useEffect)
  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    return null;
  }

  const { data: systemOverviewResponse, isLoading: overviewLoading, error: overviewError } = trpc.admin.getSystemOverview.useQuery();
  const { data: systemAnalyticsResponse, isLoading: analyticsLoading, error: analyticsError } = trpc.admin.getSystemAnalytics.useQuery({ period: '30d' });
  const { data: adminWorkloadResponse, isLoading: workloadLoading, error: workloadError } = trpc.admin.getAdminWorkload.useQuery();

  // Extract data from tRPC response structure
  const systemOverview = systemOverviewResponse?.json || systemOverviewResponse;
  const systemAnalytics = systemAnalyticsResponse?.json || systemAnalyticsResponse;
  const adminWorkload = adminWorkloadResponse?.json || adminWorkloadResponse;

  const isLoading = overviewLoading || analyticsLoading || workloadLoading;
  const hasError = overviewError || analyticsError || workloadError;

  // Show error state if any query failed
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Admin Dashboard Error
          </h2>
          <p className="text-gray-600 mb-4">
            There was an error loading the admin dashboard data.
          </p>
          <div className="space-y-2">
            {overviewError && (
              <p className="text-sm text-red-600">System Overview: {overviewError.message}</p>
            )}
            {analyticsError && (
              <p className="text-sm text-red-600">Analytics: {analyticsError.message}</p>
            )}
            {workloadError && (
              <p className="text-sm text-red-600">Workload: {workloadError.message}</p>
            )}
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context="Admin Dashboard Page">
      <AdminPageLayout
        title="Admin Dashboard"
        description="Manage and monitor the GeoDomain platform"
      >
        {/* Admin Actions */}
        <AdminActionGroup className="mb-6">
          <Badge variant="outline" className="text-sm">
            {(session.user as any).role}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </AdminActionGroup>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AdminStatsCard
            title="Total Users"
            value={systemOverview?.totalUsers || 0}
            icon={Users}
            color="blue"
            trend={{
              value: `${systemAnalytics?.userGrowth?.[0]?._count?.id || 0} new this month`,
              isPositive: true
            }}
          />
          
          <AdminStatsCard
            title="Active Domains"
            value={systemOverview?.totalDomains || 0}
            icon={Globe}
            color="green"
            trend={{
              value: `${systemAnalytics?.domainGrowth?.[0]?._count?.id || 0} new this month`,
              isPositive: true
            }}
          />
          
          <AdminStatsCard
            title="Pending Reviews"
            value={(systemOverview?.pendingInquiries || 0) + (systemOverview?.pendingMessages || 0)}
            icon={AlertTriangle}
            color="yellow"
            trend={{
              value: `${systemOverview?.pendingInquiries || 0} inquiries, ${systemOverview?.pendingMessages || 0} messages`,
              isPositive: false
            }}
          />
          
          <AdminStatsCard
            title="Active Deals"
            value={systemOverview?.activeDeals || 0}
            icon={DollarSign}
            color="purple"
            trend={{
              value: `$${systemAnalytics?.revenueStats?._sum?.agreedPrice?.toString() || 0} total value`,
              isPositive: true
            }}
          />
        </div>

        {/* Quick Actions */}
        <AdminSectionHeader
          title="Quick Actions"
          description="Common administrative tasks"
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/inquiries">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Review Inquiries</span>
                  {(systemOverview?.pendingInquiries || 0) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {systemOverview?.pendingInquiries || 0}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Link href="/admin/messages">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Review Messages</span>
                  {(systemOverview?.pendingMessages || 0) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {systemOverview?.pendingMessages || 0}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Link href="/admin/deals">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm">Manage Deals</span>
                </Button>
              </Link>
              
              <Link href="/admin/payments">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Verify Payments</span>
                </Button>
              </Link>
              
              <Link href="/admin/wholesale">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm">Wholesale</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Your Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Inquiries Reviewed</span>
                <span className="font-medium">{adminWorkload?.inquiriesReviewed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Messages Reviewed</span>
                <span className="font-medium">{adminWorkload?.messagesReviewed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deals Processed</span>
                <span className="font-medium">{adminWorkload?.dealsProcessed || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Review Time</span>
                <span className="font-medium">{adminWorkload?.averageReviewTime || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Workload</span>
                <Badge 
                  variant={adminWorkload?.workload === 'HIGH' ? 'destructive' : 
                          adminWorkload?.workload === 'MEDIUM' ? 'default' : 'secondary'}
                >
                  {adminWorkload?.workload || 'LOW'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wholesale Analytics */}
      <WholesaleAnalytics />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">User Growth</h4>
              <div className="space-y-2">
                {systemAnalytics?.userGrowth?.map((group, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{group.role}</span>
                    <span className="font-medium">{group._count.id}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Domain Status</h4>
              <div className="space-y-2">
                {systemAnalytics?.domainGrowth?.map((group, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{group.status}</span>
                    <span className="font-medium">{group._count.id}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Revenue Stats</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-medium">
                    ${systemAnalytics?.revenueStats?._sum?.agreedPrice?.toString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed Deals</span>
                  <span className="font-medium">
                    {systemAnalytics?.revenueStats?._count?.id || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminPageLayout>
    </QueryErrorBoundary>
  );
}
