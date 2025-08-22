'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Globe,
  FileText,
  CreditCard,
  ArrowRight
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';

interface DealStatusTrackingProps {
  deal: {
    id: string;
    status: string;
    agreedPrice: number;
    currency: string;
    paymentMethod: string;
    timeline: string;
    agreedDate?: string;
    paymentConfirmedDate?: string;
    transferInitiatedDate?: string;
    completedDate?: string;
    createdAt: string;
    inquiry: {
      domain: {
        name: string;
      };
    };
  };
  paymentStatus?: {
    status: string;
    amount?: number;
    verificationDate?: string;
  };
  transferStatus?: {
    status: string;
    initiatedDate?: string;
    completedDate?: string;
  };
  onViewDetails?: () => void;
  onContactSupport?: () => void;
}

export default function DealStatusTracking({
  deal,
  paymentStatus,
  transferStatus,
  onViewDetails,
  onContactSupport
}: DealStatusTrackingProps) {
  const getStatusStep = (status: string) => {
    switch (status) {
      case 'AGREED': return 1;
      case 'PAYMENT_PENDING': return 2;
      case 'PAYMENT_CONFIRMED': return 3;
      case 'TRANSFER_INITIATED': return 4;
      case 'COMPLETED': return 5;
      case 'DISPUTED': return 0;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGREED': return 'text-blue-600 bg-blue-50';
      case 'PAYMENT_PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'PAYMENT_CONFIRMED': return 'text-green-600 bg-green-50';
      case 'TRANSFER_INITIATED': return 'text-purple-600 bg-purple-50';
      case 'COMPLETED': return 'text-green-600 bg-green-50';
      case 'DISPUTED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AGREED': return <CheckCircle className="h-5 w-5" />;
      case 'PAYMENT_PENDING': return <Clock className="h-5 w-5" />;
      case 'PAYMENT_CONFIRMED': return <CheckCircle className="h-5 w-5" />;
      case 'TRANSFER_INITIATED': return <TrendingUp className="h-5 w-5" />;
      case 'COMPLETED': return <CheckCircle className="h-5 w-5" />;
      case 'DISPUTED': return <AlertCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'ESCROW_COM': return 'Escrow.com';
      case 'PAYPAL': return 'PayPal';
      case 'WIRE_TRANSFER': return 'Wire Transfer';
      case 'CRYPTO': return 'Cryptocurrency';
      case 'OTHER': return 'Other';
      default: return method;
    }
  };

  const currentStep = getStatusStep(deal.status);
  const totalSteps = 5;

  const steps = [
    {
      id: 1,
      title: 'Deal Agreed',
      description: 'Terms agreed between buyer and seller',
      icon: <CheckCircle className="h-4 w-4" />,
      date: deal.agreedDate,
      completed: currentStep >= 1,
      active: currentStep === 1,
    },
    {
      id: 2,
      title: 'Payment Pending',
      description: 'Waiting for buyer to complete payment',
      icon: <DollarSign className="h-4 w-4" />,
      date: null,
      completed: currentStep >= 2,
      active: currentStep === 2,
    },
    {
      id: 3,
      title: 'Payment Confirmed',
      description: 'Payment verified by admin',
      icon: <CheckCircle className="h-4 w-4" />,
      date: deal.paymentConfirmedDate,
      completed: currentStep >= 3,
      active: currentStep === 3,
    },
    {
      id: 4,
      title: 'Transfer Initiated',
      description: 'Domain transfer process started',
      icon: <TrendingUp className="h-4 w-4" />,
      date: deal.transferInitiatedDate,
      completed: currentStep >= 4,
      active: currentStep === 4,
    },
    {
      id: 5,
      title: 'Deal Completed',
      description: 'Domain transfer completed successfully',
      icon: <CheckCircle className="h-4 w-4" />,
      date: deal.completedDate,
      completed: currentStep >= 5,
      active: currentStep === 5,
    },
  ];

  const getEstimatedCompletion = () => {
    if (deal.status === 'COMPLETED') return 'Completed';
    if (deal.status === 'DISPUTED') return 'Under Review';
    
    const timeline = deal.timeline.toLowerCase();
    if (timeline.includes('day')) {
      const days = parseInt(timeline.match(/\d+/)?.[0] || '30');
      const startDate = deal.agreedDate ? new Date(deal.agreedDate) : new Date(deal.createdAt);
      const estimatedDate = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));
      return formatDate(estimatedDate.toISOString());
    }
    
    return 'Within timeline';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Deal Status Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(deal.agreedPrice, deal.currency)}
              </div>
              <div className="text-sm text-blue-700">Deal Value</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="font-semibold text-green-600">
                  {getPaymentMethodLabel(deal.paymentMethod)}
                </span>
              </div>
              <div className="text-sm text-green-700">Payment Method</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-600">
                {deal.inquiry.domain.name}
              </div>
              <div className="text-sm text-purple-700">Domain</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(deal.status)} flex items-center gap-1`}>
                {getStatusIcon(deal.status)}
                {deal.status.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="text-sm text-gray-600">
              Deal ID: {deal.id.slice(-8)}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Timeline:</span>
              <span className="font-medium">{deal.timeline}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Estimated Completion:</span>
              <span className="font-medium">{getEstimatedCompletion()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Deal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`absolute left-6 top-8 w-0.5 h-12 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
                
                <div className="flex items-start gap-4">
                  {/* Step Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                    step.completed 
                      ? 'bg-green-500 text-white' 
                      : step.active 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {step.icon}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${
                        step.completed || step.active ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h3>
                      {step.completed && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      step.completed || step.active ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                    
                    {step.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Completed: {formatDate(step.date)}
                      </p>
                    )}
                    
                    {step.active && (
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          Current Step
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Status */}
      {paymentStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    paymentStatus.status === 'CONFIRMED' ? 'default' :
                    paymentStatus.status === 'PENDING' ? 'secondary' :
                    'destructive'
                  }>
                    {paymentStatus.status}
                  </Badge>
                </div>
                
                {paymentStatus.amount && (
                  <div className="text-sm text-gray-600">
                    Amount: {formatPrice(paymentStatus.amount, deal.currency)}
                  </div>
                )}
              </div>
              
              {paymentStatus.verificationDate && (
                <div className="text-sm text-gray-600">
                  Verified: {formatDate(paymentStatus.verificationDate)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Status */}
      {transferStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Transfer Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={
                  transferStatus.status === 'COMPLETED' ? 'default' :
                  transferStatus.status === 'IN_PROGRESS' ? 'secondary' :
                  'outline'
                }>
                  {transferStatus.status.replace('_', ' ')}
                </Badge>
              </div>
              
              {transferStatus.initiatedDate && (
                <div className="text-sm text-gray-600">
                  Initiated: {formatDate(transferStatus.initiatedDate)}
                </div>
              )}
              
              {transferStatus.completedDate && (
                <div className="text-sm text-gray-600">
                  Completed: {formatDate(transferStatus.completedDate)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            {onViewDetails && (
              <Button onClick={onViewDetails} className="flex items-center gap-2">
                View Full Details
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
            
            {onContactSupport && (
              <Button variant="outline" onClick={onContactSupport}>
                Contact Support
              </Button>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Need Help?</p>
                <p>If you have any questions about your deal status or need assistance, 
                please contact our support team. We&apos;re here to help!</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
