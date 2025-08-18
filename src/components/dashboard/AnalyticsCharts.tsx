'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }[];
}

interface AnalyticsChartsProps {
  viewsData: ChartData;
  revenueData: ChartData;
  inquiriesData: ChartData;
  domainPerformance: {
    name: string;
    views: number;
    inquiries: number;
    revenue: number;
    status: string;
  }[];
}

export function AnalyticsCharts({ 
  viewsData, 
  revenueData, 
  inquiriesData, 
  domainPerformance 
}: AnalyticsChartsProps) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'bg-green-100 text-green-800';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-100 text-yellow-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Simple bar chart component using CSS
  const SimpleBarChart = ({ data, title, color = 'bg-blue-500' }: { 
    data: { label: string; value: number }[]; 
    title: string; 
    color?: string;
  }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium">{title}</h4>
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">{formatNumber(item.value)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Simple line chart component using CSS
  const SimpleLineChart = ({ data, title, color = 'bg-green-500' }: { 
    data: { label: string; value: number }[]; 
    title: string; 
    color?: string;
  }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue;
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium">{title}</h4>
        <div className="relative h-32">
          <svg className="w-full h-full" viewBox={`0 0 ${data.length * 40} 120`}>
            <polyline
              fill="none"
              stroke="currentColor"
              className={color.replace('bg-', 'text-')}
              strokeWidth="2"
              points={data.map((item, index) => 
                `${index * 40 + 20},${120 - ((item.value - minValue) / range) * 100}`
              ).join(' ')}
            />
            {data.map((item, index) => (
              <circle
                key={index}
                cx={index * 40 + 20}
                cy={120 - ((item.value - minValue) / range) * 100}
                r="3"
                className={color.replace('bg-', 'fill-')}
              />
            ))}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
            {data.map((item, index) => (
              <span key={index} className="transform -rotate-45 origin-left">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select defaultValue="30d">
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
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Views</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Revenue</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Inquiries</span>
          </Badge>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Views Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Views Trend</span>
            </CardTitle>
            <CardDescription>Monthly view count progression</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={viewsData.labels.map((label, index) => ({
                label,
                value: viewsData.datasets[0].data[index]
              }))}
              title="Views Over Time"
              color="bg-blue-500"
            />
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChart className="h-5 w-5" />
              <span>Revenue Trend</span>
            </CardTitle>
            <CardDescription>Monthly revenue progression</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleLineChart
              data={revenueData.labels.map((label, index) => ({
                label,
                value: revenueData.datasets[0].data[index]
              }))}
              title="Revenue Over Time"
              color="bg-green-500"
            />
          </CardContent>
        </Card>

        {/* Inquiries Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5" />
              <span>Inquiries Distribution</span>
            </CardTitle>
            <CardDescription>Inquiry count by month</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarChart
              data={inquiriesData.labels.map((label, index) => ({
                label,
                value: inquiriesData.datasets[0].data[index]
              }))}
              title="Inquiries by Month"
              color="bg-purple-500"
            />
          </CardContent>
        </Card>

        {/* Domain Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Domain Performance</span>
            </CardTitle>
            <CardDescription>Performance metrics by domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {domainPerformance.map((domain, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{domain.name}</h4>
                    <Badge className={getStatusColor(domain.status)}>
                      {domain.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-gray-600">Views:</span>
                      <div className="font-medium">{formatNumber(domain.views)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Inquiries:</span>
                      <div className="font-medium">{domain.inquiries}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Revenue:</span>
                      <div className="font-medium">{formatCurrency(domain.revenue)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>Key metrics and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(viewsData.datasets[0].data.reduce((a, b) => a + b, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Views</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+15.3%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(revenueData.datasets[0].data.reduce((a, b) => a + b, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">+8.7%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(inquiriesData.datasets[0].data.reduce((a, b) => a + b, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Inquiries</div>
              <div className="flex items-center justify-center mt-1">
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                <span className="text-xs text-red-600">-2.1%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {domainPerformance.length}
              </div>
              <div className="text-sm text-gray-600">Active Domains</div>
              <div className="flex items-center justify-center mt-1">
                <span className="text-xs text-gray-600">No change</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
