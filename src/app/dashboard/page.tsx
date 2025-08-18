'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { 
  Eye, 
  MessageSquare, 
  DollarSign, 
  Globe,
  TrendingUp,

} from 'lucide-react';

// Mock data - replace with real API calls
const mockStats = {
  totalViews: 1247,
  totalInquiries: 12,
  totalRevenue: 45000,
  totalDomains: 3,
  viewsChange: 15.3,
  inquiriesChange: -2.1,
  revenueChange: 8.7,
  domainsChange: 0
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'inquiry' as const,
    title: 'New inquiry for techstartup.com',
    description: 'Buyer interested in purchasing the domain',
    timestamp: '2 hours ago',
    status: 'success' as const
  },
  {
    id: '2',
    type: 'verification' as const,
    title: 'Domain verification completed',
    description: 'realestatepro.net is now verified',
    timestamp: '1 day ago',
    status: 'success' as const
  },
  {
    id: '3',
    type: 'payment' as const,
    title: 'Payment received for financehub.com',
    description: 'Transaction completed successfully',
    timestamp: '3 days ago',
    status: 'success' as const
  }
];

const mockStatsCards = [
  {
    id: 'views',
    title: 'Total Views',
    value: 1247,
    change: 15.3,
    changeType: 'increase' as const,
    icon: <Eye className="h-5 w-5 text-blue-500" />,
    color: 'bg-blue-500',
    description: 'Total page views across all domains'
  },
  {
    id: 'inquiries',
    title: 'Total Inquiries',
    value: 12,
    change: -2.1,
    changeType: 'decrease' as const,
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
    color: 'bg-green-500',
    description: 'Total inquiries received'
  },
  {
    id: 'revenue',
    title: 'Total Revenue',
    value: 45000,
    change: 8.7,
    changeType: 'increase' as const,
    icon: <DollarSign className="h-5 w-5 text-purple-500" />,
    color: 'bg-purple-500',
    description: 'Total revenue from domain sales'
  },
  {
    id: 'domains',
    title: 'Active Domains',
    value: 3,
    change: 0,
    changeType: 'neutral' as const,
    icon: <Globe className="h-5 w-5 text-orange-500" />,
    color: 'bg-orange-500',
    description: 'Number of active domain listings'
  }
];

const mockDomains = [
  {
    id: '1',
    name: 'techstartup.com',
    price: 15000,
    industry: 'Technology',
    state: 'California',
    city: 'San Francisco',
    status: 'VERIFIED',
    inquiryCount: 5
  },
  {
    id: '2',
    name: 'realestatepro.net',
    price: 8500,
    industry: 'Real Estate',
    state: 'New York',
    city: 'New York',
    status: 'VERIFIED',
    inquiryCount: 3
  },
  {
    id: '3',
    name: 'healthcareplus.org',
    price: 12000,
    industry: 'Healthcare',
    state: 'Texas',
    city: 'Austin',
    status: 'VERIFIED',
    inquiryCount: 7
  }
];

export default function DashboardPage() {
  const [userRole] = useState<'BUYER' | 'SELLER' | 'ADMIN'>('SELLER');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                GeoDomainLand
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link href="/domains" className="text-gray-600 hover:text-gray-900">
                Browse Domains
              </Link>
              <Link href="/dashboard" className="text-blue-600 font-medium">
                Dashboard
              </Link>
              <Button variant="outline">Logout</Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s an overview of your account.</p>
        </div>

        {/* Dashboard Overview Component */}
        <DashboardOverview 
          stats={mockStats}
          recentActivity={mockRecentActivity}
          userRole={userRole}
        />

        {/* Stats Cards Component */}
        <div className="mt-8">
          <StatsCards stats={mockStatsCards} period="Last 30 days" />
        </div>

        {/* Quick Actions and My Domains */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {/* Quick Actions Component */}
          <QuickActions 
            userRole={userRole}
            pendingActions={2}
            unreadMessages={3}
          />

          {/* My Domains */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>My Domains</CardTitle>
                  <CardDescription>Manage your domain listings</CardDescription>
                </div>
                <Link href="/domains/new">
                  <Button>Add Domain</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDomains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{domain.name}</h3>
                      <p className="text-sm text-gray-600">
                        {domain.industry} • {domain.city && `${domain.city}, `}{domain.state}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(domain.price)}</div>
                      <div className="text-sm text-gray-600">{domain.inquiryCount} inquiries</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">Edit</Button>
                      <Button size="sm">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>Key insights about your domain performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
