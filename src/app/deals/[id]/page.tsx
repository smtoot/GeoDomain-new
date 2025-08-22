'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  FileText,
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  User,
  Globe,
  Download,
  Share2,
  Edit,
  Mail,
  Phone,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import DealDetail from '@/components/deals/DealDetail';
import PaymentInstructions from '@/components/deals/PaymentInstructions';
import PaymentVerification from '@/components/deals/PaymentVerification';
import DealStatusTracking from '@/components/deals/DealStatusTracking';

export default function DealDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const dealId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get navigation context from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const fromPage = searchParams.get('from');
  const adminPage = searchParams.get('page');

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Fetch deal data from tRPC API
  const { data: deal, isLoading: dealLoading, error: dealError } = trpc.deals.getDealById.useQuery(
    { dealId },
    { enabled: !!dealId }
  );

  // Fetch payment data from tRPC API
  const { data: paymentData, isLoading: paymentLoading } = trpc.payments.getPaymentStatus.useQuery(
    { dealId },
    { enabled: !!dealId }
  );

  // Show loading state
  if (dealLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (dealError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Deal Not Found</h2>
            <p className="text-gray-600 mb-4">
              The deal you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </p>
            <Button onClick={() => router.push('/deals')}>Back to Deals</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use mock data as fallback if API data is not available
  const dealData = deal || {
    id: dealId,
    inquiry: {
      buyerName: 'John Buyer',
      buyerEmail: 'john@buyer.com',
      buyerPhone: '+1 (555) 123-4567',
      buyerCompany: 'Tech Startup Inc.',
      budgetRange: '$5,000 - $10,000',
      intendedUse: 'E-commerce website for our new product line',
      timeline: '30 days',
      message: 'We are looking to purchase this domain for our upcoming e-commerce platform. We need it within 30 days to launch our product.',
      domain: {
        id: 'domain1',
        name: 'example.com',
        price: 7500,
        logoUrl: undefined,
        owner: {
          id: 'seller1',
          name: 'Jane Seller',
          email: 'jane@seller.com',
          phone: '+1 (555) 987-6543',
        },
      },
    },
    buyer: {
      id: 'buyer1',
      name: 'John Buyer',
      email: 'john@buyer.com',
      phone: '+1 (555) 123-4567',
    },
    seller: {
      id: 'seller1',
      name: 'Jane Seller',
      email: 'jane@seller.com',
      phone: '+1 (555) 987-6543',
    },
    agreedPrice: 5000,
    currency: 'USD',
    paymentMethod: 'ESCROW_COM',
    paymentInstructions: 'Please use Escrow.com for this transaction. Create a new escrow transaction with the following details:\n\n- Domain: example.com\n- Amount: $5,000 USD\n- Buyer: John Buyer (john@buyer.com)\n- Seller: Jane Seller (jane@seller.com)\n\nFollow the standard escrow process and notify admin once payment is initiated.',
    timeline: '30 days',
    terms: '1. Buyer agrees to pay $5,000 USD for the domain example.com\n2. Payment will be made through Escrow.com\n3. Domain transfer will be initiated within 5 business days of payment confirmation\n4. Both parties agree to cooperate with the transfer process\n5. Deal is subject to admin verification and approval\n6. Any disputes will be resolved through admin mediation',
    status: 'AGREED',
    adminNotes: 'Deal looks good, both parties have agreed to terms. Waiting for payment to be completed.',
    agreedDate: new Date('2024-01-15').toISOString(),
    paymentConfirmedDate: undefined,
    transferInitiatedDate: undefined,
    completedDate: undefined,
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-20').toISOString(),
  };

  const payment = paymentData || {
    id: 'payment1',
    status: 'PENDING',
    amount: 5000,
    currency: 'USD',
    paymentMethod: 'ESCROW_COM',
    externalReference: 'ESC-123456789',
    adminNotes: 'Payment proof submitted, under review',
    verificationDate: undefined,
    createdAt: new Date('2024-01-18').toISOString(),
  };

  const transferData = {
    status: 'PENDING',
    initiatedDate: undefined,
    completedDate: undefined,
  };

  const handleBack = () => {
    if (fromPage === 'admin' && adminPage === 'payments') {
      router.push('/admin/payments');
    } else {
      router.push('/deals');
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    // In real implementation, this would call tRPC mutation
    toast.success(`Deal status updated to ${newStatus}`);
  };

  const handleDownloadDocument = () => {
    // In real implementation, this would generate and download a PDF
    toast.success('Deal document downloaded');
  };

  const handleShare = () => {
    // In real implementation, this would share the deal
    toast.success('Deal shared successfully');
  };

  const handleEdit = () => {
    // In real implementation, this would navigate to edit page
    toast.success('Edit functionality coming soon');
  };

  const handleContactSupport = () => {
    // In real implementation, this would open support chat or email
    toast.success('Support contacted');
  };

  const handlePaymentProofSubmit = async (data: any) => {
    // In real implementation, this would call tRPC mutation
    toast.success('Payment proof uploaded successfully');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'AGREED': return 'default';
      case 'PAYMENT_PENDING': return 'secondary';
      case 'PAYMENT_CONFIRMED': return 'default';
      case 'TRANSFER_INITIATED': return 'default';
      case 'COMPLETED': return 'default';
      case 'DISPUTED': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AGREED': return <FileText className="h-4 w-4" />;
      case 'PAYMENT_PENDING': return <DollarSign className="h-4 w-4" />;
      case 'PAYMENT_CONFIRMED': return <CreditCard className="h-4 w-4" />;
      case 'TRANSFER_INITIATED': return <TrendingUp className="h-4 w-4" />;
      case 'COMPLETED': return <Calendar className="h-4 w-4" />;
      case 'DISPUTED': return <User className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {fromPage === 'admin' && adminPage === 'payments' ? 'Back to Admin Payments' : 'Back to Deals'}
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Deal Details</h1>
              <p className="text-gray-600">Deal ID: {dealId}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadDocument}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Deal Status */}
        <div className="flex items-center gap-4 mb-6">
          <Badge variant={getStatusBadgeVariant(dealData.status)} className="flex items-center gap-1">
            {getStatusIcon(dealData.status)}
            {dealData.status.replace('_', ' ')}
          </Badge>
          <div className="text-sm text-gray-600">
            Created: {formatDate(dealData.createdAt)}
          </div>
          <div className="text-sm text-gray-600">
            Last Updated: {formatDate(dealData.updatedAt)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DealDetail
            deal={dealData as any}
            userRole={(session?.user as any)?.role as 'BUYER' | 'SELLER' | 'ADMIN'}
            onBack={handleBack}
            onUpdateStatus={handleUpdateStatus}
            onDownloadDocument={handleDownloadDocument}
            onShare={handleShare}
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentInstructions
            deal={dealData as any}
            onCopyInstructions={() => toast.success('Instructions copied')}
            onDownloadInstructions={() => toast.success('Instructions downloaded')}
            onContactSupport={handleContactSupport}
          />
          
          <PaymentVerification
            deal={dealData as any}
            existingPayment={payment as any}
            onSubmit={handlePaymentProofSubmit}
            onViewProof={() => toast.success('Viewing payment proof')}
            onDownloadProof={() => toast.success('Downloading payment proof')}
          />
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <DealStatusTracking
            deal={dealData as any}
            paymentStatus={payment as any}
            transferStatus={transferData as any}
            onViewDetails={() => setActiveTab('overview')}
            onContactSupport={handleContactSupport}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deal Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Deal Agreement</h4>
                          <p className="text-sm text-gray-600">Complete deal terms and conditions</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Payment Instructions</h4>
                          <p className="text-sm text-gray-600">Detailed payment process</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Transfer Instructions</h4>
                          <p className="text-sm text-gray-600">Domain transfer process</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Invoice</h4>
                          <p className="text-sm text-gray-600">Payment invoice and receipt</p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <p className="font-medium mb-1">Document Access:</p>
                      <p>All deal documents are available for download. Keep these documents for your records and future reference.</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
