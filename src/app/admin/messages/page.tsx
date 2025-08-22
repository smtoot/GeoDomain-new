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
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Eye, 
  Check, 
  X, 
  Edit, 
  User, 
  Globe,
  MessageSquare
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminMessageModerationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'edit'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  const { data: pendingMessages, isLoading, error, refetch } = trpc.inquiries.getPendingInquiries.useQuery({
    limit: 50,
    type: 'messages',
  }) as { data: { items: any[] } | undefined, isLoading: boolean, error: any, refetch: () => void };

  const moderateMessageMutation = trpc.inquiries.moderateMessage.useMutation({
    onSuccess: () => {
      toast.success('Message moderated successfully');
      setSelectedMessage(null);
      setAdminNotes('');
      setRejectionReason('');
      setEditedContent('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleModeration = async () => {
    if (!selectedMessage) return;

    let action: 'APPROVE' | 'REJECT' | 'EDIT';
    let notes = adminNotes;
    let rejectionReasonValue = rejectionReason;
    let editedContentValue = editedContent;

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
      case 'edit':
        action = 'EDIT';
        if (!editedContent.trim()) {
          toast.error('Edited content is required');
          return;
        }
        editedContentValue = editedContent;
        break;
    }

    setIsProcessing(true);
    try {
      await moderateMessageMutation.mutateAsync({
        messageId: selectedMessage.id,
        action,
        adminNotes: notes,
        rejectionReason: rejectionReasonValue,
        editedContent: editedContentValue,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Messages</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Message Moderation</h1>
        <p className="text-gray-600">Review and moderate pending messages between buyers and sellers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Pending Messages</p>
                <p className="text-2xl font-bold">{pendingMessages?.items?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Messages List */}
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
      ) : pendingMessages?.items && pendingMessages.items.length > 0 ? (
        <div className="space-y-4">
          {pendingMessages.items.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          Message from {message.sender.name || message.sender.email}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Sent on {formatDate(message.sentDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {message.senderType}
                        </Badge>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Sender:</span>
                        <span className="font-medium">{message.sender.name || message.sender.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Domain:</span>
                        <span className="font-medium">{message.inquiry.domain.name}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Message Content:</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Inquiry: {message.inquiry.buyerName} ({message.inquiry.buyerEmail})</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-48">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setSelectedMessage(message);
                            setEditedContent(message.content);
                          }}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Message</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Message Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Message Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Sender:</span>
                                <p className="font-medium">{message.sender.name || message.sender.email}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Type:</span>
                                <Badge variant="outline" className="text-xs">
                                  {message.senderType}
                                </Badge>
                              </div>
                              <div>
                                <span className="text-gray-600">Domain:</span>
                                <p className="font-medium">{message.inquiry.domain.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Sent:</span>
                                <p className="font-medium">{formatDate(message.sentDate)}</p>
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 text-sm">Original Message:</span>
                              <div className="bg-gray-50 p-3 rounded-lg mt-1">
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              </div>
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
                                  variant={moderationAction === 'edit' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setModerationAction('edit')}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit & Approve
                                </Button>
                              </div>

                              {/* Admin Notes */}
                              <div>
                                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                                <Textarea
                                  id="adminNotes"
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add any notes about this message..."
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
                                    placeholder="Explain why this message was rejected..."
                                    rows={3}
                                    required
                                  />
                                </div>
                              )}

                              {/* Edited Content */}
                              {moderationAction === 'edit' && (
                                <div>
                                  <Label htmlFor="editedContent">Edited Message *</Label>
                                  <Textarea
                                    id="editedContent"
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    placeholder="Edit the message content..."
                                    rows={6}
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    The edited message will be sent to the recipient instead of the original.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedMessage(null)}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending messages</h3>
            <p className="text-gray-600">
              All messages have been reviewed and processed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
