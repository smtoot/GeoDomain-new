'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Check,
  X,
  Clock,
  User,
  Globe,
  Calendar,
  AlertTriangle,
  TrendingUp,
  FileText,
  Users,
  Building
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminDealManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('all-deals');

  // All hooks must be called before any conditional returns
  const { data: dealsData, isLoading, error } = trpc.admin.deals.listActiveDeals.useQuery({
    status: statusFilter === 'ALL' ? undefined : (statusFilter as 'AGREED' | 'PAYMENT_PENDING' | 'TRANSFER_INITIATED' | 'COMPLETED' | 'DISPUTED'),
    search: searchTerm || undefined,
  }, {
    enabled: status === 'authenticated' && session?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role),
  });

  // Mock data for inquiry deals (in real implementation, this would come from tRPC)
  const inquiryDeals = [
    {
      id: '1',
      amount: 2500.00,
      status: 'NEGOTIATING',
      createdAt: new Date(),
      closedAt: null,
      inquiry: {
        id: '1',
        domain: {
          name: 'example.com',
        },
      },
      buyer: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      seller: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    },
    {
      id: '2',
      amount: 5000.00,
      status: 'AGREED',
      createdAt: new Date(),
      closedAt: null,
      inquiry: {
        id: '2',
        domain: {
          name: 'business.com',
        },
      },
      buyer: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
      },
      seller: {
        name: 'Alice Brown',
        email: 'alice@example.com',
      },
    },
  ];

  // Redirect if not admin - AFTER all hooks are called
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  const deals = dealsData?.deals || [];

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.inquiry.domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (deal.buyer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (deal.seller.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateDealStatus = async (dealId: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Deal status updated to ${newStatus}`);
      setSelectedDeal(null);
    } catch (error) {
      toast.error('Failed to update deal status');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AGREED': return 'default';
      case 'PAYMENT_PENDING': return 'secondary';
      case 'TRANSFER_INITIATED': return 'default';
      case 'COMPLETED': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'VERIFIED': return 'default';
      case 'COMPLETED': return 'default';
      case 'FAILED': return 'destructive';
      default: return 'outline';
    }
  };

  const getTransferStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'NOT_STARTED': return 'outline';
      case 'INITIATED': return 'secondary';
      case 'IN_PROGRESS': return 'default';
      case 'COMPLETED': return 'default';
      case 'FAILED': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEGOTIATING': return 'bg-yellow-100 text-yellow-800';
      case 'AGREED': return 'bg-blue-100 text-blue-800';
      case 'PAYMENT_PENDING': return 'bg-orange-100 text-orange-800';
      case 'PAYMENT_CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalValue = filteredDeals.reduce((sum, deal) => sum + Number(deal.agreedPrice), 0);

  return (
    <QueryErrorBoundary context="Admin Deals Management Page">
      <StandardPageLayout
        title="Deal Management"
        description="Monitor and manage all domain deals and transactions (merged)"
        isLoading={isLoading}
        loadingText="Loading deals..."
        error={error}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all-deals">All Deals</TabsTrigger>
            <TabsTrigger value="inquiry-deals">Inquiry Deals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-deals" className="space-y-6">
        {/* Admin Actions */}
        <div className="flex items-center gap-2 mb-6">
            <Badge variant="outline" className="text-sm">
              {filteredDeals.length} deals
            </Badge>
            <Badge variant="default" className="text-sm">
              ${totalValue.toLocaleString()} total value
            </Badge>
        </div>

        {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />

            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold">
                  {filteredDeals.filter(d => d.status === 'AGREED' || d.status === 'PAYMENT_PENDING' || d.status === 'TRANSFER_INITIATED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold">
                  {filteredDeals.filter(d => d.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Deals</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by domain, buyer, or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="AGREED">Agreed</SelectItem>
                  <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
                  <SelectItem value="TRANSFER_INITIATED">Transfer Initiated</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading deals...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Deals</h3>
            <p className="text-gray-600 mb-4">There was an error loading the deals. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      ) : filteredDeals.length > 0 ? (
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {deal.inquiry.domain.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Deal created on {formatDate(deal.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(deal.status)}>
                          {deal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">${deal.agreedPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Buyer:</span>
                        <span className="font-medium">{deal.buyer.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Seller:</span>
                        <span className="font-medium">{deal.seller.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Timeline:</span>
                        <span className="font-medium">{deal.timeline}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                      <p className="text-sm text-gray-600">{deal.adminNotes}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>Last updated: {formatDate(deal.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-48">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedDeal(deal)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Deal Details - {deal.inquiry.domain.name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Deal Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Deal Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Domain:</span>
                                <p className="font-medium">{deal.inquiry.domain.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Agreed Price:</span>
                                <p className="font-medium">${deal.agreedPrice.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Status:</span>
                                <Badge variant={getStatusBadgeVariant(deal.status)}>
                                  {deal.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-gray-600">Timeline:</span>
                                <p className="font-medium">{deal.timeline}</p>
                              </div>
                            </div>
                          </div>

                          {/* Parties */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Parties</h3>
                            <div className="grid grid-cols-1 gap-4">
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Buyer</h4>
                                <div className="text-sm">
                                  <p><span className="text-gray-600">Name:</span> {deal.buyer.name}</p>
                                  <p><span className="text-gray-600">Email:</span> {deal.buyer.email}</p>
                                </div>
                              </div>
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Seller</h4>
                                <div className="text-sm">
                                  <p><span className="text-gray-600">Name:</span> {deal.seller.name}</p>
                                  <p><span className="text-gray-600">Email:</span> {deal.seller.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Status Tracking */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Status Tracking</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">

                            </div>
                          </div>

                          {/* Admin Notes */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Admin Notes</h3>
                            <Textarea
                              value={deal.adminNotes || ''}
                              onChange={() => {}} // Read-only for now
                              placeholder="Add admin notes..."
                              rows={3}
                              readOnly
                            />
                          </div>

                          {/* Quick Actions */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateDealStatus(deal.id, 'COMPLETED')}
                                disabled={isProcessing || deal.status === 'COMPLETED'}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateDealStatus(deal.id, 'DISPUTED')}
                                disabled={isProcessing || deal.status === 'DISPUTED'}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel Deal
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your filters or search terms.'
                : 'No deals have been created yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
          </TabsContent>
          
          <TabsContent value="inquiry-deals" className="space-y-6">
            {/* Inquiry Deals Content */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Inquiry Deals</p>
                      <p className="text-2xl font-bold">{inquiryDeals.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Total Value</p>
                      <p className="text-2xl font-bold">
                        ${inquiryDeals.reduce((sum, deal) => sum + deal.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-600">Negotiating</p>
                      <p className="text-2xl font-bold">
                        {inquiryDeals.filter(d => d.status === 'NEGOTIATING').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Agreed</p>
                      <p className="text-2xl font-bold">
                        {inquiryDeals.filter(d => d.status === 'AGREED').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inquiry Deals Table */}
            <Card>
              <CardHeader>
                <CardTitle>Inquiry Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inquiryDeals.map((deal) => (
                    <div key={deal.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div>
                              <h3 className="font-medium text-gray-900">{deal.inquiry.domain.name}</h3>
                              <p className="text-sm text-gray-600">
                                {deal.buyer.name} → {deal.seller.name}
                              </p>
                            </div>
                            <Badge className={getStatusColor(deal.status)}>
                              {deal.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">${deal.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(deal.createdAt)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDeal(deal)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
