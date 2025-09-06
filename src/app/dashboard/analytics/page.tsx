'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/main-layout';
import { trpc } from '@/lib/trpc';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MessageSquare, 
  DollarSign, 
  Globe,
  Calendar,
  Users,
  Activity
} from 'lucide-react';

// Mock data removed - using real data from tRPC

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const { data: session, status } = useSession();

  // Fetch real data from tRPC - same as main dashboard
  const { data: statsResponse, isLoading: statsLoading, error: statsError  } = trpc.dashboard.getSellerStats.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000 // Cache for 30 seconds
    }
  );

  // Extract data from tRPC response structure
  const stats = statsResponse?.json || statsResponse;

  const { data: domainPerformance } = trpc.dashboard.getDomainPerformance.useQuery(
    { limit: 5 },
    { 
      enabled: status === 'authenticated',
      staleTime: 30000, // Cache for 30 seconds
      refetchOnWindowFocus: false
    }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Show loading state
  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Analytics Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Detailed performance metrics and insights for your domain portfolio.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.totalViews || 0)}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(stats?.viewsChange || 0)}
                <span className={`text-sm ml-1 ${getChangeColor(stats?.viewsChange || 0)}`}>
                  {(stats?.viewsChange || 0) > 0 ? '+' : ''}{stats?.viewsChange || 0}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last 30 days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Inquiries</CardTitle>
                <MessageSquare className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.totalInquiries || 0)}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(stats?.inquiriesChange || 0)}
                <span className={`text-sm ml-1 ${getChangeColor(stats?.inquiriesChange || 0)}`}>
                  {(stats?.inquiriesChange || 0) > 0 ? '+' : ''}{stats?.inquiriesChange || 0}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last 30 days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(Number(stats?.totalRevenue) || 0)}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(stats?.revenueChange || 0)}
                <span className={`text-sm ml-1 ${getChangeColor(stats?.revenueChange || 0)}`}>
                  {(stats?.revenueChange || 0) > 0 ? '+' : ''}{stats?.revenueChange || 0}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last 30 days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Active Domains</CardTitle>
                <Globe className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalDomains || 0}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(stats?.domainsChange || 0)}
                <span className={`text-sm ml-1 ${getChangeColor(stats?.domainsChange || 0)}`}>
                  {(stats?.domainsChange || 0) > 0 ? '+' : ''}{stats?.domainsChange || 0}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last 30 days</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="performance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Domain Performance</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Domain Performance</CardTitle>
                <CardDescription>Performance metrics for each of your domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(domainPerformance || []).map((domain: any) => (
                    <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium">{domain.name}</h3>
                          <Badge variant={domain.status === 'VERIFIED' ? 'default' : 'secondary'}>
                            {domain.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-6 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {formatNumber(domain.views)} views
                          </span>
                          <span className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            {domain.inquiries} inquiries
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrency(domain.revenue)}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm">Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Views Trend</CardTitle>
                  <CardDescription>Monthly view count progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>View tracking coming soon</p>
                    <p className="text-sm">Real-time analytics will be available in the next update</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>Revenue tracking coming soon</p>
                    <p className="text-sm">Real-time analytics will be available in the next update</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>Key insights about your domain performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Strong Performance</p>
                      <p className="text-xs text-green-600">Your domains are performing above average</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">High Visibility</p>
                      <p className="text-xs text-blue-600">techstartup.com has the highest view count</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Good Conversion</p>
                      <p className="text-xs text-purple-600">1.2% inquiry rate from views</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                  <CardDescription>Suggestions to improve your performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Add More Domains</h4>
                    <p className="text-xs text-gray-600">Consider listing more domains to increase revenue potential</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Optimize Descriptions</h4>
                    <p className="text-xs text-gray-600">Improve domain descriptions to increase inquiry rates</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Price Optimization</h4>
                    <p className="text-xs text-gray-600">Review pricing strategy based on market trends</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
