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
  FileText,
  Calendar,
  AlertTriangle,
  Shield,
  Upload,
  Download
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminPaymentVerificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [verificationAction, setVerificationAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  // Mock data for payments - in real implementation, this would come from tRPC
  const mockPayments = [
    {
      id: '1',
      deal: { 
        id: 'deal1', 
        domain: { name: 'example.com' },
        buyer: { name: 'John Buyer', email: 'john@buyer.com' },
        seller: { name: 'Jane Seller', email: 'jane@seller.com' },
        agreedPrice: 5000
      },
      amount: 5000,
      status: 'PENDING_VERIFICATION',
      paymentMethod: 'BANK_TRANSFER',
      proofFile: 'payment_proof_1.pdf',
      submittedAt: new Date('2024-01-20'),
      adminNotes: 'Payment proof submitted, needs verification',
      transactionId: 'TXN123456',
      bankDetails: {
        bankName: 'Chase Bank',
        accountNumber: '****1234',
        routingNumber: '021000021'
      }
    },
    {
      id: '2',
      deal: { 
        id: 'deal2', 
        domain: { name: 'startup.io' },
        buyer: { name: 'Bob Startup', email: 'bob@startup.com' },
        seller: { name: 'Alice Domain', email: 'alice@domain.com' },
        agreedPrice: 8000
      },
      amount: 8000,
      status: 'VERIFIED',
      paymentMethod: 'WIRE_TRANSFER',
      proofFile: 'payment_proof_2.pdf',
      submittedAt: new Date('2024-01-18'),
      verifiedAt: new Date('2024-01-19'),
      adminNotes: 'Payment verified successfully',
      transactionId: 'TXN789012',
      bankDetails: {
        bankName: 'Wells Fargo',
        accountNumber: '****5678',
        routingNumber: '121000248'
      }
    },
    {
      id: '3',
      deal: { 
        id: 'deal3', 
        domain: { name: 'business.net' },
        buyer: { name: 'Carol Corp', email: 'carol@corp.com' },
        seller: { name: 'David Business', email: 'david@business.com' },
        agreedPrice: 3000
      },
      amount: 3000,
      status: 'REJECTED',
      paymentMethod: 'CHECK',
      proofFile: 'payment_proof_3.pdf',
      submittedAt: new Date('2024-01-15'),
      rejectedAt: new Date('2024-01-16'),
      adminNotes: 'Payment proof unclear, check bounced',
      rejectionReason: 'Payment proof image is blurry and unreadable',
      transactionId: 'TXN345678',
      bankDetails: {
        bankName: 'Bank of America',
        accountNumber: '****9012',
        routingNumber: '026009593'
      }
    },
  ];

  const filteredPayments = mockPayments.filter(payment => {
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Payment ${verificationAction === 'approve' ? 'verified' : 'rejected'} successfully`);
      setSelectedPayment(null);
      setAdminNotes('');
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to verify payment');
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Verification</h1>
            <p className="text-gray-600">Verify manual payments submitted by users</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredPayments.length} payments
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {totalPending} pending
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
      <Card className="mb-6">
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
      {filteredPayments.length > 0 ? (
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
