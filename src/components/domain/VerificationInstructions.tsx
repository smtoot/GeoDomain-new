import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  FileText, 
  Copy, 
  Download, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useState } from 'react';

interface VerificationInstructionsProps {
  domain: {
    name: string;
    verificationToken: string;
  };
  onVerify?: (method: 'DNS' | 'FILE') => void;
  onDownloadFile?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

interface VerificationMethod {
  id: 'DNS' | 'FILE';
  name: string;
  description: string;
  icon: React.ReactNode;
  isRecommended: boolean;
  instructions: string[];
  requirements: string[];
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const verificationMethods: VerificationMethod[] = [
  {
    id: 'DNS',
    name: 'DNS TXT Record',
    description: 'Add a TXT record to your domain\'s DNS settings',
    icon: <Globe className="h-5 w-5" />,
    isRecommended: true,
    difficulty: 'Easy',
    estimatedTime: '5-10 minutes',
    requirements: [
      'Access to your domain registrar or DNS provider',
      'Ability to add DNS records',
      'Basic understanding of DNS management'
    ],
    instructions: [
      'Log in to your domain registrar or DNS provider',
      'Navigate to DNS management for your domain',
      'Add a new TXT record with the following details:',
      'Name/Host: @ (or leave empty for root domain)',
      'Value: Your verification token (see below)',
      'TTL: 3600 (or default)',
      'Save the record and wait for DNS propagation',
      'Click "Verify DNS" below to check if the record is active'
    ]
  },
  {
    id: 'FILE',
    name: 'File Upload',
    description: 'Upload a verification file to your domain\'s root directory',
    icon: <FileText className="h-5 w-5" />,
    isRecommended: false,
    difficulty: 'Medium',
    estimatedTime: '10-15 minutes',
    requirements: [
      'Access to your web hosting control panel or FTP',
      'Ability to upload files to your domain root',
      'Basic understanding of file management'
    ],
    instructions: [
      'Download the verification file below',
      'Upload the file to your domain\'s root directory',
      'Common locations: public_html, www, or htdocs',
      'Ensure the file is accessible at: https://yourdomain.com/geodomainland-verification.txt',
      'Verify the file is publicly accessible by visiting the URL',
      'Click "Verify File" below to check if the file is accessible'
    ]
  }
];

export function VerificationInstructions({ 
  domain, 
  onVerify, 
  onDownloadFile, 
  showActions = true, 
  variant = 'default' 
}: VerificationInstructionsProps) {
  const [activeMethod, setActiveMethod] = useState<'DNS' | 'FILE'>('DNS');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'default';
      case 'Medium': return 'secondary';
      case 'Hard': return 'destructive';
      default: return 'outline';
    }
  };

  if (variant === 'compact') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Verification Methods</CardTitle>
          <CardDescription>
            Choose a method to verify ownership of {domain.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {verificationMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {method.icon}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{method.name}</span>
                      {method.isRecommended && (
                        <Badge variant="secondary" className="text-xs">Recommended</Badge>
                      )}
                      <Badge variant={getDifficultyColor(method.difficulty)} className="text-xs">
                        {method.difficulty}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
                {showActions && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVerify?.(method.id)}
                  >
                    Use {method.name}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-6 w-6" />
            <span>Domain Verification Instructions</span>
          </CardTitle>
          <CardDescription>
            Follow these steps to verify ownership of {domain.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeMethod} onValueChange={(value) => setActiveMethod(value as 'DNS' | 'FILE')}>
            <TabsList className="grid w-full grid-cols-2">
              {verificationMethods.map((method) => (
                <TabsTrigger key={method.id} value={method.id} className="flex items-center space-x-2">
                  {method.icon}
                  <span>{method.name}</span>
                  {method.isRecommended && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {verificationMethods.map((method) => (
              <TabsContent key={method.id} value={method.id} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{method.name}</h3>
                      <p className="text-gray-600">{method.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getDifficultyColor(method.difficulty)}>
                        {method.difficulty}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ~{method.estimatedTime}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Requirements</h4>
                        <ul className="mt-2 space-y-1">
                          {method.requirements.map((requirement, index) => (
                            <li key={index} className="text-sm text-blue-800 flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4" />
                              <span>{requirement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Step-by-Step Instructions</h4>
                    <ol className="space-y-3">
                      {method.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </span>
                          <span className="text-gray-700">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {method.id === 'DNS' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3">DNS Record Details</h4>
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
                              onClick={() => copyToClipboard(domain.verificationToken)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {method.id === 'FILE' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-3">Verification File Details</h4>
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
                              onClick={() => copyToClipboard(domain.verificationToken)}
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
                      {onDownloadFile && (
                        <Button variant="outline" className="mt-3" onClick={onDownloadFile}>
                          <Download className="h-4 w-4 mr-2" />
                          Download Verification File
                        </Button>
                      )}
                    </div>
                  )}

                  {showActions && (
                    <div className="flex space-x-3 pt-4">
                      <Button onClick={() => onVerify?.(method.id)} className="flex-1">
                        Verify with {method.name}
                      </Button>
                      <Button variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Documentation
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Instructions</CardTitle>
        <CardDescription>
          Choose a verification method for {domain.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeMethod} onValueChange={(value) => setActiveMethod(value as 'DNS' | 'FILE')}>
          <TabsList className="grid w-full grid-cols-2">
            {verificationMethods.map((method) => (
              <TabsTrigger key={method.id} value={method.id}>
                {method.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {verificationMethods.map((method) => (
            <TabsContent key={method.id} value={method.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{method.name}</h3>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {method.isRecommended && (
                    <Badge variant="secondary" className="text-xs">Recommended</Badge>
                  )}
                  <Badge variant={getDifficultyColor(method.difficulty)} className="text-xs">
                    {method.difficulty}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-sm">Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                  {method.instructions.slice(0, 4).map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

              {method.id === 'DNS' && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm">
                    <strong>DNS Record:</strong> TXT @ {domain.verificationToken}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => copyToClipboard(domain.verificationToken)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {method.id === 'FILE' && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm">
                    <strong>File:</strong> geodomainland-verification.txt
                    <br />
                    <strong>Content:</strong> {domain.verificationToken}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => copyToClipboard(domain.verificationToken)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {showActions && (
                <Button onClick={() => onVerify?.(method.id)} className="w-full">
                  Verify with {method.name}
                </Button>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
