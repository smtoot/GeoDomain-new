'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Filter, 
  X, 
  Search, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Tag, 
  User, 
  Save, 
  Bookmark,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'numberrange' | 'boolean';
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  multiple?: boolean;
}

export interface FilterValue {
  key: string;
  value: any;
  label: string;
  type: string;
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: FilterValue[];
  createdAt: Date;
  isDefault?: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterOption[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onClear: () => void;
  savedFilters?: SavedFilter[];
  onSaveFilter?: (name: string, description: string) => void;
  onLoadFilter?: (filter: SavedFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
  className?: string;
  compact?: boolean;
}

export function AdvancedFilters({
  filters,
  values,
  onChange,
  onClear,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter,
  onDeleteFilter,
  className,
  compact = false
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [saveFilterDescription, setSaveFilterDescription] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);

  // Update active filters when values change
  useEffect(() => {
    const newActiveFilters: FilterValue[] = [];
    
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && 
          !(Array.isArray(value) && value.length === 0)) {
        const filter = filters.find(f => f.key === key);
        if (filter) {
          newActiveFilters.push({
            key,
            value,
            label: filter.label,
            type: filter.type
          });
        }
      }
    });
    
    setActiveFilters(newActiveFilters);
  }, [values, filters]);

  const handleFilterChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  const handleRemoveFilter = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  const handleClearAll = () => {
    onClear();
    setActiveFilters([]);
  };

  const handleSaveFilter = () => {
    if (!saveFilterName.trim()) {
      toast.error('Please enter a filter name');
      return;
    }

    if (activeFilters.length === 0) {
      toast.error('No active filters to save');
      return;
    }

    onSaveFilter?.(saveFilterName.trim(), saveFilterDescription.trim());
    setShowSaveDialog(false);
    setSaveFilterName('');
    setSaveFilterDescription('');
    toast.success('Filter saved successfully');
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    const newValues: Record<string, any> = {};
    filter.filters.forEach(f => {
      newValues[f.key] = f.value;
    });
    onChange(newValues);
    onLoadFilter?.(filter);
    toast.success(`Loaded filter: ${filter.name}`);
  };

  const renderFilterInput = (filter: FilterOption) => {
    const value = values[filter.key];

    switch (filter.type) {
      case 'text':
        return (
          <Input
            placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFilterChange(filter.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All {filter.label}</SelectItem>
              {filter.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => {
              const isSelected = Array.isArray(value) && value.includes(option.value);
              return (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${filter.key}-${option.value}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : [];
                      const newValues = checked
                        ? [...currentValues, option.value]
                        : currentValues.filter((v: string) => v !== option.value);
                      handleFilterChange(filter.key, newValues);
                    }}
                  />
                  <label
                    htmlFor={`${filter.key}-${option.value}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                  </label>
                </div>
              );
            })}
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            className="w-full"
          />
        );

      case 'daterange':
        return (
          <div className="flex gap-2">
            <Input
              type="date"
              placeholder="From"
              value={value?.from || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, from: e.target.value })}
              className="flex-1"
            />
            <Input
              type="date"
              placeholder="To"
              value={value?.to || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, to: e.target.value })}
              className="flex-1"
            />
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}`}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value ? Number(e.target.value) : '')}
            className="w-full"
          />
        );

      case 'numberrange':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.min || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, min: e.target.value ? Number(e.target.value) : '' })}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.max || ''}
              onChange={(e) => handleFilterChange(filter.key, { ...value, max: e.target.value ? Number(e.target.value) : '' })}
              className="flex-1"
            />
          </div>
        );

      case 'boolean':
        return (
          <Select value={value || ''} onValueChange={(val) => handleFilterChange(filter.key, val === 'true')}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder || `Select ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filter Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-medium text-gray-900">Filters</span>
          {activeFilters.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilters.length} active
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 mr-2" />
            ) : (
              <ChevronDown className="h-4 w-4 mr-2" />
            )}
            {isExpanded ? 'Hide' : 'Show'} Filters
          </Button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span className="text-xs">
                {filter.label}: {Array.isArray(filter.value) 
                  ? filter.value.join(', ') 
                  : typeof filter.value === 'object' 
                    ? JSON.stringify(filter.value)
                    : String(filter.value)
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFilter(filter.key)}
                className="h-4 w-4 p-0 hover:bg-gray-300"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Saved Filters */}
      {savedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {savedFilters.map((filter) => (
            <Button
              key={filter.id}
              variant="outline"
              size="sm"
              onClick={() => handleLoadFilter(filter)}
              className="text-xs"
            >
              <Bookmark className="h-3 w-3 mr-1" />
              {filter.name}
            </Button>
          ))}
        </div>
      )}

      {/* Filter Controls */}
      {isExpanded && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advanced Filters</CardTitle>
              {activeFilters.length > 0 && onSaveFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveDialog(true)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={cn(
              'grid gap-4',
              compact ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            )}>
              {filters.map((filter) => (
                <div key={filter.key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    {filter.label}
                  </label>
                  {renderFilterInput(filter)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <Card className="fixed inset-4 z-50 max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Save Filter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Filter Name
              </label>
              <Input
                placeholder="Enter filter name"
                value={saveFilterName}
                onChange={(e) => setSaveFilterName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Description (Optional)
              </label>
              <Input
                placeholder="Enter description"
                value={saveFilterDescription}
                onChange={(e) => setSaveFilterDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSaveFilter} className="flex-1">
                Save Filter
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Quick filter presets component
export function QuickFilterPresets({
  presets,
  onApplyPreset,
  className
}: {
  presets: Array<{
    name: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    filters: Record<string, any>;
  }>;
  onApplyPreset: (filters: Record<string, any>) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {presets.map((preset) => {
        const Icon = preset.icon;
        return (
          <Button
            key={preset.name}
            variant="outline"
            size="sm"
            onClick={() => onApplyPreset(preset.filters)}
            className="text-xs"
          >
            <Icon className="h-3 w-3 mr-1" />
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
