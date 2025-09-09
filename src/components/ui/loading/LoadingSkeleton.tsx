'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'bg-gray-200 rounded',
            i === lines - 1 ? 'w-3/4' : 'w-full',
            'h-4 mb-2'
          )}
        />
      ))}
    </div>
  );
}

interface LoadingCardSkeletonProps {
  className?: string;
  showHeader?: boolean;
  lines?: number;
}

export function LoadingCardSkeleton({ 
  className, 
  showHeader = true, 
  lines = 3 
}: LoadingCardSkeletonProps) {
  return (
    <div className={cn('animate-pulse bg-white rounded-lg shadow-sm p-6', className)}>
      {showHeader && (
        <div className="mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'bg-gray-200 rounded h-4',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
          />
        ))}
      </div>
    </div>
  );
}
