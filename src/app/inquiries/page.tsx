'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { trpc } from '@/lib/trpc';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { QueryErrorBoundary } from '@/components/error';
import { 
  Search, 
  MessageSquare, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';

export default function BuyerInquiriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const { data: buyerStats, isLoading, error } = trpc.inquiries.getBuyerStats.useQuery();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING_REVIEW: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        label: 'Under Review',
        icon: <Clock className="h-4 w-4" />
      },
      FORWARDED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'Forwarded to Seller',
        icon: <MessageSquare className="h-4 w-4" />
      },
      OPEN: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Open for Communication',
        icon: <MessageSquare className="h-4 w-4" />
      },
      CHANGES_REQUESTED: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        label: 'Changes Requested',
        icon: <Clock className="h-4 w-4" />
      },
      REJECTED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        label: 'Rejected',
        icon: <XCircle className="h-4 w-4" />
      },
      COMPLETED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Completed',
        icon: <CheckCircle className="h-4 w-4" />
      },
      CONVERTED_TO_DEAL: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        label: 'Converted to Deal',
        icon: <CheckCircle className="h-4 w-4" />
      },
      CLOSED: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        label: 'Closed',
        icon: <XCircle className="h-4 w-4" />
      }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING_REVIEW;
    return (
      <Badge className={`${config.color} border flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const filteredInquiries = buyerStats?.recentInquiries?.filter(inquiry => {
    const matchesSearch = inquiry.domainName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  return (
    <QueryErrorBoundary context="Buyer Inquiries Page">
      <StandardPageLayout
        title="My Inquiries"
        description="Track the status of your domain inquiries and communicate with sellers"
        isLoading={isLoading}
        loadingText="Loading your inquiries..."
        error={error as any}
        className="min-h-screen bg-gray-50 py-8"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Inquiries</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {buyerStats?.stats.total || 0}
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
                    <p className="text-sm text-gray-600">Under Review</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {buyerStats?.stats.pending || 0}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {buyerStats?.stats.approved || 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Approval Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {buyerStats?.stats.approvalRate || 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
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
                <option value="PENDING_REVIEW">Under Review</option>
                <option value="FORWARDED">Forwarded</option>
                <option value="CHANGES_REQUESTED">Changes Requested</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Inquiries List */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <LoadingCardSkeleton key={i} lines={3} />
              ))}
            </div>
          ) : filteredInquiries.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matching inquiries' : 'No inquiries yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Start by browsing domains and submitting your first inquiry.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={() => router.push('/domains')}>
                    Browse Domains
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInquiries.map((inquiry) => (
                <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {inquiry.domainName}
                          </h3>
                          {getStatusBadge(inquiry.status)}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Price:</span>
                            <span>{formatPrice(inquiry.domainPrice)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Submitted: {formatDate(inquiry.createdAt)}</span>
                          </div>
                          
                          {inquiry.updatedAt !== inquiry.createdAt && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Updated: {formatDate(inquiry.updatedAt)}</span>
                            </div>
                          )}
                        </div>

                        {inquiry.lastModeration && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Admin Note:</span> {inquiry.lastModeration.adminNotes}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Reviewed: {formatDate(inquiry.lastModeration.reviewDate)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={() => router.push(`/inquiries/${inquiry.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        
                        {inquiry.status === 'FORWARDED' && (
                          <Button
                            onClick={() => router.push(`/inquiries/${inquiry.id}`)}
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Continue Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}