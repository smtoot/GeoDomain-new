'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Users, 
  Globe, 
  DollarSign, 
  AlertTriangle,
  Clock,
  Settings,
  BarChart3,
  Shield,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for collapsible sections
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isSystemOpen, setIsSystemOpen] = useState(false);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">There was a problem loading the dashboard data.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Calculate critical metrics
  const totalUsers = systemOverview?.totalUsers || 0;
  const totalDomains = systemOverview?.totalDomains || 0;
  const totalRevenue = systemAnalytics?.revenueStats?._sum?.agreedPrice || 0;
  const pendingItems = (systemOverview?.pendingInquiries || 0) + (systemOverview?.pendingMessages || 0);
  
  // Determine system health
  const systemHealth = pendingItems === 0 ? 'healthy' : pendingItems < 5 ? 'warning' : 'critical';
  
  // Get user role for role-based content
  const userRole = (session.user as any).role;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage and monitor the GeoDomain platform</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                {userRole}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* TIER 1 - CRITICAL: System Status Bar */}
        {systemHealth !== 'healthy' && (
          <Card className={`mb-6 border-l-4 ${
            systemHealth === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${
                  systemHealth === 'critical' ? 'text-red-600' : 'text-yellow-600'
                }`} />
                <div>
                  <h3 className={`font-medium ${
                    systemHealth === 'critical' ? 'text-red-900' : 'text-yellow-900'
                  }`}>
                    {systemHealth === 'critical' ? 'Critical Issues Detected' : 'Attention Required'}
                  </h3>
                  <p className={`text-sm ${
                    systemHealth === 'critical' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {pendingItems} items require immediate attention
                  </p>
                </div>
                <div className="ml-auto">
                  <Link href="/admin/inquiries">
                    <Button size="sm" variant={systemHealth === 'critical' ? 'destructive' : 'default'}>
                      Review Now
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TIER 1 - CRITICAL: Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                  <p className="text-xs text-green-600">
                    +{systemAnalytics?.userGrowth?.[0]?._count?.id || 0} this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Globe className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Domains</p>
                  <p className="text-2xl font-bold text-gray-900">{totalDomains}</p>
                  <p className="text-xs text-green-600">
                    +{systemAnalytics?.domainGrowth?.[0]?._count?.id || 0} this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${totalRevenue}</p>
                  <p className="text-xs text-gray-500">
                    {systemAnalytics?.revenueStats?._count?.id || 0} deals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${
                  pendingItems > 0 ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                  <AlertTriangle className={`h-6 w-6 ${
                    pendingItems > 0 ? 'text-red-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingItems}</p>
                  <p className="text-xs text-gray-500">
                    {systemOverview?.pendingInquiries || 0} inquiries, {systemOverview?.pendingMessages || 0} messages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TIER 1 - CRITICAL: Pending Actions (Only if there are pending items) */}
        {pendingItems > 0 && (
          <Card className="mb-6 border-l-4 border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Clock className="h-5 w-5" />
                Pending Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(systemOverview?.pendingInquiries || 0) > 0 && (
                  <Link href="/admin/inquiries">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-blue-50">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm">Review Inquiries</span>
                      <Badge variant="destructive" className="text-xs">
                        {systemOverview?.pendingInquiries || 0}
                      </Badge>
                    </Button>
                  </Link>
                )}
                
                {(systemOverview?.pendingMessages || 0) > 0 && (
                  <Link href="/admin/messages">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-blue-50">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm">Review Messages</span>
                      <Badge variant="destructive" className="text-xs">
                        {systemOverview?.pendingMessages || 0}
                      </Badge>
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* TIER 2 - IMPORTANT: Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/users">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-gray-50">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">Manage Users</span>
                </Button>
              </Link>
              
              <Link href="/admin/domains">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-gray-50">
                  <Globe className="h-5 w-5" />
                  <span className="text-sm">Manage Domains</span>
                </Button>
              </Link>
              
              <Link href="/admin/deals">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-gray-50">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-sm">Manage Deals</span>
                </Button>
              </Link>
              
              <Link href="/admin/wholesale">
                <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-gray-50">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Wholesale</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* TIER 2 - IMPORTANT: Recent Activity (Collapsible) */}
        <Collapsible open={isActivityOpen} onOpenChange={setIsActivityOpen}>
          <Card className="mb-6">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </div>
                  {isActivityOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* TIER 3 - ANALYTICS: System Overview (Collapsible) */}
        <Collapsible open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
          <Card className="mb-6">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-gray-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    System Analytics
                  </div>
                  {isAnalyticsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* TIER 4 - MANAGEMENT: System Management (Collapsible) */}
        {userRole === 'SUPER_ADMIN' && (
          <Collapsible open={isSystemOpen} onOpenChange={setIsSystemOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      System Management
                    </div>
                    {isSystemOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/admin/analytics">
                      <Button variant="outline" className="w-full h-16 flex-col gap-2">
                        <BarChart3 className="h-5 w-5" />
                        <span className="text-sm">Analytics</span>
                      </Button>
                    </Link>
                    
                    <Link href="/admin/performance">
                      <Button variant="outline" className="w-full h-16 flex-col gap-2">
                        <TrendingUp className="h-5 w-5" />
                        <span className="text-sm">Performance</span>
                      </Button>
                    </Link>
                    
                    <Link href="/admin/seed-data">
                      <Button variant="outline" className="w-full h-16 flex-col gap-2">
                        <RefreshCw className="h-5 w-5" />
                        <span className="text-sm">Seed Data</span>
                      </Button>
                    </Link>
                    
                    <Link href="/admin/notifications">
                      <Button variant="outline" className="w-full h-16 flex-col gap-2">
                        <Eye className="h-5 w-5" />
                        <span className="text-sm">Notifications</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>
    </div>
  );
}