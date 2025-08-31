'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DashboardLayout } from '@/components/layout/main-layout';
import { 
  Search, 
  MessageSquare, 
  Filter,
  Eye,
  Reply,
  Clock,
  User,
  X,
  Send
} from 'lucide-react';

// Mock data - replace with real API calls
const mockInquiries = [
  {
    id: '1',
    domainName: 'techstartup.com',
    buyerName: 'John Smith',
    buyerEmail: 'john@example.com',
    message: 'I\'m interested in purchasing this domain for my startup. What\'s your best price?',
    budget: 12000,
    status: 'pending',
    timestamp: '2 hours ago',
    domainPrice: 15000
  },
  {
    id: '2',
    domainName: 'realestatepro.net',
    buyerName: 'Sarah Johnson',
    buyerEmail: 'sarah@realestate.com',
    message: 'Looking to acquire this domain for our real estate agency. Is it still available?',
    budget: 8000,
    status: 'responded',
    timestamp: '1 day ago',
    domainPrice: 8500
  },
  {
    id: '3',
    domainName: 'healthcareplus.org',
    buyerName: 'Dr. Michael Brown',
    buyerEmail: 'michael@healthcare.org',
    message: 'Interested in this domain for our healthcare platform. Can we discuss terms?',
    budget: 15000,
    status: 'pending',
    timestamp: '3 days ago',
    domainPrice: 12000
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="text-yellow-600">Pending Response</Badge>;
    case 'responded':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Responded</Badge>;
    case 'negotiating':
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Negotiating</Badge>;
    case 'closed':
      return <Badge variant="outline" className="text-gray-600">Closed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function InquiriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredInquiries = mockInquiries.filter((inquiry) => {
    const matchesSearch = !searchTerm ||
      inquiry.domainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewInquiry = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setIsViewModalOpen(true);
  };

  const handleRespond = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setResponseMessage('');
    setIsRespondModalOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseMessage.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update inquiry status
    const updatedInquiries = mockInquiries.map(inquiry => 
      inquiry.id === selectedInquiry.id 
        ? { ...inquiry, status: 'responded' }
        : inquiry
    );
    
    // In a real app, you would call an API here
    console.log('Response sent:', {
      inquiryId: selectedInquiry.id,
      message: responseMessage,
      timestamp: new Date().toISOString()
    });
    
    setIsSubmitting(false);
    setIsRespondModalOpen(false);
    setResponseMessage('');
    
    // Show success message (you could add a toast notification here)
    alert('Response sent successfully!');
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
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-600 mt-2">Manage buyer inquiries for your domains</p>
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
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="responded">Responded</option>
            <option value="negotiating">Negotiating</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Inquiries List */}
      <div className="space-y-4">
        {filteredInquiries.map((inquiry) => (
          <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Inquiry Details */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {inquiry.domainName}
                    </h3>
                    {getStatusBadge(inquiry.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{inquiry.buyerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{inquiry.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Budget: ${inquiry.budget.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700">{inquiry.message}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewInquiry(inquiry)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(inquiry)}
                    className="flex items-center gap-2"
                  >
                    <Reply className="h-4 w-4" />
                    Respond
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInquiries.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'You haven\'t received any inquiries yet. Keep promoting your domains!'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Domain</Label>
                  <p className="text-lg font-semibold">{selectedInquiry.domainName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedInquiry.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Buyer Name</Label>
                  <p className="text-gray-900">{selectedInquiry.buyerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Buyer Email</Label>
                  <p className="text-gray-900">{selectedInquiry.buyerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Budget</Label>
                  <p className="text-gray-900">${selectedInquiry.budget.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Domain Price</Label>
                  <p className="text-gray-900">${selectedInquiry.domainPrice.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Received</Label>
                  <p className="text-gray-900">{selectedInquiry.timestamp}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Message</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{selectedInquiry.message}</p>
                </div>
              </div>
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
                  <p className="text-gray-900">{selectedInquiry.domainName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Buyer</Label>
                  <p className="text-gray-900">{selectedInquiry.buyerName}</p>
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
    </DashboardLayout>
  );
}
