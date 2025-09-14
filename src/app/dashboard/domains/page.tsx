'use client';

import { useMemo, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/main-layout";
import { QueryErrorBoundary } from "@/components/error";
import { StandardDashboardLayout } from "@/components/layout/StandardDashboardLayout";
import { LoadingCardSkeleton } from "@/components/ui/loading/LoadingSkeleton";
import { DashboardGuard } from "@/components/auth/DashboardGuard";
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  MoreHorizontal,
  Globe,
  TrendingUp,
  MessageSquare,
  DollarSign,
  Building,
  MapPin,
  Clock,
  ShoppingCart,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories";
import { WholesaleDomainModal } from "@/components/wholesale/WholesaleDomainModal";
import { WholesaleConfirmModal } from "@/components/wholesale/WholesaleConfirmModal";

// Using real data from tRPC below

// formatPrice from utils is used instead

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'VERIFIED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    case 'PENDING_VERIFICATION':
      return <Badge variant="outline" className="text-yellow-600">Pending Verification</Badge>;
    case 'DRAFT':
      return <Badge variant="outline" className="text-gray-600">Draft</Badge>;
    case 'PAUSED':
      return <Badge variant="outline" className="text-orange-600">Paused</Badge>;
    case 'REJECTED':
      return <Badge variant="outline" className="text-red-600">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DashboardDomainsPage() {

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showWholesaleConfirmModal, setShowWholesaleConfirmModal] = useState(false);
  const [selectedDomainForWholesale, setSelectedDomainForWholesale] = useState<any>(null);

  // Wrap tRPC query in try-catch to prevent crashes
  let data, isLoading, isError, error, refetch;

  try {
    const queryResult = trpc.domains.getMyDomains.useQuery(
      { 
        limit: 50, 
        status: statusFilter === 'all' || statusFilter === 'pending' ? undefined : statusFilter as any 
      }
    );
    data = queryResult.data;
    isLoading = queryResult.isLoading;
    isError = queryResult.isError;
    error = queryResult.error;
    refetch = queryResult.refetch;

  } catch (err) {
    console.error('❌ [SELLER DOMAINS] tRPC query error:', err);
    data = undefined;
    isLoading = false;
    isError = true;
    error = err as Error;
    refetch = () => {};
  }
  
  // Error handling and authentication check
  
  // Fix data access pattern to match API response structure: { success: true, data: domains }
  // Temporarily remove memoization to test if it's causing the issue
  const domains = data?.data ?? [];

  // Check for authentication errors in the data
  const hasAuthError = error?.message?.includes('UNAUTHORIZED') || 
                      data?.error?.message?.includes('UNAUTHORIZED') ||
                      (data && !data.success && data.error);
  
  // Debug logging for authentication

  // Determine if we should show error state
  const shouldShowError = isError || hasAuthError;

  // Temporarily remove useMemo to test if it's causing the issue

  let filteredDomains;
  try {
    const term = searchTerm.trim().toLowerCase();
    filteredDomains = domains.filter((domain: any) => {
      if (!domain || typeof domain !== 'object') {

        return false;
      }
      
      const matchesSearch = !term ||
        (domain.name && domain.name.toLowerCase().includes(term)) ||
        (domain.category && domain.category.toLowerCase().includes(term)) ||
        (domain.state && domain.state.toLowerCase().includes(term)) ||
        (domain.city && domain.city.toLowerCase().includes(term));
      const matchesStatus = statusFilter === 'all' || 
        domain.status === statusFilter ||
        (statusFilter === 'pending' && ['DRAFT', 'PENDING_VERIFICATION', 'REJECTED'].includes(domain.status));
      return matchesSearch && matchesStatus;
    });

  } catch (err) {
    console.error('❌ [SELLER DOMAINS] Error filtering domains:', err);
    filteredDomains = [];
  }

  // Temporarily remove useMemo to test if it's causing the issue
  let totalViews;
  try {
    totalViews = domains.reduce((sum: number, d: any) => {
      if (!d || typeof d !== 'object') return sum;
      
      const views = Array.isArray(d.analytics) 
        ? d.analytics.reduce((s: number, day: any) => s + (day?.views || 0), 0) 
        : 0;
      return sum + views;
    }, 0);
  } catch (err) {
    console.error('Error calculating total views:', err);
    totalViews = 0;
  }

  let totalValue;
  try {
    totalValue = domains.reduce((sum: number, d: any) => {
      if (!d || typeof d !== 'object') return sum;
      return sum + Number(d.price || 0);
    }, 0);
  } catch (err) {
    console.error('Error calculating total value:', err);
    totalValue = 0;
  }

  // Calculate pending domains (domains that need attention)
  let pendingDomains;
  try {
    pendingDomains = domains.filter((d: any) => {
      if (!d || typeof d !== 'object') return false;
      const status = d.status;
      return status === 'DRAFT' || 
             status === 'PENDING_VERIFICATION' || 
             status === 'REJECTED';
    }).length;
  } catch (err) {
    console.error('Error calculating pending domains:', err);
    pendingDomains = 0;
  }

  // Wrap mutations in try-catch to prevent crashes
  let updateMutation, deleteMutation, togglePauseMutation;

  // Ensure refetch is a function
  const safeRefetch = typeof refetch === 'function' ? refetch : () => {};
  
  try {
    updateMutation = trpc.domains.update.useMutation({ 
      onSuccess: () => {

        safeRefetch();
      }
    });
    deleteMutation = trpc.domains.delete.useMutation({ 
      onSuccess: () => {

        safeRefetch();
      },
      onError: (error) => {
        console.error('❌ [SELLER DOMAINS] Delete mutation error:', error);
        alert(`Failed to delete domain: ${error.message}`);
      }
    });
    togglePauseMutation = trpc.domains.togglePause.useMutation({ 
      onSuccess: () => {

        safeRefetch();
      }
    });

  } catch (err) {
    console.error('❌ [SELLER DOMAINS] Error setting up mutations:', err);
    // Create dummy mutations to prevent crashes
    updateMutation = { mutate: () => {}, mutateAsync: () => Promise.resolve() };
    deleteMutation = { mutate: () => {}, mutateAsync: () => Promise.resolve() };
    togglePauseMutation = { mutate: () => {}, mutateAsync: () => Promise.resolve() };
  }

  const handleTogglePause = (domain: { id: string; status: string; name: string }) => {
    try {
      togglePauseMutation.mutate({ id: domain.id });
    } catch (err) {
      console.error('Error toggling pause:', err);
      alert('Failed to toggle pause. Please try again.');
    }
  };

  const handleDelete = (domain: { id: string; name: string }) => {

    try {
      if (confirm(`Delete ${domain.name}? This cannot be undone.`)) {

        deleteMutation.mutate(domain.id);
      } else {

      }
    } catch (err) {
      console.error('❌ [DELETE DOMAIN] Error in handleDelete:', err);
      alert('Failed to delete domain. Please try again.');
    }
  };

  return (
    <DashboardGuard>
      <QueryErrorBoundary context="Dashboard Domains Page">
        <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Domains</h1>
          <p className="text-gray-600 mt-2">Manage your domain listings and track their performance</p>
        </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="DRAFT">Draft</option>
            <option value="PAUSED">Paused</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <Link href="/domains/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Domain
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold">{domains.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setStatusFilter('pending')}
          title="Click to filter domains that need attention (Draft, Pending Verification, Rejected)"
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Domains</p>
                <p className="text-2xl font-bold">{pendingDomains}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">{formatPrice(totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Listings</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${filteredDomains.length} of ${domains.length} domains`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shouldShowError && (
            <div className="text-center py-8">
              {console.log('🔍 [SELLER DOMAINS] Rendering error state...')}
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
              <p className="text-gray-600 mb-4">
                {hasAuthError 
                  ? 'This page is only accessible to sellers. Please log in with a seller account to view your domains.'
                  : `Error: ${error?.message || 'Unknown error occurred'}`
                }
              </p>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-red-900 mb-2">Debug Information:</h4>
                  <div className="text-sm text-red-800">
                    <p><strong>Error:</strong> {error.message}</p>
                    <p><strong>Data:</strong> {JSON.stringify(data, null, 2)}</p>
                  </div>
                </div>
              )}
              {hasAuthError && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">Demo Seller Accounts:</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>• seller1@test.com / seller123</div>
                    <div>• seller2@test.com / seller123</div>
                    <div>• seller3@test.com / seller123</div>
                  </div>
                </div>
              )}
              <div className="flex gap-2 justify-center">
                <Button onClick={() => refetch()}>Retry</Button>
                {hasAuthError && (
                  <Link href="/login">
                    <Button variant="outline">Login as Seller</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
          {isLoading && (
            <div className="space-y-3">
              {console.log('🔍 [SELLER DOMAINS] Rendering loading state...')}
              {[...Array(3)].map((_, i) => (
                <LoadingCardSkeleton key={i} lines={2} />
              ))}
            </div>
          )}
          {filteredDomains.length === 0 && !isLoading && !shouldShowError ? (
            <div className="text-center py-8">
              {console.log('🔍 [SELLER DOMAINS] Rendering empty state...')}
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first domain'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <div className="flex gap-2 justify-center">
                  <Link href="/domains/new">
                    <Button>Add Your First Domain</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline">Login as Seller</Button>
                  </Link>
                </div>
              )}
            </div>
          ) : (!isLoading && !shouldShowError && (
            <div className="space-y-4">
              {console.log('🔍 [SELLER DOMAINS] Rendering domains list...', filteredDomains)}
              {filteredDomains.map((domain, index) => {
                try {

                  // Safety check for domain object
                  if (!domain || typeof domain !== 'object') {

                    return null;
                  }
                  
                  const domainKey = domain?.id || `domain-${index}`;

                  return (
                <div key={domainKey} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-blue-600 truncate">{domain.name || 'Unnamed Domain'}</h3>
                      {getStatusBadge(domain.status || 'UNKNOWN')}
                    </div>
                    
                    {/* Category and Geographic Indicators */}
                    <div className="flex items-center gap-2 mb-2">
                      {domain.category && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          <Building className="h-3 w-3 mr-1" />
                          {getCategoryById(domain.category)?.name || domain.category}
                        </Badge>
                      )}
                      {domain.geographicScope && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                          <MapPin className="h-3 w-3 mr-1" />
                          {getGeographicScopeByValue(domain.geographicScope)?.label || domain.geographicScope}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                      <span>{domain.city && `${domain.city}, `}{domain.state || 'Unknown'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Listed {domain.createdAt ? new Date(domain.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatPrice(domain.price || 0)}</div>
                      <div className="text-sm text-gray-600">
                        {domain.inquiries?.length || 0} inquiries
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {domain.id && (
                        <>
                          <Link href={`/domains/${encodeURIComponent(domain.name)}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/domains/${encodeURIComponent(domain.name)}/edit`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          {domain.status === 'VERIFIED' ? (
                            <Button size="sm" variant="outline" disabled>Verified</Button>
                          ) : domain.status === 'PENDING_VERIFICATION' ? (
                            <Button size="sm" variant="outline" disabled>Pending Review</Button>
                          ) : (
                            <Link href={`/domains/${encodeURIComponent(domain.name)}/verify`}>
                              <Button size="sm" variant="outline">Verify</Button>
                            </Link>
                          )}
                          {/* Wholesale Button - only show for verified domains */}
                          {['VERIFIED', 'PUBLISHED', 'ACTIVE'].includes(domain.status) && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedDomainForWholesale(domain);
                                setShowWholesaleConfirmModal(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Wholesale
                            </Button>
                          )}
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => handleTogglePause(domain)}>
                        {domain.status === 'PAUSED' ? 'Unpause' : 'Pause'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(domain)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
                );
                } catch (err) {
                  console.error(`❌ [SELLER DOMAINS] Error rendering domain ${index}:`, err);
                  return (
                    <div key={`error-${index}`} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <p className="text-red-600">Error rendering domain {index}</p>
                    </div>
                  );
                }
              })}
            </div>
          ))}
          {console.log('🔍 [SELLER DOMAINS] Finished rendering domains list')}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8">
        {console.log('🔍 [SELLER DOMAINS] Rendering Quick Actions section...')}
        <Card>
          <CardHeader>
            {console.log('🔍 [SELLER DOMAINS] Rendering Quick Actions header...')}
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your domains</CardDescription>
          </CardHeader>
          <CardContent>
            {console.log('🔍 [SELLER DOMAINS] Rendering Quick Actions content...')}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {console.log('🔍 [SELLER DOMAINS] Rendering Quick Actions grid...')}
              <Link href="/domains/new">
                {console.log('🔍 [SELLER DOMAINS] Rendering Add New Domain link...')}
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6" />
                  <div>
                    <div className="font-medium">Add New Domain</div>
                    <div className="text-sm text-gray-600">List a new domain for sale</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/analytics">
                {console.log('🔍 [SELLER DOMAINS] Rendering View Analytics link...')}
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <div>
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-gray-600">Track domain performance</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/inquiries">
                {console.log('🔍 [SELLER DOMAINS] Rendering Manage Inquiries link...')}
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <div>
                    <div className="font-medium">Manage Inquiries</div>
                    <div className="text-sm text-gray-600">Respond to buyer inquiries</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      {console.log('🔍 [SELLER DOMAINS] Finished rendering Quick Actions section')}

      {/* Wholesale Section */}
      <WholesaleSection />
      </div>
      {console.log('🔍 [SELLER DOMAINS] About to render DashboardLayout...')}

      {/* Wholesale Confirm Modal */}
      {showWholesaleConfirmModal && selectedDomainForWholesale && (
        <WholesaleConfirmModal
          isOpen={showWholesaleConfirmModal}
          onClose={() => {
            setShowWholesaleConfirmModal(false);
            setSelectedDomainForWholesale(null);
          }}
          onSuccess={() => {
            setShowWholesaleConfirmModal(false);
            setSelectedDomainForWholesale(null);
            // Refresh the page to show updated data
            window.location.reload();
          }}
          domain={selectedDomainForWholesale}
        />
      )}
        </DashboardLayout>
      </QueryErrorBoundary>
    </DashboardGuard>
  );
}

// Wholesale Section Component
function WholesaleSection() {
  const [showWholesaleModal, setShowWholesaleModal] = useState(false);
  
  // Fetch wholesale configuration
  const { data: config } = trpc.wholesale.getConfig.useQuery();
  
  // Fetch seller's wholesale domains
  const { 
    data: wholesaleData, 
    isLoading: wholesaleLoading, 
    refetch: refetchWholesale 
  } = trpc.wholesale.getMyWholesaleDomains.useQuery({
    page: 1,
    limit: 10,
  });

  const getWholesaleStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
      case 'PENDING_APPROVAL':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Approval</Badge>;
      case 'SOLD':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Sold</Badge>;
      case 'REMOVED':
        return <Badge variant="outline" className="text-gray-600">Removed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-red-600" />
                Wholesale Marketplace
              </CardTitle>
              <CardDescription>
                Sell your domains at a fixed price of ${config?.price || 299} for quick sales
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowWholesaleModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Package className="h-4 w-4 mr-2" />
              Add to Wholesale
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {wholesaleLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : !wholesaleData?.domains.length ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No wholesale domains</h3>
              <p className="text-gray-600 mb-4">
                Add your verified domains to the wholesale marketplace for quick sales at ${config?.price || 299} each.
              </p>
              <Button 
                onClick={() => setShowWholesaleModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Package className="h-4 w-4 mr-2" />
                Add Your First Domain
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wholesaleData.domains.slice(0, 6).map((wholesaleDomain) => (
                  <div key={wholesaleDomain.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {wholesaleDomain.domain.name}
                      </h4>
                      {getWholesaleStatusBadge(wholesaleDomain.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">${config?.price || 299}</span>
                    </div>
                    
                    {wholesaleDomain.domain.category && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Building className="h-4 w-4" />
                        <span>{wholesaleDomain.domain.category}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {wholesaleDomain.domain.city && wholesaleDomain.domain.state 
                          ? `${wholesaleDomain.domain.city}, ${wholesaleDomain.domain.state}`
                          : wholesaleDomain.domain.state || 'National'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {wholesaleDomain.status === 'SOLD' && wholesaleDomain.soldAt
                          ? `Sold ${new Date(wholesaleDomain.soldAt).toLocaleDateString()}`
                          : `Added ${new Date(wholesaleDomain.addedAt).toLocaleDateString()}`
                        }
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {wholesaleData.domains.length > 6 && (
                <div className="text-center pt-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard/wholesale">
                      View All Wholesale Domains ({wholesaleData.pagination.total})
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Wholesale Modal */}
      {showWholesaleModal && (
        <WholesaleDomainModal 
          onClose={() => setShowWholesaleModal(false)}
          onSuccess={() => {
            setShowWholesaleModal(false);
            refetchWholesale();
          }}
        />
      )}

    </div>
  );
}
