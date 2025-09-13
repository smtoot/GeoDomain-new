'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Building, 
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  CreditCard,
  Eye,
  Heart,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WholesaleDomainCardProps {
  domain: {
    id: string;
    domain: {
      name: string;
      description?: string;
      category?: string;
      city?: string;
      state?: string;
      price?: number;
    };
    seller: {
      name?: string;
      company?: string;
    };
    addedAt: string;
    status: string;
  };
  wholesalePrice: number;
  onPurchase: (domain: any) => void;
  onView: (domain: any) => void;
  className?: string;
}

export function WholesaleDomainCard({
  domain,
  wholesalePrice,
  onPurchase,
  onView,
  className
}: WholesaleDomainCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING_APPROVAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SOLD':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        "border-2 hover:border-red-200",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Featured Badge */}
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg">
          <Star className="h-3 w-3 mr-1" />
          Wholesale
        </Badge>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
          onClick={() => setIsLiked(!isLiked)}
        >
          <Heart className={cn("h-4 w-4", isLiked ? "fill-red-500 text-red-500" : "text-gray-600")} />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-white"
        >
          <Share2 className="h-4 w-4 text-gray-600" />
        </Button>
      </div>

      <CardContent className="p-6">
        {/* Domain Name */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-200">
            {domain.domain.name}
          </h3>
          {domain.domain.description && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {domain.domain.description}
            </p>
          )}
        </div>

        {/* Domain Details */}
        <div className="space-y-3 mb-4">
          {domain.domain.category && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building className="h-4 w-4 text-gray-400" />
              <Badge variant="outline" className="text-xs">
                {domain.domain.category}
              </Badge>
            </div>
          )}
          
          {(domain.domain.city || domain.domain.state) && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>
                {domain.domain.city && domain.domain.state
                  ? `${domain.domain.city}, ${domain.domain.state}`
                  : domain.domain.state || 'National'
                }
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>Listed {formatDate(domain.addedAt)}</span>
          </div>
        </div>

        {/* Seller Information */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {domain.seller.name?.charAt(0) || domain.seller.company?.charAt(0) || 'S'}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {domain.seller.company || domain.seller.name || 'Verified Seller'}
              </p>
              <p className="text-xs text-gray-500">Trusted Seller</p>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Wholesale Price</p>
              <p className="text-2xl font-bold text-green-600">${wholesalePrice}</p>
            </div>
            <div className="text-right">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <TrendingUp className="h-3 w-3 mr-1" />
                Fixed Price
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(domain)}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
          
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => onPurchase(domain)}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
        </div>

        {/* Hover Effect Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br from-red-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-lg"
        )} />
      </CardContent>
    </Card>
  );
}
