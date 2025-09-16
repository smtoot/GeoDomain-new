'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
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
  Users,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface AdminTicketDetailsPageProps {
  params: {
    id: string;
  };
}

export default function AdminTicketDetailsPage({ params }: AdminTicketDetailsPageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [assignedAdminId, setAssignedAdminId] = useState('');

  const { data: ticketData, isLoading, error, refetch } = trpc.support.getTicketDetailsAdmin.useQuery({
    ticketId: params.id,
  });

  // Fetch admins for assignment
  const { data: adminsData } = trpc.admin.users.listUsers.useQuery({
    role: 'ADMIN',
    limit: 50,
  }, {
    enabled: status === 'authenticated',
  });

  // Initialize assignedAdminId from ticket data
  useEffect(() => {
    if (ticketData?.ticket?.assignedAdminId) {
      setAssignedAdminId(ticketData.ticket.assignedAdminId);
    } else {
      setAssignedAdminId('unassigned');
    }
  }, [ticketData]);

  const addMessageMutation = trpc.support.addAdminMessage.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Message added successfully');
      setNewMessage('');
      setIsInternal(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add message');
      setIsSubmitting(false);
    },
  });

  const updateStatusMutation = trpc.support.updateTicketStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Ticket status updated successfully');
      setNewStatus('');
      setAssignedAdminId('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update ticket status');
      setIsUpdatingStatus(false);
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
      isInternal,
    });
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    setIsUpdatingStatus(true);
    
    updateStatusMutation.mutate({
      ticketId: params.id,
      status: newStatus as any,
      assignedAdminId: assignedAdminId && assignedAdminId !== 'unassigned' ? assignedAdminId : undefined,
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

  // Redirect if not admin
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

  const ticket = ticketData?.ticket;

  return (
    <StandardPageLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/admin/support">
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
                    The support ticket you're looking for doesn't exist.
                  </p>
                  <Link href="/admin/support">
                    <Button variant="outline">
                      Back to Support
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
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
                                href={`/domains/${encodeURIComponent(ticket.domain.name)}`}
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
                                : message.sender.role === 'ADMIN'
                                ? 'bg-green-50 border border-green-200 mr-8'
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
                                {message.isInternal && (
                                  <Badge variant="outline" className="text-xs">
                                    Internal
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
                        Respond to the customer or add internal notes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSendMessage} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="isInternal"
                            checked={isInternal}
                            onChange={(e) => setIsInternal(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="isInternal" className="text-sm">
                            Internal note (not visible to customer)
                          </Label>
                        </div>
                        
                        <Textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder={isInternal ? "Add internal note..." : "Type your response here..."}
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
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Status Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Save className="h-5 w-5" />
                      Manage Ticket
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPEN">Open</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                          <SelectItem value="RESOLVED">Resolved</SelectItem>
                          <SelectItem value="CLOSED">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="assignedAdmin">Assign to Admin</Label>
                      <Select value={assignedAdminId} onValueChange={setAssignedAdminId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select admin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {adminsData?.users?.filter((admin: any) => admin.id && admin.id.trim() !== '').map((admin: any) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.name || admin.email}
                            </SelectItem>
                          )) || []}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleUpdateStatus}
                      disabled={isUpdatingStatus || !newStatus}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isUpdatingStatus ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Status
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Ticket Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Ticket ID:</span>
                      <p className="text-sm text-gray-900 font-mono">{ticket.id}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Created:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(ticket.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                      <p className="text-sm text-gray-900">
                        {new Date(ticket.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    {ticket.assignedAdmin && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Assigned to:</span>
                        <p className="text-sm text-gray-900">
                          {ticket.assignedAdmin.name || ticket.assignedAdmin.email}
                        </p>
                      </div>
                    )}
                    {ticket.resolvedAt && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Resolved:</span>
                        <p className="text-sm text-gray-900">
                          {new Date(ticket.resolvedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {ticket.closedAt && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Closed:</span>
                        <p className="text-sm text-gray-900">
                          {new Date(ticket.closedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-sm text-gray-900">
                        {ticket.user.name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-sm text-gray-900">{ticket.user.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">User ID:</span>
                      <p className="text-sm text-gray-900 font-mono">{ticket.user.id}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </QueryErrorBoundary>
      </div>
    </StandardPageLayout>
  );
}
