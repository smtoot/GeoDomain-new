'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { ArrowLeft, FileText, AlertCircle } from 'lucide-react';
import DealAgreementForm from '@/components/deals/DealAgreementForm';
import { trpc } from '@/lib/trpc';

export default function CreateDealPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get inquiry ID from URL params
  const inquiryId = searchParams.get('inquiryId');
  const domainId = searchParams.get('domainId');

  // Fetch real inquiry data
  const { data: inquiryData, isLoading: isLoadingInquiry, error: inquiryError } = trpc.inquiries.getById.useQuery(
    { id: inquiryId! },
    { enabled: !!inquiryId }
  );

  // Extract inquiry data from tRPC response
  const inquiry = inquiryData?.json || inquiryData;

  const createDealMutation = trpc.deals.createAgreement.useMutation({
    onSuccess: (data) => {
      toast.success('Deal agreement created successfully!');
      router.push(`/deals/${data.dealId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create deal agreement');
    },
  });

  const handleSubmit = async (formData: any) => {
    if (!session?.user) {
      toast.error('You must be logged in to create a deal');
      return;
    }

    if (!inquiryId) {
      toast.error('Inquiry ID is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await createDealMutation.mutateAsync({
        inquiryId: inquiryId,
        agreedPrice: formData.agreedPrice,
        currency: formData.currency,
        paymentMethod: formData.paymentMethod,
        paymentInstructions: formData.paymentInstructions,
        timeline: formData.timeline,
        terms: formData.terms,
      });
    } catch (error) {
      } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">
              You must be logged in to create a deal agreement.
            </p>
            <Button onClick={() => router.push('/login')}>
              Login to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while fetching inquiry data
  if (isLoadingInquiry) {
    return (
      <QueryErrorBoundary context="Create Deal Page">
        <StandardPageLayout
          title="Create Deal Agreement"
          description="Loading inquiry details..."
          isLoading={true}
          loadingText="Loading inquiry details..."
        >
          <LoadingCardSkeleton />
        </StandardPageLayout>
      </QueryErrorBoundary>
    );
  }

  // Show error state if inquiry not found
  if (inquiryError || !inquiry) {
    return (
      <QueryErrorBoundary context="Create Deal Page">
        <StandardPageLayout
          title="Create Deal Agreement"
          description="Error loading inquiry details"
          error={inquiryError}
        >
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Inquiry Not Found</h2>
              <p className="text-gray-600 mb-4">
                The inquiry you're trying to create a deal for could not be found.
              </p>
              <Button onClick={handleBack}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        </StandardPageLayout>
      </QueryErrorBoundary>
    );
  }

  return (
    <QueryErrorBoundary context="Create Deal Page">
      <StandardPageLayout
        title="Create Deal Agreement"
        description="Set up the terms and conditions for your domain transaction"
        isLoading={isSubmitting}
        loadingText="Creating deal agreement..."
      >
        {/* Navigation */}
        <div className="mb-6">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Deal Agreement Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DealAgreementForm
                inquiryId={inquiry.id}
                domainName={inquiry.domain.name}
                buyerName={inquiry.buyerName}
                sellerName={inquiry.seller.name}
                originalPrice={inquiry.domain.price}
                onSubmit={handleSubmit}
                isLoading={isSubmitting}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Deal Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Domain</label>
                <p className="text-lg font-semibold text-primary">{inquiry.domain.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Original Price</label>
                <p className="text-lg font-semibold text-gray-900">${inquiry.domain.price.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Industry</label>
                <p className="text-gray-900">{inquiry.domain.industry || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Location</label>
                <p className="text-gray-900">
                  {inquiry.domain.city && `${inquiry.domain.city}, `}
                  {inquiry.domain.state || 'Not specified'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Buyer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{inquiry.buyerName}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{inquiry.buyerEmail}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Budget Range</label>
                <p className="text-gray-900">{inquiry.budgetRange}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Intended Use</label>
                <p className="text-gray-900">{inquiry.intendedUse}</p>
              </div>
            </CardContent>
          </Card>

          {/* Seller Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-gray-900">{inquiry.seller.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900">{inquiry.seller.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Creating a deal agreement is an important step. Make sure all terms are clear and agreed upon by both parties.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
