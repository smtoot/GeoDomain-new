'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Plus, 
  Download, 
  Filter, 
  Search,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileAdminPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  backButton?: boolean;
  backHref?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export function MobileAdminPageLayout({
  title,
  description,
  children,
  actions,
  backButton = false,
  backHref = '/admin',
  className,
  loading = false,
  error,
  onRefresh
}: MobileAdminPageLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {backButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                </Button>
              )}
              {actions}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-red-600 mb-2">⚠️ Error</div>
                <p className="text-gray-600">{error}</p>
                {onRefresh && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Mobile-optimized stats cards
export function MobileStatsCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
  className
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center gap-1 mt-1">
              <Badge 
                variant="outline" 
                className={cn(
                  'text-xs',
                  trend === 'up' && 'bg-green-100 text-green-800',
                  trend === 'down' && 'bg-red-100 text-red-800',
                  trend === 'neutral' && 'bg-gray-100 text-gray-800'
                )}
              >
                {change}
              </Badge>
            </div>
          )}
        </div>
        <div className="p-3 bg-blue-100 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </Card>
  );
}

// Mobile-optimized action bar
export function MobileActionBar({
  actions,
  className
}: {
  actions: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
    disabled?: boolean;
  }>;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2 p-4 bg-white border-t border-gray-200', className)}>
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className="flex-1"
          >
            <Icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}

// Mobile-optimized filter chips
export function MobileFilterChips({
  filters,
  onRemove,
  onClearAll,
  className
}: {
  filters: Array<{
    key: string;
    label: string;
    value: string;
  }>;
  onRemove: (key: string) => void;
  onClearAll?: () => void;
  className?: string;
}) {
  if (filters.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2 p-4 bg-gray-50', className)}>
      {filters.map((filter) => (
        <Badge
          key={filter.key}
          variant="secondary"
          className="flex items-center gap-1 pr-1"
        >
          <span>{filter.label}: {filter.value}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(filter.key)}
            className="h-4 w-4 p-0 hover:bg-gray-300"
          >
            ×
          </Button>
        </Badge>
      ))}
      {onClearAll && filters.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-gray-600"
        >
          Clear All
        </Button>
      )}
    </div>
  );
}
