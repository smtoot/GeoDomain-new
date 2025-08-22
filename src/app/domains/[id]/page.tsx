'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  MapPin, 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  Shield, 
  MessageSquare,
  ArrowLeft,
  Share2,
  Heart
} from 'lucide-react';

// Mock data for demonstration - in real app this would come from tRPC
const mockDomain = {
  id: "1",
  name: "techstartup.com",
  price: 15000,
  priceType: "FIXED" as const,
  description: "Perfect domain for a tech startup company. This premium domain name is ideal for technology companies, startups, and innovative businesses looking to establish a strong online presence. The name is memorable, brandable, and has excellent potential for SEO.",
  industry: "Technology",
  state: "California",
  city: "San Francisco",
  status: "VERIFIED" as const,
  verificationToken: "abc123",
  registrar: "GoDaddy",
  expirationDate: new Date('2025-12-31'),
  createdAt: new Date('2023-01-15'),
  publishedAt: new Date('2023-02-01'),
  tags: ["tech", "startup", "innovation", "business"],
  metaTitle: "TechStartup.com - Premium Domain for Technology Companies",
  metaDescription: "Premium domain name perfect for tech startups and technology companies. Memorable, brandable, and SEO-optimized.",
  inquiryCount: 5,
  viewCount: 1250,
  owner: {
    id: "user1",
    name: "John Smith",
    email: "john@example.com",
    company: "Domain Holdings LLC"
  },
  analytics: [
    { date: '2024-01-01', views: 45, inquiries: 2 },
    { date: '2024-01-02', views: 52, inquiries: 1 },
    { date: '2024-01-03', views: 38, inquiries: 0 },
    { date: '2024-01-04', views: 67, inquiries: 3 },
    { date: '2024-01-05', views: 41, inquiries: 1 },
  ]
};

export default function DomainDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  // Get navigation context from URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const fromPage = searchParams.get('from');
  const userId = searchParams.get('userId');
  const adminPage = searchParams.get('page');
  
  // In real app, fetch domain data using tRPC
  // const { data: domain, isLoading, error } = trpc.domains.getById.useQuery({ id });
  
  // For now, use mock data
  const domain = mockDomain;
  
  if (!domain) {
    notFound();
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => {
                  if (fromPage === 'user' && userId) {
                    router.push(`/admin/users/${userId}`);
                  } else if (fromPage === 'admin' && adminPage === 'domains') {
                    router.push('/admin/domains');
                  } else {
                    router.push('/domains');
                  }
                }}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {fromPage === 'user' && userId ? 'Back to User Details' : 
                 fromPage === 'admin' && adminPage === 'domains' ? 'Back to Admin Domains' : 
                 'Back to Domains'}
              </button>
            </div>
            <nav className="flex space-x-8">
              <Link href="/domains" className="text-blue-600 font-medium">
                Browse Domains
              </Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Domain Header */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Globe className="h-6 w-6 text-blue-600" />
                      <CardTitle className="text-3xl font-bold text-gray-900">
                        {domain.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-lg">
                      {domain.city && `${domain.city}, `}{domain.state}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div className="text-3xl font-bold text-green-600">
                    {formatPrice(domain.price)}
                  </div>
                  <Badge variant={domain.status === 'VERIFIED' ? 'default' : 'secondary'}>
                    {domain.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{domain.viewCount}</div>
                    <div className="text-sm text-gray-600">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{domain.inquiryCount}</div>
                    <div className="text-sm text-gray-600">Inquiries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{domain.industry}</div>
                    <div className="text-sm text-gray-600">Industry</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{domain.priceType}</div>
                    <div className="text-sm text-gray-600">Price Type</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {domain.description}
                </p>
              </CardContent>
            </Card>

            {/* Domain Information */}
            <Card>
              <CardHeader>
                <CardTitle>Domain Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Registrar</div>
                        <div className="text-gray-600">{domain.registrar}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Expiration Date</div>
                        <div className="text-gray-600">{formatDate(domain.expirationDate)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Listed Since</div>
                        <div className="text-gray-600">{formatDate(domain.publishedAt)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Location</div>
                        <div className="text-gray-600">
                          {domain.city && `${domain.city}, `}{domain.state}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Verification</div>
                        <div className="text-gray-600">DNS Verified</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="font-medium">Price Type</div>
                        <div className="text-gray-600 capitalize">{domain.priceType.toLowerCase()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            {domain.tags && domain.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {domain.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Seller */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Seller</CardTitle>
                <CardDescription>
                  Interested in this domain? Send an inquiry to the seller.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="font-medium">{domain.owner.name}</div>
                    <div className="text-sm text-gray-600">{domain.owner.company}</div>
                  </div>
                </div>
                <Separator />
                <Link href={`/domains/${domain.id}/inquiry`}>
                  <Button className="w-full" size="lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Inquiry
                  </Button>
                </Link>
                <p className="text-xs text-gray-500 text-center">
                  All inquiries are moderated for quality and security
                </p>
              </CardContent>
            </Card>

            {/* Similar Domains */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Domains</CardTitle>
                <CardDescription>
                  Other domains you might be interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium">techstartup{i}.com</div>
                        <div className="text-sm text-gray-600">Technology</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-600">${(15000 - i * 1000).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">Verified</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/domains" className="block text-center mt-4 text-blue-600 hover:text-blue-800">
                  View All Similar Domains
                </Link>
              </CardContent>
            </Card>

            {/* Domain Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {domain.analytics.slice(-5).map((day, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {new Date(day.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm">
                        <span className="text-blue-600">{day.views} views</span>
                        {day.inquiries > 0 && (
                          <span className="ml-2 text-green-600">{day.inquiries} inquiries</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
