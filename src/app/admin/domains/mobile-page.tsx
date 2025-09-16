'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
// Removed MobileAdminPageLayout import - using standard layout instead
import { MobileDataTable, MobileActionButtons } from '@/components/admin/MobileDataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Download
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function MobileAdminDomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Array<{key: string, label: string, value: string}>>([]);

  // All hooks must be called before any conditional returns
  const { data: domainsData, isLoading, error, refetch } = trpc.admin.domains.listDomainsForModeration.useQuery({
    search: searchTerm || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter as any,
    page: currentPage,
    limit: 20,
  }, {
    enabled: status === 'authenticated' && session?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role),
  });

  // Debug logging
  const moderateDomainMutation = trpc.admin.domains.moderateDomain.useMutation({
    onSuccess: () => {
      toast.success('Domain moderated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to moderate domain');
    },
  });

  const deleteDomainMutation = trpc.admin.domains.deleteDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Domain deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete domain');
    },
  });

  const restoreDomainMutation = trpc.admin.domains.restoreDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Domain restored successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore domain');
    },
  });

  const permanentDeleteDomainMutation = trpc.admin.domains.permanentDeleteDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Domain permanently deleted');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently delete domain');
    },
  });

  const toggleFeaturedMutation = trpc.admin.toggleFeaturedDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Featured status updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update featured status');
    },
  });

  // Redirect if not admin - AFTER all hooks are called
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Domain Management</h1>
          <p className="text-gray-600 mt-1">Loading domains...</p>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN') {
    router.push('/login');
    return null;
  }

  const handleModerateDomain = async (domainId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') => {
    const actionText = action === 'APPROVE' ? 'approve' : action === 'REJECT' ? 'reject' : 'suspend';
    const confirmMessage = `Are you sure you want to ${actionText} this domain?`;
    
    if (window.confirm(confirmMessage)) {
      moderateDomainMutation.mutate({
        domainId,
        action,
        reason: `Domain ${actionText}d by admin`,
        adminNotes: `Action taken by ${session.user?.name || 'Admin'}`,
      });
    }
  };

  const handleDeleteDomain = async (domainId: string, domainName: string) => {
    const confirmMessage = `Are you sure you want to DELETE the domain "${domainName}"?\n\nThis will soft-delete the domain (can be restored later).`;
    
    if (window.confirm(confirmMessage)) {
      const reason = prompt('Please provide a reason for deleting this domain (optional):');
      
      deleteDomainMutation.mutate({
        domainId,
        reason: reason || 'Domain deleted by admin',
        adminNotes: `Domain deleted by ${session.user?.name || 'Admin'}`,
      });
    }
  };

  const handleRestoreDomain = async (domainId: string, domainName: string) => {
    const confirmMessage = `Are you sure you want to RESTORE the domain "${domainName}"?\n\nThis will make the domain available again in the marketplace.`;
    
    if (window.confirm(confirmMessage)) {
      restoreDomainMutation.mutate({
        domainId,
        reason: 'Domain restored by admin',
        adminNotes: `Domain restored by ${session.user?.name || 'Admin'}`,
      });
    }
  };

  const handlePermanentDeleteDomain = async (domainId: string, domainName: string) => {
    const confirmMessage = `⚠️ WARNING: This will PERMANENTLY DELETE the domain "${domainName}" and cannot be undone!\n\nAre you absolutely sure?`;
    
    if (window.confirm(confirmMessage)) {
      const doubleConfirm = window.confirm('This action cannot be undone. Type "DELETE" to confirm:');
      if (doubleConfirm) {
        permanentDeleteDomainMutation.mutate({
          domainId,
          reason: 'Domain permanently deleted by admin',
          adminNotes: `Domain permanently deleted by ${session.user?.name || 'Admin'}`,
        });
      }
    }
  };

  const handleToggleFeatured = async (domainId: string, domainName: string, currentFeatured: boolean) => {
    const action = currentFeatured ? 'remove from featured' : 'add to featured';
    const confirmMessage = `Are you sure you want to ${action} "${domainName}"?`;
    
    if (window.confirm(confirmMessage)) {
      toggleFeaturedMutation.mutate({
        domainId,
        featured: !currentFeatured,
      });
    }
  };

  const handleDomainClick = (domain: any) => {
    router.push(`/admin/domains/${domain.id}`);
  };

  const handleExportDomains = () => {
    if (!domainsData?.domains.length) return;
    
    const csvContent = [
      ['Name', 'Status', 'Price', 'Category', 'Location', 'Seller', 'Created At'].join(','),
      ...domainsData.domains.map(domain => [
        domain.name,
        domain.status,
        domain.price,
        domain.category?.name || 'N/A',
        `${domain.city?.name || 'N/A'}, ${domain.state?.name || 'N/A'}`,
        domain.seller?.name || 'N/A',
        new Date(domain.createdAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `domains-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
      if (value !== 'ALL') {
        setActiveFilters(prev => [
          ...prev.filter(f => f.key !== 'status'),
          { key: 'status', label: 'Status', value }
        ]);
      } else {
        setActiveFilters(prev => prev.filter(f => f.key !== 'status'));
      }
    }
  };

  const handleRemoveFilter = (key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key));
    if (key === 'status') {
      setStatusFilter('ALL');
    }
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    setStatusFilter('ALL');
    setSearchTerm('');
  };

  // Define columns for mobile data table
  const columns = [
    {
      key: 'name',
      label: 'Domain',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{value}</span>
          {row.featured && <Star className="h-4 w-4 text-yellow-500" />}
        </div>
      )
    },
    {
      key: 'price',
      label: 'Price',
      render: (value: number) => `$${value?.toLocaleString() || 'N/A'}`
    },
    {
      key: 'category',
      label: 'Category',
      render: (value: any, row: any) => row.category?.name || 'N/A'
    },
    {
      key: 'location',
      label: 'Location',
      render: (value: any, row: any) => `${row.city?.name || 'N/A'}, ${row.state?.name || 'N/A'}`
    },
    {
      key: 'seller',
      label: 'Seller',
      render: (value: any, row: any) => row.seller?.name || 'N/A'
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'SUSPENDED': return <Pause className="h-4 w-4 text-red-600" />;
      case 'DELETED': return <XCircle className="h-4 w-4 text-gray-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Domain Management</h1>
            <p className="text-gray-600 mt-1">Review and moderate domain listings</p>
          </div>
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
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error.message}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-600 text-sm">Loading domains...</p>
        </div>
      )}
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Domains</p>
              <p className="text-2xl font-bold text-gray-900">{domainsData?.total || 0}</p>
            </div>
            <Globe className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900">{domainsData?.domains?.filter(d => d.status === 'PENDING').length || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {filter.label}: {filter.value}
                <button
                  onClick={() => handleRemoveFilter(filter.key)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search domains..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DELETED">Deleted</option>
          </select>
        </div>
      </div>

      {/* Domains Table */}
      <MobileDataTable
        title="Domains"
        description={`${domainsData?.domains.length || 0} domains found`}
        data={domainsData?.domains || []}
        columns={columns}
        onRowClick={handleDomainClick}
        emptyMessage="No domains found"
        loading={isLoading}
      />

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
    </div>
  );
}
