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

const geographicScopes = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'STATE', label: 'State' },
  { value: 'CITY', label: 'City' }
];

export default function EditDomainPage() {
  const router = useRouter();
  const params = useParams();
  const domainName = params.domain as string;
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    priceType: 'FIXED',
    description: '',
    geographicScope: 'NATIONAL',
    state: '',
    city: '',
    category: '',
    logoUrl: '',
    metaTitle: '',
    metaDescription: '',
    tags: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get domain by name instead of ID
  const { data: domainResponse, isLoading: domainLoading, error } = trpc.domains.getByName.useQuery(
    { name: domainName },
    {
      enabled: !!domainName,
    }
  );

  const domain = domainResponse?.data?.data || domainResponse?.data || domainResponse;

  const updateDomainMutation = trpc.domains.update.useMutation();
  const deleteDomainMutation = trpc.domains.delete.useMutation();

  useEffect(() => {
    if (domain) {
      setFormData({
        name: domain.name || '',
        price: domain.price?.toString() || '',
        priceType: domain.priceType || 'FIXED',
        description: domain.description || '',
        geographicScope: domain.geographicScope || 'NATIONAL',
        state: domain.state?.name || domain.state || '',
        city: domain.city?.name || domain.city || '',
        category: domain.category?.name || domain.category || '',
        logoUrl: domain.logoUrl || '',
        metaTitle: domain.metaTitle || '',
        metaDescription: domain.metaDescription || '',
        tags: domain.tags || [],
      });
      setIsLoading(false);
    }
  }, [domain]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!domain) return;

    setIsSaving(true);
    try {
      await updateDomainMutation.mutateAsync({
        id: domain.id,
        name: formData.name,
        price: parseFloat(formData.price),
        priceType: formData.priceType as 'FIXED' | 'NEGOTIABLE' | 'MAKE_OFFER',
        description: formData.description,
        geographicScope: formData.geographicScope,
        state: formData.state,
        city: formData.city,
        category: formData.category,
        logoUrl: formData.logoUrl,
        metaTitle: formData.metaTitle,
        metaDescription: formData.metaDescription,
        tags: formData.tags,
      });

      // Redirect to the updated domain page
      router.push(`/domains/${encodeURIComponent(formData.name)}`);
    } catch (error) {
      console.error('Error updating domain:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!domain || !confirm('Are you sure you want to delete this domain? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDomainMutation.mutateAsync({ id: domain.id });
      router.push('/domains');
    } catch (error) {
      console.error('Error deleting domain:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (domainLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Domain Not Found</h1>
            <p className="text-gray-600 mb-6">
              The domain "{domainName}" could not be found.
            </p>
            <Button onClick={() => router.push('/domains')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Domains
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button 
              onClick={() => router.push(`/domains/${encodeURIComponent(domainName)}`)} 
              variant="ghost"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Domain
            </Button>
            
            <div className="flex gap-3">
              <Link href={`/domains/${encodeURIComponent(domainName)}`}>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </Link>
              <Button 
                onClick={handleDelete}
                variant="destructive"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Edit Domain
          </h1>
          <p className="text-gray-600">
            Update the information for <span className="font-semibold text-blue-600">{domain.name}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Update the basic details of your domain listing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Domain Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="example.com"
                    className="font-mono"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="10000"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="priceType">Price Type *</Label>
                    <Select 
                      value={formData.priceType} 
                      onValueChange={(value) => handleInputChange('priceType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                </div>
                
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your domain, its potential uses, and why it's valuable..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
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
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
                <CardDescription>
                  Specify the geographic scope and location for your domain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="geographicScope">Geographic Scope *</Label>
                  <Select 
                    value={formData.geographicScope} 
                    onValueChange={(value) => handleInputChange('geographicScope', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {geographicScopes.map((scope) => (
                        <SelectItem key={scope.value} value={scope.value}>
                          {scope.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.geographicScope === 'STATE' && (
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Select 
                      value={formData.state} 
                      onValueChange={(value) => handleInputChange('state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a state" />
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
                )}
                
                {formData.geographicScope === 'CITY' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State *</Label>
                      <Select 
                        value={formData.state} 
                        onValueChange={(value) => handleInputChange('state', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a state" />
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
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Enter city name"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* SEO Information */}
            <Card>
              <CardHeader>
                <CardTitle>SEO Information</CardTitle>
                <CardDescription>
                  Optional SEO fields to improve search visibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                    placeholder="SEO title for search engines"
                  />
                </div>
                
                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                    placeholder="SEO description for search engines"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <Badge 
                    className={
                      domain.status === 'VERIFIED' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : domain.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
                  >
                    {domain.status}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current Price</span>
                  <span className="font-semibold">
                    {formatPrice(domain.price)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Views</span>
                  <span className="font-semibold">
                    {domain.views || 0}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Inquiries</span>
                  <span className="font-semibold">
                    {domain.inquiryCount || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Save Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSave}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                
                <Link href={`/domains/${encodeURIComponent(domainName)}`} className="block">
                  <Button variant="outline" className="w-full">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview Changes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
