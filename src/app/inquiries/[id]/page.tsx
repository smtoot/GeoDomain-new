'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageSquare, Calendar, DollarSign, User, Globe } from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function InquiryDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const inquiryId = params.id as string;
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Get navigation context from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const fromPage = searchParams.get('from');
  const userId = searchParams.get('userId');

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const { data: inquiry, isLoading, error } = trpc.inquiries.getById.useQuery(
    { id: inquiryId },
    { enabled: !!inquiryId }
  );

  const sendMessageMutation = trpc.inquiries.sendMessage.useMutation({
    onSuccess: () => {
      toast.success('Message sent and is under review');
      setMessage('');
      // Refetch inquiry data to get updated messages
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'secondary';
      case 'APPROVED':
      case 'FORWARDED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'CHANGES_REQUESTED':
        return 'outline';
      case 'COMPLETED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Under Review';
      case 'APPROVED':
        return 'Approved';
      case 'FORWARDED':
        return 'Forwarded to Seller';
      case 'REJECTED':
        return 'Rejected';
      case 'CHANGES_REQUESTED':
        return 'Changes Requested';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync({
        inquiryId,
        content: message.trim(),
      });
    } finally {
      setIsSending(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Inquiry</h1>
          <p className="text-gray-600">{error.message}</p>
          <Button 
            onClick={() => {
              if (fromPage === 'user' && userId) {
                router.push(`/admin/users/${userId}`);
              } else {
                router.push('/inquiries');
              }
            }} 
            className="mt-4"
          >
            {fromPage === 'user' && userId ? 'Back to User Details' : 'Back to Inquiries'}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !inquiry) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => {
            if (fromPage === 'user' && userId) {
              router.push(`/admin/users/${userId}`);
            } else {
              router.push('/inquiries');
            }
          }}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {fromPage === 'user' && userId ? 'Back to User Details' : 'Back to Inquiries'}
        </Button>
        
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Inquiry for {inquiry.domain.name}
            </h1>
            <p className="text-gray-600">
              Submitted on {formatDate(inquiry.createdAt)}
            </p>
          </div>
          <Badge variant={getStatusBadgeVariant(inquiry.status)} className="text-sm">
            {getStatusText(inquiry.status)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle>Inquiry Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Budget:</span>
                  <span className="font-medium">{(inquiry as any).buyerInfo?.budgetRange || (inquiry as any).budgetRange}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Timeline:</span>
                  <span className="font-medium">{(inquiry as any).buyerInfo?.timeline || (inquiry as any).timeline || 'Not specified'}</span>
                </div>
              </div>

              {/* Anonymous Buyer ID for Sellers */}
              {(inquiry as any).buyerInfo?.anonymousBuyerId && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Buyer ID:</span>
                  <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                    {(inquiry as any).buyerInfo.anonymousBuyerId}
                  </span>
                </div>
              )}

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Intended Use:</h4>
                <p className="text-gray-600">{(inquiry as any).buyerInfo?.intendedUse || (inquiry as any).intendedUse}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Your Message:</h4>
                <p className="text-gray-600">{(inquiry as any).message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages ({(inquiry as any).messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(inquiry as any).messages.length > 0 ? (
                <div className="space-y-4">
                  {(inquiry as any).messages.map((msg: any) => (
                    <div key={msg.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {msg.sender.name || msg.sender.email}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {msg.senderType}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(msg.sentDate)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={msg.status === 'APPROVED' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {msg.status === 'PENDING' ? 'Under Review' : msg.status}
                        </Badge>
                      </div>
                      <p className="text-gray-700">{msg.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No messages yet
                </p>
              )}

              {/* Send Message Form */}
              {inquiry.status === 'FORWARDED' && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Send a Message</h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Type your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !message.trim()}
                      >
                        {isSending ? 'Sending...' : 'Send Message'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Domain Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domain Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900">{inquiry.domain.name}</h4>
                <p className="text-2xl font-bold text-primary">
                  {formatPrice(Number(inquiry.domain.price))}
                </p>
              </div>
              {inquiry.domain.logoUrl && (
                <img
                  src={inquiry.domain.logoUrl}
                  alt={`${inquiry.domain.name} logo`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seller Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">
                  {inquiry.domain.owner.name || 'Domain Owner'}
                </p>
                <p className="text-sm text-gray-600">{inquiry.domain.owner.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Information */}
          <Card>
            <CardHeader>
              <CardTitle>Status Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Current Status</p>
                <Badge variant={getStatusBadgeVariant(inquiry.status)} className="mt-1">
                  {getStatusText(inquiry.status)}
                </Badge>
              </div>
              
              {inquiry.status === 'PENDING_REVIEW' && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Your inquiry is being reviewed by our team. This usually takes 24-48 hours.
                  </p>
                </div>
              )}

              {inquiry.status === 'REJECTED' && (
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    Your inquiry was not approved. You can submit a new inquiry with different details.
                  </p>
                </div>
              )}

              {inquiry.status === 'CHANGES_REQUESTED' && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Changes were requested for your inquiry. Please review and resubmit.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
