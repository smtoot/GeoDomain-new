'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Upload, 
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Eye,
  Download,
  X,
  CreditCard,
  Calendar
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const paymentProofSchema = z.object({
  paymentProofUrl: z.string().url('Payment proof must be a valid URL'),
  paymentMethod: z.enum(['ESCROW_COM', 'PAYPAL', 'WIRE_TRANSFER', 'CRYPTO', 'OTHER']),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentProofFormData = z.infer<typeof paymentProofSchema>;

interface PaymentVerificationProps {
  deal: {
    id: string;
    agreedPrice: number;
    currency: string;
    paymentMethod: string;
    status: string;
    inquiry: {
      domain: {
        name: string;
      };
    };
  };
  existingPayment?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    externalReference?: string;
    adminNotes?: string;
    verificationDate?: string;
    createdAt: string;
  };
  onSubmit: (data: PaymentProofFormData) => Promise<void>;
  onViewProof?: () => void;
  onDownloadProof?: () => void;
  isLoading?: boolean;
}

export default function PaymentVerification({
  deal,
  existingPayment,
  onSubmit,
  onViewProof,
  onDownloadProof,
  isLoading = false
}: PaymentVerificationProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PaymentProofFormData>({
    resolver: zodResolver(paymentProofSchema),
        defaultValues: {
      paymentMethod: deal.paymentMethod as any,
      amount: Number(deal.agreedPrice),
      currency: deal.currency,
    },
  });

  const watchedPaymentMethod = watch('paymentMethod');

  const handleFormSubmit = async (data: PaymentProofFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success('Payment proof uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload payment proof. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'CONFIRMED': return 'default';
      case 'FAILED': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />;
      case 'FAILED': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Payment proof submitted and awaiting admin verification';
      case 'CONFIRMED':
        return 'Payment has been verified by admin';
      case 'FAILED':
        return 'Payment verification failed. Please check the admin notes and resubmit.';
      default:
        return 'No payment proof submitted yet';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(Number(deal.agreedPrice), deal.currency)}
              </div>
              <div className="text-sm text-blue-700">Expected Amount</div>
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
        </CardContent>
      </Card>

      {/* Existing Payment Status */}
      {existingPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(existingPayment.status)} className="flex items-center gap-1">
                    {getStatusIcon(existingPayment.status)}
                    {existingPayment.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  Submitted: {formatDate(existingPayment.createdAt)}
                </div>
              </div>
              
              <p className="text-sm text-gray-700">{getStatusMessage(existingPayment.status)}</p>
              
              {existingPayment.adminNotes && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-1">Admin Notes:</h4>
                  <p className="text-sm text-yellow-700">{existingPayment.adminNotes}</p>
                </div>
              )}
              
              {existingPayment.verificationDate && (
                <div className="text-sm text-gray-600">
                  Verified: {formatDate(existingPayment.verificationDate)}
                </div>
              )}
              
              <div className="flex gap-2">
                {onViewProof && (
                  <Button variant="outline" size="sm" onClick={onViewProof}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Proof
                  </Button>
                )}
                {onDownloadProof && (
                  <Button variant="outline" size="sm" onClick={onDownloadProof}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Payment Proof Form */}
      {(!existingPayment || existingPayment.status === 'FAILED') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Payment Proof
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paymentProofUrl" className="text-sm font-medium text-gray-700">
                    Payment Proof URL *
                  </Label>
                  <Input
                    id="paymentProofUrl"
                    type="url"
                    placeholder="https://example.com/payment-receipt"
                    {...register('paymentProofUrl')}
                  />
                  {errors.paymentProofUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentProofUrl.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Upload your payment receipt to a file sharing service and provide the URL
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                    Payment Method *
                  </Label>
                  <Select onValueChange={(value) => setValue('paymentMethod', value as any)} defaultValue={deal.paymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESCROW_COM">Escrow.com</SelectItem>
                      <SelectItem value="PAYPAL">PayPal</SelectItem>
                      <SelectItem value="WIRE_TRANSFER">Wire Transfer</SelectItem>
                      <SelectItem value="CRYPTO">Cryptocurrency</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="amount" className="text-sm font-medium text-gray-700">
                    Amount Paid *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10"
                      {...register('amount', { valueAsNumber: true })}
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                    Currency
                  </Label>
                  <Select onValueChange={(value) => setValue('currency', value)} defaultValue={deal.currency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="transactionId" className="text-sm font-medium text-gray-700">
                    Transaction ID
                  </Label>
                  <Input
                    id="transactionId"
                    placeholder="e.g., TXN123456789"
                    {...register('transactionId')}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Optional: Transaction ID from payment provider
                  </p>
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information about the payment..."
                  rows={3}
                  {...register('notes')}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Include any relevant details about the payment
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure the payment amount matches the agreed price</li>
                      <li>Include the domain name in your payment reference</li>
                      <li>Keep all original payment documentation</li>
                      <li>Admin will verify your payment within 24-48 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="min-w-[150px]"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Proof
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Payment Verification Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Verification Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-sm">Payment Proof Submitted</div>
                <div className="text-xs text-gray-600">Immediate</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-sm">Admin Review</div>
                <div className="text-xs text-gray-600">24-48 hours</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-sm">Payment Verification</div>
                <div className="text-xs text-gray-600">Admin confirms payment</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-sm">Domain Transfer Initiated</div>
                <div className="text-xs text-gray-600">After payment confirmation</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
