"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, SlidersHorizontal, Loader2 } from "lucide-react";

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
  const { data: domainsData, isLoading, error } = trpc.domains.getAll.useQuery({
    limit: 50, // Example limit
    status: 'VERIFIED' // Only show verified domains
  });

  // Use database data if available, otherwise use empty array
  const domains = domainsData?.items || [];

  // Enhanced filtering logic
  const filteredDomains = useMemo(() => {
    return domains.filter(domain => {
      // Search matching (enhanced)
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search || 
        domain.name.toLowerCase().includes(searchLower) ||
        domain.description.toLowerCase().includes(searchLower) ||
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
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'newest':
        return sorted.sort((a, b) => (b.analytics?.inquiries || 0) - (a.analytics?.inquiries || 0));
      case 'popular':
        return sorted.sort((a, b) => (b.analytics?.inquiries || 0) - (a.analytics?.inquiries || 0));
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
    return ["All Categories", ...uniqueCategories.filter(Boolean).sort()];
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

  // Error state
  if (error) {
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
                <Card key={domain.id} className="hover:shadow-lg transition-shadow">
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
                          {domain.analytics?.inquiries || 0} inquiries
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      {domain.description}
                    </p>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded whitespace-nowrap">
                          {domain.category}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded whitespace-nowrap">
                          {domain.geographicScope}
                        </span>
                      </div>
                      <Link href={`/domains/${domain.id}`}>
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
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="/domains" className="text-gray-300 hover:text-white transition-colors">Browse Domains</a></li>
                <li><a href="/search" className="text-gray-300 hover:text-white transition-colors">Search</a></li>
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
