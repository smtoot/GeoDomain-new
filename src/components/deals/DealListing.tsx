'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Eye,
  FileText,
  User,
  Globe,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';

interface Deal {
  id: string;
  inquiry: {
    buyerName: string;
    buyerEmail: string;
    domain: {
      id: string;
      name: string;
      logoUrl?: string;
    };
  };
  buyer: {
    id: string;
    name: string;
    email: string;
  };
  seller: {
    id: string;
    name: string;
    email: string;
  };
  agreedPrice: number;
  currency: string;
  paymentMethod: string;
  status: string;
  timeline: string;
  createdAt: string;
  updatedAt: string;
  agreedDate?: string;
  paymentConfirmedDate?: string;
  transferInitiatedDate?: string;
  completedDate?: string;
}

interface DealListingProps {
  deals: Deal[];
  onViewDeal: (dealId: string) => void;
  onUpdateStatus?: (dealId: string, status: string) => Promise<void>;
  isLoading?: boolean;
  userRole?: 'BUYER' | 'SELLER' | 'ADMIN';
}

export default function DealListing({
  deals,
  onViewDeal,
  onUpdateStatus,
  isLoading = false,
  userRole = 'BUYER'
}: DealListingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = 
      deal.inquiry.domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.inquiry.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.seller.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    switch (sortBy) {
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'agreedPrice':
        return b.agreedPrice - a.agreedPrice;
      case 'status':
        return a.status.localeCompare(b.status);
      default:
        return 0;
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AGREED': return 'default';
      case 'PAYMENT_PENDING': return 'secondary';
      case 'PAYMENT_CONFIRMED': return 'default';
      case 'TRANSFER_INITIATED': return 'default';
      case 'COMPLETED': return 'default';
      case 'DISPUTED': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AGREED': return <CheckCircle className="h-4 w-4" />;
      case 'PAYMENT_PENDING': return <Clock className="h-4 w-4" />;
      case 'PAYMENT_CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'TRANSFER_INITIATED': return <TrendingUp className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'DISPUTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'ESCROW_COM': return 'Escrow.com';
      case 'PAYPAL': return 'PayPal';
      case 'WIRE_TRANSFER': return 'Wire Transfer';
      case 'CRYPTO': return 'Cryptocurrency';
      case 'OTHER': return 'Other';
      default: return method;
    }
  };

  const getNextAction = (deal: Deal) => {
    switch (deal.status) {
      case 'AGREED':
        return userRole === 'BUYER' ? 'Complete Payment' : 'Wait for Payment';
      case 'PAYMENT_PENDING':
        return userRole === 'BUYER' ? 'Upload Payment Proof' : 'Wait for Payment Confirmation';
      case 'PAYMENT_CONFIRMED':
        return userRole === 'SELLER' ? 'Initiate Transfer' : 'Wait for Transfer';
      case 'TRANSFER_INITIATED':
        return 'Transfer in Progress';
      case 'COMPLETED':
        return 'Deal Completed';
      case 'DISPUTED':
        return 'Dispute Resolution';
      default:
        return 'Review Deal';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search deals by domain, buyer, or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AGREED">Agreed</SelectItem>
              <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
              <SelectItem value="PAYMENT_CONFIRMED">Payment Confirmed</SelectItem>
              <SelectItem value="TRANSFER_INITIATED">Transfer Initiated</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DISPUTED">Disputed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Created</SelectItem>
              <SelectItem value="agreedPrice">Price</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deal Cards */}
      <div className="space-y-4">
        {sortedDeals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Try adjusting your search or filters'
                  : 'You don\'t have any deals yet'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {deal.inquiry.domain.logoUrl ? (
                      <img
                        src={deal.inquiry.domain.logoUrl}
                        alt={`${deal.inquiry.domain.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Globe className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {deal.inquiry.domain.name}
                        </h3>
                        <Badge variant={getStatusBadgeVariant(deal.status)} className="flex items-center gap-1">
                          {getStatusIcon(deal.status)}
                          {deal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {userRole === 'BUYER' ? deal.seller.name : deal.buyer.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(deal.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatPrice(deal.agreedPrice, deal.currency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getPaymentMethodLabel(deal.paymentMethod)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Timeline</div>
                    <div className="text-sm text-gray-600">{deal.timeline}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Next Action</div>
                    <div className="text-sm text-gray-600">{getNextAction(deal)}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-700">Last Updated</div>
                    <div className="text-sm text-gray-600">{formatDate(deal.updatedAt)}</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Deal ID: {deal.id.slice(-8)}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDeal(deal.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
