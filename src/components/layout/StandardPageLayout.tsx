'use client';

import { ReactNode } from 'react';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCard } from '@/components/ui/loading/LoadingCard';
import { cn } from '@/lib/utils';

interface StandardPageLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  isLoading?: boolean;
  loadingText?: string;
  error?: Error | null;
  context?: string;
  className?: string;
  showHeader?: boolean;
}

export function StandardPageLayout({
  children,
  title,
  description,
  isLoading = false,
  loadingText = 'Loading...',
  error = null,
  context = 'Page',
  className,
  showHeader = true
}: StandardPageLayoutProps) {
  if (isLoading) {
    return (
      <LoadingCard 
        title={loadingText}
        description="Please wait while we load your content."
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading {context}
          </h2>
          <p className="text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context={context}>
      <div className={cn('min-h-screen bg-gray-50', className)}>
        {showHeader && (title || description) && (
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {title && (
                <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              )}
              {description && (
                <p className="mt-2 text-gray-600">{description}</p>
              )}
            </div>
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </QueryErrorBoundary>
  );
}
