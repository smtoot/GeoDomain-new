"use client";

import { useState, useEffect } from 'react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Globe, Upload, Save, Eye } from 'lucide-react';

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Education',
  'Retail',
  'Entertainment',
  'Travel',
  'Food & Beverage',
  'Automotive',
  'Fashion',
  'Sports',
  'Non-Profit',
  'Other'
];

const states = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const priceTypes = [
  { value: 'FIXED', label: 'Fixed Price' },
  { value: 'NEGOTIABLE', label: 'Negotiable' },
  { value: 'MAKE_OFFER', label: 'Make Offer' }
];

interface DomainFormData {
  name: string;
  price: string;
  priceType: string;
  description: string;
  industry: string;
  isNational: boolean;
  state: string;
  city: string;
  logoUrl: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
}

export default function CreateDomainPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createMutation = trpc.domains.create.useMutation();
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState<DomainFormData>({
    name: '',
    price: '',
    priceType: 'FIXED',
    description: '',
    industry: '',
    isNational: false,
    state: '',
    city: '',
    logoUrl: '',
    metaTitle: '',
    metaDescription: '',
    tags: []
  });

  const [newTag, setNewTag] = useState('');

  // Check authentication
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login?callbackUrl=/domains/new');
    }
  }, [sessionStatus, router]);

  const handleInputChange = (field: keyof DomainFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check authentication first
      if (sessionStatus !== 'authenticated' || !session?.user) {
        alert('You must be logged in to create a domain');
        router.push('/login?callbackUrl=/domains/new');
        return;
      }

      // Basic validation
      if (!formData.name.trim()) {
        alert('Please enter a domain name');
        setIsSubmitting(false);
        return;
      }
      if (!formData.price || parseFloat(formData.price) <= 0) {
        alert('Please enter a valid price');
        setIsSubmitting(false);
        return;
      }
      if (!formData.description || formData.description.length < 10) {
        alert('Please enter a description (at least 10 characters)');
        setIsSubmitting(false);
        return;
      }
      if (!formData.industry) {
        alert('Please select an industry');
        setIsSubmitting(false);
        return;
      }
      if (!formData.isNational && !formData.state) {
        alert('Please select a state or mark as national domain');
        setIsSubmitting(false);
        return;
      }

      let geographicScope: string;
      if (formData.isNational) {
        geographicScope = 'NATIONAL';
      } else if (formData.city) {
        geographicScope = 'CITY';
      } else {
        geographicScope = 'STATE';
      }
      
      const category = formData.industry || 'General';
      
      const submissionData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        priceType: formData.priceType as any,
        description: formData.description,
        geographicScope: geographicScope as any,
        state: formData.isNational ? undefined : formData.state || undefined,
        city: formData.isNational ? undefined : formData.city || undefined,
        category,
        logoUrl: formData.logoUrl || undefined,
        metaTitle: formData.metaTitle || undefined,
        metaDescription: formData.metaDescription || undefined,
        tags: formData.tags,
      };

      console.log('🔍 [CREATE DOMAIN] Submitting domain with data:', submissionData);
      console.log('🔍 [CREATE DOMAIN] User session:', { 
        userId: session?.user?.id, 
        userEmail: session?.user?.email,
        sessionStatus 
      });

      const created = await createMutation.mutateAsync(submissionData);

      console.log('✅ [CREATE DOMAIN] Domain created successfully:', created);

      // Redirect to verification methods page for the newly created domain
      router.push(`/domains/${created.data.id}/verify-methods`);
    } catch (error) {
      console.error('Error creating domain:', error);
      alert(`Failed to create domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price: string) => {
    if (!price) return '';
    const num = parseFloat(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Show loading while checking authentication
  if (sessionStatus === 'loading') {
    return (
      <StandardPageLayout
        title="Loading..."
        description="Please wait while we verify your authentication."
        isLoading={true}
        loadingText="Checking authentication..."
        className="min-h-screen bg-gray-50"
      >
        <LoadingCardSkeleton />
      </StandardPageLayout>
    );
  }

  // Show login prompt if not authenticated
  if (sessionStatus === 'unauthenticated') {
    return (
      <StandardPageLayout
        title="Authentication Required"
        description="You must be logged in to create a domain listing."
        className="min-h-screen bg-gray-50"
      >
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to create a domain listing.</p>
          <Link href="/login?callbackUrl=/domains/new">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </StandardPageLayout>
    );
  }

  if (previewMode) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(false)}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Edit
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Preview Mode</Badge>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Globe className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {formData.name || 'yourdomain.com'}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-lg">
                    {formData.isNational 
                      ? 'National Domain' 
                      : formData.city && formData.city !== 'National'
                        ? `${formData.city}, ${formData.state}`
                        : formData.state || 'Location'
                    }
                  </CardDescription>
                </div>
                <Badge variant="secondary">DRAFT</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-6">
                <div className="text-3xl font-bold text-green-600">
                  {formatPrice(formData.price)}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {formData.priceType.toLowerCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">Inquiries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formData.industry || 'Industry'}</div>
                  <div className="text-sm text-gray-600">Industry</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formData.priceType}</div>
                  <div className="text-sm text-gray-600">Price Type</div>
                </div>
              </div>

              {formData.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{formData.description}</p>
                </div>
              )}

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <QueryErrorBoundary context="Create Domain Page">
      <StandardPageLayout
        title="Create New Domain Listing"
        description="List your premium domain for sale. Fill out the details below to create your listing."
        isLoading={isSubmitting}
        loadingText="Creating domain listing..."
        className="min-h-screen bg-gray-50"
      >
        {/* Navigation */}
        <div className="mb-6">
          <Link href="/dashboard/domains" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Domains
          </Link>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
            className="flex items-center"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential details about your domain listing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Domain Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (USD) *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="5000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="priceType">Price Type *</Label>
                <Select value={formData.priceType} onValueChange={(value) => handleInputChange('priceType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select price type" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your domain, its potential uses, and why it's valuable..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category & Location */}
          <Card>
            <CardHeader>
              <CardTitle>Category & Location</CardTitle>
              <CardDescription>
                Help buyers find your domain by categorizing it properly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="isNational">National Domain</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isNational"
                      checked={formData.isNational}
                      onChange={(e) => handleInputChange('isNational', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Check this box if your domain is a national-level domain, not tied to any specific state or city.
                    </span>
                  </div>
                </div>
              </div>

              {!formData.isNational && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">City (Optional)</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Enter city name"
                    />
                  </div>
                </div>
              )}
              
              {formData.isNational && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">National Domain</p>
                      <p className="text-sm text-blue-700">
                        This domain will be listed as a national-level domain, not tied to any specific state or city.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SEO & Marketing */}
          <Card>
            <CardHeader>
              <CardTitle>SEO & Marketing</CardTitle>
              <CardDescription>
                Optimize your listing for search engines and marketing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="SEO-optimized title for your domain"
                />
              </div>

              <div>
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="Brief description for search engines and social media"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" variant="outline" onClick={handleAddTag}>
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/domains">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Domain Listing
                </>
              )}
            </Button>
          </div>
        </form>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
