'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  MessageSquare,
  User,
  Calendar,
  Mail,
  Phone,
  Globe,
  AtSign
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { adminNotifications } from '@/components/notifications/ToastNotification';
import { formatDate } from '@/lib/utils';

export default function FlaggedMessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  // Mock data for flagged messages (in real implementation, this would come from tRPC)
  const flaggedMessages = [
    {
      id: '1',
      content: 'Please contact me at john@example.com or call 555-123-4567',
      flaggedReason: 'Email address detected',
      contactInfoDetected: true,
      sentDate: new Date(),
      status: 'FLAGGED',
      sender: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      inquiry: {
        id: '1',
        domain: {
          name: 'example.com',
        },
      },
    },
    {
      id: '2',
      content: 'Visit my website at https://mysite.com for more details',
      flaggedReason: 'URL detected',
      contactInfoDetected: true,
      sentDate: new Date(),
      status: 'FLAGGED',
      sender: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
      inquiry: {
        id: '2',
        domain: {
          name: 'business.com',
        },
      },
    },
  ];

  const handleApproveMessage = async (messageId: string) => {
    setIsReviewing(true);
    try {
      // In a real implementation, this would call a tRPC mutation
      console.log(`Approving message ${messageId}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      adminNotifications.success('Message approved successfully');
      setSelectedMessage(null);
    } catch (error) {
      adminNotifications.error('Failed to approve message');
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRejectMessage = async (messageId: string) => {
    setIsReviewing(true);
    try {
      // In a real implementation, this would call a tRPC mutation
      console.log(`Rejecting message ${messageId}`);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      adminNotifications.success('Message rejected successfully');
      setSelectedMessage(null);
    } catch (error) {
      adminNotifications.error('Failed to reject message');
    } finally {
      setIsReviewing(false);
    }
  };

  const getContactInfoIcon = (reason: string) => {
    if (reason.includes('Email')) return <Mail className="h-4 w-4" />;
    if (reason.includes('Phone')) return <Phone className="h-4 w-4" />;
    if (reason.includes('URL')) return <Globe className="h-4 w-4" />;
    if (reason.includes('Social')) return <AtSign className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Flagged Messages</h1>
            <p className="text-gray-600 mt-2">
              Review messages flagged for containing contact information
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
            <span className="text-sm text-gray-500">{flaggedMessages.length} Flagged</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{flaggedMessages.length}</div>
                  <div className="text-sm text-gray-500">Flagged Messages</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {flaggedMessages.filter(m => m.flaggedReason.includes('Email')).length}
                  </div>
                  <div className="text-sm text-gray-500">Email Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {flaggedMessages.filter(m => m.flaggedReason.includes('Phone')).length}
                  </div>
                  <div className="text-sm text-gray-500">Phone Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {flaggedMessages.filter(m => m.flaggedReason.includes('URL')).length}
                  </div>
                  <div className="text-sm text-gray-500">URL Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flagged Messages List */}
        <div className="space-y-4">
          {flaggedMessages.map((message) => (
            <Card key={message.id} className="border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Message Content */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Message Content</span>
                      </div>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md">
                        {message.content}
                      </p>
                    </div>

                    {/* Contact Info Detection */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {getContactInfoIcon(message.flaggedReason)}
                        <span className="text-sm font-medium text-gray-700">Detection Reason</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {message.flaggedReason}
                      </Badge>
                    </div>

                    {/* Message Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">From:</span>
                        <p className="font-medium">{message.sender.name}</p>
                        <p className="text-gray-500">{message.sender.email}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Domain:</span>
                        <p className="font-medium">{message.inquiry.domain.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Sent:</span>
                        <p className="font-medium">{formatDate(message.sentDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMessage(message)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApproveMessage(message.id)}
                      disabled={isReviewing}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectMessage(message.id)}
                      disabled={isReviewing}
                      className="flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Review Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>Review Flagged Message</CardTitle>
                <CardDescription>
                  Review the message and decide whether to approve or reject it
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Message Content */}
                <div>
                  <Label>Message Content</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-gray-900">{selectedMessage.content}</p>
                  </div>
                </div>

                {/* Detection Reason */}
                <div>
                  <Label>Detection Reason</Label>
                  <div className="mt-1">
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {selectedMessage.flaggedReason}
                    </Badge>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    className="mt-1"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedMessage(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRejectMessage(selectedMessage.id)}
                    disabled={isReviewing}
                  >
                    Reject Message
                  </Button>
                  <Button
                    onClick={() => handleApproveMessage(selectedMessage.id)}
                    disabled={isReviewing}
                  >
                    Approve Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {flaggedMessages.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Flagged Messages
                </h3>
                <p className="text-gray-500">
                  All messages are clean and don't contain contact information.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StandardPageLayout>
  );
}
