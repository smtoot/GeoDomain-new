'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/layout/main-layout';
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

// Mock data - replace with real API calls
const mockAnalytics = {
  overview: {
    totalViews: 1247,
    totalInquiries: 12,
    totalRevenue: 45000,
    totalDomains: 3,
    viewsChange: 15.3,
    inquiriesChange: -2.1,
    revenueChange: 8.7,
    domainsChange: 0
  },
  domainPerformance: [
    {
      id: '1',
      name: 'techstartup.com',
      views: 456,
      inquiries: 5,
      revenue: 15000,
      status: 'VERIFIED'
    },
    {
      id: '2',
      name: 'realestatepro.net',
      views: 234,
      inquiries: 3,
      revenue: 8500,
      status: 'VERIFIED'
    },
    {
      id: '3',
      name: 'healthcareplus.org',
      views: 557,
      inquiries: 7,
      revenue: 12000,
      status: 'VERIFIED'
    }
  ],
  monthlyData: [
    { month: 'Jan', views: 120, inquiries: 2, revenue: 5000 },
    { month: 'Feb', views: 180, inquiries: 3, revenue: 8000 },
    { month: 'Mar', views: 220, inquiries: 4, revenue: 12000 },
    { month: 'Apr', views: 280, inquiries: 5, revenue: 15000 },
    { month: 'May', views: 320, inquiries: 6, revenue: 18000 },
    { month: 'Jun', views: 380, inquiries: 7, revenue: 22000 }
  ]
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

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

  return (
    <DashboardLayout>
      {/* Analytics Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                {formatNumber(mockAnalytics.overview.totalViews)}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(mockAnalytics.overview.viewsChange)}
                <span className={`text-sm ml-1 ${getChangeColor(mockAnalytics.overview.viewsChange)}`}>
                  {mockAnalytics.overview.viewsChange > 0 ? '+' : ''}{mockAnalytics.overview.viewsChange}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last period</span>
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
                {formatNumber(mockAnalytics.overview.totalInquiries)}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(mockAnalytics.overview.inquiriesChange)}
                <span className={`text-sm ml-1 ${getChangeColor(mockAnalytics.overview.inquiriesChange)}`}>
                  {mockAnalytics.overview.inquiriesChange > 0 ? '+' : ''}{mockAnalytics.overview.inquiriesChange}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last period</span>
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
                {formatCurrency(mockAnalytics.overview.totalRevenue)}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(mockAnalytics.overview.revenueChange)}
                <span className={`text-sm ml-1 ${getChangeColor(mockAnalytics.overview.revenueChange)}`}>
                  {mockAnalytics.overview.revenueChange > 0 ? '+' : ''}{mockAnalytics.overview.revenueChange}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last period</span>
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
                {mockAnalytics.overview.totalDomains}
              </div>
              <div className="flex items-center mt-1">
                {getChangeIcon(mockAnalytics.overview.domainsChange)}
                <span className={`text-sm ml-1 ${getChangeColor(mockAnalytics.overview.domainsChange)}`}>
                  {mockAnalytics.overview.domainsChange > 0 ? '+' : ''}{mockAnalytics.overview.domainsChange}%
                </span>
                <span className="text-xs text-gray-600 ml-1">vs last period</span>
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
                  {mockAnalytics.domainPerformance.map((domain) => (
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
                  <div className="space-y-3">
                    {mockAnalytics.monthlyData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(data.views / Math.max(...mockAnalytics.monthlyData.map(d => d.views))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">
                            {formatNumber(data.views)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription>Monthly revenue progression</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAnalytics.monthlyData.map((data, index) => (
                      <div key={data.month} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{data.month}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ 
                                width: `${(data.revenue / Math.max(...mockAnalytics.monthlyData.map(d => d.revenue))) * 100}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-16 text-right">
                            {formatCurrency(data.revenue)}
                          </span>
                        </div>
                      </div>
                    ))}
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
