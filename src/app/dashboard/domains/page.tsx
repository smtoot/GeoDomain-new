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
  Clock
} from 'lucide-react';
import { getCategoryById, getGeographicScopeByValue } from "@/lib/categories";

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
    totalViews = 0;
  }

  let totalValue;
  try {
    totalValue = domains.reduce((sum: number, d: any) => {
      if (!d || typeof d !== 'object') return sum;
      return sum + Number(d.price || 0);
    }, 0);
  } catch (err) {
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
        alert(`Failed to delete domain: ${error.message}`);
      }
    });
    togglePauseMutation = trpc.domains.togglePause.useMutation({ 
      onSuccess: () => {
        safeRefetch();
      }
    });
    } catch (err) {
    // Create dummy mutations to prevent crashes
    updateMutation = { mutate: () => {}, mutateAsync: () => Promise.resolve() };
    deleteMutation = { mutate: () => {}, mutateAsync: () => Promise.resolve() };
    togglePauseMutation = { mutate: () => {}, mutateAsync: () => Promise.resolve() };
  }

  const handleTogglePause = (domain: { id: string; status: string; name: string }) => {
    try {
      togglePauseMutation.mutate({ id: domain.id });
    } catch (err) {
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
              {// Safety check for domain object
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
                  return (
                    <div key={`error-${index}`} className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <p className="text-red-600">Error rendering domain {index}</p>
                    </div>
                  );
                }
              })}
            </div>
          ))}
          {}
