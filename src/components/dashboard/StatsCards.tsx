'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MessageSquare, 
  DollarSign, 
  Globe,
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  color: string;
  description?: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface StatsCardsProps {
  stats: StatCard[];
  period?: string;
}

export function StatsCards({ stats, period = 'Last 30 days' }: StatsCardsProps) {
  const formatCurrency = (value: string | number) => {
    if (typeof value === 'string') return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: string | number) => {
    if (typeof value === 'string') return value;
    return new Intl.NumberFormat('en-US').format(value);
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeText = (change: number, changeType: string) => {
    if (changeType === 'neutral') return 'No change';
    return `${changeType === 'increase' ? '+' : ''}${change}%`;
  };

  const formatValue = (value: string | number, title: string) => {
    if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('price')) {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Key Metrics</h3>
          <p className="text-sm text-gray-600">{period}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.id} className="relative overflow-hidden">
            {/* Background accent */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.color} opacity-5 rounded-full -translate-y-16 translate-x-16`} />
            
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {stat.icon}
                  {stat.badge && (
                    <Badge variant={stat.badgeVariant || 'default'} className="text-xs">
                      {stat.badge}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {formatValue(stat.value, stat.title)}
                </div>
                
                <div className="flex items-center space-x-2">
                  {getChangeIcon(stat.changeType)}
                  <span className={`text-sm ${getChangeColor(stat.changeType)}`}>
                    {getChangeText(stat.change, stat.changeType)}
                  </span>
                  <span className="text-xs text-gray-600">vs previous period</span>
                </div>
                
                {stat.description && (
                  <p className="text-xs text-gray-600 mt-2">
                    {stat.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Total Views</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(stats.find(s => s.title.includes('Views'))?.value || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900">Total Inquiries</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(stats.find(s => s.title.includes('Inquiries'))?.value || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(stats.find(s => s.title.includes('Revenue'))?.value || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance Indicators</CardTitle>
            <CardDescription>Key performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Conversion Rate</span>
              </div>
              <span className="text-sm font-medium">2.4%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Avg Response Time</span>
              </div>
              <span className="text-sm font-medium">4.2 hours</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Customer Satisfaction</span>
              </div>
              <span className="text-sm font-medium">4.8/5</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest platform activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New inquiry received</p>
                <p className="text-xs text-gray-600">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Domain verification completed</p>
                <p className="text-xs text-gray-600">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Payment received</p>
                <p className="text-xs text-gray-600">3 hours ago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
