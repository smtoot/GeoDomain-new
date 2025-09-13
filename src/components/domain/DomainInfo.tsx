import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  MapPin, 
  Building, 
  Calendar, 
  Shield, 
  User, 
  Mail, 
  Phone,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

interface DomainInfo {
  id: string;
  name: string;
  price: number;
  priceType: 'FIXED' | 'NEGOTIABLE' | 'MAKE_OFFER';
  description?: string;
  industry: string;
  state: string;
  city?: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'PUBLISHED' | 'PAUSED' | 'SOLD';
  verificationToken?: string;
  registrar?: string;
  expirationDate?: Date;
  createdAt: Date;
  publishedAt?: Date;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  logoUrl?: string;
  owner: {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
  };
  analytics?: {
    views: number;
    inquiries: number;
    lastViewed?: Date;
  };
}

interface DomainInfoProps {
  domain: DomainInfo;
  showOwnerInfo?: boolean;
  showTechnicalDetails?: boolean;
  showVerificationDetails?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onContactOwner?: () => void;
  onVerifyDomain?: () => void;
}

export function DomainInfo({
  domain,
  showOwnerInfo = true,
  showTechnicalDetails = true,
  showVerificationDetails = true,
  variant = 'default',
  onContactOwner,
  onVerifyDomain
}: DomainInfoProps) {
  const [copied, setCopied] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getStatusColor = (status: DomainInfo['status']) => {
    switch (status) {
      case 'VERIFIED':
      case 'PUBLISHED':
        return 'default';
      case 'PENDING_VERIFICATION':
        return 'secondary';
      case 'PAUSED':
        return 'outline';
      case 'SOLD':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriceTypeLabel = (priceType: DomainInfo['priceType']) => {
    switch (priceType) {
      case 'FIXED':
        return 'Fixed Price';
      case 'NEGOTIABLE':
        return 'Negotiable';
      case 'MAKE_OFFER':
        return 'Make Offer';
      default:
        return priceType;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      }
  };

  const getVerificationStatus = () => {
    switch (domain.status) {
      case 'VERIFIED':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          text: 'Verified',
          description: 'This domain has been verified by the owner',
          color: 'text-green-600'
        };
      case 'PENDING_VERIFICATION':
        return {
          icon: <Clock className="h-5 w-5 text-yellow-600" />,
          text: 'Pending Verification',
          description: 'Domain verification is in progress',
          color: 'text-yellow-600'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          text: 'Not Verified',
          description: 'This domain has not been verified',
          color: 'text-red-600'
        };
    }
  };

  if (variant === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">{domain.name}</span>
              </div>
              <Badge variant={getStatusColor(domain.status)}>
                {domain.status}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{domain.city && `${domain.city}, `}{domain.state}</span>
              <span className="font-semibold text-green-600">{formatPrice(domain.price)}</span>
            </div>
            
            {domain.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{domain.description}</p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{domain.industry}</span>
              <span>Listed {formatRelativeDate(domain.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>Domain Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Domain Name</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-semibold">{domain.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(domain.name)}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-600">Price</Label>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-green-600">{formatPrice(domain.price)}</span>
                  <Badge variant="outline" className="ml-2">
                    {getPriceTypeLabel(domain.priceType)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Industry</Label>
                <div className="mt-1">{domain.industry}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Location</Label>
                <div className="mt-1 flex items-center space-x-1">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span>{domain.city && `${domain.city}, `}{domain.state}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <div className="mt-1">
                  <Badge variant={getStatusColor(domain.status)}>
                    {domain.status}
                  </Badge>
                </div>
              </div>
            </div>

            {domain.description && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="mt-1 text-gray-700">{domain.description}</p>
              </div>
            )}

            {domain.tags && domain.tags.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {domain.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Details */}
        {showTechnicalDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Technical Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Registrar</Label>
                  <div className="mt-1">{domain.registrar || 'Not specified'}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Expiration Date</Label>
                  <div className="mt-1 flex items-center space-x-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>{domain.expirationDate ? formatDate(domain.expirationDate) : 'Not specified'}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created</Label>
                  <div className="mt-1">{formatDate(domain.createdAt)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Published</Label>
                  <div className="mt-1">{domain.publishedAt ? formatDate(domain.publishedAt) : 'Not published'}</div>
                </div>
              </div>

              {domain.analytics && (
                <div className="grid md:grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{domain.analytics.views}</div>
                    <div className="text-sm text-gray-600">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{domain.analytics.inquiries}</div>
                    <div className="text-sm text-gray-600">Total Inquiries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">
                      {domain.analytics.lastViewed ? `Last viewed ${formatRelativeDate(domain.analytics.lastViewed)}` : 'No views yet'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Verification Details */}
        {showVerificationDetails && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Verification Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                {getVerificationStatus().icon}
                <div>
                  <div className={`font-semibold ${getVerificationStatus().color}`}>
                    {getVerificationStatus().text}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getVerificationStatus().description}
                  </div>
                </div>
              </div>

              {domain.verificationToken && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Verification Token</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {domain.verificationToken}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(domain.verificationToken!)}
                    >
                      {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {domain.status === 'PENDING_VERIFICATION' && onVerifyDomain && (
                <Button onClick={onVerifyDomain} className="w-full">
                  Verify Domain Ownership
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Owner Information */}
        {showOwnerInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Owner Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <div className="mt-1">{domain.owner.name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Company</Label>
                  <div className="mt-1">{domain.owner.company || 'Not specified'}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{domain.owner.email}</span>
                  </div>
                </div>
                {domain.owner.phone && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{domain.owner.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {onContactOwner && (
                <Button onClick={onContactOwner} className="w-full">
                  Contact Owner
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <span>Domain Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Domain Name</Label>
            <div className="mt-1 font-semibold">{domain.name}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Price</Label>
            <div className="mt-1">
              <span className="text-xl font-bold text-green-600">{formatPrice(domain.price)}</span>
              <Badge variant="outline" className="ml-2">
                {getPriceTypeLabel(domain.priceType)}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm font-medium text-gray-600">Industry</Label>
            <div className="mt-1">{domain.industry}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Location</Label>
            <div className="mt-1">{domain.city && `${domain.city}, `}{domain.state}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Status</Label>
            <div className="mt-1">
              <Badge variant={getStatusColor(domain.status)}>
                {domain.status}
              </Badge>
            </div>
          </div>
        </div>

        {domain.description && (
          <div>
            <Label className="text-sm font-medium text-gray-600">Description</Label>
            <p className="mt-1 text-gray-700">{domain.description}</p>
          </div>
        )}

        <Separator />

        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-sm font-medium text-gray-600">Created</Label>
            <div className="mt-1">{formatDate(domain.createdAt)}</div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-600">Owner</Label>
            <div className="mt-1">{domain.owner.name}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
