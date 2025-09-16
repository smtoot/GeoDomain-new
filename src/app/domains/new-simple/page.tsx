'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { ArrowLeft } from 'lucide-react';
import { ImprovedDomainFormSimple } from '@/components/forms/ImprovedDomainFormSimple';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CreateDomainPageSimple() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication
  if (sessionStatus === 'loading') {
    return (
      <StandardPageLayout
        title="Create Domain Listing (Simple)"
        description="Add a new domain to your portfolio"
        isLoading={true}
        loadingText="Loading..."
      />
    );
  }

  if (sessionStatus === 'unauthenticated') {
    router.push('/login?callbackUrl=/domains/new-simple');
    return null;
  }

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Domain listing created successfully!');
      router.push('/dashboard/domains');
    } catch (error) {
      toast.error('Failed to create domain listing');
      setIsSubmitting(false);
    }
  };

  return (
    <StandardPageLayout
      title="Create Domain Listing (Simple)"
      description="Add a new domain to your portfolio with our simplified form"
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
      </div>

      {/* Form */}
      <ImprovedDomainFormSimple
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        mode="create"
      />
    </StandardPageLayout>
  );
}
