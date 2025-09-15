'use client';

import { useState } from 'react';
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
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm', 
      label: 'Under Review',
      icon: <Clock className="h-3 w-3" />
    },
    FORWARDED: { 
      color: 'bg-blue-100 text-blue-800 border-blue-300 shadow-sm', 
      label: 'Active',
      icon: <MessageSquare className="h-3 w-3" />
    },
    CHANGES_REQUESTED: { 
      color: 'bg-orange-100 text-orange-800 border-orange-300 shadow-sm', 
      label: 'Changes Requested',
      icon: <Clock className="h-3 w-3" />
    },
    REJECTED: { 
      color: 'bg-red-100 text-red-800 border-red-300 shadow-sm', 
      label: 'Rejected',
      icon: <X className="h-3 w-3" />
    },
    COMPLETED: { 
      color: 'bg-green-100 text-green-800 border-green-300 shadow-sm', 
      label: 'Completed',
      icon: <CheckCircle className="h-3 w-3" />
    }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING_REVIEW;
  return (
    <Badge className={`${config.color} border flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

export default function InquiriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real inquiries data
  const { data: inquiriesDataResponse, isLoading, error, refetch  } = trpc.inquiries.getDomainInquiries.useQuery({
    limit: 50,
    status: statusFilter === 'all' ? undefined : (statusFilter as 'FORWARDED' | 'COMPLETED' | 'PENDING_REVIEW')
  });

  // Fetch seller analytics
  const { data: sellerStats } = trpc.inquiries.getSellerStats.useQuery();

  // Extract data from tRPC response structure (without superjson transformer)
  const inquiriesData = inquiriesDataResponse;

  // Send message mutation
  const sendMessageMutation = trpc.inquiries.sendMessage.useMutation({
    onSuccess: () => {
      refetch(); // Refresh inquiries after sending message
    }
  });

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
      
      inquiryNotifications.responseSent();
    } catch (error) {
      setIsSubmitting(false);
      inquiryNotifications.responseFailed();
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
            <option value="FORWARDED">Forwarded to You</option>
            <option value="COMPLETED">Completed</option>
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
            <Card key={inquiry.id} className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-r from-white to-blue-50/30 overflow-hidden">
              <CardContent className="p-0">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {inquiry.domain.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {inquiry.buyerInfo?.anonymousBuyerId 
                            ? `Buyer ${inquiry.buyerInfo.anonymousBuyerId}`
                            : 'Anonymous Buyer'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(inquiry.status)}
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Received</p>
                        <p className="text-sm font-medium text-gray-700">
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Financial Info */}
                    <div className="space-y-4">
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Budget Range</span>
                        </div>
                        <p className="text-lg font-bold text-green-900">
                          {inquiry.buyerInfo?.budgetRange || 'Not specified'}
                        </p>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-blue-800">Domain Price</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900">
                          ${(inquiry.domain.price || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Middle Column - Timeline & Details */}
                    <div className="space-y-4">
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">Timeline</span>
                        </div>
                        <p className="text-sm text-orange-900">
                          {inquiry.buyerInfo?.timeline || 'Not specified'}
                        </p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-800">Intended Use</span>
                        </div>
                        <p className="text-sm text-purple-900 line-clamp-3">
                          {inquiry.buyerInfo?.intendedUse 
                            ? inquiry.buyerInfo.intendedUse
                            : 'Inquiry received from buyer (details reviewed by admin)'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Right Column - Actions */}
                    <div className="flex flex-col gap-3">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-800 mb-3">Quick Actions</h4>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewInquiry(inquiry)}
                            className="w-full justify-start gap-2 hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                            View Full Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRespond(inquiry)}
                            className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
                          >
                            <Reply className="h-4 w-4" />
                            Respond to Buyer
                          </Button>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-gray-600">Ready for response</span>
                        </div>
                      </div>
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
