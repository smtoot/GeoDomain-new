'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardGuard } from '@/components/auth/DashboardGuard';
import { DashboardLayout } from '@/components/layout/main-layout';
import { QueryErrorBoundary } from '@/components/error';
import { WholesaleDomainModal } from '@/components/wholesale/WholesaleDomainModal';
import { 
  ShoppingCart, 
  Package, 
  Search, 
  Filter,
  DollarSign,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  TrendingUp,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function WholesaleManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'BUYER' | 'SELLER' | 'ADMIN' | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);

  // Check user role and redirect if not a seller
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      setUserRole(role);
      
      // Redirect buyers to their saved domains page (they don't manage wholesale)
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

  // Show loading while checking authentication
  if (status === 'loading' || userRole === null) {
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

  // Fetch wholesale configuration
  const { data: config } = trpc.wholesaleConfig.getConfig.useQuery();

  // Fetch seller's wholesale domains
  const { 
    data: wholesaleData, 
    isLoading: wholesaleLoading, 
    error: wholesaleError,
    refetch: refetchWholesale 
  } = trpc.wholesale.getMyWholesaleDomains.useQuery({
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    page: currentPage,
    limit: 20,
  }, {
    enabled: true, // Let DashboardGuard handle authentication
  });

  // Remove domain from wholesale mutation
  const removeFromWholesaleMutation = trpc.wholesale.removeDomain.useMutation({
    onSuccess: () => {
      toast.success('Domain removed from wholesale marketplace');
      refetchWholesale();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove domain from wholesale');
    },
  });

  const getStatusBadge = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING_APPROVAL':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'SOLD':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'REMOVED':
        return <X className="h-4 w-4 text-gray-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleRemoveFromWholesale = async (wholesaleDomainId: string) => {
    if (confirm('Are you sure you want to remove this domain from the wholesale marketplace?')) {
      await removeFromWholesaleMutation.mutateAsync({
        wholesaleDomainId,
      });
    }
  };

  // Filter domains based on search term
  const filteredDomains = wholesaleData?.domains?.filter((wholesaleDomain) => {
    if (!searchTerm) return true;
    return wholesaleDomain.domain.name.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  // Calculate statistics
  const stats = {
    total: wholesaleData?.pagination.total || 0,
    active: wholesaleData?.domains?.filter(d => d.status === 'ACTIVE').length || 0,
    pending: wholesaleData?.domains?.filter(d => d.status === 'PENDING_APPROVAL').length || 0,
    sold: wholesaleData?.domains?.filter(d => d.status === 'SOLD').length || 0,
  };

  // Show loading state
  if (wholesaleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wholesale domains...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (wholesaleError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Wholesale Page</h1>
          <p className="text-gray-600 mb-4">An unexpected error occurred</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardGuard>
      <QueryErrorBoundary>
        <DashboardLayout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Wholesale Domain Management</h1>
          <p className="text-gray-600 mt-2">
            Manage your domains in the wholesale marketplace
          </p>
        </div>

        <div className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Domains</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sold</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.sold}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Header with Actions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-red-600" />
                    Wholesale Domains
                  </CardTitle>
                  <CardDescription>
                    Manage your domains in the wholesale marketplace at ${config?.wholesalePrice || 299} each
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search domains..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SOLD">Sold</SelectItem>
                    <SelectItem value="REMOVED">Removed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Domains List */}
              {filteredDomains.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'No domains found' : 'No wholesale domains'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Add your verified domains to the wholesale marketplace for quick sales.'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add Your First Domain
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDomains.map((wholesaleDomain) => (
                    <Card key={wholesaleDomain.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              {getStatusIcon(wholesaleDomain.status)}
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {wholesaleDomain.domain.name}
                              </h3>
                              {getStatusBadge(wholesaleDomain.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>Wholesale: ${config?.wholesalePrice || 299}</span>
                              </div>
                              
                              {wholesaleDomain.domain.category && (
                                <div className="flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  <span>{wholesaleDomain.domain.category}</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>
                                  {wholesaleDomain.domain.city && wholesaleDomain.domain.state 
                                    ? `${wholesaleDomain.domain.city}, ${wholesaleDomain.domain.state}`
                                    : wholesaleDomain.domain.state || 'National'
                                  }
                                </span>
                              </div>
                            </div>
                            
                            {wholesaleDomain.domain.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {wholesaleDomain.domain.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                              <Clock className="h-3 w-3" />
                              <span>
                                {wholesaleDomain.status === 'SOLD' && wholesaleDomain.soldAt
                                  ? `Sold ${new Date(wholesaleDomain.soldAt).toLocaleDateString()}`
                                  : `Added ${new Date(wholesaleDomain.addedAt).toLocaleDateString()}`
                                }
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/domains/${encodeURIComponent(wholesaleDomain.domain.name)}`} target="_blank">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                            
                            {(wholesaleDomain.status === 'PENDING_APPROVAL' || wholesaleDomain.status === 'ACTIVE') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleRemoveFromWholesale(wholesaleDomain.id)}
                                disabled={removeFromWholesaleMutation.isLoading}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {wholesaleData && wholesaleData.pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {wholesaleData.pagination.totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(wholesaleData.pagination.totalPages, prev + 1))}
                    disabled={currentPage === wholesaleData.pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Domain Modal */}
        {showAddModal && (
          <WholesaleDomainModal 
            onClose={() => setShowAddModal(false)}
            onSuccess={() => {
              setShowAddModal(false);
              refetchWholesale();
            }}
          />
        )}
          </div>
        </DashboardLayout>
      </QueryErrorBoundary>
    </DashboardGuard>
  );
}
