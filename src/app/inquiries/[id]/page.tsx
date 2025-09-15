'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { trpc } from '@/lib/trpc';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { QueryErrorBoundary } from '@/components/error';
import { 
  ArrowLeft,
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Globe,
  User,
  Building,
  DollarSign,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { inquiryNotifications } from '@/components/notifications/ToastNotification';

export default function BuyerInquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [messageContent, setMessageContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inquiryId = params.id as string;

  const { data: inquiry, isLoading, error } = trpc.inquiries.getById.useQuery(
    { id: inquiryId },
    { enabled: !!inquiryId }
  );

  const { data: messagesData, refetch: refetchMessages } = trpc.inquiries.getMessages.useQuery(
    { inquiryId, page: 1, limit: 50 },
    { enabled: !!inquiryId }
  );

  const sendMessageMutation = trpc.inquiries.sendMessage.useMutation({
    onSuccess: () => {
      inquiryNotifications.responseSent();
      setMessageContent('');
      refetchMessages();
    },
    onError: () => {
      inquiryNotifications.responseFailed();
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING_REVIEW: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        label: 'Under Review',
        icon: <Clock className="h-4 w-4" />,
        description: 'Your inquiry is being reviewed by our team'
      },
      FORWARDED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'Forwarded to Seller',
        icon: <MessageSquare className="h-4 w-4" />,
        description: 'Your inquiry has been approved and sent to the seller'
      },
      CHANGES_REQUESTED: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        label: 'Changes Requested',
        icon: <AlertCircle className="h-4 w-4" />,
        description: 'Please review the requested changes below'
      },
      REJECTED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        label: 'Rejected',
        icon: <XCircle className="h-4 w-4" />,
        description: 'Your inquiry was not approved'
      },
      COMPLETED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Completed',
        icon: <CheckCircle className="h-4 w-4" />,
        description: 'This inquiry has been completed'
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING_REVIEW;
    return {
      badge: (
        <Badge className={`${config.color} border flex items-center gap-1`}>
          {config.icon}
          {config.label}
        </Badge>
      ),
      description: config.description
    };
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await sendMessageMutation.mutateAsync({
        inquiryId,
        content: messageContent
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Not Found</h1>
            <p className="text-gray-600 mb-6">
              The inquiry you're looking for could not be found.
            </p>
            <Button onClick={() => router.push('/inquiries')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inquiries
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusBadge(inquiry.status);

  return (
    <QueryErrorBoundary context="Buyer Inquiry Detail Page">
      <StandardPageLayout
        title="Inquiry Details"
        description={`Track the status of your inquiry for ${inquiry.domain?.name || 'this domain'}`}
        isLoading={false}
        className="min-h-screen bg-gray-50 py-8"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <div className="mb-6">
            <Button 
              onClick={() => router.push('/inquiries')} 
              variant="ghost" 
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Inquiries
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Inquiry Information */}
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Inquiry Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {statusInfo.badge}
                    </div>
                    <p className="text-sm text-gray-600">{statusInfo.description}</p>
                    
                    {/* Status Timeline */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Inquiry submitted</span>
                        <span className="text-gray-500">{formatDate(inquiry.createdAt)}</span>
                      </div>
                      
                      {inquiry.status !== 'PENDING_REVIEW' && (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Admin review completed</span>
                          <span className="text-gray-500">{formatDate(inquiry.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domain Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {inquiry.domain?.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Price</span>
                      <span className="font-semibold text-lg">
                        {formatPrice(inquiry.domain?.price || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Inquiry Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Your Inquiry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Budget Range:</span>
                      <p className="font-medium">{inquiry.budgetRange}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Timeline:</span>
                      <p className="font-medium">{inquiry.timeline || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Intended Use:</span>
                    <p className="mt-1 text-sm">{inquiry.intendedUse}</p>
                  </div>
                  
                  <div>
                    <span className="text-gray-600">Message:</span>
                    <p className="mt-1 text-sm">{inquiry.message}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Messages Section */}
            <div className="space-y-6">
              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Conversation
                  </CardTitle>
                  <CardDescription>
                    {inquiry.status === 'FORWARDED' 
                      ? 'You can now communicate with the seller through our secure messaging system.'
                      : 'Messages will appear here once your inquiry is approved.'
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {messagesData?.messages && messagesData.messages.length > 0 ? (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {messagesData.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.senderType === 'BUYER'
                              ? 'bg-blue-50 ml-8'
                              : 'bg-gray-50 mr-8'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {message.senderType === 'BUYER' ? 'You' : 'Seller'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.sentDate)}
                            </span>
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages yet</p>
                      {inquiry.status === 'FORWARDED' && (
                        <p className="text-sm">Start the conversation below</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Send Message */}
              {inquiry.status === 'FORWARDED' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Send Message
                    </CardTitle>
                    <CardDescription>
                      Your message will be reviewed before being sent to the seller.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your message here..."
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={4}
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageContent.trim() || isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}