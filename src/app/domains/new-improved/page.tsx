'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { ImprovedDomainForm } from '@/components/forms/ImprovedDomainForm';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CreateDomainPageImproved() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Create domain mutation
  const createMutation = trpc.domains.create.useMutation({
    onSuccess: (data) => {
      toast.success('Domain listing created successfully!');
      router.push(`/domains/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create domain listing');
      setIsSubmitting(false);
    },
  });

  // Check authentication
  if (sessionStatus === 'loading') {
    return (
      <StandardPageLayout
        title="Create Domain Listing"
        description="Add a new domain to your portfolio"
        isLoading={true}
        loadingText="Loading..."
      >
        <LoadingCardSkeleton />
      </StandardPageLayout>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/login?callbackUrl=/domains/new-improved');
    return null;
  }

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      // Transform form data to match API expectations
      const domainData = {
        name: formData.name,
        price: formData.price,
        priceType: formData.priceType,
        description: formData.description,
        industry: formData.industry,
        category: formData.category,
        geographicScope: formData.geographicScope,
        state: formData.state,
        city: formData.city,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        tags: formData.tags,
      };

      await createMutation.mutateAsync(domainData);
    } catch (error) {
      // Error handling is done in the mutation's onError callback
      console.error('Domain creation error:', error);
    }
  };

  return (
    <QueryErrorBoundary context="Create Domain Page (Improved)">
      <StandardPageLayout
        title="Create Domain Listing"
        description="Add a new domain to your portfolio with our improved form"
        isLoading={false}
      >
        {/* Header Actions */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard/domains">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Domains
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {previewMode ? 'Edit Mode' : 'Preview Mode'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <ImprovedDomainForm
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          mode="create"
        />

        {/* Help Section */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium mb-2">Domain Name Tips:</h4>
              <ul className="space-y-1">
                <li>• Use the exact domain name you own</li>
                <li>• Include the extension (.com, .net, etc.)</li>
                <li>• Avoid typos and ensure accuracy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Pricing Guidelines:</h4>
              <ul className="space-y-1">
                <li>• Research similar domains for pricing</li>
                <li>• Consider domain age and traffic</li>
                <li>• Set competitive but realistic prices</li>
              </ul>
            </div>
          </div>
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
