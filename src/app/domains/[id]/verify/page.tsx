"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  Globe, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Copy,
  RefreshCw,
  Upload,
  FileText,
  ExternalLink,
  Download
} from 'lucide-react';

// Mock data for demonstration
const mockDomain = {
  id: "1",
  name: "techstartup.com",
  verificationToken: "geodomainland-verification-abc123",
  status: "PENDING_VERIFICATION" as "PENDING_VERIFICATION" | "VERIFIED" | "FAILED",
  registrar: "GoDaddy",
  createdAt: new Date('2024-01-15'),
};

interface VerificationMethod {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  isRecommended: boolean;
}

const verificationMethods: VerificationMethod[] = [
  {
    id: 'dns',
    name: 'DNS TXT Record',
    description: 'Add a TXT record to your domain\'s DNS settings',
    isRecommended: true,
    instructions: [
      'Log in to your domain registrar or DNS provider',
      'Navigate to DNS management for your domain',
      'Add a new TXT record with the following details:',
      'Name/Host: @ (or leave empty)',
      'Value: geodomainland-verification-abc123',
      'TTL: 3600 (or default)',
      'Save the record and wait for DNS propagation (up to 24 hours)',
      'Click "Verify DNS" below to check if the record is active'
    ]
  },
  {
    id: 'file',
    name: 'File Upload',
    description: 'Upload a verification file to your domain\'s root directory',
    isRecommended: false,
    instructions: [
      'Download the verification file below',
      'Upload the file to your domain\'s root directory (public_html, www, or similar)',
      'Ensure the file is accessible at: https://yourdomain.com/geodomainland-verification.txt',
      'Click "Verify File" below to check if the file is accessible'
    ]
  }
];

interface DomainVerificationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DomainVerificationPage({ params }: DomainVerificationPageProps) {
  const [domainId, setDomainId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setDomainId(resolvedParams.id);
    });
  }, [params]);
  const router = useRouter();
  const [activeMethod, setActiveMethod] = useState('dns');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'checking' | 'success' | 'failed'>('pending');
  const [verificationMessage, setVerificationMessage] = useState('');

  const domain = mockDomain; // In real app, fetch from tRPC

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationStatus('checking');
    setVerificationMessage('Checking verification...');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulate success (in real app, this would check actual verification)
      setVerificationStatus('success');
      setVerificationMessage('Domain verification successful! Your domain is now verified.');
      
      // Redirect after a delay
      setTimeout(() => {
        router.push(`/domains/${domainId}`);
      }, 2000);
    } catch (error) {
      setVerificationStatus('failed');
      setVerificationMessage('Verification failed. Please check your settings and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show success feedback
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getStatusIcon = () => {
    switch (domain.status) {
      case 'VERIFIED':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'PENDING_VERIFICATION':
        return <Clock className="h-6 w-6 text-yellow-600" />;
      default:
        return <AlertCircle className="h-6 w-6 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (domain.status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING_VERIFICATION':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href={`/domains/${domainId}`} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Domain
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor()}>
                {domain.status}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Globe className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Verify Domain Ownership</h1>
              <p className="text-gray-600">Verify that you own {domain.name}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Domain Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Domain Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-lg">{domain.name}</div>
                    <div className="text-sm text-gray-600">Registrar: {domain.registrar}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon()}
                    <Badge variant={getStatusColor()}>
                      {domain.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Methods</CardTitle>
                <CardDescription>
                  Choose a method to verify your domain ownership
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeMethod} onValueChange={setActiveMethod} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    {verificationMethods.map((method) => (
                      <TabsTrigger key={method.id} value={method.id} className="flex items-center space-x-2">
                        <span>{method.name}</span>
                        {method.isRecommended && (
                          <Badge variant="secondary" className="text-xs">Recommended</Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {verificationMethods.map((method) => (
                    <TabsContent key={method.id} value={method.id} className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">{method.name}</h3>
                        <p className="text-gray-600 mb-4">{method.description}</p>
                        
                        <div className="space-y-4">
                          <h4 className="font-medium">Instructions:</h4>
                          <ol className="list-decimal list-inside space-y-2 text-sm">
                            {method.instructions.map((instruction, index) => (
                              <li key={index} className="text-gray-700">{instruction}</li>
                            ))}
                          </ol>
                        </div>

                        {method.id === 'dns' && (
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">DNS Record Details:</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Type:</span>
                                <code className="bg-white px-2 py-1 rounded text-sm">TXT</code>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Name:</span>
                                <code className="bg-white px-2 py-1 rounded text-sm">@</code>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Value:</span>
                                <div className="flex items-center space-x-2">
                                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                                    {domain.verificationToken}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(domain.verificationToken!)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {method.id === 'file' && (
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium mb-2">Verification File:</h4>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">File Name:</span>
                                <code className="bg-white px-2 py-1 rounded text-sm">geodomainland-verification.txt</code>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">File Content:</span>
                                <div className="flex items-center space-x-2">
                                  <code className="bg-white px-2 py-1 rounded text-sm font-mono">
                                    {domain.verificationToken}
                                  </code>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyToClipboard(domain.verificationToken!)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">URL:</span>
                                <code className="bg-white px-2 py-1 rounded text-sm">
                                  https://{domain.name}/geodomainland-verification.txt
                                </code>
                              </div>
                            </div>
                            <Button variant="outline" className="mt-4">
                              <Download className="h-4 w-4 mr-2" />
                              Download Verification File
                            </Button>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Verification Status */}
            {verificationStatus !== 'pending' && (
              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    {verificationStatus === 'checking' && <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />}
                    {verificationStatus === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {verificationStatus === 'failed' && <AlertCircle className="h-5 w-5 text-red-600" />}
                    <span className={verificationStatus === 'success' ? 'text-green-600' : verificationStatus === 'failed' ? 'text-red-600' : 'text-blue-600'}>
                      {verificationMessage}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Verification Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="w-full"
                  size="lg"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Domain
                    </>
                  )}
                </Button>
                
                <Button variant="outline" className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Status
                </Button>
              </CardContent>
            </Card>

            {/* Help & Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Having trouble with verification?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• DNS changes can take up to 24 hours</li>
                    <li>• Make sure you&apos;re editing the correct domain</li>
                    <li>• Check with your registrar for DNS access</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Documentation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Verification Token */}
            <Card>
              <CardHeader>
                <CardTitle>Verification Token</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <code className="block w-full bg-gray-100 p-3 rounded text-sm font-mono break-all">
                    {domain.verificationToken}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(domain.verificationToken!)}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Token
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
