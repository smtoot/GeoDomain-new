'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { AdminPageLayout, AdminDataTable } from '@/components/admin/AdminDesignSystem';
import { GlobalSearch } from '@/components/admin/GlobalSearch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Globe, 
  MessageSquare, 
  DollarSign, 
  FileText,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize query from URL params
  useEffect(() => {
    if (!isInitialized) {
      const urlQuery = searchParams.get('q');
      if (urlQuery) {
        setQuery(urlQuery);
      }
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized]);

  // Search API call
  const { data: searchResults, isLoading, error } = trpc.adminGlobalSearch.globalSearch.useQuery(
    { query },
    { 
      enabled: isInitialized && query.length >= 2,
      refetchOnWindowFocus: false
    }
  );

  // Filter results by type
  const filteredResults = searchResults?.filter(result => 
    selectedType === 'all' || result.type === selectedType
  ) || [];

  // Group results by type
  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof filteredResults>);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return User;
      case 'domain': return Globe;
      case 'inquiry': return MessageSquare;
      case 'deal': return DollarSign;
      case 'message': return FileText;
      case 'support': return MessageSquare;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-800';
      case 'domain': return 'bg-green-100 text-green-800';
      case 'inquiry': return 'bg-yellow-100 text-yellow-800';
      case 'deal': return 'bg-purple-100 text-purple-800';
      case 'message': return 'bg-gray-100 text-gray-800';
      case 'support': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'user': return 'Users';
      case 'domain': return 'Domains';
      case 'inquiry': return 'Inquiries';
      case 'deal': return 'Deals';
      case 'message': return 'Messages';
      case 'support': return 'Support Tickets';
      default: return 'Other';
    }
  };

  const handleResultClick = (result: any) => {
    router.push(result.url);
  };

  const handleExportResults = () => {
    if (!filteredResults.length) return;
    
    const csvContent = [
      ['Type', 'Title', 'Subtitle', 'Status', 'Date', 'Value'].join(','),
      ...filteredResults.map(result => [
        result.type,
        `"${result.title}"`,
        `"${result.subtitle}"`,
        result.metadata?.status || '',
        result.metadata?.date || '',
        result.metadata?.value || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-results-${query}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminPageLayout
      title="Global Search"
      description="Search across all platform data"
      actions={
        <div className="flex items-center gap-2">
          {filteredResults.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportResults}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Results
            </Button>
          )}
        </div>
      }
    >
      {/* Search Input */}
      <div className="mb-6">
        <GlobalSearch 
          placeholder="Search users, domains, inquiries, deals..."
          className="w-full max-w-2xl"
          onResultClick={handleResultClick}
        />
      </div>

      {/* Search Results */}
      {!isInitialized ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing search...</p>
        </div>
      ) : query.length >= 2 ? (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Search Results for "{query}"
              </h2>
              <Badge variant="outline">
                {filteredResults.length} results
              </Badge>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="all">All Types</option>
                <option value="user">Users</option>
                <option value="domain">Domains</option>
                <option value="inquiry">Inquiries</option>
                <option value="deal">Deals</option>
                <option value="message">Messages</option>
                <option value="support">Support</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error.message}</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && filteredResults.length === 0 && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">
                Try different keywords or check your spelling
              </p>
            </div>
          )}

          {/* Results by Type */}
          {!isLoading && !error && filteredResults.length > 0 && (
            <div className="space-y-6">
              {Object.entries(groupedResults).map(([type, results]) => {
                const Icon = getTypeIcon(type);
                
                return (
                  <AdminDataTable
                    key={type}
                    title={getTypeLabel(type)}
                    description={`${results.length} ${getTypeLabel(type).toLowerCase()} found`}
                  >
                    <div className="space-y-2">
                      {results.map((result) => (
                        <div
                          key={`${result.type}-${result.id}`}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900 truncate">
                                  {result.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getTypeColor(result.type)}`}
                                >
                                  {result.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {result.subtitle}
                              </p>
                              {result.metadata && (
                                <div className="flex items-center gap-2 mt-2">
                                  {result.metadata.status && (
                                    <Badge variant="outline" className="text-xs">
                                      {result.metadata.status}
                                    </Badge>
                                  )}
                                  {result.metadata.date && (
                                    <span className="text-xs text-gray-500">
                                      {result.metadata.date}
                                    </span>
                                  )}
                                  {result.metadata.value && (
                                    <span className="text-xs text-gray-500">
                                      {result.metadata.value}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AdminDataTable>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Start your search</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Use the search bar above to find users, domains, inquiries, deals, and more across the platform.
          </p>
        </div>
      )}
    </AdminPageLayout>
  );
}
