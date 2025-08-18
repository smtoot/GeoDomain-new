'use client';

import { useState } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  MoreHorizontal,
  Globe,
  TrendingUp,
  MessageSquare,
  DollarSign
} from 'lucide-react';

// Mock data - replace with real API calls
const mockDomains = [
  {
    id: '1',
    name: 'techstartup.com',
    price: 15000,
    industry: 'Technology',
    state: 'California',
    city: 'San Francisco',
    status: 'VERIFIED',
    inquiryCount: 8,
    viewCount: 245,
    createdAt: '2024-01-15',
    lastInquiry: '2024-01-20'
  },
  {
    id: '2',
    name: 'realestatepro.com',
    price: 8500,
    industry: 'Real Estate',
    state: 'New York',
    city: 'New York',
    status: 'VERIFIED',
    inquiryCount: 5,
    viewCount: 189,
    createdAt: '2024-01-10',
    lastInquiry: '2024-01-18'
  },
  {
    id: '3',
    name: 'healthcareplus.com',
    price: 12000,
    industry: 'Healthcare',
    state: 'Texas',
    city: 'Houston',
    status: 'PENDING_VERIFICATION',
    inquiryCount: 0,
    viewCount: 67,
    createdAt: '2024-01-25',
    lastInquiry: null
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'VERIFIED':
      return <Badge variant="default" className="bg-green-100 text-green-800">Verified</Badge>;
    case 'PENDING_VERIFICATION':
      return <Badge variant="outline" className="text-yellow-600">Pending Verification</Badge>;
    case 'DRAFT':
      return <Badge variant="outline" className="text-gray-600">Draft</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function DashboardDomainsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredDomains = mockDomains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         domain.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || domain.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Domains</h1>
        <p className="text-gray-600 mt-2">Manage your domain listings and track their performance</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search domains..."
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
            <option value="VERIFIED">Verified</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="DRAFT">Draft</option>
          </select>
        </div>

        <Link href="/domains/new">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Domain
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold">{mockDomains.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold">{mockDomains.reduce((sum, domain) => sum + domain.viewCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold">{mockDomains.reduce((sum, domain) => sum + domain.inquiryCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(mockDomains.reduce((sum, domain) => sum + domain.price, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domains List */}
      <Card>
        <CardHeader>
          <CardTitle>Domain Listings</CardTitle>
          <CardDescription>
            {filteredDomains.length} of {mockDomains.length} domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredDomains.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first domain'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/domains/new">
                  <Button>Add Your First Domain</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDomains.map((domain) => (
                <div key={domain.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg text-blue-600 truncate">{domain.name}</h3>
                      {getStatusBadge(domain.status)}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-600">
                      <span>{domain.industry}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{domain.city && `${domain.city}, `}{domain.state}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>Listed {new Date(domain.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
                    <div className="text-right">
                      <div className="font-semibold text-lg">{formatCurrency(domain.price)}</div>
                      <div className="text-sm text-gray-600">
                        {domain.viewCount} views • {domain.inquiryCount} inquiries
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/domains/${domain.id}`}>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/domains/${domain.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your domains</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/domains/new">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <Plus className="h-6 w-6" />
                  <div>
                    <div className="font-medium">Add New Domain</div>
                    <div className="text-sm text-gray-600">List a new domain for sale</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <div>
                    <div className="font-medium">View Analytics</div>
                    <div className="text-sm text-gray-600">Track domain performance</div>
                  </div>
                </Button>
              </Link>

              <Link href="/dashboard">
                <Button variant="outline" className="w-full h-auto p-4 flex flex-col items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  <div>
                    <div className="font-medium">Manage Inquiries</div>
                    <div className="text-sm text-gray-600">Respond to buyer inquiries</div>
                  </div>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
