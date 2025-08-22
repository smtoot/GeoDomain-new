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
  Calendar, 
  FileText, 
  CreditCard,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const dealAgreementSchema = z.object({
  inquiryId: z.string(),
  agreedPrice: z.number().positive('Price must be positive'),
  currency: z.string(),
  paymentMethod: z.enum(['ESCROW_COM', 'PAYPAL', 'WIRE_TRANSFER', 'CRYPTO', 'OTHER']),
  paymentInstructions: z.string().min(10, 'Payment instructions must be at least 10 characters'),
  timeline: z.string().min(1, 'Timeline is required'),
  terms: z.string().min(10, 'Terms must be at least 10 characters'),
});

type DealAgreementFormData = z.infer<typeof dealAgreementSchema>;

interface DealAgreementFormProps {
  inquiryId: string;
  domainName: string;
  buyerName: string;
  sellerName: string;
  originalPrice: number;
  onSubmit: (data: DealAgreementFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function DealAgreementForm({
  inquiryId,
  domainName,
  buyerName,
  sellerName,
  originalPrice,
  onSubmit,
  isLoading = false
}: DealAgreementFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DealAgreementFormData>({
    resolver: zodResolver(dealAgreementSchema),
    defaultValues: {
      inquiryId,
      currency: 'USD',
      paymentMethod: 'ESCROW_COM',
    },
  });

  const watchedPaymentMethod = watch('paymentMethod');

  const handleFormSubmit = async (data: DealAgreementFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success('Deal agreement created successfully!');
    } catch (error) {
      toast.error('Failed to create deal agreement. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentMethodInfo = (method: string) => {
    switch (method) {
      case 'ESCROW_COM':
        return {
          name: 'Escrow.com',
          description: 'Secure escrow service for domain transactions',
          instructions: 'Use Escrow.com for secure payment processing',
        };
      case 'PAYPAL':
        return {
          name: 'PayPal',
          description: 'Fast and secure online payments',
          instructions: 'Send payment via PayPal to the seller',
        };
      case 'WIRE_TRANSFER':
        return {
          name: 'Wire Transfer',
          description: 'Direct bank transfer',
          instructions: 'Complete wire transfer to seller\'s bank account',
        };
      case 'CRYPTO':
        return {
          name: 'Cryptocurrency',
          description: 'Digital currency payment',
          instructions: 'Send cryptocurrency payment to seller\'s wallet',
        };
      case 'OTHER':
        return {
          name: 'Other Method',
          description: 'Custom payment arrangement',
          instructions: 'Follow seller\'s specific payment instructions',
        };
      default:
        return {
          name: 'Select Method',
          description: 'Choose a payment method',
          instructions: '',
        };
    }
  };

  const paymentInfo = getPaymentMethodInfo(watchedPaymentMethod);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Deal Agreement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Domain</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <span className="font-medium text-lg">{domainName}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Buyer</Label>
                  <div className="mt-1 p-2 bg-blue-50 rounded-md">
                    <span className="text-sm">{buyerName}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Seller</Label>
                  <div className="mt-1 p-2 bg-green-50 rounded-md">
                    <span className="text-sm">{sellerName}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Original Price</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded-md">
                  <span className="text-lg font-semibold">${originalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="agreedPrice" className="text-sm font-medium text-gray-700">
                  Agreed Price *
                </Label>
                <div className="mt-1 relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="agreedPrice"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-10"
                    {...register('agreedPrice', { valueAsNumber: true })}
                  />
                </div>
                {errors.agreedPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.agreedPrice.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="currency" className="text-sm font-medium text-gray-700">
                  Currency
                </Label>
                <Select onValueChange={(value) => setValue('currency', value)} defaultValue="USD">
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
                <Label htmlFor="timeline" className="text-sm font-medium text-gray-700">
                  Timeline *
                </Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 30 days, 2 weeks"
                  {...register('timeline')}
                />
                {errors.timeline && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeline.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="paymentMethod" className="text-sm font-medium text-gray-700">
                Payment Method *
              </Label>
              <Select onValueChange={(value) => setValue('paymentMethod', value as any)} defaultValue="ESCROW_COM">
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

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">{paymentInfo.name}</h4>
                    <p className="text-sm text-blue-700 mt-1">{paymentInfo.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="paymentInstructions" className="text-sm font-medium text-gray-700">
                Payment Instructions *
              </Label>
              <Textarea
                id="paymentInstructions"
                placeholder="Provide detailed payment instructions..."
                rows={4}
                {...register('paymentInstructions')}
              />
              {errors.paymentInstructions && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentInstructions.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="terms" className="text-sm font-medium text-gray-700">
                Deal Terms *
              </Label>
              <Textarea
                id="terms"
                placeholder="Specify the terms and conditions of the deal..."
                rows={6}
                {...register('terms')}
              />
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>This deal agreement will be reviewed by admin before finalization</span>
            </div>
            
            <Button
              type="submit"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isSubmitting || isLoading}
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Create Deal
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
