import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MessageSquare, 
  DollarSign, 
  Globe,
  Calendar,
  Users
} from 'lucide-react';

interface DomainStats {
  totalDomains: number;
  totalViews: number;
  totalInquiries: number;
  totalValue: number;
  averagePrice: number;
  verifiedDomains: number;
  pendingVerification: number;
  activeListings: number;
  viewsThisMonth: number;
  inquiriesThisMonth: number;
  viewsChange: number;
  inquiriesChange: number;
  valueChange: number;
}

interface DomainStatsProps {
  stats: DomainStats;
  period?: '7d' | '30d' | '90d' | '1y';
  showTrends?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function DomainStats({ 
  stats, 
  period = '30d', 
  showTrends = true,
  variant = 'default' 
}: DomainStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    }
    if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalDomains)}</div>
          <div className="text-sm text-gray-600">Total Domains</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{formatNumber(stats.totalViews)}</div>
          <div className="text-sm text-gray-600">Total Views</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{formatNumber(stats.totalInquiries)}</div>
          <div className="text-sm text-gray-600">Total Inquiries</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.totalValue)}</div>
          <div className="text-sm text-gray-600">Total Value</div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalDomains)}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{stats.verifiedDomains} verified</span>
                <span>•</span>
                <span>{stats.pendingVerification} pending</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
              {showTrends && (
                <div className="flex items-center space-x-2 text-xs">
                  {getTrendIcon(stats.viewsChange)}
                  <span className={getTrendColor(stats.viewsChange)}>
                    {formatPercentage(stats.viewsChange)} from last {period}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalInquiries)}</div>
              {showTrends && (
                <div className="flex items-center space-x-2 text-xs">
                  {getTrendIcon(stats.inquiriesChange)}
                  <span className={getTrendColor(stats.inquiriesChange)}>
                    {formatPercentage(stats.inquiriesChange)} from last {period}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              {showTrends && (
                <div className="flex items-center space-x-2 text-xs">
                  {getTrendIcon(stats.valueChange)}
                  <span className={getTrendColor(stats.valueChange)}>
                    {formatPercentage(stats.valueChange)} from last {period}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Domain Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Verified</span>
                <Badge variant="default">{stats.verifiedDomains}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Verification</span>
                <Badge variant="secondary">{stats.pendingVerification}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Listings</span>
                <Badge variant="outline">{stats.activeListings}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Views</span>
                <span className="font-semibold">{formatNumber(stats.viewsThisMonth)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Inquiries</span>
                <span className="font-semibold">{formatNumber(stats.inquiriesThisMonth)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Price</span>
                <span className="font-semibold">{formatCurrency(stats.averagePrice)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Conversion Rate</span>
                <span className="font-semibold">
                  {stats.totalViews > 0 
                    ? ((stats.totalInquiries / stats.totalViews) * 100).toFixed(2)
                    : '0'
                  }%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Views per Domain</span>
                <span className="font-semibold">
                  {stats.totalDomains > 0 
                    ? Math.round(stats.totalViews / stats.totalDomains)
                    : '0'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Avg. Inquiries per Domain</span>
                <span className="font-semibold">
                  {stats.totalDomains > 0 
                    ? (stats.totalInquiries / stats.totalDomains).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalDomains)}</div>
          <p className="text-xs text-muted-foreground">
            {stats.verifiedDomains} verified, {stats.pendingVerification} pending
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
          {showTrends && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIcon(stats.viewsChange)}
              <span className={getTrendColor(stats.viewsChange)}>
                {formatPercentage(stats.viewsChange)} from last {period}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalInquiries)}</div>
          {showTrends && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIcon(stats.inquiriesChange)}
              <span className={getTrendColor(stats.inquiriesChange)}>
                {formatPercentage(stats.inquiriesChange)} from last {period}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          {showTrends && (
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {getTrendIcon(stats.valueChange)}
              <span className={getTrendColor(stats.valueChange)}>
                {formatPercentage(stats.valueChange)} from last {period}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
