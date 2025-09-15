'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { 
  Handshake, 
  DollarSign, 
  User, 
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Building
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { adminNotifications } from '@/components/notifications/ToastNotification';
import { formatDate } from '@/lib/utils';

export default function InquiryDealsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  // Mock data for inquiry deals (in real implementation, this would come from tRPC)
  const inquiryDeals = [
    {
      id: '1',
      amount: 2500.00,
      status: 'NEGOTIATING',
      createdAt: new Date(),
      closedAt: null,
      inquiry: {
        id: '1',
        domain: {
          name: 'example.com',
        },
      },
      buyer: {
        name: 'John Doe',
        email: 'john@example.com',
      },
      seller: {
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
    },
    {
      id: '2',
      amount: 5000.00,
      status: 'AGREED',
      createdAt: new Date(),
      closedAt: null,
      inquiry: {
        id: '2',
        domain: {
          name: 'business.com',
        },
      },
      buyer: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
      },
      seller: {
        name: 'Alice Brown',
        email: 'alice@example.com',
      },
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEGOTIATING': return 'bg-yellow-100 text-yellow-800';
      case 'AGREED': return 'bg-blue-100 text-blue-800';
      case 'PAYMENT_PENDING': return 'bg-orange-100 text-orange-800';
      case 'PAYMENT_CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NEGOTIATING': return <Clock className="h-4 w-4" />;
      case 'AGREED': return <CheckCircle className="h-4 w-4" />;
      case 'PAYMENT_PENDING': return <DollarSign className="h-4 w-4" />;
      case 'PAYMENT_CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'DISPUTED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const totalDeals = inquiryDeals.length;
  const totalValue = inquiryDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const negotiatingDeals = inquiryDeals.filter(deal => deal.status === 'NEGOTIATING').length;
  const completedDeals = inquiryDeals.filter(deal => deal.status === 'COMPLETED').length;

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inquiry Deals</h1>
            <p className="text-gray-600 mt-2">
              Manage deals created from inquiries in the hybrid system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Handshake className="h-6 w-6 text-blue-500" />
            <span className="text-sm text-gray-500">{totalDeals} Deals</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{totalDeals}</div>
                  <div className="text-sm text-gray-500">Total Deals</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{negotiatingDeals}</div>
                  <div className="text-sm text-gray-500">Negotiating</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{completedDeals}</div>
                  <div className="text-sm text-gray-500">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deals List */}
        <div className="space-y-4">
          {inquiryDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Deal Header */}
                    <div className="flex items-center gap-3">
                      <Handshake className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {deal.inquiry.domain.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Deal #{deal.id}
                        </p>
                      </div>
                      <Badge className={`${getStatusColor(deal.status)} flex items-center gap-1`}>
                        {getStatusIcon(deal.status)}
                        {deal.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Deal Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Amount</span>
                        <p className="text-lg font-semibold text-green-600">
                          ${deal.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Created</span>
                        <p className="font-medium">{formatDate(deal.createdAt)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Status</span>
                        <p className="font-medium">{deal.status.replace('_', ' ')}</p>
                      </div>
                    </div>

                    {/* Participants */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Buyer</span>
                        </div>
                        <p className="font-medium">{deal.buyer.name}</p>
                        <p className="text-sm text-gray-500">{deal.buyer.email}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Seller</span>
                        </div>
                        <p className="font-medium">{deal.seller.name}</p>
                        <p className="text-sm text-gray-500">{deal.seller.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDeal(deal)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/admin/deals/${deal.id}`)}
                      className="flex items-center gap-2"
                    >
                      <Handshake className="h-4 w-4" />
                      Manage Deal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Deal Details Modal */}
        {selectedDeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle>Deal Details</CardTitle>
                <CardDescription>
                  Detailed information about the inquiry deal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Deal Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Deal ID</Label>
                    <p className="font-medium">{selectedDeal.id}</p>
                  </div>
                  <div>
                    <Label>Amount</Label>
                    <p className="font-medium text-green-600">${selectedDeal.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge className={`${getStatusColor(selectedDeal.status)} flex items-center gap-1 w-fit`}>
                      {getStatusIcon(selectedDeal.status)}
                      {selectedDeal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="font-medium">{formatDate(selectedDeal.createdAt)}</p>
                  </div>
                </div>

                {/* Domain Info */}
                <div>
                  <Label>Domain</Label>
                  <p className="font-medium">{selectedDeal.inquiry.domain.name}</p>
                </div>

                {/* Participants */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Buyer</Label>
                    <p className="font-medium">{selectedDeal.buyer.name}</p>
                    <p className="text-sm text-gray-500">{selectedDeal.buyer.email}</p>
                  </div>
                  <div>
                    <Label>Seller</Label>
                    <p className="font-medium">{selectedDeal.seller.name}</p>
                    <p className="text-sm text-gray-500">{selectedDeal.seller.email}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDeal(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedDeal(null);
                      router.push(`/admin/deals/${selectedDeal.id}`);
                    }}
                  >
                    Manage Deal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {inquiryDeals.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Handshake className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Inquiry Deals
                </h3>
                <p className="text-gray-500">
                  No deals have been created from inquiries yet.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StandardPageLayout>
  );
}
