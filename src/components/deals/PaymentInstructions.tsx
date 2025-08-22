'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Download,
  Mail,
  Phone,
  Building,
  Globe,
  FileText
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface PaymentInstructionsProps {
  deal: {
    id: string;
    agreedPrice: number;
    currency: string;
    paymentMethod: string;
    paymentInstructions: string;
    timeline: string;
    status: string;
    inquiry: {
      domain: {
        name: string;
      };
    };
  };
  onCopyInstructions?: () => void;
  onDownloadInstructions?: () => void;
  onContactSupport?: () => void;
}

export default function PaymentInstructions({
  deal,
  onCopyInstructions,
  onDownloadInstructions,
  onContactSupport
}: PaymentInstructionsProps) {
  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'ESCROW_COM':
        return {
          name: 'Escrow.com',
          description: 'Secure escrow service for domain transactions',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          link: 'https://www.escrow.com',
          instructions: [
            'Visit Escrow.com and create an account',
            'Start a new transaction for domain purchase',
            'Enter the domain name and agreed price',
            'Follow the escrow process instructions',
            'Complete payment through the escrow service'
          ]
        };
      case 'PAYPAL':
        return {
          name: 'PayPal',
          description: 'Fast and secure online payments',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          link: 'https://www.paypal.com',
          instructions: [
            'Log in to your PayPal account',
            'Send payment to the seller\'s PayPal email',
            'Include the domain name in the payment note',
            'Select "Goods and Services" for protection',
            'Complete the payment transaction'
          ]
        };
      case 'WIRE_TRANSFER':
        return {
          name: 'Wire Transfer',
          description: 'Direct bank transfer',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'bg-green-50 border-green-200 text-green-800',
          link: null,
          instructions: [
            'Contact your bank for wire transfer',
            'Use the provided bank account details',
            'Include the domain name in the reference',
            'Complete the wire transfer',
            'Keep the transfer confirmation'
          ]
        };
      case 'CRYPTO':
        return {
          name: 'Cryptocurrency',
          description: 'Digital currency payment',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'bg-orange-50 border-orange-200 text-orange-800',
          link: null,
          instructions: [
            'Use the provided cryptocurrency wallet address',
            'Send the exact amount in the specified cryptocurrency',
            'Include the domain name in the transaction note',
            'Wait for blockchain confirmation',
            'Keep the transaction hash for verification'
          ]
        };
      case 'OTHER':
        return {
          name: 'Other Method',
          description: 'Custom payment arrangement',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'bg-gray-50 border-gray-200 text-gray-800',
          link: null,
          instructions: [
            'Follow the specific payment instructions provided',
            'Contact the seller for any clarification',
            'Keep all payment documentation',
            'Notify admin once payment is completed'
          ]
        };
      default:
        return {
          name: method,
          description: 'Payment method',
          icon: <CreditCard className="h-5 w-5" />,
          color: 'bg-gray-50 border-gray-200 text-gray-800',
          link: null,
          instructions: []
        };
    }
  };

  const paymentInfo = getPaymentMethodInfo(deal.paymentMethod);

  const handleCopyInstructions = () => {
    if (onCopyInstructions) {
      onCopyInstructions();
    } else {
      navigator.clipboard.writeText(deal.paymentInstructions);
      toast.success('Payment instructions copied to clipboard');
    }
  };

  const handleDownloadInstructions = () => {
    if (onDownloadInstructions) {
      onDownloadInstructions();
    } else {
      // Create a text file with payment instructions
      const content = `Payment Instructions for ${deal.inquiry.domain.name}

Deal ID: ${deal.id}
                Amount: ${formatPrice(Number(deal.agreedPrice), deal.currency)}
Payment Method: ${paymentInfo.name}
Timeline: ${deal.timeline}

Instructions:
${deal.paymentInstructions}

Please complete payment within the specified timeline and provide proof of payment to the admin.`;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payment-instructions-${deal.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Payment instructions downloaded');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AGREED': return 'bg-blue-100 text-blue-800';
      case 'PAYMENT_PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAYMENT_CONFIRMED': return 'bg-green-100 text-green-800';
      case 'TRANSFER_INITIATED': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(Number(deal.agreedPrice), deal.currency)}
              </div>
              <div className="text-sm text-blue-700">Amount Due</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                {paymentInfo.icon}
                <span className="font-semibold text-green-600">{paymentInfo.name}</span>
              </div>
              <div className="text-sm text-green-700">Payment Method</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="font-semibold text-purple-600">{deal.timeline}</div>
              <div className="text-sm text-purple-700">Timeline</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <Badge className={getStatusColor(deal.status)}>
              {deal.status.replace('_', ' ')}
            </Badge>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyInstructions}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadInstructions}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {paymentInfo.icon}
            {paymentInfo.name} Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${paymentInfo.color} mb-4`}>
            <p className="text-sm">{paymentInfo.description}</p>
            {paymentInfo.link && (
              <Button variant="link" size="sm" className="p-0 h-auto text-sm" asChild>
                <a href={paymentInfo.link} target="_blank" rel="noopener noreferrer">
                  Visit {paymentInfo.name} <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Step-by-Step Instructions:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              {paymentInfo.instructions.map((instruction, index) => (
                <li key={index} className="pl-2">{instruction}</li>
              ))}
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Custom Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Specific Payment Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-4 rounded-lg">
              {deal.paymentInstructions}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Complete payment within the specified timeline: <strong>{deal.timeline}</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Keep all payment documentation and receipts</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Include the domain name ({deal.inquiry.domain.name}) in your payment reference</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Notify admin once payment is completed and provide proof</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <span>Do not proceed with domain transfer until payment is confirmed by admin</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              If you have any questions about the payment process or encounter any issues, 
              please contact our support team.
            </p>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onContactSupport}>
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Call Support
              </Button>
            </div>
            
            <div className="text-xs text-gray-500">
              <p>Support Hours: Monday - Friday, 9:00 AM - 6:00 PM EST</p>
              <p>Email: support@geodomainland.com</p>
              <p>Phone: +1 (555) 123-4567</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
