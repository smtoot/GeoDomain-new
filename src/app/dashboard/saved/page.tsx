'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout/main-layout';
import { trpc } from '@/lib/trpc';
import { 
  Search, 
  Globe, 
  Heart,
  Eye,
  MessageSquare,
  Filter,
  X
} from 'lucide-react';

export default function SavedDomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch buyer activity to get saved domains
  const { data: buyerActivityResponse, isLoading, error  } = trpc.dashboard.getBuyerActivity.useQuery(
    undefined,
    { enabled: status === 'authenticated' }
  );

  // Extract data from tRPC response structure
  const buyerActivity = buyerActivityResponse?.json || buyerActivityResponse;

  const savedDomains = buyerActivity?.savedDomains || [];

  const filteredDomains = savedDomains.filter((domain: any) => {
    const matchesSearch = !searchTerm ||
      domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (domain.category?.toLowerCase?.().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || domain.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(savedDomains.map((d: any) => d.category).filter(Boolean)));

  const handleBrowseMore = () => {
    router.push('/domains');
  };

  const handleViewDomain = (domainId: string) => {
    router.push(`/domains/${domainId}`);
  };

  const handleInquire = (domainId: string) => {
    router.push(`/domains/${domainId}?action=inquire`);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading saved domains...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Domains</h1>
            <p className="text-gray-600">
              Your bookmarked domains and recent inquiries
            </p>
          </div>
          <Button onClick={handleBrowseMore}>
            <Globe className="h-4 w-4 mr-2" />
            Browse More Domains
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search saved domains..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category: any) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-red-600 font-medium mb-2">Failed to load saved domains</div>
                <div className="text-sm text-red-600 mb-4">
                  {error.message || 'Please try refreshing the page'}
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredDomains.length === 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <Heart className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                <div className="text-blue-600 font-medium mb-2">No saved domains yet</div>
                <div className="text-sm text-blue-600 mb-4">
                  Start browsing domains to save your favorites
                </div>
                <Button onClick={handleBrowseMore} variant="outline">
                  Browse Domains
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Saved Domains Grid */}
        {!isLoading && !error && filteredDomains.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDomains.map((domain: any) => (
              <Card key={domain.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {domain.name}
                      </CardTitle>
                      {domain.category && (
                        <Badge variant="secondary" className="mb-2">
                          {domain.category}
                        </Badge>
                      )}
                    </div>
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Domain Logo */}
                    {domain.logoUrl && (
                      <div className="flex justify-center">
                        <img
                          src={domain.logoUrl}
                          alt={`${domain.name} logo`}
                          className="h-16 w-16 object-contain rounded-lg"
                        />
                      </div>
                    )}

                    {/* Price */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        ${domain.price?.toLocaleString() || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">Asking Price</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewDomain(domain.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleInquire(domain.id)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Inquire
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats */}
        {!isLoading && !error && savedDomains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Saved Domains Summary</CardTitle>
              <CardDescription>
                Overview of your bookmarked domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {savedDomains.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Saved</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {categories.length}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    ${savedDomains.reduce((sum: number, d: any) => sum + (d.price || 0), 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredDomains.length}
                  </div>
                  <div className="text-sm text-gray-600">Filtered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
