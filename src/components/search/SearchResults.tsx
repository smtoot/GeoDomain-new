"use client";

import { DomainGrid } from '@/components/domain/DomainGrid';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  AlertCircle, 
  Loader2,
  Globe,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchDomain {
  id: string;
  name: string;
  price: number | any;
  industry: string;
  state: string;
  city?: string | null;
  logoUrl?: string | null;
  status: string;
  description?: string | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  analytics?: {
    views: number;
    inquiries: number;
  }[];
}

interface SearchResultsProps {
  results: SearchDomain[];
  isLoading: boolean;
  layout: 'grid' | 'list';
  onInquiry: (domainId: string) => void;
  onView: (domainId: string) => void;
  className?: string;
}

export function SearchResults({
  results,
  isLoading,
  layout,
  onInquiry,
  onView,
  className,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Searching domains...</p>
          </div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No domains found
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or filters to find more domains.
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Globe className="h-4 w-4" />
                  <span>Check domain name spelling</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Filter className="h-4 w-4" />
                  <span>Try different filters</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Expand location search</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <DomainGrid
        domains={results as any}
        isLoading={false}
        layout={layout}
        showActions={true}
        onInquiry={onInquiry}
        onView={onView}
      />
    </div>
  );
}
