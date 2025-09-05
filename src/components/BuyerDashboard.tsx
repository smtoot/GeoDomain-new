'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Heart,
  ShoppingCart,
  DollarSign,
  Activity,
  Clock,
  Eye,
  Plus,
  ArrowRight,
  Globe
} from 'lucide-react';

export default function BuyerDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch buyer statistics with optimized caching
  const { data: buyerStats, isLoading: statsLoading, error: statsError } = trpc.dashboard.getBuyerStats.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  );
  
  // Fetch buyer activity with optimized caching
  const { data: buyerActivity, isLoading: activityLoading, error: activityError } = trpc.dashboard.getBuyerActivity.useQuery(
    undefined,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  );

  useEffect(() => {
    if (!statsLoading && !activityLoading) {
      setIsLoading(false);
    }
  }, [statsLoading, activityLoading]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'browse':
        router.push('/domains');
        break;
      case 'saved':
        router.push('/dashboard/saved');
        break;
      case 'purchases':
        router.push('/dashboard/purchases');
        break;
      case 'inquiries':
        router.push('/dashboard/inquiries');
        break;
      default:
        break;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Buyer Dashboard</h2>
          <p className="text-gray-600">
            Track your domain inquiries, purchases, and activity
          </p>
        </div>
        <Button onClick={() => handleQuickAction('browse')}>
          <Plus className="h-4 w-4 mr-2" />
          Browse Domains
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Inquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {buyerStats?.totalInquiries || 0}
            </div>
            {buyerStats?.inquiriesChange !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {getChangeIcon(buyerStats.inquiriesChange)}
                <span className={getChangeColor(buyerStats.inquiriesChange)}>
                  {buyerStats.inquiriesChange > 0 ? '+' : ''}{buyerStats.inquiriesChange}%
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Inquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Inquiries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {buyerStats?.pendingInquiries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        {/* Saved Domains */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saved Domains</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {buyerStats?.totalSavedDomains || 0}
            </div>
            {buyerStats?.savedChange !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {getChangeIcon(buyerStats.savedChange)}
                <span className={getChangeColor(buyerStats.savedChange)}>
                  {buyerStats.savedChange > 0 ? '+' : ''}{buyerStats.savedChange}%
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Spent */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(buyerStats?.totalSpent || 0).toLocaleString()}
            </div>
            {buyerStats?.spendingChange !== undefined && (
              <div className="flex items-center gap-1 text-xs">
                {getChangeIcon(buyerStats.spendingChange)}
                <span className={getChangeColor(buyerStats.spendingChange)}>
                  {buyerStats.spendingChange > 0 ? '+' : ''}{buyerStats.spendingChange}%
                </span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access your most important buyer features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('browse')}
            >
              <Globe className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Browse Domains</div>
                <div className="text-sm text-muted-foreground">Find new opportunities</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('saved')}
            >
              <Heart className="h-8 w-8 text-red-600" />
              <div className="text-center">
                <div className="font-medium">Saved Domains</div>
                <div className="text-sm text-muted-foreground">Your favorites</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('purchases')}
            >
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Purchase History</div>
                <div className="text-sm text-muted-foreground">Track spending</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('inquiries')}
            >
              <MessageSquare className="h-8 w-8 text-purple-600" />
              <div className="text-center">
                <div className="font-medium">My Inquiries</div>
                <div className="text-sm text-muted-foreground">View responses</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {buyerActivity && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest domain interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Inquiries */}
              {buyerActivity.inquiries && buyerActivity.inquiries.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Recent Inquiries
                  </h4>
                  <div className="space-y-2">
                    {buyerActivity.inquiries.slice(0, 3).map((inquiry: any) => (
                      <div key={inquiry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-gray-900">{inquiry.domain.name}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(inquiry.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {inquiry.status}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/domains/${inquiry.domain.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Purchases */}
              {buyerActivity.purchases && buyerActivity.purchases.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Recent Purchases
                  </h4>
                  <div className="space-y-2">
                    {buyerActivity.purchases.slice(0, 3).map((purchase: any) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <div className="font-medium text-gray-900">{purchase.domain.name}</div>
                            <div className="text-sm text-gray-600">
                              {new Date(purchase.completedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="font-medium text-green-600">
                              ${purchase.amount?.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-600">Completed</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!buyerActivity.inquiries || buyerActivity.inquiries.length === 0) &&
               (!buyerActivity.purchases || buyerActivity.purchases.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <div className="font-medium mb-2">No recent activity</div>
                  <div className="text-sm">Start browsing domains to generate activity</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error States */}
      {(statsError || activityError) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-red-600 font-medium mb-2">Failed to load buyer data</div>
              <div className="text-sm text-red-600 mb-4">
                {statsError?.message || activityError?.message || 'Please try refreshing the page'}
              </div>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
