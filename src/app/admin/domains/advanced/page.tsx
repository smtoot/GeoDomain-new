'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { AdvancedFilters, QuickFilterPresets } from '@/components/admin/AdvancedFilters';
import { AdminPageLayout } from '@/components/admin/AdminDesignSystem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Globe, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  MapPin,
  Building,
  Pause,
  Shield,
  RotateCcw,
  Star,
  Filter,
  Download,
  Calendar,
  Tag,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdvancedAdminDomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);

  // Define available filter options
  const filterOptions = [
    {
      key: 'search',
      label: 'Search',
      type: 'text' as const,
      placeholder: 'Search domains, descriptions, categories...'
    },
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect' as const,
      options: [
        { value: 'DRAFT', label: 'Draft' },
        { value: 'PENDING_VERIFICATION', label: 'Pending Review' },
        { value: 'VERIFIED', label: 'Verified' },
        { value: 'PAUSED', label: 'Paused' },
        { value: 'REJECTED', label: 'Rejected' },
        { value: 'DELETED', label: 'Deleted' }
      ]
    },
    {
      key: 'price',
      label: 'Price Range',
      type: 'numberrange' as const,
      placeholder: 'Enter price range'
    },
    {
      key: 'category',
      label: 'Category',
      type: 'multiselect' as const,
      options: [
        { value: 'BUSINESS', label: 'Business' },
        { value: 'REAL_ESTATE', label: 'Real Estate' },
        { value: 'TECHNOLOGY', label: 'Technology' },
        { value: 'HEALTHCARE', label: 'Healthcare' },
        { value: 'EDUCATION', label: 'Education' },
        { value: 'ENTERTAINMENT', label: 'Entertainment' },
        { value: 'OTHER', label: 'Other' }
      ]
    },
    {
      key: 'state',
      label: 'State',
      type: 'multiselect' as const,
      options: [
        { value: 'CA', label: 'California' },
        { value: 'NY', label: 'New York' },
        { value: 'TX', label: 'Texas' },
        { value: 'FL', label: 'Florida' },
        { value: 'IL', label: 'Illinois' },
        { value: 'PA', label: 'Pennsylvania' },
        { value: 'OH', label: 'Ohio' },
        { value: 'GA', label: 'Georgia' },
        { value: 'NC', label: 'North Carolina' },
        { value: 'MI', label: 'Michigan' }
      ]
    },
    {
      key: 'featured',
      label: 'Featured',
      type: 'boolean' as const
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      type: 'daterange' as const
    },
    {
      key: 'seller',
      label: 'Seller',
      type: 'text' as const,
      placeholder: 'Search by seller name or email'
    }
  ];

  // Quick filter presets
  const quickPresets = [
    {
      name: 'pending_review',
      label: 'Pending Review',
      icon: Clock,
      filters: { status: ['PENDING_VERIFICATION'] }
    },
    {
      name: 'high_value',
      label: 'High Value',
      icon: DollarSign,
      filters: { price: { min: 10000 } }
    },
    {
      name: 'featured',
      label: 'Featured',
      icon: Star,
      filters: { featured: true }
    },
    {
      name: 'recent',
      label: 'Recent',
      icon: Calendar,
      filters: { 
        createdAt: { 
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
        } 
      }
    }
  ];

  // Fetch domains with advanced filters
  const { data: domainsData, isLoading, error, refetch } = trpc.admin.domains.listDomainsForModeration.useQuery({
    search: filters.search || undefined,
    status: filters.status && filters.status.length > 0 ? filters.status : undefined,
    priceMin: filters.price?.min || undefined,
    priceMax: filters.price?.max || undefined,
    category: filters.category && filters.category.length > 0 ? filters.category : undefined,
    state: filters.state && filters.state.length > 0 ? filters.state : undefined,
    featured: filters.featured !== undefined ? filters.featured : undefined,
    createdAtFrom: filters.createdAt?.from || undefined,
    createdAtTo: filters.createdAt?.to || undefined,
    seller: filters.seller || undefined,
    page: currentPage,
    limit: 20,
  }, {
    enabled: status === 'authenticated' && session?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role),
  });

  // Fetch saved filters
  const { data: savedFiltersData, refetch: refetchSavedFilters } = trpc.filterManagement.getSavedFilters.useQuery(
    { entityType: 'domains' },
    { enabled: status === 'authenticated' }
  );

  // Save filter mutation
  const saveFilterMutation = trpc.filterManagement.createSavedFilter.useMutation({
    onSuccess: () => {
      refetchSavedFilters();
      toast.success('Filter saved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save filter');
    },
  });

  // Load filter mutation
  const loadFilterMutation = trpc.filterManagement.incrementFilterUsage.useMutation();

  // Redirect if not admin
  if (status === 'loading') {
    return (
      <AdminPageLayout
        title="Advanced Domain Management"
        description="Loading..."
        loading={true}
      />
    );
  }

  if (status === 'unauthenticated' || !session?.user || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN') {
    router.push('/login');
    return null;
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleSaveFilter = (name: string, description: string) => {
    const activeFilters = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        const option = filterOptions.find(opt => opt.key === key);
        return {
          key,
          value,
          label: option?.label || key,
          type: option?.type || 'text'
        };
      });

    if (activeFilters.length === 0) {
      toast.error('No active filters to save');
      return;
    }

    saveFilterMutation.mutate({
      name,
      description,
      filters: activeFilters,
      entityType: 'domains'
    });
  };

  const handleLoadFilter = (filter: any) => {
    const newFilters: Record<string, any> = {};
    filter.filters.forEach((f: any) => {
      newFilters[f.key] = f.value;
    });
    setFilters(newFilters);
    setCurrentPage(1);
    
    // Track usage
    loadFilterMutation.mutate({ filterId: filter.id });
  };

  const handleApplyPreset = (presetFilters: Record<string, any>) => {
    setFilters(presetFilters);
    setCurrentPage(1);
  };

  const handleExportDomains = () => {
    if (!domainsData?.domains.length) return;
    
    const csvContent = [
      ['Name', 'Status', 'Price', 'Category', 'Location', 'Seller', 'Created At', 'Featured'].join(','),
      ...domainsData.domains.map(domain => [
        domain.name,
        domain.status,
        domain.price,
        domain.category?.name || 'N/A',
        `${domain.city?.name || 'N/A'}, ${domain.state?.name || 'N/A'}`,
        domain.seller?.name || 'N/A',
        new Date(domain.createdAt).toLocaleDateString(),
        domain.featured ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domains-advanced-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING_VERIFICATION': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'PAUSED': return <Pause className="h-4 w-4 text-red-600" />;
      case 'DELETED': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <AdminPageLayout
      title="Advanced Domain Management"
      description="Advanced filtering and management for domain listings"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportDomains}
            disabled={!domainsData?.domains.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      }
      onRefresh={refetch}
      loading={isLoading}
      error={error?.message}
    >
      {/* Quick Filter Presets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Quick Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickFilterPresets
            presets={quickPresets}
            onApplyPreset={handleApplyPreset}
          />
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <AdvancedFilters
        filters={filterOptions}
        values={filters}
        onChange={handleFilterChange}
        onClear={handleClearFilters}
        savedFilters={savedFiltersData || []}
        onSaveFilter={handleSaveFilter}
        onLoadFilter={handleLoadFilter}
        className="mb-6"
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Domain Results
          </h2>
          <Badge variant="outline">
            {domainsData?.domains.length || 0} domains
          </Badge>
          {domainsData?.total && (
            <Badge variant="secondary">
              {domainsData.total} total
            </Badge>
          )}
        </div>
      </div>

      {/* Domains List */}
      {domainsData?.domains.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or search criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {domainsData?.domains.map((domain) => (
            <Card key={domain.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {domain.name}
                      </h3>
                      {domain.featured && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                      <div className="flex items-center gap-1">
                        {getStatusIcon(domain.status)}
                        <Badge 
                          variant="outline"
                          className={cn(
                            'text-xs',
                            domain.status === 'VERIFIED' && 'bg-green-100 text-green-800',
                            domain.status === 'PENDING_VERIFICATION' && 'bg-yellow-100 text-yellow-800',
                            domain.status === 'PAUSED' && 'bg-red-100 text-red-800',
                            domain.status === 'DELETED' && 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {domain.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Price:</span>
                        <span className="ml-2 text-gray-900">${domain.price?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Category:</span>
                        <span className="ml-2 text-gray-900">{domain.category?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Location:</span>
                        <span className="ml-2 text-gray-900">
                          {domain.city?.name || 'N/A'}, {domain.state?.name || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Seller:</span>
                        <span className="ml-2 text-gray-900">{domain.seller?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(domain.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/domains/${domain.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {domainsData && domainsData.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {domainsData.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(domainsData.totalPages, prev + 1))}
              disabled={currentPage === domainsData.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}
