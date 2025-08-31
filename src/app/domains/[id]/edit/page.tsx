"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Trash2, Globe } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { formatPrice } from '@/lib/utils';

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

interface DomainEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function DomainEditPage({ params }: DomainEditPageProps) {
  const { id: domainId } = useParams<{ id: string }>();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  // Load domain data using tRPC
  const { data: domain, isLoading: isDomainLoading, isError } = trpc.domains.getById.useQuery(
    { id: String(domainId) },
    { enabled: Boolean(domainId) }
  );

  const updateMutation = trpc.domains.update.useMutation({
    onSuccess: () => {
      router.push(`/domains/${domainId}`);
    }
  });

  const deleteMutation = trpc.domains.delete.useMutation({
    onSuccess: () => {
      router.push('/dashboard/domains');
    }
  });

  // Update form when domain data loads
  useEffect(() => {
    if (domain) {
      setFormData({
        name: domain.name,
        price: domain.price.toString(),
        priceType: domain.priceType,
        description: domain.description || '',
        industry: domain.category,
        isNational: domain.geographicScope === 'NATIONAL',
        state: domain.state || '',
        city: domain.city || '',
        logoUrl: domain.logoUrl || '',
        metaTitle: domain.metaTitle || '',
        metaDescription: domain.metaDescription || '',
        tags: domain.tags ? JSON.parse(domain.tags) : []
      });
      setIsLoading(false);
    }
  }, [domain]);

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
      let geographicScope: string;
      if (formData.isNational) {
        geographicScope = 'NATIONAL';
      } else if (formData.city) {
        geographicScope = 'CITY';
      } else {
        geographicScope = 'STATE';
      }

      await updateMutation.mutateAsync({
        id: String(domainId),
        data: {
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          priceType: formData.priceType as any,
          description: formData.description || undefined,
          geographicScope: geographicScope as any,
          state: formData.isNational ? undefined : formData.state || undefined,
          city: formData.isNational ? undefined : formData.city || undefined,
          category: formData.industry,
          logoUrl: formData.logoUrl || '',
          metaTitle: formData.metaTitle || undefined,
          metaDescription: formData.metaDescription || undefined,
          tags: formData.tags,
        }
      });
    } catch (error) {
      console.error('Error updating domain:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this domain listing? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteMutation.mutateAsync({ id: String(domainId) });
    } catch (error) {
      console.error('Error deleting domain:', error);
    } finally {
      setIsDeleting(false);
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

  if (isDomainLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domain...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Domain</h2>
          <p className="text-gray-600 mb-4">Failed to load the domain. Please try again.</p>
          <Link href="/dashboard/domains">
            <Button>Back to Domains</Button>
          </Link>
        </div>
      </div>
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
                  <CardTitle className="text-3xl font-bold text-gray-900">
                    {formData.name}
                  </CardTitle>
                  <CardDescription className="text-lg">
                    {formData.isNational 
                      ? 'National Domain' 
                      : formData.city && formData.city !== 'National'
                        ? `${formData.city}, ${formData.state}`
                        : formData.state || 'Location'
                    }
                  </CardDescription>
                </div>
                <Badge variant={domain?.status === 'VERIFIED' ? 'default' : 'secondary'}>
                  {domain?.status || 'DRAFT'}
                </Badge>
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
                  <div className="text-2xl font-bold text-gray-900">1,250</div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">5</div>
                  <div className="text-sm text-gray-600">Inquiries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{formData.industry}</div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/domains" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to My Domains
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(true)}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Domain Listing</h1>
          <p className="text-gray-600">
            Update your domain listing information. Changes will be reflected immediately.
          </p>
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
            <Link href={`/domains/${domainId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
