'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/main-layout';
import { StandardDashboardLayout } from '@/components/layout/StandardDashboardLayout';
import { trpc } from '@/lib/trpc';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { extractTrpcData } from '@/lib/utils/trpc-helpers';
import { QueryErrorBoundary } from '@/components/error';
import { 
  Search, 
  MessageSquare, 
  Filter,
  Eye,
  Reply,
  Clock,
  User,
  X,
  Send,
  TrendingUp,
  Timer,
  DollarSign,
  Building,
  CheckCircle
} from 'lucide-react';
import { inquiryNotifications } from '@/components/notifications/ToastNotification';

// Mock data removed - using real data from tRPC

// Define the inquiry type based on what the backend returns
interface Inquiry {
  id: string;
  status: string;
  createdAt: Date;
  domain: {
    id: string;
    name: string;
    price: number;
    logoUrl?: string;
  };
  buyerInfo?: {
    anonymousBuyerId: string;
    budgetRange: string;
    intendedUse: string;
    timeline?: string;
  };
  messages: Array<{
    id: string;
    content: string;
    status: string;
    sentDate: Date;
    senderType: 'BUYER' | 'SELLER';
  }>;
  adminNotes?: string;
  approvedDate?: Date;
}

const getStatusBadge = (status: string) => {
  const statusConfig = {
    PENDING_REVIEW: { 
      color: 'bg-yellow-100 text-yellow-800', 
      label: 'Under Review'
    },
    OPEN: { 
      color: 'bg-green-100 text-green-800', 
      label: 'Open for Communication'
    },
    CHANGES_REQUESTED: { 
      color: 'bg-orange-100 text-orange-800', 
      label: 'Changes Requested'
    },
    REJECTED: { 
      color: 'bg-red-100 text-red-800', 
      label: 'Rejected'
    },
    CONVERTED_TO_DEAL: { 
      color: 'bg-blue-100 text-blue-800', 
      label: 'Converted to Deal'
    },
    CLOSED: { 
      color: 'bg-gray-100 text-gray-800', 
      label: 'Closed'
    }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING_REVIEW;
  return (
    <Badge className={`${config.color} px-2 py-1 text-xs font-medium rounded`}>
      {config.label}
    </Badge>
  );
};

export default function InquiriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userRole, setUserRole] = useState<'BUYER' | 'SELLER' | 'ADMIN' | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ALWAYS call all hooks at the top level - before any conditional logic
  // Fetch real inquiries data
  const { data: inquiriesDataResponse, isLoading, error, refetch  } = trpc.inquiries.getDomainInquiries.useQuery({
    limit: 50,
    status: statusFilter === 'all' ? undefined : (statusFilter as 'OPEN' | 'CLOSED' | 'PENDING_REVIEW')
  }, {
    enabled: userRole === 'SELLER',
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  // Fetch seller analytics
  const { data: sellerStats } = trpc.inquiries.getSellerStats.useQuery(undefined, {
    enabled: userRole === 'SELLER',
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  // Send message mutation
  const sendMessageMutation = trpc.inquiries.sendMessage.useMutation({
    onSuccess: (data) => {
      refetch(); // Refresh inquiries after sending message
      // Show success notification with updated status
      // Message sent successfully
      inquiryNotifications.responseSent();
    },
    onError: () => {
      inquiryNotifications.responseFailed();
    }
  });

  // Check user role and redirect if not a seller
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      setUserRole(role);
      
      // Redirect buyers to their saved domains page (they don't manage seller inquiries)
      if (role === 'BUYER') {
        router.push('/dashboard/saved');
        return;
      }
      
      // Redirect admins to admin dashboard
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        router.push('/admin');
        return;
      }
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === 'loading' || userRole === null) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading while redirecting
  if (userRole === 'BUYER' || userRole === 'ADMIN') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Redirecting...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Extract data from tRPC response structure using consistent helper
  const inquiriesData = extractTrpcData(inquiriesDataResponse);

  // Fix data access pattern to match API response structure: { items: inquiries, nextCursor }
  const inquiries = (inquiriesData?.items || []) as unknown as Inquiry[];

  const filteredInquiries = inquiries.filter((inquiry: Inquiry) => {
    const matchesSearch = !searchTerm ||
      inquiry.domain.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsViewModalOpen(true);
  };

  const handleRespond = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setResponseMessage('');
    setIsRespondModalOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseMessage.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await sendMessageMutation.mutateAsync({
        inquiryId: selectedInquiry?.id || '',
        content: responseMessage
      });
      
      setIsSubmitting(false);
      setIsRespondModalOpen(false);
      setResponseMessage('');
    } catch (error) {
      setIsSubmitting(false);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedInquiry(null);
  };

  const closeRespondModal = () => {
    setIsRespondModalOpen(false);
    setSelectedInquiry(null);
    setResponseMessage('');
  };

  return (
    <QueryErrorBoundary context="Dashboard Inquiries Page">
      <StandardDashboardLayout
        title="My Inquiries"
        description="Track the status of your domain inquiries"
        isLoading={isLoading}
        loadingText="Loading inquiries..."
        error={error as any}
      >

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {sellerStats?.stats.total || 0}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Response</p>
                <p className="text-2xl font-bold text-orange-600">
                  {sellerStats?.stats.forwarded || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {sellerStats?.stats.conversionRate || 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {sellerStats?.stats.avgResponseTime || 0}h
                </p>
              </div>
              <Timer className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search inquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open for Communication</option>
            <option value="CLOSED">Closed</option>
            <option value="PENDING_REVIEW">Under Review</option>
          </select>
        </div>
      </div>

      {/* Loading State - Now handled by StandardDashboardLayout */}
      {isLoading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <LoadingCardSkeleton key={i} lines={2} />
          ))}
        </div>
      )}

      {/* Error State - Now handled by StandardDashboardLayout */}

      {/* Empty State */}
      {!isLoading && !error && filteredInquiries.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
          <p className="text-gray-600">
            {inquiries.length === 0 
              ? "You haven't received any inquiries yet." 
              : "No inquiries match your current filters."}
          </p>
        </div>
      )}

      {/* Inquiries List */}
      {!isLoading && !error && filteredInquiries.length > 0 && (
        <div className="space-y-6">
          {filteredInquiries.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Side - Domain & Buyer Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {inquiry.domain.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {inquiry.buyerInfo?.anonymousBuyerId 
                            ? `Buyer ${inquiry.buyerInfo.anonymousBuyerId}`
                            : 'Anonymous Buyer'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <p className="font-medium">{inquiry.buyerInfo?.budgetRange || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Timeline:</span>
                        <p className="font-medium">{inquiry.buyerInfo?.timeline || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Domain Price:</span>
                        <p className="font-medium">${(inquiry.domain.price || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Received:</span>
                        <p className="font-medium">{new Date(inquiry.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {inquiry.buyerInfo?.intendedUse && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Intended Use:</span> {inquiry.buyerInfo.intendedUse}
                      </p>
                    )}
                  </div>

                  {/* Right Side - Status & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusBadge(inquiry.status)}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInquiry(inquiry)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {inquiry.status === 'OPEN' ? (
                        <Button
                          size="sm"
                          onClick={() => handleRespond(inquiry)}
                          className="flex items-center gap-2"
                        >
                          <Reply className="h-4 w-4" />
                          Message
                        </Button>
                      ) : inquiry.status === 'CONVERTED_TO_DEAL' ? (
                        <Button
                          size="sm"
                          disabled
                          className="flex items-center gap-2 bg-blue-100 text-blue-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Deal Created
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled
                          className="flex items-center gap-2"
                        >
                          <Clock className="h-4 w-4" />
                          {inquiry.status === 'PENDING_REVIEW' ? 'Reviewing' : 'N/A'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Inquiry Details</h2>
              <Button variant="ghost" size="sm" onClick={closeViewModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Essential Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Domain</Label>
                  <p className="text-lg font-semibold">{selectedInquiry.domain?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInquiry.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date Received</Label>
                  <p className="text-gray-900">{new Date(selectedInquiry.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Budget Range</Label>
                  <p className="text-gray-900">{selectedInquiry.buyerInfo?.budgetRange || 'Not specified'}</p>
                </div>
              </div>

              {/* Business Context */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Intended Use</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">
                    {selectedInquiry.buyerInfo?.intendedUse || 'Not specified'}
                  </p>
                </div>
              </div>

              {/* Optional Information */}
              {selectedInquiry.buyerInfo?.timeline && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Timeline</Label>
                  <p className="text-gray-900">{selectedInquiry.buyerInfo.timeline}</p>
                </div>
              )}

              {selectedInquiry.adminNotes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Admin Notes</Label>
                  <div className="mt-2 p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-900">{selectedInquiry.adminNotes}</p>
                  </div>
                </div>
              )}

              {selectedInquiry.messages && selectedInquiry.messages.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Conversation History</Label>
                  <div className="mt-2 space-y-2">
                    {selectedInquiry.messages.map((message: any, index: number) => (
                      <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500">
                            {message.senderType === 'BUYER' ? 'Buyer' : 'Seller'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.sentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={closeViewModal}>
                Close
              </Button>
              <Button onClick={() => {
                closeViewModal();
                handleRespond(selectedInquiry);
              }}>
                <Reply className="h-4 w-4 mr-2" />
                Respond to Inquiry
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {isRespondModalOpen && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Respond to Inquiry</h2>
              <Button variant="ghost" size="sm" onClick={closeRespondModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Domain</Label>
                  <p className="text-gray-900">{selectedInquiry?.domain?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Buyer</Label>
                  <p className="text-gray-900">{selectedInquiry?.buyerInfo?.anonymousBuyerId || 'Anonymous Buyer'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Your Response</Label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response to the buyer..."
                  className="mt-2 min-h-[120px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={closeRespondModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitResponse} 
                disabled={!responseMessage.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Response
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      </StandardDashboardLayout>
    </QueryErrorBoundary>
  );
  }
