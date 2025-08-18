"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Filter, 
  X, 
  Search, 
  MapPin, 
  Building, 
  DollarSign,
  SortAsc,
  SortDesc
} from 'lucide-react';

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Education',
  'Retail',
  'Entertainment',
  'Travel',
  'Food & Beverage',
  'Automotive',
  'Fashion',
  'Sports',
  'Non-Profit',
  'Other'
];

const states = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const priceTypes = [
  { value: 'FIXED', label: 'Fixed Price' },
  { value: 'NEGOTIABLE', label: 'Negotiable' },
  { value: 'MAKE_OFFER', label: 'Make Offer' }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'popularity', label: 'Most Popular' }
];

export interface DomainFilters {
  search: string;
  industry: string;
  state: string;
  city: string;
  priceType: string;
  priceRange: [number, number];
  status: string;
  sortBy: string;
}

interface DomainFiltersProps {
  filters: DomainFilters;
  onFiltersChange: (filters: DomainFilters) => void;
  onClearFilters: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  totalResults?: number;
}

export function DomainFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  isExpanded = false,
  onToggleExpanded,
  totalResults
}: DomainFiltersProps) {
  const [localFilters, setLocalFilters] = useState<DomainFilters>(filters);

  const handleFilterChange = (key: keyof DomainFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const defaultFilters: DomainFilters = {
      search: '',
      industry: '',
      state: '',
      city: '',
      priceType: '',
      priceRange: [0, 100000],
      status: '',
      sortBy: 'newest'
    };
    setLocalFilters(defaultFilters);
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && 
    value !== 'newest' && 
    (Array.isArray(value) ? value[0] !== 0 || value[1] !== 100000 : true)
  );

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== '' && 
    value !== 'newest' && 
    (Array.isArray(value) ? value[0] !== 0 || value[1] !== 100000 : true)
  ).length;

  return (
    <div className="space-y-4">
      {/* Search and Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search domains..."
            value={localFilters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={localFilters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {onToggleExpanded && (
            <Button
              variant="outline"
              onClick={onToggleExpanded}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {totalResults !== undefined && (
        <div className="text-sm text-gray-600">
          {totalResults} domain{totalResults !== 1 ? 's' : ''} found
        </div>
      )}

      {/* Expanded Filters */}
      {isExpanded && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="flex items-center gap-1"
                  >
                    <X className="h-3 w-3" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Industry Filter */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Building className="h-4 w-4" />
                Industry
              </Label>
              <Select value={localFilters.industry} onValueChange={(value) => handleFilterChange('industry', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location Filters */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  State
                </Label>
                <Select value={localFilters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All states</SelectItem>
                    {states.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2">City</Label>
                <Input
                  placeholder="Enter city name"
                  value={localFilters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                />
              </div>
            </div>

            {/* Price Filters */}
            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4" />
                  Price Type
                </Label>
                <Select value={localFilters.priceType} onValueChange={(value) => handleFilterChange('priceType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All price types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All price types</SelectItem>
                    {priceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2">Price Range</Label>
                <div className="space-y-4">
                  <Slider
                    value={localFilters.priceRange}
                    onValueChange={(value) => handleFilterChange('priceRange', value)}
                    max={100000}
                    min={0}
                    step={1000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${localFilters.priceRange[0].toLocaleString()}</span>
                    <span>${localFilters.priceRange[1].toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Label className="mb-2">Status</Label>
              <Select value={localFilters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="pt-4 border-t">
                <Label className="mb-2">Active Filters:</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.industry && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Industry: {filters.industry}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('industry', '')}
                      />
                    </Badge>
                  )}
                  {filters.state && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      State: {filters.state}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('state', '')}
                      />
                    </Badge>
                  )}
                  {filters.city && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      City: {filters.city}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('city', '')}
                      />
                    </Badge>
                  )}
                  {filters.priceType && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Price Type: {priceTypes.find(t => t.value === filters.priceType)?.label}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('priceType', '')}
                      />
                    </Badge>
                  )}
                  {filters.status && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Status: {filters.status}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('status', '')}
                      />
                    </Badge>
                  )}
                  {(filters.priceRange[0] > 0 || filters.priceRange[1] < 100000) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      Price: ${filters.priceRange[0].toLocaleString()} - ${filters.priceRange[1].toLocaleString()}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleFilterChange('priceRange', [0, 100000])}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
