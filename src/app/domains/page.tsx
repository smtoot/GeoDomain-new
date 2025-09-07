"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, SlidersHorizontal, Loader2, Globe, MapPin, DollarSign, Building2, ChevronDown } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories";
import { DomainCard } from "@/components/domain/DomainCard";

export default function DomainsPage() {
  // Enhanced filter state
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    geographicScope: "all",
    state: "all",
    city: "all",
    priceMin: "",
    priceMax: "",
    sortBy: "relevance"
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Fetch domains from database using tRPC (Replaced static data)
  const { data: domainsData, isLoading, error } = trpc.domains.getAllDomains.useQuery();

  // Use database data if available, otherwise use empty array
  const domains = domainsData?.sampleDomains || [];
  
  // Log for debugging
  console.log('🔍 [DOMAINS PAGE] Data:', domainsData);
  console.log('🔍 [DOMAINS PAGE] Data JSON:', JSON.stringify(domainsData, null, 2));
  console.log('🔍 [DOMAINS PAGE] Error:', error);
  console.log('🔍 [DOMAINS PAGE] Error details:', error?.message, error?.data);
  console.log('🔍 [DOMAINS PAGE] Loading:', isLoading);
  console.log('🔍 [DOMAINS PAGE] Domains array:', domains);
  console.log('🔍 [DOMAINS PAGE] Success status:', domainsData?.success);
  console.log('🔍 [DOMAINS PAGE] API Error:', domainsData && 'error' in domainsData ? domainsData.error : undefined);
  console.log('🔍 [DOMAINS PAGE] API Error Stack:', domainsData && 'errorStack' in domainsData ? domainsData.errorStack : undefined);
  
  // Debug tRPC client
  console.log('🔍 [DOMAINS PAGE] tRPC client:', trpc);
  console.log('🔍 [DOMAINS PAGE] Query result:', { domainsData, isLoading, error });

  // Enhanced filtering logic
  const filteredDomains = useMemo(() => {
    return domains.filter((domain: any) => {
      // Search matching (enhanced)
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search || 
        domain.name.toLowerCase().includes(searchLower) ||
        (domain.description && domain.description.toLowerCase().includes(searchLower)) ||
        domain.category.toLowerCase().includes(searchLower) ||
        (domain.state && domain.state.toLowerCase().includes(searchLower)) ||
        (domain.city && domain.city.toLowerCase().includes(searchLower));
      
      // Category matching
      const matchesCategory = filters.category === "all" || domain.category === filters.category;
      
      // Geographic scope matching
      const matchesScope = filters.geographicScope === "all" || domain.geographicScope === filters.geographicScope;
      
      // State matching
      const matchesState = filters.state === "all" || domain.state === filters.state;
      
      // City matching
      const matchesCity = filters.city === "all" || domain.city === filters.city;
      
      // Price range matching
      const matchesPrice = (!filters.priceMin || domain.price >= Number(filters.priceMin)) &&
                          (!filters.priceMax || domain.price <= Number(filters.priceMax));
      
      return matchesSearch && matchesCategory && matchesScope && matchesState && matchesCity && matchesPrice;
    });
  }, [filters, domains]);

  // Sort domains based on sortBy
  const sortedDomains = useMemo(() => {
    const sorted = [...filteredDomains];
    switch (filters.sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price-high':
        return sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'popular':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:
        return sorted;
    }
  }, [filteredDomains, filters.sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      category: "all",
      geographicScope: "all",
      state: "all",
      city: "all",
      priceMin: "",
      priceMax: "",
      sortBy: "relevance"
    });
  };

  // Generate dynamic filter options from real data
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(domains.map((d: any) => d.category))];
    return ["All Categories", ...uniqueCategories.filter(Boolean).sort()] as string[];
  }, [domains]);

  const states = useMemo(() => {
    const uniqueStates = [...new Set(domains.map((d: any) => d.state))];
    return ["All States", ...uniqueStates.filter((state): state is string => state !== null).sort()];
  }, [domains]);

  const cities = useMemo(() => {
    const uniqueCities = [...new Set(domains.map((d: any) => d.city))];
    return ["All Cities", ...uniqueCities.filter((city): city is string => city !== null).sort()];
  }, [domains]);

  const geographicScopes = ["All Scopes", "NATIONAL", "STATE", "CITY"];

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' }
  ];

  // Price range presets
  const priceRanges = [
    { label: "All Prices", min: "", max: "" },
    { label: "Less than $1,000", min: "0", max: "1000" },
    { label: "$1,000 - $5,000", min: "1000", max: "5000" },
    { label: "$5,000 - $10,000", min: "5000", max: "10000" },
    { label: "$10,000 - $25,000", min: "10000", max: "25000" },
    { label: "Over $25,000", min: "25000", max: "" }
  ];

  const getGeographicDisplay = (domain: any) => {
    switch (domain.geographicScope) {
      case 'NATIONAL':
        return 'National Coverage';
      case 'STATE':
        return domain.state || 'State Coverage';
      case 'CITY':
        return domain.city && domain.state ? `${domain.city}, ${domain.state}` : 'City Coverage';
      default:
        return 'Coverage Area';
    }
  };

  // Active filters for display
  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.search) active.push({ key: 'search', label: `Search: "${filters.search}"` });
    if (filters.category !== 'all') active.push({ key: 'category', label: `Category: ${filters.category}` });
    if (filters.geographicScope !== 'all') active.push({ key: 'geographicScope', label: `Scope: ${filters.geographicScope}` });
    if (filters.state !== 'all') active.push({ key: 'state', label: `State: ${filters.state}` });
    if (filters.city !== 'all') active.push({ key: 'city', label: `City: ${filters.city}` });
    if (filters.priceMin || filters.priceMax) {
      const priceLabel = filters.priceMin && filters.priceMax 
        ? `Price: $${Number(filters.priceMin).toLocaleString()} - $${Number(filters.priceMax).toLocaleString()}`
        : filters.priceMin 
        ? `Price: $${Number(filters.priceMin).toLocaleString()}+`
        : `Price: Up to $${Number(filters.priceMax).toLocaleString()}`;
      active.push({ key: 'price', label: priceLabel });
    }
    return active;
  }, [filters]);

  const removeFilter = (key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      switch (key) {
        case 'search':
          newFilters.search = '';
          break;
        case 'category':
          newFilters.category = 'all';
          break;
        case 'geographicScope':
          newFilters.geographicScope = 'all';
          break;
        case 'state':
          newFilters.state = 'all';
          break;
        case 'city':
          newFilters.city = 'all';
          break;
        case 'price':
          newFilters.priceMin = '';
          newFilters.priceMax = '';
          break;
      }
      return newFilters;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-blue-600">
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

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading domains...</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Error state - temporarily bypass to debug
  if (error && !domainsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-blue-600">
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

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Domains</h1>
              <p className="text-gray-600 mb-4">There was an error loading the domains. Please try again.</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <MainLayout>
      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Premium Domains
            </h1>
            <p className="text-lg text-gray-600">
              Discover verified domains with enhanced category classification and geographic scope
            </p>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            {/* Primary Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
              {/* Enhanced Search Input */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search domains, locations, categories..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10 pr-10"
                  />
                  {filters.search && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: string) => (
                      <SelectItem key={category} value={category === "All Categories" ? "all" : category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Geographic Scope Filter */}
              <div>
                <Select value={filters.geographicScope} onValueChange={(value) => setFilters(prev => ({ ...prev, geographicScope: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {geographicScopes.map(scope => (
                      <SelectItem key={scope} value={scope === "All Scopes" ? "all" : scope}>
                        {scope}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* State Filter */}
              <div>
                <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map(state => (
                      <SelectItem key={state} value={state === "All States" ? "all" : state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Filter */}
              <div>
                <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city === "All Cities" ? "all" : city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </Button>
              
              {activeFilters.length > 0 && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear All Filters
                </Button>
              )}
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                {/* Price Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {priceRanges.slice(1).map((range, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          priceMin: range.min, 
                          priceMax: range.max 
                        }))}
                        className="text-xs"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Sort Options */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quick Actions</label>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        priceMin: "0", 
                        priceMax: "1000" 
                      }))}
                    >
                      Under $1K
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ 
                        ...prev, 
                        geographicScope: "NATIONAL" 
                      }))}
                    >
                      National Only
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(filter => (
                  <Badge key={filter.key} variant="secondary" className="cursor-pointer hover:bg-gray-300">
                    {filter.label}
                    <button
                      onClick={() => removeFilter(filter.key)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Results Count and Summary */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                Found {sortedDomains.length} domains
                {activeFilters.length > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    (filtered from {domains.length} total)
                  </span>
                )}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {filters.sortBy !== 'relevance' && (
                <span>Sorted by: {sortOptions.find(opt => opt.value === filters.sortBy)?.label}</span>
              )}
            </div>
          </div>

          {/* Domains Grid */}
          {sortedDomains.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedDomains.map((domain) => (
                <DomainCard
                  key={domain.id}
                  domain={{
                    id: domain.id,
                    name: domain.name,
                    price: domain.price,
                    priceType: domain.priceType || 'FIXED',
                    category: (domain.category as any)?.name || (domain as any).categoryId || '',
                    geographicScope: domain.geographicScope || 'NATIONAL',
                    state: (domain.state as any)?.name || (domain.state as any)?.abbreviation || undefined,
                    city: (domain.city as any)?.name || undefined,
                    description: domain.description || undefined,
                    status: domain.status,
                    createdAt: domain.createdAt,
                    tags: [], // Add tags if available
                  }}
                  onView={(domainId) => {
                    window.location.href = `/domains/${domainId}`;
                  }}
                  onInquiry={(domainId) => {
                    window.location.href = `/domains/${domainId}/inquiry`;
                  }}
                  variant="default"
                  showStats={false}
                  showOwner={false}
                  showTechnical={false}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <p className="text-lg">No domains found matching your criteria</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
