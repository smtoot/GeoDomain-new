"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, SlidersHorizontal, MapPin, DollarSign, Building } from "lucide-react";
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories";
import { trpc } from "@/lib/trpc";

export default function SearchPage() {
  const searchParams = useSearchParams();

  // Enhanced filter state with URL sync
  const [filters, setFilters] = useState({
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

  // Simple state management - no complex API calls for now
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data for now to get the page working
  const categories = [
    { id: "technology", name: "Technology", count: 25 },
    { id: "business", name: "Business", count: 18 },
    { id: "real-estate", name: "Real Estate", count: 12 },
    { id: "healthcare", name: "Healthcare", count: 8 }
  ];
  
  const states = [
    { id: "california", name: "California", count: 45 },
    { id: "new-york", name: "New York", count: 32 },
    { id: "texas", name: "Texas", count: 28 },
    { id: "florida", name: "Florida", count: 22 }
  ];
  
  const cities = [
    { id: "los-angeles", name: "Los Angeles", count: 15 },
    { id: "new-york-city", name: "New York City", count: 12 },
    { id: "san-francisco", name: "San Francisco", count: 10 },
    { id: "miami", name: "Miami", count: 8 }
  ];
  
  const domains = [
    {
      id: 1,
      name: "techstartup.com",
      price: 2500,
      category: "technology",
      state: "california",
      city: "los-angeles",
      geographicScope: "CITY",
      status: "available",
      description: "Perfect for tech startups and innovation companies",
      createdAt: "2024-01-15T10:30:00Z",
      inquiryCount: 5
    },
    {
      id: 2,
      name: "businesshub.com",
      price: 1800,
      category: "business",
      state: "new-york",
      city: "new-york-city",
      geographicScope: "CITY",
      status: "available",
      description: "Ideal for business consulting and corporate services",
      createdAt: "2024-01-20T14:45:00Z",
      inquiryCount: 3
    },
    {
      id: 3,
      name: "realestatepro.com",
      price: 3200,
      category: "real-estate",
      state: "florida",
      city: "miami",
      geographicScope: "CITY",
      status: "available",
      description: "Great for real estate professionals and agencies",
      createdAt: "2024-01-25T09:15:00Z",
      inquiryCount: 8
    }
  ];

  // Sort options
  const sortOptions = [
    { value: "relevance", label: "Relevance" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name: A to Z" },
    { value: "newest", label: "Newest First" }
  ];

  // Update URL when filters change
  useEffect(() => {
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
  }, [filters]);

  // Filter and sort domains
  const filteredAndSortedDomains = useMemo(() => {
    let filtered = domains.filter((domain: any) => {
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
        filtered.sort((a: any, b: any) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a: any, b: any) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a: any, b: any) => a.name.localeCompare(b.name));
        break;
      case 'newest':
        filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        // Relevance sorting (default)
        break;
    }

    return filtered;
  }, [domains, filters]);

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const active: Array<{key: string, label: string}> = [];
    
    if (filters.search) active.push({ key: 'search', label: `Search: "${filters.search}"` });
    if (filters.category !== 'all') {
      const category = categories.find((cat: any) => cat.id === filters.category);
      if (category) active.push({ key: 'category', label: `Category: ${category.name}` });
    }
    if (filters.geographicScope !== 'All Scopes') {
      active.push({ key: 'geographicScope', label: `Scope: ${filters.geographicScope}` });
    }
    if (filters.state !== 'all') {
      const state = states.find((state: any) => state.id === filters.state);
      if (state) active.push({ key: 'state', label: `State: ${state.name}` });
    }
    if (filters.city !== 'all') {
      const city = cities.find((city: any) => city.id === filters.city);
      if (city) active.push({ key: 'city', label: `City: ${city.name}` });
    }
    if (filters.priceMin || filters.priceMax) {
      const priceLabel = `Price: $${filters.priceMin || '0'} - $${filters.priceMax || '∞'}`;
      active.push({ key: 'price', label: priceLabel });
    }
    
    return active;
  }, [filters, categories, states, cities]);

  // Remove individual filter
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
  };

  // Clear all filters
  const clearFilters = () => {
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
  };

  // Get geographic display for domain
  const getGeographicDisplay = (domain: any) => {
    const parts = [];
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
  };

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
              <Link href="/domains" className="text-gray-600 hover:text-gray-900">
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

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Browse Premium Domains
            </h1>
            <p className="text-lg text-gray-600">
              Discover premium domains for your business. Search by location, category, or price to find the perfect match.
            </p>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            {/* Combined Loading State */}
            {isLoading && (
              <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="text-blue-800 font-medium">Loading domains and filters...</p>
                </div>
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
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
                  {filteredAndSortedDomains.map((domain: any) => (
                <Card key={domain.id} className="hover:shadow-lg transition-shadow" data-testid="domain-card">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-xl text-blue-600">
                          {domain.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {getGeographicDisplay(domain)}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${domain.price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {domain.inquiryCount} inquiries
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate">
                              {getCategoryById(domain.category)?.name || 'Uncategorized'}
                          </span>
                      </div>
                      <Link href={`/domains/${encodeURIComponent(domain.name)}`}>
                        <Button variant="outline" size="sm" className="shrink-0">
                          View Details
                        </Button>
                      </Link>
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
              <Button onClick={clearFilters} variant="outline">
                Clear All Filters
              </Button>
            </div>
              )}
            </>
          )}
        </div>
      </section>

              <footer className="bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="text-2xl font-bold text-blue-400 mb-4">GeoDomainLand</h3>
                      <p className="text-gray-300 mb-4">
                        The premier marketplace for premium domain names. Connect with buyers and sellers 
                        in a secure, moderated environment.
                      </p>
                      <div className="flex space-x-4">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">
                          <span className="sr-only">Twitter</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors">
                          <span className="sr-only">LinkedIn</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
                      <ul className="space-y-2">
                <li><a href="/domains" className="text-gray-300 hover:text-white transition-colors">Browse Domains</a></li>
                <li><a href="/deals" className="text-gray-300 hover:text-white transition-colors">Active Deals</a></li>
                        <li><a href="/login" className="text-gray-300 hover:text-white transition-colors">Login</a></li>
                        <li><a href="/register" className="text-gray-300 hover:text-white transition-colors">Register</a></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold mb-4">Support</h4>
                      <ul className="space-y-2">
                        <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                        <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact Us</a></li>
                        <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                        <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
                      </ul>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 mt-8 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                      <p className="text-gray-400 text-sm">
                        © 2024 GeoDomainLand. All rights reserved.
                      </p>
                      <div className="flex space-x-6 mt-4 md:mt-0">
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy</a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms</a>
                        <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookies</a>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
  );
}