import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Shield, 
  RefreshCw,
  ExternalLink,
  Copy
} from 'lucide-react';
import { useState } from 'react';

interface VerificationStatusProps {
  domain: {
    id: string;
    name: string;
    status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
    verificationToken?: string;
    verificationMethod?: 'DNS' | 'FILE';
    lastVerifiedAt?: Date;
    verificationExpiresAt?: Date;
  };
  onVerify?: () => void;
  onRefresh?: () => void;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function VerificationStatus({ 
  domain, 
  onVerify, 
  onRefresh, 
  showActions = true, 
  variant = 'default' 
}: VerificationStatusProps) {
  const [copied, setCopied] = useState(false);

  const getStatusInfo = () => {
    switch (domain.status) {
      case 'VERIFIED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          color: 'default' as const,
          title: 'Domain Verified',
          description: 'This domain has been successfully verified',
          actionText: 'Re-verify Domain',
          showToken: false
        };
      case 'PENDING_VERIFICATION':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          color: 'secondary' as const,
          title: 'Verification Pending',
          description: 'Domain verification is in progress',
          actionText: 'Check Status',
          showToken: true
        };
      case 'FAILED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          color: 'destructive' as const,
          title: 'Verification Failed',
          description: 'Domain verification failed. Please try again.',
          actionText: 'Retry Verification',
          showToken: true
        };
      case 'EXPIRED':
        return {
          icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
          color: 'destructive' as const,
          title: 'Verification Expired',
          description: 'Domain verification has expired. Please re-verify.',
          actionText: 'Re-verify Domain',
          showToken: true
        };
      default:
        return {
          icon: <Shield className="h-5 w-5 text-gray-600" />,
          color: 'outline' as const,
          title: 'Not Verified',
          description: 'This domain has not been verified yet',
          actionText: 'Verify Domain',
          showToken: true
        };
    }
  };

  const statusInfo = getStatusInfo();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
        {statusInfo.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {statusInfo.title}
            </span>
            <Badge variant={statusInfo.color} className="text-xs">
              {domain.status}
            </Badge>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {statusInfo.description}
          </p>
        </div>
        {showActions && (
          <Button
            variant="outline"
            size="sm"
            onClick={onVerify}
            className="shrink-0"
          >
            {statusInfo.actionText}
          </Button>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {statusInfo.icon}
            <span>Domain Verification</span>
          </CardTitle>
          <CardDescription>
            Verification status for {domain.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{statusInfo.title}</h4>
              <p className="text-sm text-gray-600">{statusInfo.description}</p>
            </div>
            <Badge variant={statusInfo.color}>
              {domain.status}
            </Badge>
          </div>

          {domain.lastVerifiedAt && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last verified:</span> {formatDate(domain.lastVerifiedAt)}
            </div>
          )}

          {domain.verificationExpiresAt && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Expires:</span> {formatDate(domain.verificationExpiresAt)}
            </div>
          )}

          {statusInfo.showToken && domain.verificationToken && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Verification Token:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(domain.verificationToken!)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <code className="block w-full bg-gray-100 p-2 rounded text-sm font-mono break-all">
                {domain.verificationToken}
              </code>
            </div>
          )}

          {showActions && (
            <div className="flex space-x-2 pt-2">
              <Button onClick={onVerify} className="flex-1">
                {statusInfo.actionText}
              </Button>
              {onRefresh && (
                <Button variant="outline" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {statusInfo.icon}
          <span>Verification Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">{statusInfo.title}</h4>
            <p className="text-sm text-gray-600">{statusInfo.description}</p>
          </div>
          <Badge variant={statusInfo.color}>
            {domain.status}
          </Badge>
        </div>

        {statusInfo.showToken && domain.verificationToken && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Verification Token:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(domain.verificationToken!)}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <code className="block w-full bg-gray-100 p-2 rounded text-sm font-mono break-all">
              {domain.verificationToken}
            </code>
          </div>
        )}

        {showActions && (
          <div className="flex space-x-2">
            <Button onClick={onVerify} className="flex-1">
              {statusInfo.actionText}
            </Button>
            {onRefresh && (
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
