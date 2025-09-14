'use client';

import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  X, 
  Search, 
  Globe, 
  DollarSign, 
  Building, 
  MapPin, 
  CheckCircle, 
  AlertCircle,
  Package,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WholesaleDomainModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Domain {
  id: string;
  name: string;
  description?: string;
  category?: string;
  state?: string;
  city?: string;
  geographicScope: string;
  status: string;
  price: number;
  priceType: string;
}

export function WholesaleDomainModal({ onClose, onSuccess }: WholesaleDomainModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch wholesale configuration
  const { data: config } = trpc.wholesale.getConfig.useQuery();

  // Fetch seller's domains
  const { data: domainsData, isLoading: domainsLoading, error: domainsError } = trpc.domains.getMyDomains.useQuery({
    page: 1,
    limit: 100,
  });

  // Debug logging
  console.log('WholesaleDomainModal - domainsData:', domainsData);
  console.log('WholesaleDomainModal - domainsError:', domainsError);
  console.log('WholesaleDomainModal - domains:', domainsData?.domains?.map(d => ({ name: d.name, status: d.status })));

  // Add domain to wholesale mutation
  const addToWholesaleMutation = trpc.wholesale.addDomain.useMutation({
    onSuccess: () => {
      toast.success('Domain added to wholesale marketplace!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add domain to wholesale');
    },
  });

  // Filter domains based on search term and eligibility
  const eligibleDomains = domainsData?.domains?.filter((domain) => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase());
    // Allow domains that are verified, published, or active (not draft, rejected, or deleted)
    const isEligible = ['VERIFIED', 'PUBLISHED', 'ACTIVE'].includes(domain.status) && 
                      !['DRAFT', 'REJECTED', 'DELETED', 'PENDING_VERIFICATION'].includes(domain.status);
    return matchesSearch && isEligible;
  }) || [];

  const handleAddToWholesale = async () => {
    if (!selectedDomain) return;

    setIsSubmitting(true);
    try {
      await addToWholesaleMutation.mutateAsync({
        domainId: selectedDomain.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDomainSelect = (domain: Domain) => {
    setSelectedDomain(domain);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-red-600" />
            Add Domain to Wholesale Marketplace
          </DialogTitle>
          <DialogDescription>
            Select a verified domain to add to the wholesale marketplace at ${config?.price || 299}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search your domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Only verified domains are eligible for the wholesale marketplace. 
                Domains will be reviewed by admin before going live.
              </AlertDescription>
            </Alert>
          </div>

          {/* Domain Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Domain</h3>
            
            {domainsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : eligibleDomains.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No domains found' : 'No eligible domains'}
                </h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? 'Try adjusting your search term.'
                    : 'You need at least one verified, published, or active domain to add to wholesale. Check your domain status in the domains page.'
                  }
                </p>
                {domainsData?.domains && domainsData.domains.length > 0 && (
                  <div className="mt-4 text-sm text-gray-500">
                    <p>Found {domainsData.domains.length} total domains:</p>
                    <ul className="mt-2 space-y-1">
                      {domainsData.domains.slice(0, 3).map((domain) => (
                        <li key={domain.id} className="flex justify-between">
                          <span>{domain.name}</span>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{domain.status}</span>
                        </li>
                      ))}
                      {domainsData.domains.length > 3 && (
                        <li className="text-xs text-gray-400">... and {domainsData.domains.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {eligibleDomains.map((domain) => (
                  <Card 
                    key={domain.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedDomain?.id === domain.id 
                        ? 'ring-2 ring-red-500 bg-red-50' 
                        : 'hover:border-red-300'
                    }`}
                    onClick={() => handleDomainSelect(domain)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {domain.name}
                        </h4>
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          Verified
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        {domain.category && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            <span>{domain.category}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {domain.city && domain.state 
                              ? `${domain.city}, ${domain.state}`
                              : domain.state || 'National'
                            }
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Current: ${domain.price} → Wholesale: ${config?.price || 299}</span>
                        </div>
                      </div>
                      
                      {domain.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {domain.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Selected Domain Summary */}
          {selectedDomain && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Selected Domain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Domain:</span>
                    <span className="font-semibold text-red-600">{selectedDomain.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Price:</span>
                    <span>${selectedDomain.price}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Wholesale Price:</span>
                    <span className="font-semibold text-green-600">${config?.price || 299}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      Pending Approval
                    </Badge>
                  </div>
                </div>
                
                <Alert className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This domain will be submitted for admin approval before appearing in the wholesale marketplace.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddToWholesale}
              disabled={!selectedDomain || isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? 'Adding...' : 'Add to Wholesale'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
