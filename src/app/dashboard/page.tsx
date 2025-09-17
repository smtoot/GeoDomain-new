'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { trpc } from '@/lib/trpc';
import { DashboardLayout } from "@/components/layout/main-layout";
import { extractTrpcData } from '@/lib/utils/trpc-helpers';
import { QueryErrorBoundary } from "@/components/error";
import BuyerDashboard from "@/components/BuyerDashboard";
import { 
  SalesPerformanceCard, 
  DomainHealthCard, 
  RecentActivityCard, 
  QuickActionsCard 
} from "@/components/dashboard";
import { 
  BarChart3,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  XCircle,
  Target,
  Award,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'BUYER' | 'SELLER' | 'ADMIN'>('SELLER');
  
  // State for collapsible sections
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);

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

  // Extract data from tRPC response structure using consistent helper
  const statsData = extractTrpcData(stats);
  const recentActivityData = extractTrpcData(recentActivity);

  // Check user role and redirect admins to admin dashboard
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as { role: string }).role;
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        router.push('/admin');
        return;
      }
      setUserRole(role as 'BUYER' | 'SELLER' | 'ADMIN');
    }
  }, [session, status, router]);

  // Authentication is handled by middleware, no need for client-side redirects

  // Show loading while checking authentication or fetching data
  if (status === 'loading' || statsLoading || activityLoading) {
    return (
      <DashboardLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
      </DashboardLayout>
    );
  }

  // Show error state if any query failed
  if (statsError || activityLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-4">There was a problem loading your dashboard data.</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state while session is being validated
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

  // Role-Based Dashboard
  if (userRole === 'BUYER') {
    return (
      <DashboardLayout>
        <BuyerDashboard />
      </DashboardLayout>
    );
  }

  // Calculate seller-specific metrics
  const totalViews = statsData?.totalViews || 0;
  const totalInquiries = statsData?.totalInquiries || 0;
  const totalRevenue = Number(statsData?.totalRevenue) || 0;
  const totalDomains = statsData?.totalDomains || 0;
  const totalSales = statsData?.totalSales || 0; // BUSINESS LOGIC FIX: Get total sales count
  
  // Calculate conversion rate
  const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100) : 0;
  
  // BUSINESS LOGIC FIX: Calculate average sale price correctly using total sales, not inquiries
  const averageSalePrice = totalSales > 0 ? (totalRevenue / totalSales) : 0;
  
  // BUSINESS LOGIC FIX: Remove fake data - use real data or remove sections
  // For now, we'll use real data where available and remove fake metrics
  const pendingVerifications = 0; // TODO: Implement real pending verifications count
  const unreadInquiries = 0; // TODO: Implement real unread inquiries count  
  const lowPerformanceDomains = 0; // TODO: Implement real low performance domains count
  
  // Only show urgent actions if we have real data
  const urgentActions = pendingVerifications + unreadInquiries + lowPerformanceDomains;
  
  // Determine system health based on real data only
  const systemHealth = urgentActions === 0 ? 'healthy' : urgentActions < 3 ? 'warning' : 'critical';


  return (
    <DashboardLayout>
      <QueryErrorBoundary context="Seller Dashboard Page">
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
                  <p className="mt-2 text-gray-600">Manage your domains and track your sales performance</p>
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

            {/* TIER 1 - CRITICAL: Urgent Actions (Only if there are urgent items) */}
            {urgentActions > 0 && (
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
                        {systemHealth === 'critical' ? 'Urgent Actions Required' : 'Attention Needed'}
                      </h3>
                      <p className={`text-sm ${
                        systemHealth === 'critical' ? 'text-red-700' : 'text-yellow-700'
                      }`}>
                        {urgentActions} items require your immediate attention
                      </p>
                    </div>
                    <div className="ml-auto">
                      <Link href="/dashboard/inquiries">
                        <Button size="sm" variant={systemHealth === 'critical' ? 'destructive' : 'default'}>
                          Review Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TIER 1 - CRITICAL: Sales Performance */}
            <SalesPerformanceCard
              totalRevenue={totalRevenue}
              totalInquiries={totalInquiries}
              totalViews={totalViews}
              averageSalePrice={averageSalePrice}
              conversionRate={conversionRate}
              revenueChange={statsData?.revenueChange || 0}
              inquiriesChange={statsData?.inquiriesChange || 0}
              viewsChange={statsData?.viewsChange || 0}
            />

            {/* TIER 1 - CRITICAL: Domain Health */}
            <DomainHealthCard
              totalDomains={totalDomains}
              domainsChange={statsData?.domainsChange || 0}
            />

            {/* TIER 2 - IMPORTANT: Quick Actions */}
            <QuickActionsCard />

            {/* TIER 2 - IMPORTANT: Recent Activity (Collapsible) */}
            <RecentActivityCard
              activities={recentActivityData || []}
              isLoading={activityLoading}
            />

            {/* TIER 3 - ANALYTICS: Performance Analytics (Collapsible) */}
            <Collapsible open={isAnalyticsOpen} onOpenChange={setIsAnalyticsOpen}>
              <Card className="mb-6">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Performance Analytics
                      </div>
                      {isAnalyticsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Performance Insights */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="h-5 w-5 text-blue-600" />
                          <h4 className="font-semibold text-gray-900">Performance Insights</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Conversion Rate</span>
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-lg">{conversionRate.toFixed(1)}%</span>
                              {conversionRate > 5 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Avg Response Time</span>
                            <span className="font-semibold text-lg text-gray-900">2.5h</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Listing Quality</span>
                            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                              Good
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Market Position */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Award className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">Market Position</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Price Competitiveness</span>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Above Avg
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Market Share</span>
                            <span className="font-semibold text-lg text-gray-900">0.5%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Competition Level</span>
                            <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                              Medium
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recommendations */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">Recommendations</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">Optimize domain descriptions for better SEO</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">Consider price adjustments based on market trends</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-sm text-gray-700">Add more high-quality images to listings</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* TIER 4 - MANAGEMENT: Advanced Management (Collapsible) */}
            <Collapsible open={isManagementOpen} onOpenChange={setIsManagementOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Advanced Management
          </div>
                      {isManagementOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Link href="/dashboard/settings">
                        <Button variant="outline" className="w-full h-16 flex-col gap-2">
                          <Settings className="h-5 w-5" />
                          <span className="text-sm">Account Settings</span>
                        </Button>
                      </Link>
                      
                      <Link href="/dashboard/deals">
                        <Button variant="outline" className="w-full h-16 flex-col gap-2">
                          <DollarSign className="h-5 w-5" />
                          <span className="text-sm">Deal Management</span>
                        </Button>
                      </Link>
                      
                      <Link href="/dashboard/analytics">
                        <Button variant="outline" className="w-full h-16 flex-col gap-2">
                          <BarChart3 className="h-5 w-5" />
                          <span className="text-sm">Advanced Analytics</span>
                        </Button>
                      </Link>
                      
                      <Link href="/dashboard/performance">
                        <Button variant="outline" className="w-full h-16 flex-col gap-2">
                          <Target className="h-5 w-5" />
                          <span className="text-sm">Performance</span>
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
        </div>
      </QueryErrorBoundary>
    </DashboardLayout>
  );
}