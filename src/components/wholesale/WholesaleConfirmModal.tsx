'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface WholesaleConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  domain: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    state?: string;
    city?: string;
    price: number;
    priceType: string;
  };
}

export function WholesaleConfirmModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  domain 
}: WholesaleConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch wholesale configuration
  const { data: config } = trpc.wholesale.getConfig.useQuery();

  // Add domain to wholesale mutation
  const addToWholesaleMutation = trpc.wholesale.addDomain.useMutation({
    onSuccess: () => {
      toast.success('Domain added to wholesale marketplace!');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add domain to wholesale');
    },
  });

  const handleConfirmWholesale = async () => {
    setIsSubmitting(true);
    try {
      await addToWholesaleMutation.mutateAsync({
        domainId: domain.id,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const wholesalePrice = config?.price || 299;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-red-600" />
            Sell as Wholesale
          </DialogTitle>
          <DialogDescription>
            Add this domain to the wholesale marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Domain Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg text-blue-600 mb-2">{domain.name}</h3>
            {domain.description && (
              <p className="text-sm text-gray-600 mb-2">{domain.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {domain.category && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {domain.category}
                </span>
              )}
              {domain.state && (
                <span>{domain.city && `${domain.city}, `}{domain.state}</span>
              )}
            </div>
          </div>

          {/* Wholesale Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Wholesale Sale Details:</p>
                <div className="flex items-center justify-between">
                  <span>Current Price:</span>
                  <span className="font-semibold">${domain.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wholesale Price:</span>
                  <span className="font-semibold text-red-600">${wholesalePrice.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Price Difference:</span>
                  <span className={domain.price > wholesalePrice ? 'text-red-600' : 'text-green-600'}>
                    {domain.price > wholesalePrice ? '-' : '+'}${Math.abs(domain.price - wholesalePrice).toLocaleString()}
                  </span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Important Notice */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Important:</p>
                <ul className="text-sm space-y-1">
                  <li>• Your domain will be listed at the fixed wholesale price of <strong>${wholesalePrice}</strong></li>
                  <li>• The domain will be reviewed by admin before going live</li>
                  <li>• Once sold, the transaction is final</li>
                  <li>• You can remove it from wholesale anytime before it's sold</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmWholesale}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Sell as Wholesale
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
