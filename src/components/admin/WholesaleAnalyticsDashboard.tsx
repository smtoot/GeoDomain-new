'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Package, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  RefreshCw,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WholesaleAnalyticsDashboardProps {
  className?: string;
}

export function WholesaleAnalyticsDashboard({ className }: WholesaleAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [metricType, setMetricType] = useState('overview');

  // Fetch comprehensive analytics data
  const { data: analytics, isLoading, refetch } = trpc.wholesale.getAdvancedAnalytics.useQuery({
    timeRange: timeRange as any,
    metricType: metricType as any,
  });

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!analytics) return null;

    const {
      totalRevenue,
      totalSales,
      totalDomains,
      activeDomains,
      pendingDomains,
      soldDomains,
      averageSalePrice,
      conversionRate,
      topSellingCategories,
      topSellingStates,
      salesTrend,
      revenueTrend,
      sellerPerformance,
      recentSales
    } = analytics;

    // Calculate growth rates
    const revenueGrowth = revenueTrend?.length > 1 
      ? ((revenueTrend[revenueTrend.length - 1]?.revenue || 0) - (revenueTrend[0]?.revenue || 0)) / (revenueTrend[0]?.revenue || 1) * 100
      : 0;

    const salesGrowth = salesTrend?.length > 1
      ? ((salesTrend[salesTrend.length - 1]?.sales || 0) - (salesTrend[0]?.sales || 0)) / (salesTrend[0]?.sales || 1) * 100
      : 0;

    // Calculate performance indicators
    const performanceScore = Math.round(
      (conversionRate * 0.4) + 
      (Math.min(revenueGrowth, 100) * 0.3) + 
      (Math.min(salesGrowth, 100) * 0.3)
    );

    return {
      revenueGrowth,
      salesGrowth,
      performanceScore,
      avgDaysToSell: soldDomains > 0 ? Math.round(totalDomains / soldDomains * 30) : 0,
      marketPenetration: totalDomains > 0 ? (soldDomains / totalDomains) * 100 : 0,
    };
  }, [analytics]);

  const handleExportData = async () => {
    try {
      // This would trigger a data export API call
      toast.success('Exporting analytics data...');
      // Implementation would go here
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <TrendingUp className="h-4 w-4 text-gray-600" />;
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
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

  if (!analytics) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No analytics data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Wholesale Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into wholesale marketplace performance</p>
        </div>
        
        <div className="flex items-center gap-4">
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
          
          <Select value={metricType} onValueChange={setMetricType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue?.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(derivedMetrics?.revenueGrowth || 0)}
                  <span className={`text-sm ${derivedMetrics?.revenueGrowth && derivedMetrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {derivedMetrics?.revenueGrowth ? Math.abs(derivedMetrics.revenueGrowth).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalSales}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getTrendIcon(derivedMetrics?.salesGrowth || 0)}
                  <span className={`text-sm ${derivedMetrics?.salesGrowth && derivedMetrics.salesGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {derivedMetrics?.salesGrowth ? Math.abs(derivedMetrics.salesGrowth).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
              <Package className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.conversionRate?.toFixed(1)}%</p>
                <p className="text-sm text-gray-500 mt-1">Market penetration</p>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Performance Score</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(derivedMetrics?.performanceScore || 0)}`}>
                  {derivedMetrics?.performanceScore || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Overall health</p>
              </div>
              <Award className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Sales Performance
            </CardTitle>
            <CardDescription>Key sales metrics and trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{analytics.averageSalePrice?.toFixed(0)}</p>
                <p className="text-sm text-blue-600">Avg Sale Price</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{derivedMetrics?.avgDaysToSell || 0}</p>
                <p className="text-sm text-green-600">Avg Days to Sell</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Active Domains</span>
                </div>
                <Badge className="bg-green-100 text-green-800">{analytics.activeDomains}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pending Approval</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">{analytics.pendingDomains}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Sold Domains</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{analytics.soldDomains}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories & States */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              Top Performers
            </CardTitle>
            <CardDescription>Best selling categories and locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top Categories</h4>
              <div className="space-y-2">
                {analytics.topSellingCategories?.slice(0, 5).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      <span className="text-sm">{category.name}</span>
                    </div>
                    <Badge variant="outline">{category.sales}</Badge>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Top States</h4>
              <div className="space-y-2">
                {analytics.topSellingStates?.slice(0, 5).map((state, index) => (
                  <div key={state.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      <span className="text-sm">{state.name}</span>
                    </div>
                    <Badge variant="outline">{state.sales}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seller Performance */}
      {analytics.sellerPerformance && analytics.sellerPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Top Sellers
            </CardTitle>
            <CardDescription>Best performing sellers in the wholesale marketplace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.sellerPerformance.slice(0, 10).map((seller, index) => (
                <div key={seller.sellerId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{seller.sellerName || 'Anonymous Seller'}</p>
                      <p className="text-sm text-gray-600">{seller.sales} sales • ${seller.revenue?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">${seller.averagePrice?.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">avg price</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Sales */}
      {analytics.recentSales && analytics.recentSales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Recent Sales
            </CardTitle>
            <CardDescription>Latest wholesale domain transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.recentSales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{sale.domainName}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Buyer: {sale.buyerName || sale.buyerEmail}</span>
                      <span>Seller: {sale.sellerName || sale.sellerEmail}</span>
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
