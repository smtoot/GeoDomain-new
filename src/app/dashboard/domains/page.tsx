'use client';

import { useMemo, useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
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
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DashboardDomainsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading, isError, refetch } = trpc.domains.getMyDomains.useQuery({ limit: 50, status: statusFilter === 'all' ? undefined : statusFilter as any });
  const domains = data?.items ?? [];
  const filteredDomains = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return domains.filter((domain: any) => {
      const matchesSearch = !term ||
        domain.name.toLowerCase().includes(term) ||
        (domain.category?.toLowerCase?.().includes(term)) ||
        (domain.state?.toLowerCase?.().includes(term)) ||
        (domain.city?.toLowerCase?.().includes(term));
      const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [domains, searchTerm, statusFilter]);

  const totalViews = useMemo(() => {
    return domains.reduce((sum: number, d: any) => {
      const views = Array.isArray(d.analytics) ? d.analytics.reduce((s: number, day: any) => s + (day?.views || 0), 0) : 0;
      return sum + views;
    }, 0);
  }, [domains]);

  const totalValue = useMemo(() => {
    return domains.reduce((sum: number, d: any) => sum + Number(d.price || 0), 0);
  }, [domains]);

  const updateMutation = trpc.domains.update.useMutation({ onSuccess: () => refetch() });
  const deleteMutation = trpc.domains.delete.useMutation({ onSuccess: () => refetch() });
  const togglePauseMutation = trpc.domains.togglePause.useMutation({ onSuccess: () => refetch() });

  const handleTogglePause = (domain: { id: string; status: string; name: string }) => {
    togglePauseMutation.mutate({ id: domain.id });
  };

  const handleDelete = (domain: { id: string; name: string }) => {
    if (confirm(`Delete ${domain.name}? This cannot be undone.`)) {
      deleteMutation.mutate({ id: domain.id });
    }
  };

  return (
    <div className="container mx-auto p-6">
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
                <p className="text-2xl font-bold">—</p>
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
          {isError && (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load domains</h3>
              <p className="text-gray-600 mb-4">Please try again.</p>
              <Button onClick={() => refetch()}>Retry</Button>
            </div>
          )}
          {isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          )}
          {filteredDomains.length === 0 && !isLoading && !isError ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first domain'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/domains/new">
                  <Button>Add Your First Domain</Button>
                </Link>
              )}
            </div>
          ) : (!isLoading && !isError && (
            <div className="space-y-4">
              {filteredDomains.map((domain) => (
                <div key={domain.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-blue-600 truncate">{domain.name}</h3>
                      {getStatusBadge(domain.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                      <span>{domain.category}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{domain.city && `${domain.city}, `}{domain.state}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Listed {new Date(domain.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatPrice(domain.price)}</div>
                      {Array.isArray(domain.analytics) && (
                        <div className="text-sm text-gray-600">
                          {domain.analytics.reduce((s: number, day: any) => s + (day?.views || 0), 0)} views (30d)
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
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
                      <Button size="sm" variant="outline" onClick={() => handleTogglePause(domain)}>
                        {domain.status === 'PAUSED' ? 'Unpause' : 'Pause'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(domain)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8">
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
  );
}
