'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Building, DollarSign, Calendar, MessageSquare, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

const inquirySchema = z.object({
  buyerName: z.string().min(2, 'Name must be at least 2 characters'),
  buyerEmail: z.string().email('Invalid email address'),
  buyerPhone: z.string().optional(),
  buyerCompany: z.string().optional(),
  budgetRange: z.string().min(1, 'Budget range is required'),
  intendedUse: z.string().min(10, 'Intended use must be at least 10 characters'),
  timeline: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface InquiryFormProps {
  domainId: string;
  domainName: string;
  domainPrice: number;
  onSubmit: (data: InquiryFormData) => Promise<void>;
  onCancel?: () => void;
}

export function InquiryForm({ domainId, domainName, domainPrice, onSubmit, onCancel }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      budgetRange: '',
      intendedUse: '',
      timeline: '',
      message: '',
    },
  });

  const budgetRange = watch('budgetRange');
  const intendedUse = watch('intendedUse');

  const budgetRanges = [
    'Under $1,000',
    '$1,000 - $5,000',
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    '$50,000 - $100,000',
    'Over $100,000',
  ];

  const timelineOptions = [
    'Immediate (within 30 days)',
    'Short term (1-3 months)',
    'Medium term (3-6 months)',
    'Long term (6+ months)',
    'Flexible',
  ];

  const handleFormSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success('Inquiry submitted successfully! It will be reviewed within 24-48 hours.');
    } catch (error) {
      toast.error('Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Submit Inquiry for {domainName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Domain Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <h3 className="font-medium text-gray-900">Domain Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Domain:</span>
                <p className="font-medium">{domainName}</p>
              </div>
              <div>
                <span className="text-gray-600">Listed Price:</span>
                <p className="font-medium">${domainPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerName">Full Name *</Label>
                <Input
                  id="buyerName"
                  {...register('buyerName')}
                  placeholder="Your full name"
                />
                {errors.buyerName && (
                  <p className="text-sm text-red-600 mt-1">{errors.buyerName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="buyerEmail">Email Address *</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  {...register('buyerEmail')}
                  placeholder="your.email@example.com"
                />
                {errors.buyerEmail && (
                  <p className="text-sm text-red-600 mt-1">{errors.buyerEmail.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="buyerPhone">Phone Number (Optional)</Label>
                <Input
                  id="buyerPhone"
                  type="tel"
                  {...register('buyerPhone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="buyerCompany">Company (Optional)</Label>
                <Input
                  id="buyerCompany"
                  {...register('buyerCompany')}
                  placeholder="Your company name"
                />
              </div>
            </div>
          </div>

          {/* Purchase Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Purchase Details
            </h3>

            <div>
              <Label htmlFor="budgetRange">Budget Range *</Label>
              <Select onValueChange={(value) => setValue('budgetRange', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your budget range" />
                </SelectTrigger>
                <SelectContent>
                  {budgetRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.budgetRange && (
                <p className="text-sm text-red-600 mt-1">{errors.budgetRange.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="timeline">Timeline (Optional)</Label>
              <Select onValueChange={(value) => setValue('timeline', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your timeline" />
                </SelectTrigger>
                <SelectContent>
                  {timelineOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Intended Use */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Intended Use
            </h3>

            <div>
              <Label htmlFor="intendedUse">How do you plan to use this domain? *</Label>
              <Textarea
                id="intendedUse"
                {...register('intendedUse')}
                placeholder="Describe your plans for this domain (e.g., business website, personal blog, investment, etc.)"
                rows={4}
              />
              {errors.intendedUse && (
                <p className="text-sm text-red-600 mt-1">{errors.intendedUse.message}</p>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Message to Seller
            </h3>

            <div>
              <Label htmlFor="message">Your Message *</Label>
              <Textarea
                id="message"
                {...register('message')}
                placeholder="Introduce yourself and explain your interest in this domain. Be specific about your intentions and any questions you have."
                rows={6}
              />
              {errors.message && (
                <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
              )}
            </div>
          </div>

          {/* Information Alert */}
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Your inquiry will be reviewed by our team before being forwarded to the seller. 
              This process typically takes 24-48 hours. We review all inquiries to ensure quality and prevent spam.
            </AlertDescription>
          </Alert>

          {/* Form Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
