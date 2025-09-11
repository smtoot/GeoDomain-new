'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  Tag,
  Flag,
  Globe,
  CreditCard,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface TicketDetailsPageProps {
  params: {
    id: string;
  };
}

export default function TicketDetailsPage({ params }: TicketDetailsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticketData, isLoading, error, refetch } = trpc.support.getTicketDetails.useQuery({
    ticketId: params.id,
  });

  const addMessageMutation = trpc.support.addMessage.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Message added successfully');
      setNewMessage('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add message');
      setIsSubmitting(false);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSubmitting(true);
    
    addMessageMutation.mutate({
      ticketId: params.id,
      content: newMessage.trim(),
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'WAITING_FOR_USER':
        return <MessageSquare className="h-5 w-5 text-orange-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'CLOSED':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'WAITING_FOR_USER':
        return 'outline';
      case 'RESOLVED':
        return 'default';
      case 'CLOSED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'outline';
      case 'MEDIUM':
        return 'default';
      case 'HIGH':
        return 'secondary';
      case 'URGENT':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCategoryDisplay = (category: string) => {
    switch (category) {
      case 'DOMAIN_INQUIRY':
        return 'Domain Inquiry';
      case 'TRANSACTION_ISSUE':
        return 'Transaction Issue';
      case 'TECHNICAL_SUPPORT':
        return 'Technical Support';
      case 'ACCOUNT_ISSUE':
        return 'Account Issue';
      case 'PAYMENT_ISSUE':
        return 'Payment Issue';
      case 'GENERAL_QUESTION':
        return 'General Question';
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DOMAIN_INQUIRY':
        return <Globe className="h-4 w-4" />;
      case 'TRANSACTION_ISSUE':
        return <CreditCard className="h-4 w-4" />;
      case 'TECHNICAL_SUPPORT':
        return <AlertCircle className="h-4 w-4" />;
      case 'ACCOUNT_ISSUE':
        return <User className="h-4 w-4" />;
      case 'PAYMENT_ISSUE':
        return <CreditCard className="h-4 w-4" />;
      case 'GENERAL_QUESTION':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const ticket = ticketData?.ticket;

  return (
    <QueryErrorBoundary context="Support Ticket Details Page">
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/support">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Button>
            </Link>
          </div>
        </div>

        <QueryErrorBoundary>
          {isLoading ? (
            <div className="space-y-4">
              <LoadingCardSkeleton />
              <LoadingCardSkeleton />
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading Ticket
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error.message || 'Failed to load support ticket'}
                  </p>
                  <Button onClick={() => refetch()} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : !ticket ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ticket Not Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    The support ticket you're looking for doesn't exist or you don't have access to it.
                  </p>
                  <Link href="/support">
                    <Button variant="outline">
                      Back to Support
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Ticket Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(ticket.status)}
                        <h1 className="text-2xl font-bold text-gray-900 truncate">
                          {ticket.title}
                        </h1>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {getCategoryIcon(ticket.category)}
                          {getCategoryDisplay(ticket.category)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {ticket.user.name || ticket.user.email}
                        </div>
                        {ticket.assignedAdmin && (
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Assigned to {ticket.assignedAdmin.name || ticket.assignedAdmin.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                  
                  {/* Linked Resources */}
                  {(ticket.domain || ticket.transaction) && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Related Resources</h3>
                      <div className="space-y-2">
                        {ticket.domain && (
                          <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <span className="text-gray-600">Domain:</span>
                            <Link 
                              href={`/domains/${ticket.domain.name}`}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {ticket.domain.name}
                            </Link>
                            <span className="text-gray-500">
                              (${ticket.domain.price.toLocaleString()})
                            </span>
                          </div>
                        )}
                        {ticket.transaction && (
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="h-4 w-4 text-green-500" />
                            <span className="text-gray-600">Transaction:</span>
                            <span className="text-gray-900 font-medium">
                              ${ticket.transaction.amount.toLocaleString()}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {ticket.transaction.status}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Messages ({ticket.messages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ticket.messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {ticket.messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.sender.id === session?.user?.id
                              ? 'bg-blue-50 border border-blue-200 ml-8'
                              : 'bg-gray-50 border border-gray-200 mr-8'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900">
                                {message.sender.name || message.sender.email}
                              </span>
                              {message.sender.role === 'ADMIN' && (
                                <Badge variant="secondary" className="text-xs">
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {new Date(message.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Message Form */}
              {ticket.status !== 'CLOSED' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Message</CardTitle>
                    <CardDescription>
                      {ticket.status === 'WAITING_FOR_USER' 
                        ? 'Please respond to help us resolve your issue'
                        : 'Add additional information or ask questions'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        rows={4}
                        maxLength={2000}
                        required
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">
                          {newMessage.length}/2000 characters
                        </p>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting || !newMessage.trim()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Status Information */}
              {ticket.status === 'CLOSED' && (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Ticket Closed
                      </h3>
                      <p className="text-gray-600">
                        This support ticket has been closed. If you need further assistance, 
                        please create a new ticket.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </QueryErrorBoundary>
  );
}
