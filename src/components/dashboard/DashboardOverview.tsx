'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MessageSquare, 
  DollarSign, 
  Globe,
  Plus,
  Settings,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DashboardStats {
  totalViews: number;
  totalInquiries: number;
  totalRevenue: number;
  totalDomains: number;
  viewsChange: number;
  inquiriesChange: number;
  revenueChange: number;
  domainsChange: number;
}

interface RecentActivity {
  id: string;
  type: 'inquiry' | 'verification' | 'payment' | 'domain';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'pending' | 'error';
}

interface DashboardOverviewProps {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  userRole: 'BUYER' | 'SELLER' | 'ADMIN';
}

export function DashboardOverview({ stats, recentActivity, userRole }: DashboardOverviewProps) {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(stats.totalViews)}
            </div>
            <div className="flex items-center mt-1">
              {getChangeIcon(stats.viewsChange)}
              <span className={`text-sm ml-1 ${getChangeColor(stats.viewsChange)}`}>
                {stats.viewsChange > 0 ? '+' : ''}{stats.viewsChange}%
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
              {formatNumber(stats.totalInquiries)}
            </div>
            <div className="flex items-center mt-1">
              {getChangeIcon(stats.inquiriesChange)}
              <span className={`text-sm ml-1 ${getChangeColor(stats.inquiriesChange)}`}>
                {stats.inquiriesChange > 0 ? '+' : ''}{stats.inquiriesChange}%
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
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="flex items-center mt-1">
              {getChangeIcon(stats.revenueChange)}
              <span className={`text-sm ml-1 ${getChangeColor(stats.revenueChange)}`}>
                {stats.revenueChange > 0 ? '+' : ''}{stats.revenueChange}%
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
              {stats.totalDomains}
            </div>
            <div className="flex items-center mt-1">
              {getChangeIcon(stats.domainsChange)}
              <span className={`text-sm ml-1 ${getChangeColor(stats.domainsChange)}`}>
                {stats.domainsChange > 0 ? '+' : ''}{stats.domainsChange}%
              </span>
              <span className="text-xs text-gray-600 ml-1">vs last 30 days</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Activity */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your domains and inquiries</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {userRole === 'SELLER' && (
              <>
                <Link href="/domains/new">
                  <Button className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Domain
                  </Button>
                </Link>
                <Link href="/dashboard/inquiries">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Inquiries
                  </Button>
                </Link>
              </>
            )}
            {userRole === 'BUYER' && (
              <>
                <Link href="/domains">
                  <Button className="w-full justify-start">
                    <Globe className="h-4 w-4 mr-2" />
                    Browse Domains
                  </Button>
                </Link>
                <Link href="/inquiries">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    My Inquiries
                  </Button>
                </Link>
              </>
            )}
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                Account Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.timestamp}
                    </p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(activity.status)}>
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
