'use client';

import { useState } from 'react';
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
  FileText,
  Calendar,
  AlertTriangle,
  Shield,
  Upload,
  Download
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Payment {
  id: string;
  deal: { 
    id: string; 
    domain: { name: string };
    buyer: { name: string; email: string };
    seller: { name: string; email: string };
    agreedPrice: number;
  };
  amount: number;
  status: string;
  paymentMethod: string;
  proofFile: string;
  submittedAt: string;
  verifiedAt?: string;
  rejectedAt?: string;
  adminNotes: string;
  rejectionReason?: string;
  transactionId: string;
  bankDetails: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
  };
}

interface PaymentVerificationProps {
  payments: Payment[];
  onVerifyPayment: (paymentId: string, action: string, notes?: string, rejectionReason?: string) => Promise<void>;
  isLoading?: boolean;
}

export default function PaymentVerification({
  payments,
  onVerifyPayment,
  isLoading = false
}: PaymentVerificationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.deal.domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.deal.buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.deal.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleVerification = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);
    try {
      let action: string;
      let notes = adminNotes;
      let rejectionReasonValue = rejectionReason;

      switch (verificationAction) {
        case 'approve':
          action = 'VERIFY';
          break;
        case 'reject':
          action = 'REJECT';
          rejectionReasonValue = rejectionReason;
          break;
        default:
          action = 'VERIFY';
      }

      await onVerifyPayment(
        selectedPayment.id,
        action,
        notes,
        rejectionReasonValue
      );
      
      setSelectedPayment(null);
      setAdminNotes('');
      setRejectionReason('');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 'secondary';
      case 'VERIFIED': return 'default';
      case 'REJECTED': return 'destructive';
      default: return 'outline';
    }
  };

  const getPaymentMethodBadgeVariant = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER': return 'default';
      case 'WIRE_TRANSFER': return 'secondary';
      case 'CHECK': return 'outline';
      default: return 'outline';
    }
  };

  const totalPending = filteredPayments.filter(p => p.status === 'PENDING_VERIFICATION').length;
  const totalVerified = filteredPayments.filter(p => p.status === 'VERIFIED').length;
  const totalRejected = filteredPayments.filter(p => p.status === 'REJECTED').length;
  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold">${totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{totalPending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold">{totalVerified}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <X className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{totalRejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Payments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by domain, user, or transaction ID..."
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
                  <SelectItem value="PENDING_VERIFICATION">Pending Verification</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
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

      {/* Payments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPayments.length > 0 ? (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {payment.deal.domain.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Submitted on {formatDate(payment.submittedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPaymentMethodBadgeVariant(payment.paymentMethod)}>
                          {payment.paymentMethod.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">${payment.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Buyer:</span>
                        <span className="font-medium">{payment.deal.buyer.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Seller:</span>
                        <span className="font-medium">{payment.deal.seller.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-medium">{payment.transactionId}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Bank Details:</h4>
                      <div className="text-sm text-gray-600">
                        <p>{payment.bankDetails.bankName} - Account: {payment.bankDetails.accountNumber}</p>
                        <p>Routing: {payment.bankDetails.routingNumber}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Admin Notes:</h4>
                      <p className="text-sm text-gray-600">{payment.adminNotes}</p>
                    </div>

                    {payment.rejectionReason && (
                      <div className="mb-4">
                        <h4 className="font-medium text-red-900 mb-2">Rejection Reason:</h4>
                        <p className="text-sm text-red-600">{payment.rejectionReason}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>Proof: {payment.proofFile}</span>
                      </div>
                      {payment.verifiedAt && (
                        <div className="flex items-center gap-1">
                          <span>Verified: {formatDate(payment.verifiedAt)}</span>
                        </div>
                      )}
                      {payment.rejectedAt && (
                        <div className="flex items-center gap-1">
                          <span>Rejected: {formatDate(payment.rejectedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-48">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedPayment(payment)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Payment - {payment.deal.domain.name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Payment Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Payment Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Domain:</span>
                                <p className="font-medium">{payment.deal.domain.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Amount:</span>
                                <p className="font-medium">${payment.amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Payment Method:</span>
                                <Badge variant={getPaymentMethodBadgeVariant(payment.paymentMethod)}>
                                  {payment.paymentMethod.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-gray-600">Transaction ID:</span>
                                <p className="font-medium">{payment.transactionId}</p>
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
                                  <p><span className="text-gray-600">Name:</span> {payment.deal.buyer.name}</p>
                                  <p><span className="text-gray-600">Email:</span> {payment.deal.buyer.email}</p>
                                </div>
                              </div>
                              <div className="border rounded-lg p-4">
                                <h4 className="font-medium mb-2">Seller</h4>
                                <div className="text-sm">
                                  <p><span className="text-gray-600">Name:</span> {payment.deal.seller.name}</p>
                                  <p><span className="text-gray-600">Email:</span> {payment.deal.seller.email}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bank Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Bank Details</h3>
                            <div className="border rounded-lg p-4">
                              <div className="text-sm space-y-2">
                                <p><span className="text-gray-600">Bank:</span> {payment.bankDetails.bankName}</p>
                                <p><span className="text-gray-600">Account:</span> {payment.bankDetails.accountNumber}</p>
                                <p><span className="text-gray-600">Routing:</span> {payment.bankDetails.routingNumber}</p>
                              </div>
                            </div>
                          </div>

                          {/* Proof File */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Payment Proof</h3>
                            <div className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-gray-500" />
                                  <span className="text-sm">{payment.proofFile}</span>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Verification Actions */}
                          {payment.status === 'PENDING_VERIFICATION' && (
                            <div className="space-y-4">
                              <h3 className="font-semibold">Verification Action</h3>
                              
                              <div className="space-y-3">
                                <div className="flex gap-2">
                                  <Button
                                    variant={verificationAction === 'approve' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setVerificationAction('approve')}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Verify Payment
                                  </Button>
                                  <Button
                                    variant={verificationAction === 'reject' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setVerificationAction('reject')}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject Payment
                                  </Button>
                                </div>

                                {/* Admin Notes */}
                                <div>
                                  <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                                  <Textarea
                                    id="adminNotes"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add any notes about this payment..."
                                    rows={3}
                                  />
                                </div>

                                {/* Rejection Reason */}
                                {verificationAction === 'reject' && (
                                  <div>
                                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                                    <Textarea
                                      id="rejectionReason"
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Explain why this payment was rejected..."
                                      rows={3}
                                      required
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {payment.status === 'PENDING_VERIFICATION' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => setSelectedPayment(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleVerification}
                                disabled={isProcessing}
                              >
                                {isProcessing ? 'Processing...' : 'Submit Decision'}
                              </Button>
                            </div>
                          )}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL' 
                ? 'Try adjusting your filters or search terms.'
                : 'No payments have been submitted yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
