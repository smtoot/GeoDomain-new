'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { extractTrpcData } from '@/lib/utils/trpc-helpers';
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

/**
 * BuyerDashboard Component
 * 
 * Displays buyer statistics, quick actions, and recent activity.
 * Optimized with React.memo, useCallback, and useMemo for performance.
 */
function BuyerDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch buyer statistics with optimized caching
  const { data: buyerStatsResponse, isLoading: statsLoading, error: statsError } = trpc.dashboard.getBuyerStats.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false
    }
  );
  
  // Fetch buyer activity with optimized caching
  const { data: buyerActivityResponse, isLoading: activityLoading, error: activityError } = trpc.dashboard.getBuyerActivity.useQuery(
    undefined,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false
    }
  );

  // Memoized data extraction to prevent unnecessary re-renders
  const buyerStats = useMemo(() => {
    return extractTrpcData(buyerStatsResponse);
  }, [buyerStatsResponse]);

  const buyerActivity = useMemo(() => {
    return extractTrpcData(buyerActivityResponse);
  }, [buyerActivityResponse]);

  useEffect(() => {
    if (!statsLoading && !activityLoading) {
      setIsLoading(false);
    }
  }, [statsLoading, activityLoading]);

  // Memoized quick action handler
  const handleQuickAction = useCallback((action: string) => {
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
  }, [router]);

  // Memoized change icon component
  const getChangeIcon = useCallback((change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" />;
    }
    return <Activity className="h-4 w-4 text-gray-600" aria-hidden="true" />;
  }, []);

  // Memoized change color class
  const getChangeColor = useCallback((change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  }, []);

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
        <Button 
          onClick={() => handleQuickAction('browse')}
          aria-label="Browse available domains to purchase"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleQuickAction('browse');
            }
          }}
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Browse Domains
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Inquiries */}
        <Card role="region" aria-labelledby="total-inquiries-title">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle id="total-inquiries-title" className="text-sm font-medium">Total Inquiries</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" aria-label={`${buyerStats?.totalInquiries || 0} total inquiries`}>
              {buyerStats?.totalInquiries || 0}
            </div>
            {buyerStats?.inquiriesChange !== undefined && (
              <div className="flex items-center gap-1 text-xs" role="img" aria-label={`${buyerStats.inquiriesChange > 0 ? 'increase' : buyerStats.inquiriesChange < 0 ? 'decrease' : 'no change'} of ${Math.abs(buyerStats.inquiriesChange)}% from last month`}>
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
        <Card role="region" aria-labelledby="pending-inquiries-title">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle id="pending-inquiries-title" className="text-sm font-medium">Pending Inquiries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600" aria-label={`${buyerStats?.pendingInquiries || 0} pending inquiries`}>
              {buyerStats?.pendingInquiries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        {/* Saved Domains */}
        <Card role="region" aria-labelledby="saved-domains-title">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle id="saved-domains-title" className="text-sm font-medium">Saved Domains</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" aria-label={`${buyerStats?.totalSavedDomains || 0} saved domains`}>
              {buyerStats?.totalSavedDomains || 0}
            </div>
            {buyerStats?.savedChange !== undefined && (
              <div className="flex items-center gap-1 text-xs" role="img" aria-label={`${buyerStats.savedChange > 0 ? 'increase' : buyerStats.savedChange < 0 ? 'decrease' : 'no change'} of ${Math.abs(buyerStats.savedChange)}% from last month`}>
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
        <Card role="region" aria-labelledby="total-spent-title">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle id="total-spent-title" className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" aria-label={`Total spent: $${(buyerStats?.totalSpent || 0).toLocaleString()}`}>
              ${(buyerStats?.totalSpent || 0).toLocaleString()}
            </div>
            {buyerStats?.spendingChange !== undefined && (
              <div className="flex items-center gap-1 text-xs" role="img" aria-label={`${buyerStats.spendingChange > 0 ? 'increase' : buyerStats.spendingChange < 0 ? 'decrease' : 'no change'} of ${Math.abs(buyerStats.spendingChange)}% from last month`}>
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
      <Card role="region" aria-labelledby="quick-actions-title">
        <CardHeader>
          <CardTitle id="quick-actions-title">Quick Actions</CardTitle>
          <CardDescription>
            Access your most important buyer features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Quick action buttons">
            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('browse')}
              aria-label="Browse available domains to find new opportunities"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuickAction('browse');
                }
              }}
            >
              <Globe className="h-8 w-8 text-blue-600" aria-hidden="true" />
              <div className="text-center">
                <div className="font-medium">Browse Domains</div>
                <div className="text-sm text-muted-foreground">Find new opportunities</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('saved')}
              aria-label="View your saved domains and favorites"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuickAction('saved');
                }
              }}
            >
              <Heart className="h-8 w-8 text-red-600" aria-hidden="true" />
              <div className="text-center">
                <div className="font-medium">Saved Domains</div>
                <div className="text-sm text-muted-foreground">Your favorites</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('purchases')}
              aria-label="View your purchase history and track spending"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuickAction('purchases');
                }
              }}
            >
              <ShoppingCart className="h-8 w-8 text-green-600" aria-hidden="true" />
              <div className="text-center">
                <div className="font-medium">Purchase History</div>
                <div className="text-sm text-muted-foreground">Track spending</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex-col gap-2"
              onClick={() => handleQuickAction('inquiries')}
              aria-label="View your inquiries and responses from sellers"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleQuickAction('inquiries');
                }
              }}
            >
              <MessageSquare className="h-8 w-8 text-purple-600" aria-hidden="true" />
              <div className="text-center">
                <div className="font-medium">My Inquiries</div>
                <div className="text-sm text-muted-foreground">View responses</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {buyerActivity && (
        <Card role="region" aria-labelledby="recent-activity-title">
          <CardHeader>
            <CardTitle id="recent-activity-title">Recent Activity</CardTitle>
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
                            onClick={() => router.push(`/domains/${encodeURIComponent(inquiry.domain.name)}`)}
                            aria-label={`View details for domain ${inquiry.domain.name}`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                router.push(`/domains/${encodeURIComponent(inquiry.domain.name)}`);
                              }
                            }}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
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

// Export memoized component for performance optimization
export default memo(BuyerDashboard);
