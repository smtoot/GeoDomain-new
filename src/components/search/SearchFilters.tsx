"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  X, 
  Building, 
  MapPin, 
  DollarSign,
  CheckCircle,

} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  count: number;
}

interface PriceRange {
  min: number | any;
  max: number | any;
  average: number | any;
}

interface AvailableFilters {
  industries: FilterOption[];
  states: FilterOption[];
  priceRanges: PriceRange;
}

interface SearchFilters {
  industry: string[];
  state: string[];
  city: string;
  priceMin: number | undefined;
  priceMax: number | undefined;
  priceType: 'FIXED' | 'NEGOTIABLE' | 'MAKE_OFFER' | undefined;
  status: 'VERIFIED' | 'PUBLISHED';
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableFilters?: AvailableFilters;
  className?: string;
}

export function SearchFilters({
  filters,
  onFiltersChange,
  availableFilters,
  className,
}: SearchFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin || availableFilters?.priceRanges.min || 0,
    filters.priceMax || availableFilters?.priceRanges.max || 100000
  ]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters: SearchFilters = {
      industry: [],
      state: [],
      city: '',
      priceMin: undefined,
      priceMax: undefined,
      priceType: undefined,
      status: 'PUBLISHED',
    };
    setLocalFilters(clearedFilters);
    setPriceRange([
      availableFilters?.priceRanges.min || 0,
      availableFilters?.priceRanges.max || 100000
    ]);
    onFiltersChange(clearedFilters);
  };

  const handleIndustryToggle = (industry: string) => {
    const newIndustries = localFilters.industry.includes(industry)
      ? localFilters.industry.filter(i => i !== industry)
      : [...localFilters.industry, industry];
    handleFilterChange('industry', newIndustries);
  };

  const handleStateToggle = (state: string) => {
    const newStates = localFilters.state.includes(state)
      ? localFilters.state.filter(s => s !== state)
      : [...localFilters.state, state];
    handleFilterChange('state', newStates);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    handleFilterChange('priceMin', range[0]);
    handleFilterChange('priceMax', range[1]);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price}`;
  };

  const hasActiveFilters = 
    localFilters.industry.length > 0 ||
    localFilters.state.length > 0 ||
    localFilters.city ||
    localFilters.priceMin ||
    localFilters.priceMax ||
    localFilters.priceType;

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Industry Filter */}
        <div className="space-y-3">
          <Label className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Industry</span>
          </Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableFilters?.industries.map((industry) => (
              <div
                key={industry.value}
                className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-gray-50"
                onClick={() => handleIndustryToggle(industry.value)}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localFilters.industry.includes(industry.value)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span className="text-sm">{industry.value}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {industry.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* State Filter */}
        <div className="space-y-3">
          <Label className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>State</span>
          </Label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {availableFilters?.states.map((state) => (
              <div
                key={state.value}
                className="flex items-center justify-between p-2 rounded border cursor-pointer hover:bg-gray-50"
                onClick={() => handleStateToggle(state.value)}
              >
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localFilters.state.includes(state.value)}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <span className="text-sm">{state.value}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {state.count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* City Filter */}
        <div className="space-y-3">
          <Label>City</Label>
          <Input
            placeholder="Enter city name..."
            value={localFilters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
          />
        </div>

        {/* Price Range Filter */}
        <div className="space-y-3">
          <Label className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Price Range</span>
          </Label>
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              max={availableFilters?.priceRanges.max || 100000}
              min={availableFilters?.priceRanges.min || 0}
              step={1000}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{formatPrice(priceRange[0])}</span>
              <span>{formatPrice(priceRange[1])}</span>
            </div>
          </div>
        </div>

        {/* Price Type Filter */}
        <div className="space-y-3">
          <Label>Price Type</Label>
          <Select
            value={localFilters.priceType || ''}
            onValueChange={(value) => handleFilterChange('priceType', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All price types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All price types</SelectItem>
              <SelectItem value="FIXED">Fixed Price</SelectItem>
              <SelectItem value="NEGOTIABLE">Negotiable</SelectItem>
              <SelectItem value="MAKE_OFFER">Make Offer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-3">
          <Label className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Status</span>
          </Label>
          <Select
            value={localFilters.status}
            onValueChange={(value) => handleFilterChange('status', value as 'VERIFIED' | 'PUBLISHED')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VERIFIED">Verified Only</SelectItem>
              <SelectItem value="PUBLISHED">All Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Apply Filters Button */}
        <Button
          onClick={handleApplyFilters}
          className="w-full"
          disabled={!hasActiveFilters}
        >
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}
