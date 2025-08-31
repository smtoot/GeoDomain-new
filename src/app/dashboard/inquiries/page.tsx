'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/main-layout';
import { 
  Search, 
  MessageSquare, 
  Filter,
  Eye,
  Reply,
  Clock,
  User
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

  const filteredInquiries = mockInquiries.filter((inquiry) => {
    const matchesSearch = !searchTerm ||
      inquiry.domainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewInquiry = (inquiryId: string) => {
    // TODO: Implement view inquiry details
    console.log('View inquiry:', inquiryId);
  };

  const handleRespond = (inquiryId: string) => {
    // TODO: Implement respond to inquiry
    console.log('Respond to inquiry:', inquiryId);
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
                    onClick={() => handleViewInquiry(inquiry.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleRespond(inquiry.id)}
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
    </DashboardLayout>
  );
}
