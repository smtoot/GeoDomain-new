'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Filter,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileDataTableColumn {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface MobileDataTableProps {
  title: string;
  description?: string;
  data: any[];
  columns: MobileDataTableColumn[];
  searchable?: boolean;
  filterable?: boolean;
  onRowClick?: (row: any) => void;
  actions?: React.ReactNode;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

export function MobileDataTable({
  title,
  description,
  data,
  columns,
  searchable = false,
  filterable = false,
  onRowClick,
  actions,
  className,
  emptyMessage = "No data available",
  loading = false
}: MobileDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data based on search term
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    
    return columns.some(column => {
      const value = row[column.key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = String(aValue).localeCompare(String(bValue));
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const getRowId = (row: any, index: number) => {
    return row.id || row._id || `row-${index}`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
          </CardTitle>
          {description && (
            <div className="animate-pulse bg-gray-200 h-4 w-48 rounded"></div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-20 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* Search and Filter Controls */}
        {(searchable || filterable) && (
          <div className="flex items-center gap-2 mt-4">
            {searchable && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {sortedData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedData.map((row, index) => {
              const rowId = getRowId(row, index);
              const isExpanded = expandedRows.has(rowId);
              const primaryColumn = columns[0];
              const secondaryColumns = columns.slice(1, 3); // Show first 2 additional columns
              const remainingColumns = columns.slice(3);

              return (
                <div
                  key={rowId}
                  className={cn(
                    'border border-gray-200 rounded-lg p-4 transition-all',
                    onRowClick && 'cursor-pointer hover:bg-gray-50',
                    isExpanded && 'bg-gray-50'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {/* Primary Row Content */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {primaryColumn.render 
                            ? primaryColumn.render(row[primaryColumn.key], row)
                            : row[primaryColumn.key]
                          }
                        </h4>
                        {row.status && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              'text-xs',
                              row.status === 'ACTIVE' && 'bg-green-100 text-green-800',
                              row.status === 'PENDING' && 'bg-yellow-100 text-yellow-800',
                              row.status === 'SUSPENDED' && 'bg-red-100 text-red-800',
                              row.status === 'DELETED' && 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {row.status}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Secondary Information */}
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        {secondaryColumns.map((column) => (
                          <div key={column.key} className="truncate">
                            <span className="font-medium">{column.label}:</span>{' '}
                            {column.render 
                              ? column.render(row[column.key], row)
                              : row[column.key] || 'N/A'
                            }
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    {remainingColumns.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowExpansion(rowId);
                        }}
                        className="ml-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && remainingColumns.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {remainingColumns.map((column) => (
                          <div key={column.key} className="flex justify-between">
                            <span className="font-medium text-gray-700">{column.label}:</span>
                            <span className="text-gray-600">
                              {column.render 
                                ? column.render(row[column.key], row)
                                : row[column.key] || 'N/A'
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Mobile-optimized action buttons component
export function MobileActionButtons({ 
  onView, 
  onEdit, 
  onDelete, 
  onMore,
  className 
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMore?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {onView && (
        <Button variant="ghost" size="sm" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      {onMore && (
        <Button variant="ghost" size="sm" onClick={onMore}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
