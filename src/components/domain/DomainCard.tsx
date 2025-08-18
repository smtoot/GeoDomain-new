import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, Eye, MessageSquare } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  price: number;
  priceType: 'FIXED' | 'NEGOTIABLE' | 'MAKE_OFFER';
  description?: string;
  industry: string;
  state: string;
  city?: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'PUBLISHED' | 'PAUSED' | 'SOLD';
  logoUrl?: string;
  inquiryCount?: number;
  viewCount?: number;
  createdAt: Date;
  owner?: {
    id: string;
    name: string;
    company?: string;
  };
}

interface DomainCardProps {
  domain: Domain;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
  onInquiry?: (domainId: string) => void;
  onView?: (domainId: string) => void;
}

export function DomainCard({ 
  domain, 
  variant = 'default', 
  showActions = true,
  onInquiry,
  onView 
}: DomainCardProps) {
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getStatusColor = (status: Domain['status']) => {
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

  const getPriceTypeLabel = (priceType: Domain['priceType']) => {
    switch (priceType) {
      case 'FIXED':
        return 'Fixed';
      case 'NEGOTIABLE':
        return 'Negotiable';
      case 'MAKE_OFFER':
        return 'Make Offer';
      default:
        return priceType;
    }
  };

  if (variant === 'compact') {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <Link 
                  href={`/domains/${domain.id}`}
                  className="font-semibold text-blue-600 hover:text-blue-800 truncate"
                >
                  {domain.name}
                </Link>
              </div>
              <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                <span>{domain.city && `${domain.city}, `}{domain.state}</span>
                <span>•</span>
                <span>{domain.industry}</span>
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="font-bold text-green-600">
                {formatPrice(domain.price)}
              </div>
              <div className="text-xs text-gray-500">
                {getPriceTypeLabel(domain.priceType)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'detailed') {
    return (
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <Globe className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <CardTitle className="text-xl text-blue-600 truncate">
                  <Link href={`/domains/${domain.id}`} className="hover:text-blue-800">
                    {domain.name}
                  </Link>
                </CardTitle>
              </div>
              <CardDescription className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>{domain.city && `${domain.city}, `}{domain.state}</span>
              </CardDescription>
            </div>
            {domain.logoUrl && (
              <img
                src={domain.logoUrl}
                alt={`${domain.name} logo`}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-green-600">
              {formatPrice(domain.price)}
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={getStatusColor(domain.status)}>
                {domain.status}
              </Badge>
              <Badge variant="outline">
                {getPriceTypeLabel(domain.priceType)}
              </Badge>
            </div>
          </div>
          
          {domain.description && (
            <p className="text-gray-600 text-sm line-clamp-2">
              {domain.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              {domain.viewCount !== undefined && (
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4" />
                  <span>{domain.viewCount} views</span>
                </div>
              )}
              {domain.inquiryCount !== undefined && (
                <div className="flex items-center space-x-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{domain.inquiryCount} inquiries</span>
                </div>
              )}
            </div>
            <span>Listed {formatDate(domain.createdAt)}</span>
          </div>
          
          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onView?.(domain.id)}
              >
                View Details
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onInquiry?.(domain.id)}
              >
                Contact Seller
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-primary truncate">
              <Link href={`/domains/${domain.id}`} className="hover:text-blue-800">
                {domain.name}
              </Link>
            </CardTitle>
            <CardDescription className="mt-1">
              {domain.city && `${domain.city}, `}{domain.state}
            </CardDescription>
          </div>
          {domain.logoUrl && (
            <img
              src={domain.logoUrl}
              alt={`${domain.name} logo`}
              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(domain.price)}
          </div>
          <Badge variant={getStatusColor(domain.status)}>
            {domain.status}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{domain.industry}</Badge>
            <Badge variant="outline">{getPriceTypeLabel(domain.priceType)}</Badge>
          </div>
          {domain.inquiryCount !== undefined && (
            <span>{domain.inquiryCount} inquiries</span>
          )}
        </div>
        
        {showActions && (
          <div className="flex gap-2">
            <Button
              onClick={() => onView?.(domain.id)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              View Details
            </Button>
            <Button
              onClick={() => onInquiry?.(domain.id)}
              size="sm"
              className="flex-1"
            >
              Contact Seller
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
