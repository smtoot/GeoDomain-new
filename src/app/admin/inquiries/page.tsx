'use client';

import { useState } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  Check, 
  X, 
  Edit, 
  Calendar, 
  DollarSign, 
  User, 
  Building,
  Clock
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminInquiryModerationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'request-changes'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestedChanges, setRequestedChanges] = useState<string[]>(['']);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  const { data: pendingInquiriesResponse, isLoading, error, refetch  } = trpc.inquiries.getPendingInquiries.useQuery({
    limit: 50,
    type: 'inquiries',
  }) as { data: { items: any[] } | undefined, isLoading: boolean, error: any, refetch: () => void };

  // Extract data from tRPC response structure
  const pendingInquiries = pendingInquiriesResponse?.json || pendingInquiriesResponse;

  const moderateInquiryMutation = trpc.inquiries.moderateInquiry.useMutation({
    onSuccess: () => {
      toast.success('Inquiry moderated successfully');
      setSelectedInquiry(null);
      setAdminNotes('');
      setRejectionReason('');
      setRequestedChanges(['']);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleModeration = async () => {
    if (!selectedInquiry) return;

    let action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';
    const notes = adminNotes;
    let rejectionReasonValue = rejectionReason;
    const requestedChangesValue = requestedChanges.filter(change => change.trim());

    switch (moderationAction) {
      case 'approve':
        action = 'APPROVE';
        break;
      case 'reject':
        action = 'REJECT';
        if (!rejectionReason.trim()) {
          toast.error('Rejection reason is required');
          return;
        }
        rejectionReasonValue = rejectionReason;
        break;
      case 'request-changes':
        action = 'REQUEST_CHANGES';
        if (requestedChangesValue.length === 0 || requestedChangesValue.every(change => !change.trim())) {
          toast.error('At least one requested change is required');
          return;
        }
        break;
    }

    setIsProcessing(true);
    try {
      await moderateInquiryMutation.mutateAsync({
        inquiryId: selectedInquiry.id,
        action,
        adminNotes: notes,
        rejectionReason: rejectionReasonValue,
        requestedChanges: requestedChangesValue,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addRequestedChange = () => {
    setRequestedChanges([...requestedChanges, '']);
  };

  const removeRequestedChange = (index: number) => {
    setRequestedChanges(requestedChanges.filter((_, i) => i !== index));
  };

  const updateRequestedChange = (index: number, value: string) => {
    const newChanges = [...requestedChanges];
    newChanges[index] = value;
    setRequestedChanges(newChanges);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Inquiries</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Inquiry Moderation</h1>
        <p className="text-gray-600">Review and moderate pending domain inquiries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold">{pendingInquiries?.items?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inquiries List */}
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
      ) : pendingInquiries?.items && pendingInquiries.items.length > 0 ? (
        <div className="space-y-4">
          {pendingInquiries.items.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {inquiry.domain.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Submitted on {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                      <Badge variant="secondary">Pending Review</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Buyer:</span>
                        <span className="font-medium">{inquiry.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Budget:</span>
                        <span className="font-medium">{inquiry.budgetRange}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Timeline:</span>
                        <span className="font-medium">{inquiry.timeline || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Company:</span>
                        <span className="font-medium">{inquiry.buyerCompany || 'Not specified'}</span>
                      </div>
                    </div>

                    {/* Anonymous Buyer ID */}
                    {inquiry.anonymousBuyerId && (
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Anonymous Buyer ID:</span>
                        <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                          {inquiry.anonymousBuyerId}
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Intended Use:</h4>
                      <p className="text-sm text-gray-600">{inquiry.intendedUse}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Message:</h4>
                      <p className="text-sm text-gray-600">{inquiry.message}</p>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Contact: {inquiry.buyerEmail}</span>
                      {inquiry.buyerPhone && <span>• {inquiry.buyerPhone}</span>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-48">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Inquiry - {inquiry.domain.name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Inquiry Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Inquiry Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Buyer:</span>
                                <p className="font-medium">{inquiry.buyerName}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <p className="font-medium">{inquiry.buyerEmail}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Budget:</span>
                                <p className="font-medium">{inquiry.budgetRange}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Timeline:</span>
                                <p className="font-medium">{inquiry.timeline || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 text-sm">Intended Use:</span>
                              <p className="text-sm mt-1">{inquiry.intendedUse}</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 text-sm">Message:</span>
                              <p className="text-sm mt-1">{inquiry.message}</p>
                            </div>
                          </div>

                          {/* Moderation Actions */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Moderation Action</h3>
                            
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Button
                                  variant={moderationAction === 'approve' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setModerationAction('approve')}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant={moderationAction === 'reject' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setModerationAction('reject')}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  variant={moderationAction === 'request-changes' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setModerationAction('request-changes')}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Request Changes
                                </Button>
                              </div>

                              {/* Admin Notes */}
                              <div>
                                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                                <Textarea
                                  id="adminNotes"
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add any notes about this inquiry..."
                                  rows={3}
                                />
                              </div>

                              {/* Rejection Reason */}
                              {moderationAction === 'reject' && (
                                <div>
                                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                                  <Textarea
                                    id="rejectionReason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this inquiry was rejected..."
                                    rows={3}
                                    required
                                  />
                                </div>
                              )}

                              {/* Requested Changes */}
                              {moderationAction === 'request-changes' && (
                                <div>
                                  <Label>Requested Changes *</Label>
                                  <div className="space-y-2">
                                    {requestedChanges.map((change, index) => (
                                      <div key={index} className="flex gap-2">
                                        <Input
                                          value={change}
                                          onChange={(e) => updateRequestedChange(index, e.target.value)}
                                          placeholder={`Change ${index + 1}`}
                                        />
                                        {requestedChanges.length > 1 && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeRequestedChange(index)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={addRequestedChange}
                                    >
                                      Add Another Change
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedInquiry(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleModeration}
                              disabled={isProcessing}
                            >
                              {isProcessing ? 'Processing...' : 'Submit Decision'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
              <Check className="h-12 w-12 text-green-500 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending inquiries</h3>
            <p className="text-gray-600">
              All inquiries have been reviewed and processed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
