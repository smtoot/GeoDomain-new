'use client';

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
import Link from 'next/link';

interface AdminDashboardProps {
  systemOverview: {
    totalUsers: number;
    totalDomains: number;
    totalInquiries: number;
    totalDeals: number;
    pendingInquiries: number;
    pendingMessages: number;
    activeDeals: number;
  };
  systemAnalytics: {
    period: string;
    userGrowth: any[];
    domainGrowth: any[];
    inquiryGrowth: any[];
    dealGrowth: any[];
    revenueStats: {
      _sum?: { agreedPrice: number };
      _count?: { id: number };
    };
  };
  adminWorkload: {
    adminId: string;
    inquiriesReviewed: number;
    messagesReviewed: number;
    dealsProcessed: number;
    averageReviewTime: string;
    workload: string;
  };
}

export default function AdminDashboard({
  systemOverview,
  systemAnalytics,
  adminWorkload
}: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{systemOverview.totalUsers}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {systemAnalytics.userGrowth?.[0]?._count?.id || 0} new this month
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
                <p className="text-2xl font-bold text-gray-900">{systemOverview.totalDomains}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {systemAnalytics.domainGrowth?.[0]?._count?.id || 0} new this month
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
                  {systemOverview.pendingInquiries + systemOverview.pendingMessages}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {systemOverview.pendingInquiries} inquiries, {systemOverview.pendingMessages} messages
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
                <p className="text-2xl font-bold text-gray-900">{systemOverview.activeDeals}</p>
                <p className="text-xs text-gray-500 mt-1">
                  ${systemAnalytics.revenueStats?._sum?.agreedPrice || 0} total value
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {systemOverview.pendingInquiries > 0 && (
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
                  {systemOverview.pendingMessages > 0 && (
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
                <span className="font-medium">{adminWorkload.inquiriesReviewed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Messages Reviewed</span>
                <span className="font-medium">{adminWorkload.messagesReviewed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Deals Processed</span>
                <span className="font-medium">{adminWorkload.dealsProcessed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Review Time</span>
                <span className="font-medium">{adminWorkload.averageReviewTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Current Workload</span>
                <Badge 
                  variant={adminWorkload.workload === 'HIGH' ? 'destructive' : 
                          adminWorkload.workload === 'MEDIUM' ? 'default' : 'secondary'}
                >
                  {adminWorkload.workload}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Overview */}
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
                {systemAnalytics.userGrowth?.map((group, index) => (
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
                {systemAnalytics.domainGrowth?.map((group, index) => (
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
                    ${systemAnalytics.revenueStats?._sum?.agreedPrice || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed Deals</span>
                  <span className="font-medium">
                    {systemAnalytics.revenueStats?._count?.id || 0}
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
