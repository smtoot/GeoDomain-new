'use client';

import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface WholesaleAnalyticsProps {
  className?: string;
}

export function WholesaleAnalytics({ className }: WholesaleAnalyticsProps) {
  const { data: stats, isLoading } = trpc.wholesale.getStats.useQuery();

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  const conversionRate = stats.totalDomains > 0 
    ? ((stats.soldDomains / stats.totalDomains) * 100).toFixed(1)
    : '0.0';

  const averageRevenuePerSale = stats.totalSales > 0 
    ? (stats.totalRevenue / stats.totalSales).toFixed(2)
    : '0.00';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDomains}</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Domains</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeDomains}</p>
                <p className="text-xs text-gray-500">Currently listed</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalSales}</p>
                <p className="text-xs text-gray-500">Completed transactions</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">${stats.totalRevenue}</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Conversion Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">{conversionRate}%</span>
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Avg Revenue/Sale</span>
              </div>
              <span className="text-lg font-bold text-blue-600">${averageRevenuePerSale}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Pending Approval</span>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">
                {stats.pendingDomains}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
            <CardDescription>Domain status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Active</span>
                </div>
                <span className="font-medium">{stats.activeDomains}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Pending</span>
                </div>
                <span className="font-medium">{stats.pendingDomains}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Sold</span>
                </div>
                <span className="font-medium">{stats.soldDomains}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm">Removed</span>
                </div>
                <span className="font-medium">{stats.totalDomains - stats.activeDomains - stats.pendingDomains - stats.soldDomains}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      {stats.recentSales && stats.recentSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Sales
            </CardTitle>
            <CardDescription>Latest wholesale domain transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentSales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{sale.domainName}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Buyer: {sale.buyer.name || sale.buyer.email}</span>
                      <span>Seller: {sale.seller.name || sale.seller.email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">${sale.price}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
