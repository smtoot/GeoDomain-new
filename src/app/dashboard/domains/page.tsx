'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { DashboardLayout } from "@/components/layout/main-layout";
import { QueryErrorBoundary } from "@/components/error";
import { DashboardGuard } from "@/components/auth/DashboardGuard";
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
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

export default function DomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'BUYER' | 'SELLER' | 'ADMIN' | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check user role and redirect if not a seller
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      setUserRole(role);
      
      // Redirect buyers to their saved domains page instead of seller domains
      if (role === 'BUYER') {
        router.push('/dashboard/saved');
        return;
      }
      
      // Redirect admins to admin dashboard
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        router.push('/admin');
        return;
      }
    }
  }, [session, status, router]);

  // Show loading while checking authentication or until client-side
  if (status === 'loading' || userRole === null || !isClient) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading while redirecting
  if (userRole === 'BUYER' || userRole === 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Only run query for sellers
  const shouldRunQuery = isClient && userRole === 'SELLER';
  
  if (!shouldRunQuery) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Initializing...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardGuard allowedRoles={['SELLER']}>
      <QueryErrorBoundary context="Seller Domains Page">
        <DomainsPageContent 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      </QueryErrorBoundary>
    </DashboardGuard>
  );
}

function DomainsPageContent({ 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter 
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}) {
  // Fetch domains with error handling
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = trpc.domains.getMyDomains.useQuery(
    { 
      limit: 50, 
      status: statusFilter === 'all' || statusFilter === 'pending' ? undefined : statusFilter as any 
    },
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: false,
    }
  );

  const domains = data?.data ?? [];

  // Filter domains based on search term
  const filteredDomains = domains.filter(domain => 
    domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    domain.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalViews = domains.reduce((sum, domain) => sum + (domain.views || 0), 0);
  const totalValue = domains.reduce((sum, domain) => sum + (domain.price || 0), 0);
  const pendingDomains = domains.filter(domain => domain.status === 'PENDING_VERIFICATION').length;

  if (isError) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Domains</h2>
            <p className="text-gray-600 mb-4">
              There was an error loading your domains. Please try again.
            </p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Domains</h1>
          <p className="text-gray-600 mt-2">Manage your domain listings and track their performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Domains</p>
                  <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingDomains}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'VERIFIED' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('VERIFIED')}
              size="sm"
            >
              Verified
            </Button>
            <Button
              variant={statusFilter === 'PENDING_VERIFICATION' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('PENDING_VERIFICATION')}
              size="sm"
            >
              Pending
            </Button>
          </div>
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
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading domains...</p>
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="text-center py-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Domains Found</h3>
                <p className="text-gray-600 mb-4">
                  You haven't listed any domains yet. Start by adding your first domain.
                </p>
                <Link href="/domains/new-improved">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Domain
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDomains.map((domain) => (
                  <div key={domain.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                        {getStatusBadge(domain.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {formatPrice(domain.price)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {domain.state || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {domain.category || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {domain.views || 0} views
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4 sm:mt-0">
                      <Link href={`/domains/${domain.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/domains/${domain.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <Link href="/domains/new-improved">
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

                <Link href="/dashboard/inquiries">
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
