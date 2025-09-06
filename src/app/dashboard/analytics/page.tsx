'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/main-layout';
import { trpc } from '@/lib/trpc';
import { 
  MessageSquare, 
  DollarSign, 
  Globe,
  Activity
} from 'lucide-react';

// Mock data removed - using real data from tRPC

export default function AnalyticsPage() {
  const { data: session, status } = useSession();

  // Fetch essential data from tRPC
  const { data: statsResponse, isLoading: statsLoading } = trpc.dashboard.getSellerStats.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 30000 // Cache for 30 seconds
    }
  );

  // Get recent activity
  const { data: recentActivity } = trpc.dashboard.getRecentActivity.useQuery(
    undefined,
    { 
      enabled: status === 'authenticated',
      staleTime: 30000,
      refetchOnWindowFocus: false
    }
  );

  // Extract data from tRPC response structure
  const stats = statsResponse;

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">
            Overview of your domain portfolio performance.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Domains</CardTitle>
                <Globe className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalDomains || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Active listings</p>
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
              <p className="text-xs text-gray-600 mt-1">Messages received</p>
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
              <p className="text-xs text-gray-600 mt-1">Total earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {recentActivity?.inquiries?.length || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">Last 3 inquiries</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity?.inquiries && recentActivity.inquiries.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.inquiries.map((inquiry: any) => (
                  <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{inquiry.domain?.name}</p>
                      <p className="text-sm text-gray-600">
                        New inquiry • {new Date(inquiry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 capitalize">
                      {inquiry.status.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Inquiries will appear here when you receive them</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
