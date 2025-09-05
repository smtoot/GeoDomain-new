'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/main-layout';
import { trpc } from '@/lib/trpc';
import { 
  Search, 
  DollarSign, 
  Clock,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  X,
  Send
} from 'lucide-react';

// Mock data removed - using real data from tRPC

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'NEGOTIATING':
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Negotiating</Badge>;
    case 'AGREED':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Agreed</Badge>;
    case 'PAYMENT_PENDING':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Payment Pending</Badge>;
    case 'PAYMENT_CONFIRMED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Payment Confirmed</Badge>;
    case 'TRANSFER_INITIATED':
      return <Badge variant="default" className="bg-purple-100 text-purple-800">Transfer Initiated</Badge>;
    case 'COMPLETED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    case 'DISPUTED':
      return <Badge variant="outline" className="text-red-600">Disputed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'NEGOTIATING':
      return <Clock className="h-5 w-5 text-orange-500" />;
    case 'AGREED':
      return <DollarSign className="h-5 w-5 text-blue-500" />;
    case 'PAYMENT_PENDING':
      return <DollarSign className="h-5 w-5 text-yellow-500" />;
    case 'PAYMENT_CONFIRMED':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'TRANSFER_INITIATED':
      return <AlertCircle className="h-5 w-5 text-purple-500" />;
    case 'COMPLETED':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'DISPUTED':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

export default function DealsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real deals data
  const { data: dealsData, isLoading, error, refetch } = trpc.deals.getMyDeals.useQuery({
    limit: 50,
    status: statusFilter === 'all' ? undefined : (statusFilter as any)
  });

  // Send message mutation (using inquiries router since deals are tied to inquiries)
  const sendMessageMutation = trpc.inquiries.sendMessage.useMutation({
    onSuccess: () => {
      refetch(); // Refresh deals after sending message
    }
  });

  const deals = dealsData?.items || [];

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch = !searchTerm ||
      deal.inquiry.domain.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleViewDeal = (deal: any) => {
    setSelectedDeal(deal);
    setIsViewModalOpen(true);
  };

  const handleContactBuyer = (deal: any) => {
    setSelectedDeal(deal);
    setContactMessage('');
    setIsContactModalOpen(true);
  };

  const handleSubmitContact = async () => {
    if (!contactMessage.trim() || !selectedDeal) return;
    
    setIsSubmitting(true);
    
    try {
      await sendMessageMutation.mutateAsync({
        inquiryId: selectedDeal.inquiryId,
        content: contactMessage
      });
      
      setIsSubmitting(false);
      setIsContactModalOpen(false);
      setContactMessage('');
      
      alert('Message sent successfully! Your message will be reviewed by our team before forwarding to the buyer.');
    } catch (error) {
      setIsSubmitting(false);
      alert('Failed to send message. Please try again.');
      console.error('Error sending message:', error);
    }
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedDeal(null);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
    setSelectedDeal(null);
    setContactMessage('');
  };

  const totalDealValue = filteredDeals.reduce((sum: number, deal: any) => {
    const price = deal.agreedPrice || 0;
    return sum + (typeof price === 'number' ? price : Number(price) || 0);
  }, 0);
  const activeDeals = filteredDeals.filter((deal: any) => deal.status !== 'COMPLETED' && deal.status !== 'DISPUTED').length;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Active Deals</h1>
          <p className="text-gray-600 mt-2">Manage ongoing domain transactions</p>
        </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deal Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(totalDealValue || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{activeDeals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredDeals.length > 0 ? Math.round((filteredDeals.filter((d: any) => d.status === 'COMPLETED').length / filteredDeals.length) * 100) : 0}%
                </p>
              </div>
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
              placeholder="Search deals..."
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
            <option value="all">All Status</option>
            <option value="NEGOTIATING">Negotiating</option>
            <option value="AGREED">Agreed</option>
            <option value="PAYMENT_PENDING">Payment Pending</option>
            <option value="PAYMENT_CONFIRMED">Payment Confirmed</option>
            <option value="TRANSFER_INITIATED">Transfer Initiated</option>
            <option value="COMPLETED">Completed</option>
            <option value="DISPUTED">Disputed</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Loading deals...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Failed to load deals. Please try refreshing the page.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredDeals.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
          <p className="text-gray-600">
            {deals.length === 0 
              ? "You don't have any active deals yet. Start by responding to buyer inquiries!" 
              : "No deals match your current filters."}
          </p>
        </div>
      )}

      {/* Deals List */}
      {!isLoading && !error && filteredDeals.length > 0 && (
        <div className="space-y-4">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Deal Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(deal.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {deal.inquiry?.domain?.name || 'Domain Name Not Available'}
                      </h3>
                      {getStatusBadge(deal.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Buyer:</span> Anonymous
                      </div>
                      <div>
                        <span className="font-medium">Value:</span> ${(deal.agreedPrice || 0).toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Last Activity:</span> {new Date(deal.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Payment Method:</span> {deal.paymentMethod || 'Not specified'}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Timeline:</span> {deal.timeline || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDeal(deal)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleContactBuyer(deal)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Contact Buyer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Deal Details</h2>
              <Button variant="ghost" size="sm" onClick={closeViewModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Domain</Label>
                  <p className="text-lg font-semibold">{selectedDeal.domainName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedDeal.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Buyer Name</Label>
                  <p className="text-gray-900">{selectedDeal.buyerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Buyer Email</Label>
                  <p className="text-gray-900">{selectedDeal.buyerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Deal Value</Label>
                  <p className="text-gray-900">${(selectedDeal?.dealValue || selectedDeal?.agreedPrice || 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Last Activity</Label>
                  <p className="text-gray-900">{selectedDeal.lastActivity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Progress</Label>
                  <p className="text-gray-900">{selectedDeal.progress}%</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Next Step</Label>
                  <p className="text-gray-900">{selectedDeal.nextStep}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Progress Bar</Label>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${selectedDeal.progress}%` }}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={closeViewModal}>
                Close
              </Button>
              <Button onClick={() => {
                closeViewModal();
                handleContactBuyer(selectedDeal);
              }}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Buyer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Buyer Modal */}
      {isContactModalOpen && selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Contact Buyer</h2>
              <Button variant="ghost" size="sm" onClick={closeContactModal}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Domain</Label>
                  <p className="text-gray-900">{selectedDeal.domainName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Buyer</Label>
                  <p className="text-gray-900">{selectedDeal.buyerName}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Your Message</Label>
                <Textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Type your message to the buyer..."
                  className="mt-2 min-h-[120px]"
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={closeContactModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitContact} 
                disabled={!contactMessage.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
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
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
