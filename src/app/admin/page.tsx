'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Globe, 
  MessageSquare, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  BarChart3,
  Shield
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  const { data: systemOverview, isLoading: overviewLoading } = trpc.admin.getSystemOverview.useQuery();
  const { data: systemAnalytics, isLoading: analyticsLoading } = trpc.admin.getSystemAnalytics.useQuery({ period: '30d' });
  const { data: adminWorkload, isLoading: workloadLoading } = trpc.admin.getAdminWorkload.useQuery();

  const isLoading = overviewLoading || analyticsLoading || workloadLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
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
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">
              Welcome back, {session.user.name}. Here&apos;s what&apos;s happening in your marketplace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {(session.user as any).role}
            </Badge>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemOverview?.totalUsers || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {systemAnalytics?.userGrowth?.[0]?._count?.id || 0} new this month
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Domains</p>
                <p className="text-2xl font-bold text-gray-900">{systemOverview?.totalDomains || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {systemAnalytics?.domainGrowth?.[0]?._count?.id || 0} new this month
                </p>
              </div>
              <Globe className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(systemOverview?.pendingInquiries || 0) + (systemOverview?.pendingMessages || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {systemOverview?.pendingInquiries || 0} inquiries, {systemOverview?.pendingMessages || 0} messages
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{systemOverview?.activeDeals || 0}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${systemAnalytics?.revenueStats?._sum?.agreedPrice || 0} total value
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/inquiries">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Review Inquiries</span>
                  {systemOverview?.pendingInquiries > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {systemOverview.pendingInquiries}
                    </Badge>
                  )}
                </Button>
              </Link>
              
              <Link href="/admin/messages">
                <Button variant="outline" className="w-full h-16 flex-col gap-2">
                  <MessageSquare className="h-5 w-5" />
                  <span className="text-sm">Review Messages</span>
                  {systemOverview?.pendingMessages > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {systemOverview.pendingMessages}
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
                    ${systemAnalytics?.revenueStats?._sum?.agreedPrice || 0}
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
    </div>
  );
}
