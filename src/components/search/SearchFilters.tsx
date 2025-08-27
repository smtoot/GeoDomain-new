"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { 
  Filter, 
  MapPin, 
  Building, 
  DollarSign, 
  X, 
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { 
  industries, 
  domainCategories, 
  geographicScopes, 
  popularStates, 
  popularCities,
  getCategoriesByIndustry
} from "@/lib/categories"

interface SearchFiltersProps {
  filters: {
    search?: string
    industry?: string
    category?: string
    geographicScope?: string
    state?: string
    city?: string
    priceMin?: number
    priceMax?: number
    priceType?: string
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
  className?: string
}

export function SearchFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters, 
  className 
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<typeof domainCategories>([])

  // Update available categories when industry changes
  const handleIndustryChange = (industry: string) => {
    const categories = getCategoriesByIndustry(industry)
    setAvailableCategories(categories)
    
    // Reset category if it's no longer valid for the selected industry
    if (filters.category && !categories.find(cat => cat.id === filters.category)) {
      onFiltersChange({ ...filters, industry, category: undefined })
    } else {
      onFiltersChange({ ...filters, industry })
    }
  }

  const handleGeographicScopeChange = (scope: string) => {
    // Reset state and city when changing scope
    let newFilters = { ...filters, geographicScope: scope }
    
    if (scope === "NATIONAL") {
      newFilters = { ...newFilters, state: undefined, city: undefined }
    } else if (scope === "STATE") {
      newFilters = { ...newFilters, city: undefined }
    }
    
    onFiltersChange(newFilters)
  }

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const clearFilter = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key as keyof typeof filters]
    onFiltersChange(newFilters)
  }

  const activeFiltersCount = Object.keys(filters).filter(key => 
    filters[key as keyof typeof filters] !== undefined && 
    filters[key as keyof typeof filters] !== ""
  ).length

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Search Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label>Search Domains</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by domain name, description..."
              value={filters.search || ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Geographic Scope */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Geographic Scope
          </Label>
          <Select
            value={filters.geographicScope || ""}
            onValueChange={handleGeographicScopeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select geographic scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Scopes</SelectItem>
              {geographicScopes.map((scope) => (
                <SelectItem key={scope.value} value={scope.value}>
                  <div>
                    <div className="font-medium">{scope.label}</div>
                    <div className="text-sm text-muted-foreground">{scope.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* State Filter */}
        {filters.geographicScope && filters.geographicScope !== "NATIONAL" && (
          <div className="space-y-2">
            <Label>State</Label>
            <Select
              value={filters.state || ""}
              onValueChange={(value) => updateFilter("state", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All States</SelectItem>
                {popularStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* City Filter */}
        {filters.geographicScope === "CITY" && (
          <div className="space-y-2">
            <Label>City</Label>
            <Select
              value={filters.city || ""}
              onValueChange={(value) => updateFilter("city", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Cities</SelectItem>
                {popularCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Industry Filter */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Industry
          </Label>
          <Select
            value={filters.industry || ""}
            onValueChange={handleIndustryChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry.id} value={industry.name}>
                  <div>
                    <div className="font-medium">{industry.name}</div>
                    <div className="text-sm text-muted-foreground">{industry.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        {filters.industry && availableCategories.length > 0 && (
          <div className="space-y-2">
            <Label>Category/Keyword</Label>
            <Select
              value={filters.category || ""}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                {availableCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-sm text-muted-foreground">{category.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Price Range */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Price Range
          </Label>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Min Price</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.priceMin || ""}
                  onChange={(e) => updateFilter("priceMin", e.target.value ? Number(e.target.value) : undefined)}
                  className="text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Max Price</Label>
                <Input
                  type="number"
                  placeholder="100000"
                  value={filters.priceMax || ""}
                  onChange={(e) => updateFilter("priceMax", e.target.value ? Number(e.target.value) : undefined)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Price Type */}
        <div className="space-y-2">
          <Label>Price Type</Label>
          <Select
            value={filters.priceType || ""}
            onValueChange={(value) => updateFilter("priceType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select price type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Price Types</SelectItem>
              <SelectItem value="FIXED">Fixed Price</SelectItem>
              <SelectItem value="NEGOTIABLE">Negotiable</SelectItem>
              <SelectItem value="MAKE_OFFER">Make Offer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary" className="gap-1">
                  Search: {filters.search}
                  <button
                    onClick={() => clearFilter("search")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.geographicScope && (
                <Badge variant="secondary" className="gap-1">
                  Scope: {geographicScopes.find(s => s.value === filters.geographicScope)?.label}
                  <button
                    onClick={() => clearFilter("geographicScope")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.state && (
                <Badge variant="secondary" className="gap-1">
                  State: {filters.state}
                  <button
                    onClick={() => clearFilter("state")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.city && (
                <Badge variant="secondary" className="gap-1">
                  City: {filters.city}
                  <button
                    onClick={() => clearFilter("city")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.industry && (
                <Badge variant="secondary" className="gap-1">
                  Industry: {filters.industry}
                  <button
                    onClick={() => clearFilter("industry")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  Category: {domainCategories.find(c => c.id === filters.category)?.name}
                  <button
                    onClick={() => clearFilter("category")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.priceMin && (
                <Badge variant="secondary" className="gap-1">
                  Min: ${filters.priceMin}
                  <button
                    onClick={() => clearFilter("priceMin")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.priceMax && (
                <Badge variant="secondary" className="gap-1">
                  Max: ${filters.priceMax}
                  <button
                    onClick={() => clearFilter("priceMax")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.priceType && (
                <Badge variant="secondary" className="gap-1">
                  Type: {filters.priceType}
                  <button
                    onClick={() => clearFilter("priceType")}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
