'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface SalesPerformanceCardProps {
  totalRevenue: number;
  totalInquiries: number;
  totalViews: number;
  averageSalePrice: number;
  conversionRate: number;
  revenueChange: number;
  inquiriesChange: number;
  viewsChange: number;
}

export function SalesPerformanceCard({
  totalRevenue,
  totalInquiries,
  totalViews,
  averageSalePrice,
  conversionRate,
  revenueChange,
  inquiriesChange,
  viewsChange
}: SalesPerformanceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Sales Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
            <div className="flex items-center justify-center mt-1">
              {getChangeIcon(revenueChange)}
              <span className={`text-sm ml-1 ${getChangeColor(revenueChange)}`}>
                {revenueChange > 0 ? '+' : ''}{revenueChange}%
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{totalInquiries}</div>
            <div className="text-sm text-gray-600">Total Inquiries</div>
            <div className="flex items-center justify-center mt-1">
              {getChangeIcon(inquiriesChange)}
              <span className={`text-sm ml-1 ${getChangeColor(inquiriesChange)}`}>
                {inquiriesChange > 0 ? '+' : ''}{inquiriesChange}%
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(averageSalePrice)}</div>
            <div className="text-sm text-gray-600">Average Sale Price</div>
            <div className="text-xs text-gray-500 mt-1">
              {conversionRate.toFixed(1)}% conversion rate
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Views</div>
            <div className="flex items-center justify-center mt-1">
              {getChangeIcon(viewsChange)}
              <span className={`text-sm ml-1 ${getChangeColor(viewsChange)}`}>
                {viewsChange > 0 ? '+' : ''}{viewsChange}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
