"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Globe, 
  DollarSign,
  MapPin,
  Building,
  Eye,
  ArrowLeft,
  Shield,
  FileText
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { QueryErrorBoundary } from '@/components/error';
import { toast } from 'react-hot-toast';

export default function DomainVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const domainId = params.domain as string;

  // Get domain by ID
  const { data: domainResponse, isLoading, error, refetch } = trpc.domains.getById.useQuery(
    { id: domainId },
    {
      enabled: !!domainId,
    }
  );

  const domain = domainResponse?.data;

  // Submit for verification mutation
  const submitForVerificationMutation = trpc.domains.submitForVerification.useMutation({
    onSuccess: () => {
      toast.success('Domain submitted for verification successfully!');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit domain for verification');
    },
  });

  const handleSubmitForVerification = async () => {
    if (!domain) return;

    setIsSubmitting(true);
    try {
      await submitForVerificationMutation.mutateAsync(domain.id);
    } catch (error) {
      console.error('Error submitting for verification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Draft
          </Badge>
        );
      case 'PENDING_VERIFICATION':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Verification
          </Badge>
        );
      case 'VERIFIED':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Verified
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Domain Not Found</h1>
              <p className="text-gray-600 mb-6">
                The domain could not be found or you don't have permission to view it.
              </p>
              <Button onClick={() => router.push('/dashboard/domains')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Domains
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user owns this domain
  if (session?.user?.id !== domain.ownerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
              <p className="text-gray-600 mb-6">
                You don't have permission to view this domain.
              </p>
              <Button onClick={() => router.push('/dashboard/domains')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Domains
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context="Domain Verification Page">
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <Button 
                onClick={() => router.push('/dashboard/domains')} 
                variant="ghost" 
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Domains
              </Button>
              
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {domain.name}
                  </h1>
                  <div className="flex items-center gap-4 mb-4">
                    {getStatusBadge(domain.status)}
                    <Badge variant="outline">
                      {domain.priceType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Domain Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Domain Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Price</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(domain.price)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    <span className="text-sm text-gray-900">{domain.category}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Geographic Scope</span>
                    <span className="text-sm text-gray-900">{domain.geographicScope}</span>
                  </div>
                  
                  {domain.state && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">State</span>
                      <span className="text-sm text-gray-900">{domain.state}</span>
                    </div>
                  )}
                  
                  {domain.city && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">City</span>
                      <span className="text-sm text-gray-900">{domain.city}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">{formatDate(domain.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                  <CardDescription>
                    Your domain verification status and next steps
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {domain.status === 'DRAFT' && (
                    <div className="text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Domain Created Successfully
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your domain has been created and is ready for verification. You must verify ownership before it can be published to the marketplace.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Next Step Required:</strong> Verify domain ownership to publish your listing.
                        </p>
                      </div>
                      <Button 
                        onClick={() => router.push(`/domains/${encodeURIComponent(domain.name)}/verify-methods`)}
                        className="w-full"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Verify Domain Ownership
                      </Button>
                    </div>
                  )}

                  {domain.status === 'PENDING_VERIFICATION' && (
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Ownership Verification Submitted
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your domain ownership verification has been submitted and is under review by our admin team. This usually takes 24-48 hours.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-yellow-800">
                          <strong>What happens next?</strong><br />
                          • Admin will verify your domain ownership<br />
                          • You'll receive an email notification<br />
                          • Domain will be published if verification succeeds
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Important:</strong> You cannot submit another verification attempt while this one is pending. Please wait for admin review.
                        </p>
                      </div>
                    </div>
                  )}

                  {domain.status === 'VERIFIED' && (
                    <div className="text-center">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Domain Ownership Verified!
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your domain ownership has been verified. You can now publish it to the marketplace.
                      </p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-green-800">
                          <strong>Ready to Publish:</strong> Your domain is verified and ready to be published to the marketplace.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => router.push(`/domains/${encodeURIComponent(domain.name)}/publish`)}
                          className="w-full"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Publish to Marketplace
                        </Button>
                        <Button 
                          onClick={() => router.push(`/domains/${encodeURIComponent(domain.name)}/edit`)}
                          variant="outline"
                          className="w-full"
                        >
                          Edit Domain
                        </Button>
                      </div>
                    </div>
                  )}

                  {domain.status === 'REJECTED' && (
                    <div className="text-center">
                      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Verification Failed
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Your domain ownership verification failed. Please try a different verification method.
                      </p>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-red-800">
                          <strong>Common reasons for verification failure:</strong><br />
                          • DNS TXT record not found or incorrect<br />
                          • Verification file not accessible<br />
                          • Domain not properly configured<br />
                          • Verification token expired
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Button 
                          onClick={() => router.push(`/domains/${encodeURIComponent(domain.name)}/verify-methods`)}
                          className="w-full"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Try Different Verification Method
                        </Button>
                        <Button 
                          onClick={() => router.push(`/domains/${encodeURIComponent(domain.name)}/edit`)}
                          variant="outline"
                          className="w-full"
                        >
                          Edit Domain
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Domain Description */}
            {domain.description && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{domain.description}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </QueryErrorBoundary>
  );
}
