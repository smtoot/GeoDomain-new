'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StandardDashboardLayout } from '@/components/layout/StandardDashboardLayout';
import { WholesaleAnalyticsDashboard } from '@/components/admin/WholesaleAnalyticsDashboard';
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
  Users,
  Settings,
  BarChart3,
  Edit,
  Save,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminWholesalePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingConfig, setEditingConfig] = useState(false);
  const [configPrice, setConfigPrice] = useState(299);
  const [configActive, setConfigActive] = useState(true);

  // Fetch wholesale configuration
  const { data: config, refetch: refetchConfig } = trpc.wholesale.getConfig.useQuery();

  // Fetch wholesale statistics
  const { data: stats } = trpc.wholesale.getStats.useQuery();

  // Fetch admin wholesale domains
  const { 
    data: wholesaleData, 
    isLoading: wholesaleLoading, 
    error: wholesaleError,
    refetch: refetchWholesale 
  } = trpc.wholesale.getAdminWholesaleDomains.useQuery({
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    search: searchTerm || undefined,
    page: currentPage,
    limit: 20,
  });

  // Update configuration mutation
  const updateConfigMutation = trpc.wholesale.updateConfig.useMutation({
    onSuccess: () => {
      toast.success('Wholesale configuration updated successfully');
      setEditingConfig(false);
      refetchConfig();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update configuration');
    },
  });

  // Update domain status mutation
  const updateDomainStatusMutation = trpc.wholesale.updateDomainStatus.useMutation({
    onSuccess: () => {
      toast.success('Domain status updated successfully');
      refetchWholesale();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update domain status');
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

  const handleUpdateConfig = async () => {
    await updateConfigMutation.mutateAsync({
      price: configPrice,
      isActive: configActive,
    });
  };

  const handleUpdateDomainStatus = async (wholesaleDomainId: string, status: string, notes?: string) => {
    await updateDomainStatusMutation.mutateAsync({
      wholesaleDomainId,
      status: status as any,
      notes,
    });
  };

  // Filter domains based on search term
  const filteredDomains = wholesaleData?.domains || [];

  return (
    <StandardDashboardLayout
      title="Wholesale Management"
      description="Manage wholesale domains, configuration, and analytics"
      isLoading={wholesaleLoading}
      loadingText="Loading wholesale data..."
      error={wholesaleError as any}
    >
        <div className="space-y-6">
          <Tabs defaultValue="management" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="management">Domain Management</TabsTrigger>
              <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="management" className="space-y-6">
              {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Domains</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalDomains || 0}</p>
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
                    <p className="text-2xl font-bold text-green-600">{stats?.activeDomains || 0}</p>
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
                    <p className="text-2xl font-bold text-yellow-600">{stats?.pendingDomains || 0}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-blue-600">${stats?.totalRevenue || 0}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Wholesale Configuration
                  </CardTitle>
                  <CardDescription>
                    Manage global wholesale settings and pricing
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setEditingConfig(!editingConfig)}
                  variant={editingConfig ? "outline" : "default"}
                >
                  {editingConfig ? <XCircle className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
                  {editingConfig ? 'Cancel' : 'Edit'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {editingConfig ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Price ($)</label>
                      <Input
                        type="number"
                        value={configPrice}
                        onChange={(e) => setConfigPrice(Number(e.target.value))}
                        min="1"
                        max="10000"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-6">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={configActive}
                        onChange={(e) => setConfigActive(e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Marketplace Active
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={handleUpdateConfig}
                      disabled={updateConfigMutation.isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateConfigMutation.isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Price</p>
                    <p className="text-2xl font-bold text-gray-900">${config?.price || 299}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className={config?.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {config?.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Domains Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-red-600" />
                    Wholesale Domains
                  </CardTitle>
                  <CardDescription>
                    Manage and approve wholesale domain submissions
                  </CardDescription>
                </div>
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
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No domains have been submitted to the wholesale marketplace yet.'
                    }
                  </p>
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>Wholesale: ${config?.price || 299}</span>
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                              <div>
                                <p className="font-medium">Seller:</p>
                                <p>{wholesaleDomain.seller.name || wholesaleDomain.seller.email}</p>
                                {wholesaleDomain.seller.company && (
                                  <p className="text-xs text-gray-500">{wholesaleDomain.seller.company}</p>
                                )}
                              </div>
                              
                              {wholesaleDomain.buyer && (
                                <div>
                                  <p className="font-medium">Buyer:</p>
                                  <p>{wholesaleDomain.buyer.name || wholesaleDomain.buyer.email}</p>
                                </div>
                              )}
                            </div>
                            
                            {wholesaleDomain.domain.description && (
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                {wholesaleDomain.domain.description}
                              </p>
                            )}
                            
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
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button variant="outline" size="sm" asChild>
                              <a href={`/domains/${encodeURIComponent(wholesaleDomain.domain.name)}`} target="_blank">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </a>
                            </Button>
                            
                            {wholesaleDomain.status === 'PENDING_APPROVAL' && (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm"
                                  onClick={() => handleUpdateDomainStatus(wholesaleDomain.id, 'ACTIVE')}
                                  disabled={updateDomainStatusMutation.isLoading}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateDomainStatus(wholesaleDomain.id, 'REMOVED')}
                                  disabled={updateDomainStatusMutation.isLoading}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
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

          {/* Recent Sales */}
          {stats?.recentSales && stats.recentSales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Recent Sales
                </CardTitle>
                <CardDescription>
                  Latest wholesale domain sales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentSales.slice(0, 5).map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{sale.domainName}</p>
                        <p className="text-sm text-gray-600">
                          {sale.buyer.name || sale.buyer.email} → {sale.seller.name || sale.seller.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">${sale.price}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <WholesaleAnalyticsDashboard />
            </TabsContent>
        </Tabs>
      </div>
    </StandardDashboardLayout>
  );
}
