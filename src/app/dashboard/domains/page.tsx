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
  DollarSign
} from 'lucide-react';

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
  console.log('🔍 [SELLER DOMAINS] Component rendering...');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Wrap tRPC query in try-catch to prevent crashes
  let data, isLoading, isError, error, refetch;
  
  console.log('🔍 [SELLER DOMAINS] Setting up tRPC query...');
  
  try {
    const queryResult = trpc.domains.getMyDomains.useQuery(
      { limit: 50, status: statusFilter === 'all' ? undefined : statusFilter as any }
    );
    data = queryResult.data;
    isLoading = queryResult.isLoading;
    isError = queryResult.isError;
    error = queryResult.error;
    refetch = queryResult.refetch;
    
    console.log('🔍 [SELLER DOMAINS] tRPC query result:', {
      data: data,
      isLoading: isLoading,
      isError: isError,
      error: error
    });
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
  const domains = data?.data ?? [];
  
  console.log('🔍 [SELLER DOMAINS] Extracted domains:', domains);
  console.log('🔍 [SELLER DOMAINS] Domains length:', domains.length);
  
  // Check for authentication errors in the data
  const hasAuthError = error?.message?.includes('UNAUTHORIZED') || 
                      data?.error?.message?.includes('UNAUTHORIZED') ||
                      (data && !data.success && data.error);
  
  // Determine if we should show error state
  const shouldShowError = isError || hasAuthError;
  
  console.log('🔍 [SELLER DOMAINS] Error states:', {
    isError: isError,
    hasAuthError: hasAuthError,
    shouldShowError: shouldShowError
  });
  const filteredDomains = useMemo(() => {
    console.log('🔍 [SELLER DOMAINS] Filtering domains...');
    try {
      const term = searchTerm.trim().toLowerCase();
      const filtered = domains.filter((domain: any) => {
        if (!domain || typeof domain !== 'object') {
          console.log('🔍 [SELLER DOMAINS] Invalid domain object:', domain);
          return false;
        }
        
        const matchesSearch = !term ||
          (domain.name && domain.name.toLowerCase().includes(term)) ||
          (domain.category && domain.category.toLowerCase().includes(term)) ||
          (domain.state && domain.state.toLowerCase().includes(term)) ||
          (domain.city && domain.city.toLowerCase().includes(term));
        const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
        return matchesSearch && matchesStatus;
      });
      
      console.log('🔍 [SELLER DOMAINS] Filtered domains:', filtered);
      return filtered;
    } catch (err) {
      console.error('❌ [SELLER DOMAINS] Error filtering domains:', err);
      return [];
    }
  }, [domains, searchTerm, statusFilter]);

  const totalViews = useMemo(() => {
    try {
      return domains.reduce((sum: number, d: any) => {
        if (!d || typeof d !== 'object') return sum;
        
        const views = Array.isArray(d.analytics) 
          ? d.analytics.reduce((s: number, day: any) => s + (day?.views || 0), 0) 
          : 0;
        return sum + views;
      }, 0);
    } catch (err) {
      console.error('Error calculating total views:', err);
      return 0;
    }
  }, [domains]);

  const totalValue = useMemo(() => {
    try {
      return domains.reduce((sum: number, d: any) => {
        if (!d || typeof d !== 'object') return sum;
        return sum + Number(d.price || 0);
      }, 0);
    } catch (err) {
      console.error('Error calculating total value:', err);
      return 0;
    }
  }, [domains]);

  // Wrap mutations in try-catch to prevent crashes
  let updateMutation, deleteMutation, togglePauseMutation;
  
  console.log('🔍 [SELLER DOMAINS] Setting up mutations...');
  console.log('🔍 [SELLER DOMAINS] refetch function:', refetch);
  console.log('🔍 [SELLER DOMAINS] refetch type:', typeof refetch);
  
  // Ensure refetch is a function
  const safeRefetch = typeof refetch === 'function' ? refetch : () => {};
  
  try {
    updateMutation = trpc.domains.update.useMutation({ 
      onSuccess: () => {
        console.log('🔍 [SELLER DOMAINS] Update mutation success, refetching...');
        safeRefetch();
      }
    });
    deleteMutation = trpc.domains.delete.useMutation({ 
      onSuccess: () => {
        console.log('🔍 [SELLER DOMAINS] Delete mutation success, refetching...');
        safeRefetch();
      }
    });
    togglePauseMutation = trpc.domains.togglePause.useMutation({ 
      onSuccess: () => {
        console.log('🔍 [SELLER DOMAINS] Toggle pause mutation success, refetching...');
        safeRefetch();
      }
    });
    console.log('🔍 [SELLER DOMAINS] Mutations set up successfully');
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
        deleteMutation.mutate({ id: domain.id });
      }
    } catch (err) {
      console.error('Error deleting domain:', err);
      alert('Failed to delete domain. Please try again.');
    }
  };

  console.log('🔍 [SELLER DOMAINS] About to render component...');
  
  return (
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
            <option value="VERIFIED">Verified</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
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
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold">
                  {domains.reduce((sum: number, domain: any) => {
                    const domainInquiries = domain.inquiries || 0;
                    return sum + domainInquiries;
                  }, 0)}
                </p>
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
                  : 'Please try again.'
                }
              </p>
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
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
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
                  console.log(`🔍 [SELLER DOMAINS] Processing domain ${index}:`, domain);
                  console.log(`🔍 [SELLER DOMAINS] Domain ${index} id:`, domain?.id);
                  console.log(`🔍 [SELLER DOMAINS] Domain ${index} type:`, typeof domain);
                  console.log(`🔍 [SELLER DOMAINS] Domain ${index} keys:`, domain ? Object.keys(domain) : 'null');
                  
                  // Safety check for domain object
                  if (!domain || typeof domain !== 'object') {
                    console.log(`❌ [SELLER DOMAINS] Invalid domain ${index}:`, domain);
                    return null;
                  }
                  
                  const domainKey = domain?.id || `domain-${index}`;
                  console.log(`🔍 [SELLER DOMAINS] Domain ${index} key:`, domainKey);
                  console.log(`🔍 [SELLER DOMAINS] Domain ${index} key type:`, typeof domainKey);
                  console.log(`🔍 [SELLER DOMAINS] Domain ${index} id type:`, typeof domain?.id);
                  console.log(`🔍 [SELLER DOMAINS] Domain ${index} id value:`, domain?.id);
                  
                  return (
                <div key={domainKey} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-blue-600 truncate">{domain.name || 'Unnamed Domain'}</h3>
                      {getStatusBadge(domain.status || 'UNKNOWN')}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                      <span>{domain.category || 'Uncategorized'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{domain.city && `${domain.city}, `}{domain.state || 'Unknown'}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Listed {domain.createdAt ? new Date(domain.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatPrice(domain.price || 0)}</div>
                      <div className="text-sm text-gray-600">
                        {domain.inquiries || 0} inquiries
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {domain.id && (
                        <>
                          <Link href={`/domains/${domain.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/domains/${domain.id}/edit`}>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </Link>
                          {domain.status === 'VERIFIED' ? (
                            <Button size="sm" variant="outline" disabled>Verify</Button>
                          ) : (
                            <Link href={`/domains/${domain.id}/verify`}>
                              <Button size="sm" variant="outline">Verify</Button>
                            </Link>
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
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/domains/new">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6" />
                  <div>
                    <div className="font-medium">Add New Domain</div>
                    <div className="text-sm text-gray-600">List a new domain for sale</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <div>
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-gray-600">Track domain performance</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard">
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
      </div>
    </DashboardLayout>
  );
}
