"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, X, Filter, SlidersHorizontal, MapPin, DollarSign, Building, Star, Eye, MessageCircle, Calendar, TrendingUp } from "lucide-react";
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories";
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Enhanced mock data with more realistic and comprehensive options
  const categories: Category[] = [
    { id: "technology", name: "Technology", count: 45 },
    { id: "business", name: "Business", count: 38 },
    { id: "real-estate", name: "Real Estate", count: 32 },
    { id: "healthcare", name: "Healthcare", count: 28 },
    { id: "restaurants", name: "Restaurants & Food", count: 25 },
    { id: "travel", name: "Travel & Tourism", count: 22 },
    { id: "law", name: "Legal Services", count: 18 },
    { id: "marketing", name: "Marketing & Advertising", count: 15 }
  ];
  
  const states: State[] = [
    { id: "california", name: "California", count: 67 },
    { id: "texas", name: "Texas", count: 54 },
    { id: "florida", name: "Florida", count: 48 },
    { id: "new-york", name: "New York", count: 42 },
    { id: "illinois", name: "Illinois", count: 35 },
    { id: "georgia", name: "Georgia", count: 28 },
    { id: "washington", name: "Washington", count: 25 },
    { id: "arizona", name: "Arizona", count: 22 }
  ];
  
  const cities: City[] = [
    { id: "los-angeles", name: "Los Angeles", count: 28 },
    { id: "houston", name: "Houston", count: 24 },
    { id: "miami", name: "Miami", count: 22 },
    { id: "chicago", name: "Chicago", count: 20 },
    { id: "phoenix", name: "Phoenix", count: 18 },
    { id: "san-francisco", name: "San Francisco", count: 16 },
    { id: "atlanta", name: "Atlanta", count: 14 },
    { id: "seattle", name: "Seattle", count: 12 }
  ];
  
  const domains: Domain[] = [
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
    },
    {
      id: 4,
      name: "texasrestaurants.com",
      price: 4200,
      category: "restaurants",
      state: "texas",
      city: "houston",
      geographicScope: "STATE",
      status: "available",
      description: "Premium domain for Texas restaurant chains and food services",
      createdAt: "2024-01-10T08:20:00Z",
      inquiryCount: 12
    },
    {
      id: 5,
      name: "miamitravel.com",
      price: 2800,
      category: "travel",
      state: "florida",
      city: "miami",
      geographicScope: "CITY",
      status: "available",
      description: "Perfect for Miami-based travel agencies and tourism businesses",
      createdAt: "2024-01-28T16:10:00Z",
      inquiryCount: 7
    },
    {
      id: 6,
      name: "chicagolawyers.com",
      price: 3500,
      category: "law",
      state: "illinois",
      city: "chicago",
      geographicScope: "CITY",
      status: "available",
      description: "Ideal for Chicago law firms and legal services",
      createdAt: "2024-01-12T11:45:00Z",
      inquiryCount: 9
    },
    {
      id: 7,
      name: "phoenixhealthcare.com",
      price: 3800,
      category: "healthcare",
      state: "arizona",
      city: "phoenix",
      geographicScope: "CITY",
      status: "available",
      description: "Great for Phoenix healthcare providers and medical practices",
      createdAt: "2024-01-18T13:30:00Z",
      inquiryCount: 6
    },
    {
      id: 8,
      name: "atlantamarketing.com",
      price: 2200,
      category: "marketing",
      state: "georgia",
      city: "atlanta",
      geographicScope: "CITY",
      status: "available",
      description: "Perfect for Atlanta marketing agencies and advertising firms",
      createdAt: "2024-01-22T15:20:00Z",
      inquiryCount: 4
    },
    {
      id: 9,
      name: "seattletech.com",
      price: 4500,
      category: "technology",
      state: "washington",
      city: "seattle",
      geographicScope: "CITY",
      status: "available",
      description: "Premium domain for Seattle tech companies and startups",
      createdAt: "2024-01-08T09:15:00Z",
      inquiryCount: 15
    },
    {
      id: 10,
      name: "sanfranciscobusiness.com",
      price: 5200,
      category: "business",
      state: "california",
      city: "san-francisco",
      geographicScope: "CITY",
      status: "available",
      description: "High-value domain for San Francisco business services",
      createdAt: "2024-01-05T12:00:00Z",
      inquiryCount: 18
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

  // Debounced search functionality
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    if (filters.search) {
      setIsLoading(true);
      setError(null);
      
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      
      setSearchTimeout(timeout);
    } else {
      setIsLoading(false);
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
    let filtered = domains.filter((domain: Domain) => {
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
            <p className="text-lg text-gray-600 mb-6">
              Discover premium domains for your business. Search by location, category, or price to find the perfect match.
            </p>
            
            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-center mb-2">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{domains.length}</div>
                <div className="text-sm text-gray-500">Total Domains</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">${Math.min(...domains.map(d => d.price)).toLocaleString()}</div>
                <div className="text-sm text-gray-500">Starting Price</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{states.length}</div>
                <div className="text-sm text-gray-500">States Covered</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-center mb-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
            </div>
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
                <Card key={domain.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md group" data-testid="domain-card">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl text-blue-600 font-semibold group-hover:text-blue-700 transition-colors truncate">
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
                        {getCategoryById(domain.category)?.name || 'Uncategorized'}
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
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
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