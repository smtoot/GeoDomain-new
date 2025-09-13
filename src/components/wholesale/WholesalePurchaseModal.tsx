'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ShoppingCart, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Globe,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getStripe } from '@/lib/stripe-client';

interface WholesalePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  wholesaleDomain: {
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
      email: string;
      company?: string;
    };
    addedAt: string;
  };
  wholesalePrice: number;
}

export function WholesalePurchaseModal({
  isOpen,
  onClose,
  wholesaleDomain,
  wholesalePrice,
}: WholesalePurchaseModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handlePurchase = async () => {
    if (!session?.user) {
      toast.error('Please log in to purchase domains');
      router.push('/login');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const response = await fetch('/api/wholesale/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wholesaleDomainId: wholesaleDomain.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create purchase');
      }

      // Initialize Stripe
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Confirm payment
      const { error } = await stripe.confirmPayment({
        clientSecret: data.paymentIntent.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/purchases?success=true`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      setStep('success');
      toast.success('Payment successful! You will receive transfer instructions via email.');

    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderDetailsStep = () => (
    <div className="space-y-6">
      {/* Domain Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Domain Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{wholesaleDomain.domain.name}</h3>
            {wholesaleDomain.domain.description && (
              <p className="text-gray-600 mt-2">{wholesaleDomain.domain.description}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {wholesaleDomain.domain.category && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Category:</span>
                <Badge variant="outline">{wholesaleDomain.domain.category}</Badge>
              </div>
            )}
            
            {(wholesaleDomain.domain.city || wholesaleDomain.domain.state) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Location:</span>
                <span>
                  {wholesaleDomain.domain.city && wholesaleDomain.domain.state
                    ? `${wholesaleDomain.domain.city}, ${wholesaleDomain.domain.state}`
                    : wholesaleDomain.domain.state || 'National'
                  }
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Listed:</span>
              <span>{formatDate(wholesaleDomain.addedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seller Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-600" />
            Seller Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-medium">
              {wholesaleDomain.seller.name || 'Domain Seller'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">{wholesaleDomain.seller.email}</span>
          </div>
          
          {wholesaleDomain.seller.company && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{wholesaleDomain.seller.company}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Wholesale Price</p>
              <p className="text-2xl font-bold text-green-600">${wholesalePrice}</p>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-200">
              Fixed Price
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Secure Purchase</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your payment is processed securely through Stripe. After payment confirmation, 
                you'll receive transfer instructions via email to complete the domain transfer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <CreditCard className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
        <p className="text-gray-600">
          You will be redirected to Stripe to complete your payment securely.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-xl font-bold text-gray-900">${wholesalePrice}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Purchase Successful!</h3>
        <p className="text-gray-600">
          Your payment has been processed successfully. You will receive transfer instructions 
          via email shortly.
        </p>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <h4 className="font-medium text-green-900 mb-2">Next Steps:</h4>
          <ol className="text-sm text-green-700 space-y-1 text-left">
            <li>1. Check your email for transfer instructions</li>
            <li>2. Contact the seller to initiate domain transfer</li>
            <li>3. Complete the transfer process with your registrar</li>
            <li>4. Update your domain settings once transferred</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-blue-600" />
            Purchase Wholesale Domain
          </DialogTitle>
          <DialogDescription>
            Complete your purchase of {wholesaleDomain.domain.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {step === 'details' && renderDetailsStep()}
          {step === 'payment' && renderPaymentStep()}
          {step === 'success' && renderSuccessStep()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              {step === 'success' ? 'Close' : 'Cancel'}
            </Button>

            {step === 'details' && (
              <Button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ${wholesalePrice}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            )}

            {step === 'success' && (
              <Button
                onClick={() => {
                  onClose();
                  router.push('/dashboard/purchases');
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                View Purchases
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
