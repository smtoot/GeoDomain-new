'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/main-layout';
import { 
  Search, 
  DollarSign, 
  Clock,
  Eye,
  MessageSquare,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Mock data - replace with real API calls
const mockDeals = [
  {
    id: '1',
    domainName: 'techstartup.com',
    buyerName: 'John Smith',
    buyerEmail: 'john@example.com',
    dealValue: 15000,
    status: 'negotiating',
    lastActivity: '2 hours ago',
    progress: 75,
    nextStep: 'Finalize payment terms'
  },
  {
    id: '2',
    domainName: 'realestatepro.net',
    buyerName: 'Sarah Johnson',
    buyerEmail: 'sarah@realestate.com',
    dealValue: 8500,
    status: 'pending_payment',
    lastActivity: '1 day ago',
    progress: 90,
    nextStep: 'Awaiting buyer payment'
  },
  {
    id: '3',
    domainName: 'healthcareplus.org',
    buyerName: 'Dr. Michael Brown',
    buyerEmail: 'michael@healthcare.org',
    dealValue: 12000,
    status: 'completed',
    lastActivity: '1 week ago',
    progress: 100,
    nextStep: 'Deal completed successfully'
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'negotiating':
      return <Badge variant="default" className="bg-orange-100 text-orange-800">Negotiating</Badge>;
    case 'pending_payment':
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Pending Payment</Badge>;
    case 'pending_transfer':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending Transfer</Badge>;
    case 'completed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
    case 'cancelled':
      return <Badge variant="outline" className="text-red-600">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'negotiating':
      return <Clock className="h-5 w-5 text-orange-500" />;
    case 'pending_payment':
      return <DollarSign className="h-5 w-5 text-blue-500" />;
    case 'pending_transfer':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'cancelled':
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

export default function DealsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredDeals = mockDeals.filter((deal) => {
    const matchesSearch = !searchTerm ||
      deal.domainName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.buyerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewDeal = (dealId: string) => {
    // TODO: Implement view deal details
    console.log('View deal:', dealId);
  };

  const handleContactBuyer = (dealId: string) => {
    // TODO: Implement contact buyer
    console.log('Contact buyer for deal:', dealId);
  };

  const totalDealValue = filteredDeals.reduce((sum, deal) => sum + deal.dealValue, 0);
  const activeDeals = filteredDeals.filter(deal => deal.status !== 'completed' && deal.status !== 'cancelled').length;

  return (
    <DashboardLayout>
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
                  ${totalDealValue.toLocaleString()}
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
                  {Math.round((filteredDeals.filter(d => d.status === 'completed').length / filteredDeals.length) * 100)}%
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
            <option value="negotiating">Negotiating</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="pending_transfer">Pending Transfer</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Deals List */}
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
                      {deal.domainName}
                    </h3>
                    {getStatusBadge(deal.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Buyer:</span> {deal.buyerName}
                    </div>
                    <div>
                      <span className="font-medium">Value:</span> ${deal.dealValue.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Last Activity:</span> {deal.lastActivity}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-medium">{deal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${deal.progress}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Next Step:</span> {deal.nextStep}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2 lg:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDeal(deal.id)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleContactBuyer(deal.id)}
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

        {filteredDeals.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deals found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'You don\'t have any active deals yet. Start by responding to buyer inquiries!'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
