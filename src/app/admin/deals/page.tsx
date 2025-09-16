'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  DollarSign, 
  Search, 
  Eye,
  Check,
  Clock,
  Globe,
  AlertTriangle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminDealManagementPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // All hooks must be called before any conditional returns
  const { data: dealsData, isLoading } = trpc.admin.deals.listActiveDeals.useQuery({
    status: statusFilter === 'ALL' ? undefined : (statusFilter as 'AGREED' | 'PAYMENT_PENDING' | 'TRANSFER_INITIATED' | 'COMPLETED' | 'DISPUTED'),
    search: searchTerm || undefined,
  }, {
    enabled: status === 'authenticated' && session?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as { role: string }).role),
  });

  // Show loading state while session is being validated
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

  const deals = dealsData?.deals || [];

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.inquiry.domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (deal.buyer.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (deal.seller.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AGREED': return 'default';
      case 'PAYMENT_PENDING': return 'secondary';
      case 'TRANSFER_INITIATED': return 'default';
      case 'COMPLETED': return 'default';
      case 'DISPUTED': return 'destructive';
      default: return 'outline';
    }
  };


  const totalValue = filteredDeals.reduce((sum, deal) => sum + deal.agreedPrice, 0);

  return (
    <QueryErrorBoundary context="Admin Deals Management Page">
      <StandardPageLayout
        title="Deal Management"
        description="Monitor and manage all domain deals and transactions"
        isLoading={isLoading}
        loadingText="Loading deals..."
      >
        <div className="space-y-6">
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
                  <div>
                    <p className="text-sm text-gray-600">Active Deals</p>
                    <p className="text-2xl font-bold">{filteredDeals.filter(d => d.status !== 'COMPLETED').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-gray-600">Pending Payment</p>
                    <p className="text-2xl font-bold">{filteredDeals.filter(d => d.status === 'PAYMENT_PENDING').length}</p>
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
                    <p className="text-2xl font-bold">{filteredDeals.filter(d => d.status === 'COMPLETED').length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search deals by domain, buyer, or seller..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="AGREED">Agreed</SelectItem>
                  <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
                  <SelectItem value="TRANSFER_INITIATED">Transfer Initiated</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Deals List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Deals
              </CardTitle>
              <CardDescription>
                Manage and monitor all domain deals and transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredDeals.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No deals found matching your criteria.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDeals.map((deal) => (
                    <div key={deal.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Globe className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{deal.inquiry.domain.name}</span>
                            <Badge variant={getStatusBadgeVariant(deal.status)}>
                              {deal.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Buyer:</strong> {deal.buyer.name} ({deal.buyer.email})</p>
                            <p><strong>Seller:</strong> {deal.seller.name} ({deal.seller.email})</p>
                            <p><strong>Amount:</strong> ${deal.agreedPrice.toLocaleString()}</p>
                            <p><strong>Payment Method:</strong> {deal.paymentMethod.replace('_', ' ')}</p>
                            <p><strong>Created:</strong> {formatDate(deal.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Deal Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Domain</Label>
                                    <p className="text-sm text-gray-600">{deal.inquiry.domain.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Badge variant={getStatusBadgeVariant(deal.status)}>
                                      {deal.status.replace('_', ' ')}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Amount</Label>
                                    <p className="text-sm text-gray-600">${deal.agreedPrice.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Payment Method</Label>
                                    <p className="text-sm text-gray-600">{deal.paymentMethod.replace('_', ' ')}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Payment Instructions</Label>
                                  <p className="text-sm text-gray-600">{deal.paymentInstructions}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Terms</Label>
                                  <p className="text-sm text-gray-600">{deal.terms}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Timeline</Label>
                                  <p className="text-sm text-gray-600">{deal.timeline}</p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}