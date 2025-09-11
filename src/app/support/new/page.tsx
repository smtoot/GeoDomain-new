'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Send, 
  AlertCircle,
  MessageSquare,
  Tag,
  Flag,
  Globe,
  CreditCard,
  User,
  Settings,
  HelpCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function NewSupportTicketPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    domainId: '',
    transactionId: '',
  });

  // Note: Domain and transaction linking is optional
  // These queries can be added later when the procedures are available
  const userDomains = { domains: [] };
  const userTransactions = { transactions: [] };

  const createTicketMutation = trpc.support.createTicket.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Support ticket created successfully');
      router.push('/support');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create support ticket');
      setIsSubmitting(false);
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    createTicketMutation.mutate({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category as any,
      priority: formData.priority as any,
      domainId: formData.domainId || undefined,
      transactionId: formData.transactionId || undefined,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DOMAIN_INQUIRY':
        return <Globe className="h-4 w-4" />;
      case 'TRANSACTION_ISSUE':
        return <CreditCard className="h-4 w-4" />;
      case 'TECHNICAL_SUPPORT':
        return <Settings className="h-4 w-4" />;
      case 'ACCOUNT_ISSUE':
        return <User className="h-4 w-4" />;
      case 'PAYMENT_ISSUE':
        return <CreditCard className="h-4 w-4" />;
      case 'GENERAL_QUESTION':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'DOMAIN_INQUIRY':
        return 'Questions about domain listings, pricing, or availability';
      case 'TRANSACTION_ISSUE':
        return 'Issues with domain purchases, sales, or transfers';
      case 'TECHNICAL_SUPPORT':
        return 'Technical problems with the website or platform';
      case 'ACCOUNT_ISSUE':
        return 'Account settings, login, or profile problems';
      case 'PAYMENT_ISSUE':
        return 'Payment processing, billing, or refund questions';
      case 'GENERAL_QUESTION':
        return 'General questions about our services';
      default:
        return '';
    }
  };

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <StandardPageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/support">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Support Ticket</h1>
          <p className="text-gray-600 mt-2">
            Describe your issue and we'll help you resolve it quickly
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ticket Information
              </CardTitle>
              <CardDescription>
                Provide basic information about your support request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.title.length}/200 characters
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Please provide detailed information about your issue..."
                  rows={6}
                  maxLength={2000}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/2000 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Category and Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Category & Priority
              </CardTitle>
              <CardDescription>
                Help us route your ticket to the right team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DOMAIN_INQUIRY">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('DOMAIN_INQUIRY')}
                        <div>
                          <div className="font-medium">Domain Inquiry</div>
                          <div className="text-sm text-gray-500">
                            {getCategoryDescription('DOMAIN_INQUIRY')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="TRANSACTION_ISSUE">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('TRANSACTION_ISSUE')}
                        <div>
                          <div className="font-medium">Transaction Issue</div>
                          <div className="text-sm text-gray-500">
                            {getCategoryDescription('TRANSACTION_ISSUE')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="TECHNICAL_SUPPORT">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('TECHNICAL_SUPPORT')}
                        <div>
                          <div className="font-medium">Technical Support</div>
                          <div className="text-sm text-gray-500">
                            {getCategoryDescription('TECHNICAL_SUPPORT')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ACCOUNT_ISSUE">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('ACCOUNT_ISSUE')}
                        <div>
                          <div className="font-medium">Account Issue</div>
                          <div className="text-sm text-gray-500">
                            {getCategoryDescription('ACCOUNT_ISSUE')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="PAYMENT_ISSUE">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('PAYMENT_ISSUE')}
                        <div>
                          <div className="font-medium">Payment Issue</div>
                          <div className="text-sm text-gray-500">
                            {getCategoryDescription('PAYMENT_ISSUE')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="GENERAL_QUESTION">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon('GENERAL_QUESTION')}
                        <div>
                          <div className="font-medium">General Question</div>
                          <div className="text-sm text-gray-500">
                            {getCategoryDescription('GENERAL_QUESTION')}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-green-500" />
                        Low - General questions
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-yellow-500" />
                        Medium - Standard issues
                      </div>
                    </SelectItem>
                    <SelectItem value="HIGH">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-orange-500" />
                        High - Urgent issues
                      </div>
                    </SelectItem>
                    <SelectItem value="URGENT">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-red-500" />
                        Urgent - Critical issues
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Optional Linking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Link to Domain or Transaction (Optional)
              </CardTitle>
              <CardDescription>
                Link this ticket to a specific domain or transaction for better context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="domainId">Related Domain</Label>
                <Select value={formData.domainId} onValueChange={(value) => handleInputChange('domainId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a domain (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No domain selected</SelectItem>
                    {userDomains?.domains?.map((domain: any) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name} - ${domain.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="transactionId">Related Transaction</Label>
                <Select value={formData.transactionId} onValueChange={(value) => handleInputChange('transactionId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a transaction (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No transaction selected</SelectItem>
                    {userTransactions?.transactions?.map((transaction: any) => (
                      <SelectItem key={transaction.id} value={transaction.id}>
                        {transaction.domain?.name} - ${transaction.amount.toLocaleString()} - {transaction.status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Link href="/support">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.title.trim() || !formData.description.trim() || !formData.category}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Ticket
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </StandardPageLayout>
  );
}
