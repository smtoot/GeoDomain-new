'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  X,
  Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminDomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
      const reason = prompt('Please provide a reason for restoring this domain (optional):');
      
      restoreDomainMutation.mutate({
        domainId,
        reason: reason || 'Domain restored by admin',
        adminNotes: `Domain restored by ${session.user?.name || 'Admin'}`,
      });
    }
  };

  const handlePermanentDeleteDomain = async (domainId: string, domainName: string) => {
    const confirmMessage = `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE the domain "${domainName}"?\n\nThis action CANNOT be undone and will completely remove the domain from the database.`;
    
    if (window.confirm(confirmMessage)) {
      const doubleConfirm = window.confirm(`FINAL CONFIRMATION: This will PERMANENTLY DELETE "${domainName}" from the database. This action is IRREVERSIBLE. Continue?`);
      
      if (doubleConfirm) {
        const reason = prompt('Please provide a reason for permanently deleting this domain (required):');
        
        if (reason && reason.trim()) {
          permanentDeleteDomainMutation.mutate({
            domainId,
            reason: reason.trim(),
            adminNotes: `Domain permanently deleted by ${session.user?.name || 'Admin'}`,
          });
        } else {
          toast.error('Reason is required for permanent deletion');
        }
      }
    }
  };

  const handleToggleFeatured = (domainId: string, currentFeatured: boolean) => {
    toggleFeaturedMutation.mutate({
      domainId,
      isFeatured: !currentFeatured,
    });
  };

  const domains = (domainsData?.domains || []) as Domain[];
  const pagination = domainsData?.pagination;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING_VERIFICATION':
        return 'secondary';
      case 'DRAFT':
        return 'outline';
      case 'SOLD':
        return 'destructive';
      case 'DELETED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING_VERIFICATION':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'DRAFT':
        return <Edit className="h-4 w-4 text-gray-600" />;
      case 'SOLD':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'DELETED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Type definitions for better type safety
  interface Domain {
    id: string;
    name: string;
    category: string;
    price: any; // Decimal type from Prisma
    status: string;
    city?: string | null;
    state: string;
    owner: {
      name: string | null;
      email: string;
    };
    _count: {
      inquiries: number;
    };
  }

  return (
    <QueryErrorBoundary context="Admin Domain Moderation Page">
      <div className="min-h-screen bg-gray-50">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Domain Moderation</h1>
              <p className="text-sm text-gray-600">Review and manage domain listings</p>
            </div>
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
              size="sm"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
        {/* Compact Stats Cards */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center">
                <Globe className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{pagination?.total || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Verified</p>
                  <p className="text-lg font-bold text-gray-900">
                    {domains.filter(d => d.status === 'VERIFIED').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-yellow-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending</p>
                  <p className="text-lg font-bold text-gray-900">
                    {domains.filter(d => d.status === 'PENDING_VERIFICATION').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Sold</p>
                  <p className="text-lg font-bold text-gray-900">
                    {domains.filter(d => d.status === 'SOLD').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Filters and Search */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 mb-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">Pending Review</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="DELETED">Deleted</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                variant="outline"
                size="sm"
                className="h-9"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Action Guide */}
        <div className="px-4 mb-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <h3 className="text-xs font-medium text-gray-900 mb-2">Quick Actions:</h3>
            <div className="grid grid-cols-2 lg:grid-cols-7 gap-2 text-xs">
              <div className="flex items-center">
                <Eye className="h-3 w-3 text-blue-600 mr-1" />
                <span className="text-gray-600">View</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-gray-600">Approve</span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-3 w-3 text-red-600 mr-1" />
                <span className="text-gray-600">Reject</span>
              </div>
              <div className="flex items-center">
                <Pause className="h-3 w-3 text-orange-600 mr-1" />
                <span className="text-gray-600">Suspend</span>
              </div>
              <div className="flex items-center">
                <Trash2 className="h-3 w-3 text-red-700 mr-1" />
                <span className="text-gray-600">Delete</span>
              </div>
              <div className="flex items-center">
                <RotateCcw className="h-3 w-3 text-blue-700 mr-1" />
                <span className="text-gray-600">Restore</span>
              </div>
              <div className="flex items-center">
                <X className="h-3 w-3 text-red-800 mr-1" />
                <span className="text-gray-600">Permanent</span>
              </div>
            </div>
          </div>
        </div>

        {/* Domains Grid */}
        <div className="px-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading domains...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading domains: {error.message}</p>
              <Button onClick={() => refetch()} className="mt-2">
                Retry
              </Button>
            </div>
          ) : domains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No domains found</p>
            </div>
          ) : (
            <>
              {/* Compact Domain Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                {domains.map((domain) => (
                  <div key={domain.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
                    {/* Domain Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{domain.name}</h3>
                        <p className="text-xs text-gray-600">{domain.category}</p>
                      </div>
                      <div className="flex items-center ml-2 gap-1">
                        {getStatusIcon(domain.status)}
                        <Badge variant={getStatusBadgeVariant(domain.status)} className="text-xs">
                          {domain.status.replace('_', ' ')}
                        </Badge>
                        {/* Featured Toggle - Only for VERIFIED domains */}
                        {domain.status === 'VERIFIED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleFeatured(domain.id, domain.isFeatured || false)}
                            disabled={toggleFeaturedMutation.isPending}
                            className={`h-6 w-6 p-0 ${
                              domain.isFeatured 
                                ? 'text-yellow-500 hover:text-yellow-600' 
                                : 'text-gray-400 hover:text-yellow-500'
                            }`}
                            title={domain.isFeatured ? 'Remove from featured' : 'Add to featured'}
                          >
                            <Star className={`h-4 w-4 ${domain.isFeatured ? 'fill-current' : ''}`} />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Domain Details */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center text-sm">
                        <Building className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-gray-600 truncate">{domain.owner.name || 'No name'}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="h-3 w-3 text-green-600 mr-1" />
                        <span className="font-medium">${Number(domain.price).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                        <span className="text-gray-600 truncate">
                          {domain.city && `${domain.city}, `}{domain.state}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-600">{domain._count.inquiries} inquiries</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/admin/domains/${encodeURIComponent(domain.name)}`)}
                        title="View Domain Details"
                        className="flex-1 h-7 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      
                      {domain.status === 'PENDING_VERIFICATION' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerateDomain(domain.id, 'APPROVE')}
                            disabled={moderateDomainMutation.isPending}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-7 px-2"
                            title="Approve Domain"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModerateDomain(domain.id, 'REJECT')}
                            disabled={moderateDomainMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                            title="Reject Domain"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      
                      {domain.status === 'VERIFIED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerateDomain(domain.id, 'SUSPEND')}
                          disabled={moderateDomainMutation.isPending}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-7 px-2"
                          title="Suspend Domain"
                        >
                          <Pause className="h-3 w-3" />
                        </Button>
                      )}

                      {/* Delete button - available for all domains except already deleted */}
                      {domain.status !== 'DELETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteDomain(domain.id, domain.name)}
                          disabled={deleteDomainMutation.isPending}
                          className="text-red-700 hover:text-red-800 hover:bg-red-50 h-7 px-2"
                          title="Delete Domain (Soft Delete)"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}

                      {/* Restore and Permanent Delete buttons - available only for deleted domains */}
                      {domain.status === 'DELETED' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreDomain(domain.id, domain.name)}
                            disabled={restoreDomainMutation.isPending}
                            className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 h-7 px-2"
                            title="Restore Domain"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePermanentDeleteDomain(domain.id, domain.name)}
                            disabled={permanentDeleteDomainMutation.isPending}
                            className="text-red-800 hover:text-red-900 hover:bg-red-100 h-7 px-2"
                            title="Permanently Delete Domain"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Compact Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-7 px-3 text-xs"
                    >
                      Prev
                    </Button>
                    <span className="text-xs text-gray-600">
                      {currentPage} / {pagination.pages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === pagination.pages}
                      className="h-7 px-3 text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </QueryErrorBoundary>
  );
}
