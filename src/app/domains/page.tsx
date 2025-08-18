"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid3X3, List } from "lucide-react";
import { trpc } from "@/lib/trpc";

// Mock data for demonstration
const mockDomains = [
  {
    id: "1",
    name: "techstartup.com",
    price: 15000,
    industry: "Technology",
    state: "California",
    city: "San Francisco",
    description: "Perfect domain for a tech startup company",
    status: "VERIFIED",
    inquiryCount: 5
  },
  {
    id: "2",
    name: "realestatepro.net",
    price: 8500,
    industry: "Real Estate",
    state: "New York",
    city: "New York",
    description: "Ideal for real estate professionals",
    status: "VERIFIED",
    inquiryCount: 3
  },
  {
    id: "3",
    name: "healthcareplus.org",
    price: 12000,
    industry: "Healthcare",
    state: "Texas",
    city: "Houston",
    description: "Premium healthcare domain",
    status: "VERIFIED",
    inquiryCount: 7
  },
  {
    id: "4",
    name: "financehub.com",
    price: 25000,
    industry: "Finance",
    state: "Illinois",
    city: "Chicago",
    description: "High-value finance domain",
    status: "VERIFIED",
    inquiryCount: 12
  },
  {
    id: "5",
    name: "educationfirst.edu",
    price: 9500,
    industry: "Education",
    state: "Massachusetts",
    city: "Boston",
    description: "Perfect for educational institutions",
    status: "VERIFIED",
    inquiryCount: 4
  },
  {
    id: "6",
    name: "retailstore.com",
    price: 7500,
    industry: "Retail",
    state: "Florida",
    city: "Miami",
    description: "Great for retail businesses",
    status: "VERIFIED",
    inquiryCount: 6
  }
];

export default function DomainsPage() {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    industry: [] as string[],
    state: [] as string[],
    city: "",
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
    priceType: undefined as 'FIXED' | 'NEGOTIABLE' | 'MAKE_OFFER' | undefined,
    status: 'PUBLISHED' as 'VERIFIED' | 'PUBLISHED',
  });
  const [sortBy] = useState<'price' | 'date' | 'popularity'>('date');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

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
    enabled: Boolean(
      (searchQuery && searchQuery.trim().length > 0) || 
      filters.industry.length > 0 || 
      filters.state.length > 0 || 
      (filters.city && filters.city.trim().length > 0) || 
      filters.priceMin || 
      filters.priceMax
    ),
  });

  const filtersQuery = trpc.search.getFilters.useQuery(undefined, {
    enabled: true,
  });

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The search will trigger automatically via the tRPC query
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Get search results or fallback to mock data
  const domains = searchQuery_tRPC.data?.items || mockDomains;
  const isLoading = searchQuery_tRPC.isLoading;
  const hasError = searchQuery_tRPC.error;
  const hasSearched = searchQuery || filters.industry.length > 0 || filters.state.length > 0 || filters.city || filters.priceMin || filters.priceMax;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                GeoDomainLand
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link href="/domains" className="text-blue-600 font-medium">
                Browse Domains
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Search Section */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Premium Domains
            </h1>
            <p className="text-lg text-gray-600">
              Discover verified domains for your business
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input 
                  placeholder="Search domains..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-6 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              {hasSearched && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      industry: [],
                      state: [],
                      city: "",
                      priceMin: undefined,
                      priceMax: undefined,
                      priceType: undefined,
                      status: 'PUBLISHED',
                    });
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>
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
          
          {/* Expanded Filters */}
          {showFilters && filtersQuery.data && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Industry Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filtersQuery.data.industries.map((industry) => (
                      <label key={industry.value} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filters.industry.includes(industry.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                industry: [...prev.industry, industry.value]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                industry: prev.industry.filter(i => i !== industry.value)
                              }));
                            }
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {industry.value} ({industry.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* State Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filtersQuery.data.states.map((state) => (
                      <label key={state.value} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={filters.state.includes(state.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                state: [...prev.state, state.value]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                state: prev.state.filter(s => s !== state.value)
                              }));
                            }
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {state.value} ({state.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={filters.priceMin || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceMin: e.target.value ? Number(e.target.value) : undefined
                      }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={filters.priceMax || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceMax: e.target.value ? Number(e.target.value) : undefined
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Domains Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching domains...</p>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Error loading domains. Please try again.</p>
              <Button onClick={() => searchQuery_tRPC.refetch()}>
                Retry
              </Button>
            </div>
          )}

          {/* Results Count */}
          {hasSearched && !isLoading && !hasError && (
            <div className="mb-6">
              <p className="text-gray-600">
                Found {domains.length} domain{domains.length !== 1 ? 's' : ''}
                {searchQuery && ` for "${searchQuery}"`}
              </p>
            </div>
          )}

          {/* Domains Grid */}
          <div className={`grid gap-6 ${
            layout === 'grid' 
              ? 'md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {domains.map((domain) => (
              <Card key={domain.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-blue-600">
                        {domain.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {domain.city && `${domain.city}, `}{domain.state}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${(typeof domain.price === 'number' ? domain.price : Number(domain.price)).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(domain as any).inquiryCount || (domain as any)._count?.inquiries || 0} inquiries
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {(domain as any).description || 'No description available'}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                        {domain.industry}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                        {domain.status}
                      </span>
                    </div>
                    <Link href={`/domains/${domain.id}`}>
                      <Button size="sm">View Details</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Can&apos;t Find What You&apos;re Looking For?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            List your premium domain and reach thousands of potential buyers
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
                List Your Domain
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-blue-600">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
