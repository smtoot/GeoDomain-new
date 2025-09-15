import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Admin Design System Constants
export const ADMIN_DESIGN_TOKENS = {
  colors: {
    background: 'bg-gray-50',
    surface: 'bg-white',
    sidebar: 'bg-gray-800',
    primary: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
    muted: 'text-gray-600',
    text: 'text-gray-900',
    border: 'border-gray-200',
  },
  spacing: {
    page: 'p-6',
    section: 'mb-8',
    card: 'p-6',
    compact: 'p-4',
    tight: 'p-3',
  },
  typography: {
    h1: 'text-3xl font-bold text-gray-900',
    h2: 'text-2xl font-semibold text-gray-900',
    h3: 'text-xl font-semibold text-gray-900',
    subtitle: 'text-gray-600',
    body: 'text-gray-900',
    caption: 'text-sm text-gray-600',
  },
  layout: {
    container: 'max-w-7xl mx-auto',
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
    flex: 'flex items-center justify-between',
  }
} as const;

// Standardized Admin Page Layout
interface AdminPageLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminPageLayout({ 
  title, 
  description, 
  children, 
  actions,
  className 
}: AdminPageLayoutProps) {
  return (
    <div className={cn(ADMIN_DESIGN_TOKENS.colors.background, 'min-h-screen')}>
      <div className={cn(ADMIN_DESIGN_TOKENS.layout.container, 'px-4 sm:px-6 lg:px-8 py-8', className)}>
        {/* Standardized Header */}
        <div className={cn(ADMIN_DESIGN_TOKENS.layout.flex, ADMIN_DESIGN_TOKENS.spacing.section)}>
          <div>
            <h1 className={ADMIN_DESIGN_TOKENS.typography.h1}>{title}</h1>
            {description && (
              <p className={cn(ADMIN_DESIGN_TOKENS.typography.subtitle, 'mt-2')}>
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-4">
              {actions}
            </div>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}

// Standardized Stats Card
interface AdminStatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

export function AdminStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'blue',
  className 
}: AdminStatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  };

  return (
    <Card className={className}>
      <CardContent className={ADMIN_DESIGN_TOKENS.spacing.card}>
        <div className={ADMIN_DESIGN_TOKENS.layout.flex}>
          <div>
            <p className={cn(ADMIN_DESIGN_TOKENS.typography.caption, 'font-medium')}>
              {title}
            </p>
            <p className={cn(ADMIN_DESIGN_TOKENS.typography.h2, 'mt-1')}>
              {value}
            </p>
            {trend && (
              <p className={cn(
                'text-sm flex items-center mt-1',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                <span className="mr-1">{trend.isPositive ? '↗' : '↘'}</span>
                {trend.value}
              </p>
            )}
          </div>
          <Icon className={cn('h-8 w-8', colorClasses[color])} />
        </div>
      </CardContent>
    </Card>
  );
}

// Standardized Section Header
interface AdminSectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminSectionHeader({ 
  title, 
  description, 
  actions,
  className 
}: AdminSectionHeaderProps) {
  return (
    <div className={cn(ADMIN_DESIGN_TOKENS.layout.flex, 'mb-6', className)}>
      <div>
        <h2 className={ADMIN_DESIGN_TOKENS.typography.h2}>{title}</h2>
        {description && (
          <p className={cn(ADMIN_DESIGN_TOKENS.typography.subtitle, 'mt-1')}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

// Standardized Data Table Container
interface AdminDataTableProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function AdminDataTable({ 
  title, 
  description, 
  children, 
  actions,
  className 
}: AdminDataTableProps) {
  return (
    <Card className={className}>
      <CardHeader className={ADMIN_DESIGN_TOKENS.spacing.card}>
        <div className={ADMIN_DESIGN_TOKENS.layout.flex}>
          <div>
            <CardTitle className={ADMIN_DESIGN_TOKENS.typography.h3}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}

// Standardized Status Badge
interface AdminStatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function AdminStatusBadge({ 
  status, 
  variant = 'default',
  className 
}: AdminStatusBadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <Badge 
      className={cn(
        'text-xs font-medium px-2 py-1',
        variantClasses[variant],
        className
      )}
    >
      {status}
    </Badge>
  );
}

// Standardized Action Button Group
interface AdminActionGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function AdminActionGroup({ children, className }: AdminActionGroupProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {children}
    </div>
  );
}

// Standardized Loading State
interface AdminLoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function AdminLoadingState({ 
  title = 'Loading...', 
  description = 'Please wait while we load your content.',
  className 
}: AdminLoadingStateProps) {
  return (
    <div className={cn(
      'flex items-center justify-center min-h-64',
      className
    )}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h3 className={ADMIN_DESIGN_TOKENS.typography.h3}>{title}</h3>
        <p className={cn(ADMIN_DESIGN_TOKENS.typography.subtitle, 'mt-2')}>
          {description}
        </p>
      </div>
    </div>
  );
}

// Standardized Empty State
interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  className?: string;
}

export function AdminEmptyState({ 
  title, 
  description, 
  icon: Icon, 
  action,
  className 
}: AdminEmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center min-h-64 text-center',
      className
    )}>
      <Icon className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className={ADMIN_DESIGN_TOKENS.typography.h3}>{title}</h3>
      <p className={cn(ADMIN_DESIGN_TOKENS.typography.subtitle, 'mt-2 max-w-md')}>
        {description}
      </p>
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}
