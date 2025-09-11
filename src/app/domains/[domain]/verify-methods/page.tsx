"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Globe, 
  Shield,
  ArrowLeft,
  Upload,
  FileText,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { QueryErrorBoundary } from '@/components/error';
import { toast } from 'react-hot-toast';

type VerificationMethod = 'DNS_TXT' | 'FILE_UPLOAD';

export default function DomainVerificationMethodsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedMethod, setSelectedMethod] = useState<VerificationMethod>('DNS_TXT');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string>('');

  const domainId = params.domain as string;

  // Get domain by ID
  const { data: domainResponse, isLoading, error, refetch } = trpc.domains.getById.useQuery(
    { id: domainId },
    {
      enabled: !!domainId,
    }
  );

  const domain = domainResponse?.data;

  // Generate verification token mutation
  const generateTokenMutation = trpc.domains.generateVerificationToken.useMutation({
    onSuccess: (data) => {
      setVerificationToken(data.token);
      toast.success('Verification token generated successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to generate verification token');
    },
  });

  // Submit verification attempt mutation
  const submitVerificationMutation = trpc.domains.submitVerificationAttempt.useMutation({
    onSuccess: () => {
      toast.success('Verification submitted successfully! Our team will review it within 24-48 hours.');
      router.push('/dashboard/domains');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit verification');
    },
  });

  const handleGenerateToken = async () => {
    if (!domain) return;
    
    try {
      await generateTokenMutation.mutateAsync({
        domainId: domain.id,
        method: selectedMethod
      });
    } catch (error) {
      console.error('Error generating token:', error);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const file = formData.get('verificationFile') as File;
      
      await submitVerificationMutation.mutateAsync({
        domainId: domain.id,
        method: selectedMethod,
        token: selectedMethod === 'DNS_TXT' ? verificationToken : undefined,
        file: selectedMethod === 'FILE_UPLOAD' ? file : undefined
      });
    } catch (error) {
      console.error('Error submitting verification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
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
                You don't have permission to verify this domain.
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

  // Check if domain is in DRAFT status (only allow verification from DRAFT)
  if (domain.status !== 'DRAFT') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Already Submitted</h1>
              <p className="text-gray-600 mb-6">
                {domain.status === 'PENDING_VERIFICATION' 
                  ? 'Your domain verification is already submitted and under review. Please wait for admin review.'
                  : `This domain is in ${domain.status} status and cannot be verified at this time.`
                }
              </p>
              <div className="space-y-2">
                <Button onClick={() => router.push(`/domains/${domainId}/verify`)} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Verification Status
                </Button>
                <Button onClick={() => router.push('/dashboard/domains')} variant="outline">
                  Back to My Domains
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context="Domain Verification Methods Page">
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50">
        <Header />
        <div className="py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <Button 
                onClick={() => router.push(`/domains/${domainId}/verify`)} 
                variant="ghost" 
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Domain Verification
              </Button>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Verify Domain Ownership
              </h1>
              <p className="text-gray-600 mb-4">
                <strong>Required:</strong> You must verify ownership of <strong>{domain.name}</strong> before it can be published to the marketplace.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">Why is verification required?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Ensures you actually own the domain you're listing</li>
                  <li>• Protects buyers from fraudulent listings</li>
                  <li>• Required by our marketplace policies</li>
                  <li>• Takes only 5-10 minutes to complete</li>
                </ul>
              </div>
            </div>

            {/* Verification Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* DNS TXT Method */}
              <Card className={selectedMethod === 'DNS_TXT' ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    DNS TXT Record
                  </CardTitle>
                  <CardDescription>
                    Add a TXT record to your domain's DNS settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="dns-txt"
                        name="method"
                        value="DNS_TXT"
                        checked={selectedMethod === 'DNS_TXT'}
                        onChange={(e) => setSelectedMethod(e.target.value as VerificationMethod)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="dns-txt" className="text-sm font-medium">
                        Use DNS TXT Record
                      </Label>
                    </div>
                    
                    {selectedMethod === 'DNS_TXT' && (
                      <div className="space-y-4">
                        <div>
                          <Label>Verification Token</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={verificationToken}
                              readOnly
                              placeholder="Click Generate Token to create verification token"
                              className="font-mono text-sm"
                            />
                            <Button
                              type="button"
                              onClick={() => copyToClipboard(verificationToken)}
                              disabled={!verificationToken}
                              variant="outline"
                              size="sm"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <Button
                          type="button"
                          onClick={handleGenerateToken}
                          disabled={generateTokenMutation.isLoading}
                          variant="outline"
                          className="w-full"
                        >
                          {generateTokenMutation.isLoading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Generate Token
                            </>
                          )}
                        </Button>
                        
                        {verificationToken && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Instructions:</h4>
                            <ol className="text-sm text-blue-800 space-y-1">
                              <li>1. Log into your domain registrar or DNS provider</li>
                              <li>2. Add a new TXT record with these details:</li>
                              <li className="ml-4">• <strong>Name:</strong> @ (or leave blank)</li>
                              <li className="ml-4">• <strong>Type:</strong> TXT</li>
                              <li className="ml-4">• <strong>Value:</strong> {verificationToken}</li>
                              <li>3. Wait 5-10 minutes for DNS propagation</li>
                              <li>4. Click "Submit Verification" below</li>
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* File Upload Method */}
              <Card className={selectedMethod === 'FILE_UPLOAD' ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                  <CardDescription>
                    Upload a verification file to your domain's root directory
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="file-upload"
                        name="method"
                        value="FILE_UPLOAD"
                        checked={selectedMethod === 'FILE_UPLOAD'}
                        onChange={(e) => setSelectedMethod(e.target.value as VerificationMethod)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="file-upload" className="text-sm font-medium">
                        Upload Verification File
                      </Label>
                    </div>
                    
                    {selectedMethod === 'FILE_UPLOAD' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="verificationFile">Verification File</Label>
                          <Input
                            id="verificationFile"
                            name="verificationFile"
                            type="file"
                            accept=".txt,.html"
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Upload a .txt or .html file (max 1MB)
                          </p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-2">Instructions:</h4>
                          <ol className="text-sm text-green-800 space-y-1">
                            <li>1. Download the verification file (will be provided after upload)</li>
                            <li>2. Upload it to your domain's root directory (public_html, www, etc.)</li>
                            <li>3. Ensure it's accessible at: {domain.name}/verification.txt</li>
                            <li>4. Click "Submit Verification" below</li>
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Submit Button */}
            <div className="mt-8">
              <form onSubmit={handleSubmitVerification}>
                <Button
                  type="submit"
                  disabled={isSubmitting || (selectedMethod === 'DNS_TXT' && !verificationToken)}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting Verification...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Submit Verification
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </QueryErrorBoundary>
  );
}
