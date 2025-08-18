import { useState } from 'react';
import { DomainCard } from './DomainCard';
import { Button } from '@/components/ui/button';
import { Loader2, Grid3X3, List } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  price: number;
  priceType: 'FIXED' | 'NEGOTIABLE' | 'MAKE_OFFER';
  description?: string;
  industry: string;
  state: string;
  city?: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'PUBLISHED' | 'PAUSED' | 'SOLD';
  logoUrl?: string;
  inquiryCount?: number;
  viewCount?: number;
  createdAt: Date;
  owner?: {
    id: string;
    name: string;
    company?: string;
  };
}

interface DomainGridProps {
  domains: Domain[];
  isLoading?: boolean;
  error?: string | null;
  layout?: 'grid' | 'list';
  onLayoutChange?: (layout: 'grid' | 'list') => void;
  onInquiry?: (domainId: string) => void;
  onView?: (domainId: string) => void;
  showActions?: boolean;
  emptyMessage?: string;
  loadMore?: () => void;
  hasMore?: boolean;
  isLoadMoreLoading?: boolean;
}

export function DomainGrid({
  domains,
  isLoading = false,
  error = null,
  layout = 'grid',
  onLayoutChange,
  onInquiry,
  onView,
  showActions = true,
  emptyMessage = 'No domains found',
  loadMore,
  hasMore = false,
  isLoadMoreLoading = false,
}: DomainGridProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(layout);

  const handleLayoutChange = (newLayout: 'grid' | 'list') => {
    setViewMode(newLayout);
    onLayoutChange?.(newLayout);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading domains...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Domains</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (domains.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Domains Found</h3>
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Layout Controls */}
      {onLayoutChange && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {domains.length} domain{domains.length !== 1 ? 's' : ''} found
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLayoutChange('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleLayoutChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Domains Grid/List */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {domains.map((domain) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            variant={viewMode === 'list' ? 'detailed' : 'default'}
            showActions={showActions}
            onInquiry={onInquiry}
            onView={onView}
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && loadMore && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={loadMore}
            disabled={isLoadMoreLoading}
            variant="outline"
            size="lg"
          >
            {isLoadMoreLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Domains'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
