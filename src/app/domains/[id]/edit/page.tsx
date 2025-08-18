"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';

// Mock data for demonstration - in real app this would come from tRPC
const mockDomain = {
  id: "1",
  name: "techstartup.com",
  price: 15000,
  priceType: "FIXED" as const,
  description: "Perfect domain for a tech startup company. This premium domain name is ideal for technology companies, startups, and innovative businesses looking to establish a strong online presence.",
  industry: "Technology",
  state: "California",
  city: "San Francisco",
  status: "VERIFIED" as const,
  logoUrl: "https://example.com/logo.png",
  metaTitle: "TechStartup.com - Premium Domain for Technology Companies",
  metaDescription: "Premium domain name perfect for tech startups and technology companies. Memorable, brandable, and SEO-optimized.",
  tags: ["tech", "startup", "innovation", "business"],
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2024-01-15'),
};

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
  const [domainId, setDomainId] = useState<string>('');

  useEffect(() => {
    params.then((resolvedParams) => {
      setDomainId(resolvedParams.id);
    });
  }, [params]);
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
    state: '',
    city: '',
    logoUrl: '',
    metaTitle: '',
    metaDescription: '',
    tags: []
  });

  const [newTag, setNewTag] = useState('');

  // Load domain data
  useEffect(() => {
    const loadDomain = async () => {
      try {
        // In real app, this would be a tRPC query
        // const { data: domain } = await trpc.domains.getById.useQuery({ id: params.id });
        
        // For now, use mock data
        const domain = mockDomain;
        
        setFormData({
          name: domain.name,
          price: domain.price.toString(),
          priceType: domain.priceType,
          description: domain.description || '',
          industry: domain.industry,
          state: domain.state,
          city: domain.city || '',
          logoUrl: domain.logoUrl || '',
          metaTitle: domain.metaTitle || '',
          metaDescription: domain.metaDescription || '',
          tags: domain.tags || []
        });
      } catch (error) {
        console.error('Error loading domain:', error);
        // Handle error - redirect to 404 or show error message
      } finally {
        setIsLoading(false);
      }
    };

    loadDomain();
  }, [domainId]);

  const handleInputChange = (field: keyof DomainFormData, value: string) => {
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
      // In real app, this would be a tRPC mutation
      // await trpc.domains.update.mutate({
      //   id: params.id,
      //   data: {
      //     ...formData,
      //     price: parseFloat(formData.price),
      //     tags: formData.tags
      //   }
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to the domain's detail page
      router.push(`/domains/${domainId}`);
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
      // In real app, this would be a tRPC mutation
      // await trpc.domains.delete.mutate({ id: params.id });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to domains list
      router.push('/dashboard/domains');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domain...</p>
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
                    {formData.city && `${formData.city}, `}{formData.state}
                  </CardDescription>
                </div>
                <Badge variant={mockDomain.status === 'VERIFIED' ? 'default' : 'secondary'}>
                  {mockDomain.status}
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
              <Link href={`/domains/${domainId}`} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Domain
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
