"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, SlidersHorizontal, MapPin, Building, Star, Eye, MessageCircle, Calendar, TrendingUp } from "lucide-react";
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories";
import { Header } from "@/components/layout/header";
import { QueryErrorBoundary } from "@/components/error";
import { LoadingSpinner } from "@/components/ui/loading";
import { trpc } from "@/lib/trpc";

// TypeScript interfaces for better type safety
interface Category {
  id: string;
  name: string;
  count: number;
}

interface State {
  id: string;
  name: string;
  count: number;
}

interface City {
  id: string;
  name: string;
  count: number;
}

interface Domain {
  id: number;
  name: string;
  price: number;
  category: string;
  state: string;
  city: string;
  geographicScope: string;
  status: string;
  description: string;
  createdAt: string;
  inquiryCount: number;
}

interface FilterState {
  search: string;
  category: string;
  geographicScope: string;
  state: string;
  city: string;
  priceMin: string;
  priceMax: string;
  sortBy: string;
}

interface ActiveFilter {
  key: string;
  label: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();

  // Enhanced filter state with URL sync
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('q') || "",
    category: searchParams.get('category') || "all",
    geographicScope: searchParams.get('scope') || "All Scopes",
    state: searchParams.get('state') || "all",
    city: searchParams.get('city') || "all",
    priceMin: searchParams.get('priceMin') || "",
    priceMax: searchParams.get('priceMax') || "",
    sortBy: searchParams.get('sort') || "relevance"
  });

  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Enhanced state management with proper error handling
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Fetch optimized domains data with counts
  const { data: domainsData, isLoading: domainsLoading, error: domainsError } = trpc.domains.getAllDomains.useQuery();

  // Extract domains from tRPC response (already filtered for VERIFIED domains on backend)
  const domains: Domain[] = (domainsData && 'sampleDomains' in domainsData) 
    ? domainsData.sampleDomains.map((domain: any) => {
        // Debug logging for category issues
        if (domain.name === 'HotelMichigan.com') {
          console.log('🔍 [DOMAIN DEBUG] HotelMichigan.com category:', {
            originalCategory: domain.category,
            mappedCategory: domain.category || 'general',
            domainData: domain
          });
        }
        
        return {
          id: domain.id,
          name: domain.name,
          price: domain.price,
          category: domain.category || 'general',
          state: domain.state || '',
          city: domain.city || '',
          geographicScope: domain.geographicScope || 'STATE',
          status: domain.status,
          description: domain.description || '',
          createdAt: domain.createdAt,
          inquiryCount: 0, // Not available in this query
        };
      })
    : [];

  // Extract categories with proper counts
  const categories: Category[] = (domainsData && 'categoryCounts' in domainsData) 
    ? domainsData.categoryCounts.map((cat: any) => ({
        id: cat.category || 'general',
        name: cat.category || 'General',
        count: cat._count.id,
      }))
    : [];

  // Extract states with proper counts
  const states: State[] = (domainsData && 'stateCounts' in domainsData) 
    ? domainsData.stateCounts.map((state: any) => ({
        id: state.state,
        name: state.state || 'Unknown',
        count: state._count.id,
      }))
    : [];

  // Extract cities with proper counts
  const cities: City[] = (domainsData && 'cityCounts' in domainsData) 
    ? domainsData.cityCounts.map((city: any) => ({
        id: city.city,
        name: city.city || 'Unknown',
        count: city._count.id,
      }))
    : [];

  // Single loading state
  const isLoading = domainsLoading;

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name: A to Z" },
    { value: "newest", label: "Newest First" }
  ];

  // Debounced search functionality
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (filters.search) {
      // Loading state handled by tRPC
      setError(null);
      
      const timeout = setTimeout(() => {
        // Loading state handled by tRPC
      }, 300);
      
      setSearchTimeout(timeout);
    } else {
      // Loading state handled by tRPC
    }
    
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [filters.search]);

  // Update URL when filters change
  useEffect(() => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('q', filters.search);
      if (filters.category !== 'all') params.set('category', filters.category);
      if (filters.geographicScope !== 'All Scopes') params.set('scope', filters.geographicScope);
      if (filters.state !== 'all') params.set('state', filters.state);
      if (filters.city !== 'all') params.set('city', filters.city);
      if (filters.priceMin) params.set('priceMin', filters.priceMin);
      if (filters.priceMax) params.set('priceMax', filters.priceMax);
      if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
      
      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState({}, '', newUrl);
    } catch (err) {
      console.error('Error updating URL:', err);
      setError('Failed to update URL parameters');
    }
  }, [filters]);

  // Filter and sort domains
  const filteredAndSortedDomains = useMemo(() => {
    const filtered = domains.filter((domain: Domain) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const stateName = states.find(s => s.id === domain.state)?.name || '';
        const cityName = cities.find(c => c.id === domain.city)?.name || '';
        const matchesSearch = 
          domain.name.toLowerCase().includes(searchTerm) ||
          (domain.category && getCategoryById(domain.category)?.name.toLowerCase().includes(searchTerm)) ||
          stateName.toLowerCase().includes(searchTerm) ||
          cityName.toLowerCase().includes(searchTerm);
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.category !== 'all' && domain.category !== filters.category) {
        return false;
      }

      // Geographic scope filter
      if (filters.geographicScope !== 'All Scopes') {
        const scope = getGeographicScopeByValue(filters.geographicScope);
        if (scope && domain.geographicScope !== scope.value) {
          return false;
        }
      }

      // State filter
      if (filters.state !== 'all' && domain.state !== filters.state) {
        return false;
      }

      // City filter
      if (filters.city !== 'all' && domain.city !== filters.city) {
        return false;
      }

      // Price filters
      if (filters.priceMin && domain.price < parseInt(filters.priceMin)) {
        return false;
      }
      if (filters.priceMax && domain.price > parseInt(filters.priceMax)) {
        return false;
      }

      return true;
    });

    // Sort domains
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a: Domain, b: Domain) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a: Domain, b: Domain) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a: Domain, b: Domain) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        filtered.sort((a: Domain, b: Domain) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        // Relevance sorting (default)
        break;
    }

    return filtered;
  }, [domains, filters]);

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const active: ActiveFilter[] = [];
    
    if (filters.search) active.push({ key: 'search', label: `Search: "${filters.search}"` });
    if (filters.category !== 'all') {
      const category = categories.find((cat: Category) => cat.id === filters.category);
      if (category) active.push({ key: 'category', label: `Category: ${category.name}` });
    }
    if (filters.geographicScope !== 'All Scopes') {
      active.push({ key: 'geographicScope', label: `Scope: ${filters.geographicScope}` });
    }
    if (filters.state !== 'all') {
      const state = states.find((state: State) => state.id === filters.state);
      if (state) active.push({ key: 'state', label: `State: ${state.name}` });
    }
    if (filters.city !== 'all') {
      const city = cities.find((city: City) => city.id === filters.city);
      if (city) active.push({ key: 'city', label: `City: ${city.name}` });
    }
    if (filters.priceMin || filters.priceMax) {
      const priceLabel = `Price: $${filters.priceMin || '0'} - $${filters.priceMax || '∞'}`;
      active.push({ key: 'price', label: priceLabel });
    }
    
    return active;
  }, [filters, categories, states, cities]);

  // Remove individual filter - optimized with useCallback
  const removeFilter = useCallback((key: string) => {
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
          newFilters.geographicScope = 'All Scopes';
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
  }, []);

  // Clear all filters - optimized with useCallback
  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      category: "all",
      geographicScope: "All Scopes",
      state: "all",
      city: "all",
      priceMin: "",
      priceMax: "",
      sortBy: "relevance"
    });
  }, []);

  // Get geographic display for domain - optimized with useCallback
  const getGeographicDisplay = useCallback((domain: Domain) => {
    const parts: string[] = [];
    if (domain.city) {
      const cityName = cities.find(c => c.id === domain.city)?.name;
      if (cityName) parts.push(cityName);
    }
    if (domain.state) {
      const stateName = states.find(s => s.id === domain.state)?.name;
      if (stateName) parts.push(stateName);
    }
    if (domain.geographicScope) {
      const scope = getGeographicScopeByValue(domain.geographicScope);
      if (scope) parts.push(scope.label);
    }
    return parts.join(', ');
  }, [cities, states]);

    return (
      <QueryErrorBoundary context="Domains Page">
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
          {/* Header */}
          <Header />

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Premium Domains
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              Discover premium domains for your business. Search by location, category, or price to find the perfect match.
            </p>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-red-200">
                <div className="flex items-center justify-center mb-2">
                  <Building className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{domains.length}</div>
                <div className="text-sm text-gray-500">Total Domains</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-red-200">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">${Math.min(...domains.map(d => d.price)).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Starting Price</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-red-200">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{states.length}</div>
                <div className="text-sm text-gray-500">States Covered</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-red-200">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-red-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            {/* Standardized Loading State */}
            {isLoading && (
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <LoadingSpinner 
                  size="md" 
                  className="text-blue-800"
                />
                <p className="mt-2 text-blue-800">Loading domains and filters...</p>
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <X className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-red-800 font-medium">Error</p>
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
              <div className="lg:col-span-2 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search domains, categories, locations..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filters.geographicScope} onValueChange={(value) => setFilters(prev => ({ ...prev, geographicScope: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Scopes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Scopes">All Scopes</SelectItem>
                    <SelectItem value="NATIONAL">National</SelectItem>
                    <SelectItem value="STATE">State</SelectItem>
                    <SelectItem value="CITY">City</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filters.state} onValueChange={(value) => setFilters(prev => ({ ...prev, state: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map((state: any) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={filters.city} onValueChange={(value) => setFilters(prev => ({ ...prev, city: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city: any) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
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
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Advanced Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Price Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMin: e.target.value }))}
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax}
                      onChange={(e) => setFilters(prev => ({ ...prev, priceMax: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sort By</label>
                  <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quick Filters</label>
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

          {/* Results Count and Summary - Only show when not loading */}
          {!isLoading && (
            <>
              <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                    Found {filteredAndSortedDomains.length} domains
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
              {filteredAndSortedDomains.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredAndSortedDomains.map((domain: Domain) => (
                <Card key={domain.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-red-300 shadow-md" data-testid="domain-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl text-red-600 font-semibold group-hover:text-red-700 transition-colors truncate">
                          {domain.name}
                        </CardTitle>
                        <CardDescription className="mt-1 flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {getGeographicDisplay(domain)}
                        </CardDescription>
                      </div>
                      <div className="text-right ml-3">
                        <div className="text-2xl font-bold text-green-600">
                          ${domain.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Starting price
                        </div>
                      </div>
                    </div>
                    
                    {/* Domain Description */}
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {domain.description}
                    </p>
                    
                    {/* Category Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <Building className="h-4 w-4 text-gray-400" />
                      <Badge variant="secondary" className="text-xs">
                        {domain.category || 'General'}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{Math.floor(Math.random() * 50) + 10} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{domain.inquiryCount} inquiries</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(domain.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Link href={`/domains/${encodeURIComponent(domain.name)}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                        Make Offer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <p className="text-lg">No domains found matching your criteria</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
              <Button onClick={clearFilters} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                Clear All Filters
              </Button>
            </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">GeoDomainLand</h3>
              <p className="text-gray-400">
                The premier marketplace for US geographic domains. Connect with buyers and sellers 
                in a secure, moderated environment across all 50 states.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Buyers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/domains" className="hover:text-white">Browse US Domains</Link></li>
                <li><Link href="/register" className="hover:text-white">Create Account</Link></li>
                <li><Link href="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">For Sellers</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/register" className="hover:text-white">List Your Domain</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Seller Dashboard</Link></li>
                <li><Link href="/domains/new" className="hover:text-white">Add New Domain</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 GeoDomainLand. All rights reserved. | US Geographic Domain Marketplace</p>
          </div>
        </div>
      </footer>
        </div>
      </QueryErrorBoundary>
  );
}