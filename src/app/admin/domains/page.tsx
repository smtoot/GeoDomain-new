'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Globe, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  MapPin,
  Building,
  Pause,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminDomainsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // All hooks must be called before any conditional returns
  const { data: domainsData, isLoading, error, refetch } = trpc.admin.domains.listDomainsForModeration.useQuery({
    search: searchTerm || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter as any,
    page: currentPage,
    limit: 20,
  }, {
    enabled: status === 'authenticated' && session?.user && ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role),
  });

  const moderateDomainMutation = trpc.admin.domains.moderateDomain.useMutation({
    onSuccess: () => {
      toast.success('Domain moderated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to moderate domain');
    },
  });

  // Redirect if not admin - AFTER all hooks are called
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user || (session.user as any).role !== 'ADMIN' && (session.user as any).role !== 'SUPER_ADMIN') {
    router.push('/login');
    return null;
  }

  const handleModerateDomain = async (domainId: string, action: 'APPROVE' | 'REJECT' | 'SUSPEND') => {
    const actionText = action === 'APPROVE' ? 'approve' : action === 'REJECT' ? 'reject' : 'suspend';
    const confirmMessage = `Are you sure you want to ${actionText} this domain?`;
    
    if (window.confirm(confirmMessage)) {
      moderateDomainMutation.mutate({
        domainId,
        action,
        reason: `Domain ${actionText}d by admin`,
        adminNotes: `Action taken by ${session.user?.name || 'Admin'}`,
      });
    }
  };

  const domains = (domainsData?.domains || []) as Domain[];
  const pagination = domainsData?.pagination;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING_VERIFICATION':
        return 'secondary';
      case 'DRAFT':
        return 'outline';
      case 'SOLD':
        return 'destructive';
      case 'DELETED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PENDING_VERIFICATION':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'DRAFT':
        return <Edit className="h-4 w-4 text-gray-600" />;
      case 'SOLD':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'DELETED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  // Type definitions for better type safety
  interface Domain {
    id: string;
    name: string;
    industry: string;
    price: any; // Decimal type from Prisma
    status: string;
    city?: string | null;
    state: string;
    owner: {
      name: string | null;
      email: string;
    };
    _count: {
      inquiries: number;
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Domain Moderation</h1>
                <p className="text-gray-600">Review and manage domain listings</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Domains</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {domains.filter(d => d.status === 'VERIFIED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {domains.filter(d => d.status === 'PENDING_VERIFICATION').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Sold</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {domains.filter(d => d.status === 'SOLD').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search domains..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="PENDING_VERIFICATION">Pending Review</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="SOLD">Sold</SelectItem>
                  <SelectItem value="DELETED">Deleted</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setCurrentPage(1);
                }}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Legend */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Action Guide:</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                <Eye className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-gray-600">View domain details</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-gray-600">Approve domain listing</span>
              </div>
              <div className="flex items-center">
                <XCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-gray-600">Reject domain listing</span>
              </div>
              <div className="flex items-center">
                <Pause className="h-4 w-4 text-orange-600 mr-2" />
                <span className="text-gray-600">Suspend active listing</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Domains Table */}
        <Card>
          <CardHeader>
            <CardTitle>Domains</CardTitle>
            <CardDescription>
              Review and moderate domain listings. Use the action buttons to approve, reject, or suspend domains.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading domains...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading domains: {error.message}</p>
                <Button onClick={() => refetch()} className="mt-2">
                  Retry
                </Button>
              </div>
            ) : domains.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No domains found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Domain</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Owner</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Price</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Inquiries</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((domain) => (
                      <tr key={domain.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{domain.name}</p>
                            <p className="text-sm text-gray-600">{domain.industry}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{domain.owner.name || 'No name'}</p>
                            <p className="text-sm text-gray-600">{domain.owner.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                            <span className="font-medium">${Number(domain.price).toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            {domain.city && `${domain.city}, `}{domain.state}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            {getStatusIcon(domain.status)}
                            <Badge variant={getStatusBadgeVariant(domain.status)} className="ml-2">
                              {domain.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm text-gray-600">
                            {domain._count.inquiries} inquiries
                          </div>
                        </td>
                                                <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/domains/${domain.id}?from=admin&page=domains`)}
                              title="View Domain Details"
                              className="hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                            
                            {domain.status === 'PENDING_VERIFICATION' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleModerateDomain(domain.id, 'APPROVE')}
                                  disabled={moderateDomainMutation.isPending}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Approve Domain"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="sr-only">Approve</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleModerateDomain(domain.id, 'REJECT')}
                                  disabled={moderateDomainMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Reject Domain"
                                >
                                  <XCircle className="h-4 w-4" />
                                  <span className="sr-only">Reject</span>
                                </Button>
                              </>
                            )}
                            
                            {domain.status === 'VERIFIED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleModerateDomain(domain.id, 'SUSPEND')}
                                disabled={moderateDomainMutation.isPending}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Suspend Domain (Temporarily disable listing)"
                              >
                                <Pause className="h-4 w-4" />
                                <span className="sr-only">Suspend Domain</span>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, pagination.total)} of {pagination.total} domains
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
