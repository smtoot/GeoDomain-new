'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  FileText
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminDealManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  // Mock data for deals - in real implementation, this would come from tRPC
  const mockDeals = [
    {
      id: '1',
      domain: { name: 'example.com', id: 'domain1' },
      buyer: { name: 'John Buyer', email: 'john@buyer.com' },
      seller: { name: 'Jane Seller', email: 'jane@seller.com' },
      agreedPrice: 5000,
      status: 'AGREED',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      paymentStatus: 'PENDING',
      transferStatus: 'NOT_STARTED',
      adminNotes: 'Deal looks good, waiting for payment',
      timeline: '30 days',
      commission: 500,
    },
    {
      id: '2',
      domain: { name: 'startup.io', id: 'domain2' },
      buyer: { name: 'Bob Startup', email: 'bob@startup.com' },
      seller: { name: 'Alice Domain', email: 'alice@domain.com' },
      agreedPrice: 8000,
      status: 'PAYMENT_PENDING',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      paymentStatus: 'VERIFIED',
      transferStatus: 'INITIATED',
      adminNotes: 'Payment received, transfer in progress',
      timeline: '14 days',
      commission: 800,
    },
    {
      id: '3',
      domain: { name: 'business.net', id: 'domain3' },
      buyer: { name: 'Carol Corp', email: 'carol@corp.com' },
      seller: { name: 'David Business', email: 'david@business.com' },
      agreedPrice: 3000,
      status: 'COMPLETED',
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-25'),
      paymentStatus: 'COMPLETED',
      transferStatus: 'COMPLETED',
      adminNotes: 'Deal completed successfully',
      timeline: '20 days',
      commission: 300,
    },
  ];

  const filteredDeals = mockDeals.filter(deal => {
    const matchesSearch = deal.domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.seller.name.toLowerCase().includes(searchTerm.toLowerCase());
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

  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.agreedPrice, 0);
  const totalCommission = filteredDeals.reduce((sum, deal) => sum + deal.commission, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Deal Management</h1>
            <p className="text-gray-600">Monitor and manage active deals in the marketplace</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredDeals.length} deals
            </Badge>
            <Badge variant="default" className="text-sm">
              ${totalValue.toLocaleString()} total value
            </Badge>
          </div>
        </div>
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
              <div>
                <p className="text-sm text-gray-600">Commission</p>
                <p className="text-2xl font-bold">${totalCommission.toLocaleString()}</p>
              </div>
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
                  {filteredDeals.filter(d => d.status !== 'COMPLETED' && d.status !== 'CANCELLED').length}
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
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
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
      {filteredDeals.length > 0 ? (
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {deal.domain.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Deal created on {formatDate(deal.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(deal.status)}>
                          {deal.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPaymentStatusBadgeVariant(deal.paymentStatus)}>
                          Payment: {deal.paymentStatus}
                        </Badge>
                        <Badge variant={getTransferStatusBadgeVariant(deal.transferStatus)}>
                          Transfer: {deal.transferStatus.replace('_', ' ')}
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
                        <span>Commission: ${deal.commission}</span>
                      </div>
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
                          <DialogTitle>Deal Details - {deal.domain.name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Deal Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Deal Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Domain:</span>
                                <p className="font-medium">{deal.domain.name}</p>
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
                              <div>
                                <span className="text-gray-600">Payment Status:</span>
                                <Badge variant={getPaymentStatusBadgeVariant(deal.paymentStatus)} className="ml-2">
                                  {deal.paymentStatus}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-gray-600">Transfer Status:</span>
                                <Badge variant={getTransferStatusBadgeVariant(deal.transferStatus)} className="ml-2">
                                  {deal.transferStatus.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Admin Notes */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Admin Notes</h3>
                            <Textarea
                              value={deal.adminNotes}
                              placeholder="Add admin notes..."
                              rows={3}
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
                                onClick={() => handleUpdateDealStatus(deal.id, 'CANCELLED')}
                                disabled={isProcessing || deal.status === 'CANCELLED'}
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
    </div>
  );
}
