'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { 
  Search, 
  Filter, 
  ShoppingCart, 
  MapPin, 
  Building, 
  DollarSign,
  Star,
  TrendingUp,
  Users,
  Globe,
  CreditCard
} from 'lucide-react';
import { WholesalePurchaseModal } from '@/components/wholesale/WholesalePurchaseModal';
import { WholesaleDomainCard } from '@/components/wholesale/WholesaleDomainCard';
// Note: Metadata is handled by the layout or can be added to a separate metadata.ts file

interface WholesaleDomain {
  id: string;
  domain: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    state?: string;
    city?: string;
    geographicScope: string;
    createdAt: string;
  };
  seller: {
    id: string;
    name?: string;
    company?: string;
  };
  addedAt: string;
  status: string;
}

export default function WholesalePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDomain, setSelectedDomain] = useState<WholesaleDomain | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Fetch wholesale configuration
  const { data: config, isLoading: configLoading } = trpc.wholesale.getConfig.useQuery();

  // Fetch wholesale domains
  const { 
    data: domainsData, 
    isLoading: domainsLoading, 
    error: domainsError 
  } = trpc.wholesale.getDomains.useQuery({
    search: searchTerm || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    state: stateFilter !== 'all' ? stateFilter : undefined,
    city: cityFilter !== 'all' ? cityFilter : undefined,
    page: currentPage,
    limit: 20,
  });

  // Get unique categories, states, and cities for filters
  const { data: allDomainsData } = trpc.wholesale.getDomains.useQuery({
    page: 1,
    limit: 1000, // Get all for filter options
  });

  const filterOptions = useMemo(() => {
    if (!allDomainsData?.domains) return { categories: [], states: [], cities: [] };

    const categories = [...new Set(allDomainsData.domains.map(d => d.domain.category).filter(Boolean))];
    const states = [...new Set(allDomainsData.domains.map(d => d.domain.state).filter(Boolean))];
    const cities = [...new Set(allDomainsData.domains.map(d => d.domain.city).filter(Boolean))];

    return { categories, states, cities };
  }, [allDomainsData]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setStateFilter('all');
    setCityFilter('all');
    setCurrentPage(1);
  };

  const handlePurchase = (domain: WholesaleDomain) => {
    if (!session?.user) {
      router.push('/login');
      return;
    }
    
    setSelectedDomain(domain);
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setSelectedDomain(null);
  };

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || stateFilter !== 'all' || cityFilter !== 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingCart className="w-8 h-8 text-red-600" />
            <h1 className="text-4xl font-bold text-gray-900">Wholesale Geo-Domains</h1>
          </div>
          <p className="text-xl text-gray-600 mb-6">
            Premium geographic domains at a fixed price of{' '}
            <span className="font-bold text-red-600 text-2xl">
              ${configLoading ? '...' : config?.price || 299}
            </span>
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Premium Quality</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Instant Purchase</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Verified Sellers</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {filterOptions.categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {filterOptions.states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary">Search: {searchTerm}</Badge>
                )}
                {categoryFilter !== 'all' && (
                  <Badge variant="secondary">Category: {categoryFilter}</Badge>
                )}
                {stateFilter !== 'all' && (
                  <Badge variant="secondary">State: {stateFilter}</Badge>
                )}
                {cityFilter !== 'all' && (
                  <Badge variant="secondary">City: {cityFilter}</Badge>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <QueryErrorBoundary>
          {domainsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <LoadingCardSkeleton key={i} />
              ))}
            </div>
          ) : domainsError ? (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Error loading wholesale domains</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : !domainsData?.domains.length ? (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No domains found</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters 
                  ? 'Try adjusting your filters to see more domains.'
                  : 'No wholesale domains are currently available.'
                }
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">
                  Showing {domainsData.domains.length} of {domainsData.pagination.total} domains
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Page {currentPage} of {domainsData.pagination.totalPages}</span>
                </div>
              </div>

              {/* Domain Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {domainsData.domains.map((wholesaleDomain) => (
                  <WholesaleDomainCard
                    key={wholesaleDomain.id}
                    domain={wholesaleDomain}
                    wholesalePrice={config?.price || 299}
                    onPurchase={handlePurchase}
                    onView={(domain) => {
                      // Navigate to domain details page
                      window.open(`/domains/${encodeURIComponent(domain.domain.name)}`, '_blank');
                    }}
                  />
                ))}
              </div>

              {/* Pagination */}
              {domainsData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {domainsData.pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(domainsData.pagination.totalPages, prev + 1))}
                    disabled={currentPage === domainsData.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </QueryErrorBoundary>
      </main>

      <Footer />

      {/* Purchase Modal */}
      {selectedDomain && config && (
        <WholesalePurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={closePurchaseModal}
          wholesaleDomain={selectedDomain}
          wholesalePrice={config.price}
        />
      )}
    </div>
  );
}
