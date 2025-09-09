'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Search, 
  Filter, 
  Plus,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import DealListing from '@/components/deals/DealListing';

export default function DealsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Handle unauthenticated state with useEffect
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Don't render anything if unauthenticated (navigation handled by useEffect)
  if (status === 'unauthenticated') {
    return null;
  }

  // Fetch deals from tRPC API
  const { data: dealsDataResponse, isLoading, error  } = trpc.deals.getMyDeals.useQuery({
    status: statusFilter === 'ALL' ? undefined : statusFilter as any,
  });

  // Extract data from tRPC response structure
  const dealsData = dealsDataResponse?.json || dealsDataResponse;

  const deals = dealsData?.items || [];

  const handleViewDeal = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  const handleUpdateStatus = async (dealId: string, newStatus: string) => {
    // In real implementation, this would call tRPC mutation
    toast.success(`Deal status updated to ${newStatus}`);
  };

  const getStatusStats = () => {
    const stats = {
      total: deals.length,
      agreed: deals.filter(d => d.status === 'AGREED').length,
      paymentPending: deals.filter(d => d.status === 'PAYMENT_PENDING').length,
      completed: deals.filter(d => d.status === 'COMPLETED').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <QueryErrorBoundary context="Deals Page">
      <StandardPageLayout
        title="My Deals"
        description="Manage and track your domain purchase deals"
        isLoading={isLoading}
        loadingText="Loading deals..."
        error={error}
      >
        {/* Header Actions */}
        <div className="flex items-center justify-end mb-6">
          <Button onClick={() => router.push('/inquiries')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Inquiry
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Agreed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.agreed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.paymentPending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search deals by domain, buyer, or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AGREED">Agreed</SelectItem>
              <SelectItem value="PAYMENT_PENDING">Payment Pending</SelectItem>
              <SelectItem value="PAYMENT_CONFIRMED">Payment Confirmed</SelectItem>
              <SelectItem value="TRANSFER_INITIATED">Transfer Initiated</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DISPUTED">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deals List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your deals...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Deals</h3>
            <p className="text-gray-600 mb-4">There was an error loading your deals. Please try again.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <DealListing
          deals={deals as any}
          onViewDeal={handleViewDeal}
          onUpdateStatus={handleUpdateStatus}
          userRole={(session?.user as any)?.role as 'BUYER' | 'SELLER' | 'ADMIN'}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && deals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
            <p className="text-gray-600 mb-4">
              Start by creating an inquiry for a domain you&apos;re interested in purchasing.
            </p>
            <Button onClick={() => router.push('/inquiries')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Inquiry
            </Button>
          </CardContent>
        </Card>
      )}
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
