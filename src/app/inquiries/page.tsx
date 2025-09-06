'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MessageSquare, Calendar, DollarSign, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function InquiriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('all');

  // Handle unauthenticated state and role-based access
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role === 'SELLER') {
      // Redirect sellers to their proper inquiries page
      router.push('/dashboard/inquiries');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  // Don't render anything if unauthenticated or if seller (navigation handled by useEffect)
  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role === 'SELLER')) {
    return null;
  }

  const { data: inquiriesDataResponse, isLoading, error  } = trpc.inquiries.getMyInquiries.useQuery({
    limit: 50,
    status: statusFilter === 'all' ? undefined : statusFilter as any,
  });

  // Extract data from tRPC response structure
  const inquiriesData = inquiriesDataResponse?.data || inquiriesDataResponse;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'secondary';
      case 'APPROVED':
      case 'FORWARDED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'CHANGES_REQUESTED':
        return 'outline';
      case 'COMPLETED':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Under Review';
      case 'APPROVED':
        return 'Approved';
      case 'FORWARDED':
        return 'Forwarded to Seller';
      case 'REJECTED':
        return 'Rejected';
      case 'CHANGES_REQUESTED':
        return 'Changes Requested';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Inquiries</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Inquiries</h1>
        <p className="text-gray-600">Track the status of your domain inquiries</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING_REVIEW">Under Review</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="FORWARDED">Forwarded to Seller</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CHANGES_REQUESTED">Changes Requested</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inquiries List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : inquiriesData?.items && inquiriesData.items.length > 0 ? (
        <div className="space-y-4">
          {inquiriesData.items.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {inquiry.domain.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Submitted on {formatDate(inquiry.createdAt)}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                        {getStatusText(inquiry.status)}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        <span>Budget: {(inquiry as any).buyerInfo?.budgetRange || (inquiry as any).budgetRange}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Timeline: {(inquiry as any).buyerInfo?.timeline || (inquiry as any).timeline || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MessageSquare className="h-4 w-4" />
                        <span>{(inquiry as any).messages?.length || 0} messages</span>
                      </div>
                    </div>

                    {/* Anonymous Buyer ID for Sellers */}
                    {(inquiry as any).buyerInfo?.anonymousBuyerId && (
                      <div className="flex items-center gap-2 mb-4">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Buyer ID:</span>
                        <span className="font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                          {(inquiry as any).buyerInfo.anonymousBuyerId}
                        </span>
                      </div>
                    )}

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-1">Intended Use:</h4>
                      <p className="text-sm text-gray-600">{(inquiry as any).buyerInfo?.intendedUse || (inquiry as any).intendedUse}</p>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-1">Your Message:</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{(inquiry as any).message}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-48">
                    <Button
                      onClick={() => router.push(`/inquiries/${inquiry.id}`)}
                      className="w-full"
                    >
                      View Details
                    </Button>
                    {inquiry.status === 'FORWARDED' && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/inquiries/${inquiry.id}`)}
                        className="w-full"
                      >
                        Continue Conversation
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Search className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No inquiries found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'all' 
                ? "You haven't submitted any inquiries yet."
                : `No inquiries with status "${getStatusText(statusFilter)}"`
              }
            </p>
            {statusFilter === 'all' && (
              <Button onClick={() => router.push('/domains')}>
                Browse Domains
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
