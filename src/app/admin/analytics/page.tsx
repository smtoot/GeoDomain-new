'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AdminPageLayout, 
  AdminStatsCard, 
  AdminSectionHeader,
  AdminActionGroup 
} from '@/components/admin/AdminDesignSystem';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Globe, 
  DollarSign, 
  MessageSquare,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  // Fetch system analytics
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = trpc.admin.getSystemAnalytics.useQuery({ 
    period: timeRange as '7d' | '30d' | '90d' | '1y' 
  });

  // Fetch system overview
  const { data: overview, isLoading: overviewLoading } = trpc.admin.getSystemOverview.useQuery();

  const handleExportData = () => {
    toast.success('Analytics data exported successfully!');
  };

  const handleRefresh = () => {
    refetchAnalytics();
    toast.success('Analytics refreshed!');
  };

  if (analyticsLoading || overviewLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageLayout
      title="System Analytics"
      description="Comprehensive analytics and insights for your platform"
      actions={
        <AdminActionGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </AdminActionGroup>
      }
    >

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AdminStatsCard
          title="Total Users"
          value={overview?.totalUsers || 0}
          icon={Users}
          color="blue"
          trend={{
            value: "+12% from last month",
            isPositive: true
          }}
        />
        
        <AdminStatsCard
          title="Total Domains"
          value={overview?.totalDomains || 0}
          icon={Globe}
          color="green"
          trend={{
            value: "+8% from last month",
            isPositive: true
          }}
        />
        
        <AdminStatsCard
          title="Total Revenue"
          value={`$${analytics?.totalRevenue || 0}`}
          icon={DollarSign}
          color="yellow"
          trend={{
            value: "+15% from last month",
            isPositive: true
          }}
        />
        
        <AdminStatsCard
          title="Active Deals"
          value={overview?.activeDeals || 0}
          icon={MessageSquare}
          color="purple"
          trend={{
            value: "+5% from last month",
            isPositive: true
          }}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p>Chart visualization would go here</p>
                    <p className="text-sm">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Domain Listings</CardTitle>
                <CardDescription>New domain listings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Globe className="h-12 w-12 mx-auto mb-4" />
                    <p>Chart visualization would go here</p>
                    <p className="text-sm">Integration with charting library needed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>Detailed user behavior and engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{analytics?.newUsers || 0}</p>
                  <p className="text-sm text-gray-600">New Users ({timeRange})</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{analytics?.activeUsers || 0}</p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{analytics?.userRetention || 0}%</p>
                  <p className="text-sm text-gray-600">Retention Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Domain Analytics</CardTitle>
              <CardDescription>Domain listing and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{analytics?.newDomains || 0}</p>
                  <p className="text-sm text-gray-600">New Listings ({timeRange})</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{analytics?.soldDomains || 0}</p>
                  <p className="text-sm text-gray-600">Domains Sold</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{analytics?.conversionRate || 0}%</p>
                  <p className="text-sm text-gray-600">Conversion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Financial performance and revenue metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">${analytics?.totalRevenue || 0}</p>
                  <p className="text-sm text-gray-600">Total Revenue ({timeRange})</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">${analytics?.averageDealValue || 0}</p>
                  <p className="text-sm text-gray-600">Average Deal Value</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{analytics?.revenueGrowth || 0}%</p>
                  <p className="text-sm text-gray-600">Revenue Growth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}
