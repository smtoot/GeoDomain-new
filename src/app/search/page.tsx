"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SearchInput } from '@/components/search/SearchInput';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchFilters } from '@/components/search/SearchFilters';
import { SearchSuggestions } from '@/components/search/SearchSuggestions';

import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  SlidersHorizontal,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Add hydration state to prevent mismatches
  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);
  
  // Get initial search parameters from URL (only after hydration)
  const initialQuery = isHydrated ? (searchParams.get('q') || '') : '';
  const initialIndustry = isHydrated ? (searchParams.get('industry')?.split(',') || []) : [];
  const initialState = isHydrated ? (searchParams.get('state')?.split(',') || []) : [];
  const initialCity = isHydrated ? (searchParams.get('city') || '') : '';
  const initialPriceMin = isHydrated ? (searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined) : undefined;
  const initialPriceMax = isHydrated ? (searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined) : undefined;
  const initialSortBy = isHydrated ? ((searchParams.get('sortBy') as 'price' | 'date' | 'popularity') || 'date') : 'date';
  const initialSortOrder = isHydrated ? ((searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc') : 'desc';

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    industry: [] as string[],
    state: [] as string[],
    city: '',
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
    priceType: undefined as 'FIXED' | 'NEGOTIABLE' | 'MAKE_OFFER' | undefined,
    status: 'PUBLISHED' as 'VERIFIED' | 'PUBLISHED',
  });
  const [sortBy, setSortBy] = useState<'price' | 'date' | 'popularity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Update state when hydrated
  useEffect(() => {
    if (isHydrated) {
      setSearchQuery(initialQuery);
      setFilters({
        industry: initialIndustry,
        state: initialState,
        city: initialCity,
        priceMin: initialPriceMin,
        priceMax: initialPriceMax,
        priceType: undefined,
        status: 'PUBLISHED',
      });
      setSortBy(initialSortBy);
      setSortOrder(initialSortOrder);
    }
  }, [isHydrated, initialQuery, initialIndustry, initialState, initialCity, initialPriceMin, initialPriceMax, initialSortBy, initialSortOrder]);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // tRPC queries
  const searchQuery_tRPC = trpc.search.search.useQuery({
    query: searchQuery?.trim() || undefined,
    industry: filters.industry.length > 0 ? filters.industry : undefined,
    state: filters.state.length > 0 ? filters.state : undefined,
    city: filters.city?.trim() || undefined,
    priceMin: filters.priceMin || undefined,
    priceMax: filters.priceMax || undefined,
    priceType: filters.priceType || undefined,
    status: filters.status,
    sortBy,
    sortOrder,
    limit: 20,
  }, {
    enabled: Boolean(isHydrated && (
      (searchQuery && searchQuery.trim().length > 0) || 
      filters.industry.length > 0 || 
      filters.state.length > 0 || 
      (filters.city && filters.city.trim().length > 0) || 
      filters.priceMin || 
      filters.priceMax
    )),
  });

  const suggestionsQuery = trpc.search.getSuggestions.useQuery({
    query: searchQuery,
    limit: 8,
  }, {
    enabled: searchQuery.length > 1 && showSuggestions && searchQuery.trim().length > 0 && isHydrated,
  });

  const popularSearchesQuery = trpc.search.getPopularSearches.useQuery({
    limit: 6,
  }, {
    enabled: isHydrated,
  });

  const filtersQuery = trpc.search.getFilters.useQuery(undefined, {
    enabled: isHydrated,
  });

  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filters.industry.length > 0) params.set('industry', filters.industry.join(','));
    if (filters.state.length > 0) params.set('state', filters.state.join(','));
    if (filters.city) params.set('city', filters.city);
    if (filters.priceMin) params.set('priceMin', filters.priceMin.toString());
    if (filters.priceMax) params.set('priceMax', filters.priceMax.toString());
    if (sortBy !== 'date') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);

    const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, filters, sortBy, sortOrder, router]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowSuggestions(false);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(value.length > 0);
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  // Handle sort changes
  const handleSortChange = (newSortBy: typeof sortBy, newSortOrder: typeof sortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  // Handle domain actions
  const handleDomainInquiry = (domainId: string) => {
    router.push(`/domains/${domainId}?inquiry=true`);
  };

  const handleDomainView = (domainId: string) => {
    router.push(`/domains/${domainId}`);
  };

  // Get search results
  const searchResults = searchQuery_tRPC.data?.items || [];
  const totalResults = searchQuery_tRPC.data?.totalCount || 0;
  const isLoading = searchQuery_tRPC.isLoading;
  const hasError = searchQuery_tRPC.error;
  const hasSearched = searchQuery || filters.industry.length > 0 || filters.state.length > 0 || filters.city || filters.priceMin || filters.priceMax;



  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Domains</h1>
              <p className="text-gray-600 mt-1">
                Find the perfect domain for your business
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={layout === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={layout === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setLayout('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Search Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SearchInput
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onSearch={handleSearch}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search domains..."
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Filters */}
              {showFilters && (
                <SearchFilters
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  availableFilters={filtersQuery.data}
                  className="lg:block"
                />
              )}

              {/* Popular Searches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Popular Searches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {popularSearchesQuery.data?.trendingDomains?.map((domain, index) => (
                      <button
                        key={domain.id}
                        onClick={() => handleSearch(domain.name)}
                        className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="font-medium text-sm">{domain.name}</div>
                        <div className="text-xs text-gray-500">
                          {domain.industry} • {domain.state} • ${typeof domain.price === 'number' ? domain.price : Number(domain.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Suggestions */}
            {showSuggestions && searchQuery.length > 1 && (
              <SearchSuggestions
                suggestions={suggestionsQuery.data || []}
                onSuggestionClick={(suggestion) => {
                  handleSearch(suggestion.name);
                  setShowSuggestions(false);
                }}
                onClose={() => setShowSuggestions(false)}
                className="mb-6"
              />
            )}

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {hasSearched ? (
                    <>
                      {totalResults} {totalResults === 1 ? 'domain' : 'domains'} found
                                             {searchQuery && (
                         <span className="text-gray-500 ml-2">
                           for &quot;{searchQuery}&quot;
                         </span>
                       )}
                    </>
                  ) : (
                    'Browse all domains'
                  )}
                </h2>
                {hasSearched && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({
                        industry: [],
                        state: [],
                        city: '',
                        priceMin: undefined,
                        priceMax: undefined,
                        priceType: undefined,
                        status: 'PUBLISHED',
                      });
                    }}
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                    handleSortChange(newSortBy, newSortOrder);
                  }}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="popularity-desc">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Active Filters */}
            {(filters.industry.length > 0 || filters.state.length > 0 || filters.city || filters.priceMin || filters.priceMax) && (
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-sm text-gray-500">Active filters:</span>
                {filters.industry.map((industry) => (
                  <Badge key={industry} variant="secondary" className="text-xs">
                    Industry: {industry}
                    <button
                      onClick={() => handleFilterChange({
                        ...filters,
                        industry: filters.industry.filter(i => i !== industry)
                      })}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {filters.state.map((state) => (
                  <Badge key={state} variant="secondary" className="text-xs">
                    State: {state}
                    <button
                      onClick={() => handleFilterChange({
                        ...filters,
                        state: filters.state.filter(s => s !== state)
                      })}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
                {filters.city && (
                  <Badge variant="secondary" className="text-xs">
                    City: {filters.city}
                    <button
                      onClick={() => handleFilterChange({
                        ...filters,
                        city: ''
                      })}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {(filters.priceMin || filters.priceMax) && (
                  <Badge variant="secondary" className="text-xs">
                    Price: ${filters.priceMin || 0} - ${filters.priceMax || '∞'}
                    <button
                      onClick={() => handleFilterChange({
                        ...filters,
                        priceMin: undefined,
                        priceMax: undefined
                      })}
                      className="ml-1 hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}

            {/* Search Results */}
            {hasSearched ? (
              <>
                {hasError ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 mb-4">
                      <AlertCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Search Error
                    </h3>
                    <p className="text-gray-600 mb-4">
                      There was an error performing your search. Please try again.
                    </p>
                    <Button
                      onClick={() => searchQuery_tRPC.refetch()}
                      variant="outline"
                    >
                      Retry Search
                    </Button>
                  </div>
                ) : (
                  <SearchResults
                    results={searchResults}
                    isLoading={isLoading}
                    layout={layout}
                    onInquiry={handleDomainInquiry}
                    onView={handleDomainView}
                  />
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start your domain search
                </h3>
                <p className="text-gray-600 mb-6">
                  Enter a search term or use the filters to find the perfect domain
                </p>
                <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <Card className="text-center p-4">
                    <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium">Search</h4>
                    <p className="text-sm text-gray-600">Find domains by name or description</p>
                  </Card>
                  <Card className="text-center p-4">
                    <Filter className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium">Filter</h4>
                    <p className="text-sm text-gray-600">Narrow down by industry, location, price</p>
                  </Card>
                  <Card className="text-center p-4">
                    <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium">Discover</h4>
                    <p className="text-sm text-gray-600">Explore popular and trending domains</p>
                  </Card>
                </div>
              </div>
            )}

            {/* Load More */}
            {searchQuery_tRPC.data?.nextCursor && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement load more functionality
                  }}
                >
                  Load More Results
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search page...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
