'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  User, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Activity,
  Globe,
  MessageSquare,
  DollarSign,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// TypeScript interfaces
interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED';
  avatar: string | null;
  phone: string | null;
  company: string | null;
  emailVerified: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  ownedDomains: Array<{
    id: string;
    name: string;
    price: any; // Decimal type from Prisma
    status: string;
    createdAt: Date;
  }>;
  buyerInquiries: Array<{
    id: string;
    domain: {
      id: string;
      name: string;
    };
    status: string;
    createdAt: Date;
  }>;
  sellerInquiries: Array<{
    id: string;
    domain: {
      id: string;
      name: string;
    };
    status: string;
    createdAt: Date;
  }>;
  _count: {
    ownedDomains: number;
    buyerInquiries: number;
    sellerInquiries: number;
    buyerDeals: number;
    sellerDeals: number;
  };
}

export default function UserDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  // All hooks must be called before any conditional returns
  const { data: userResponse, isLoading, error, refetch  } = trpc.users.getById.useQuery(
    { id: userId },
    {
      enabled: status === 'authenticated' && 
                session?.user && 
                ['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role) &&
                !!userId,
    }
  );

  // Extract data from tRPC response structure
  const user = userResponse?.json || userResponse;

  const updateUserStatusMutation = trpc.admin.users.updateUserStatus.useMutation({
    onSuccess: () => {
      toast.success('User status updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });

  const changeUserRoleMutation = trpc.admin.users.changeUserRole.useMutation({
    onSuccess: () => {
      toast.success('User role changed successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to change user role');
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

    // Show loading state while session is being validated
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

  const handleUpdateUserStatus = async (status: 'ACTIVE' | 'SUSPENDED' | 'DELETED') => {
    const confirmed = window.confirm(`Are you sure you want to ${status.toLowerCase()} this user?`);
    if (!confirmed) return;
    updateUserStatusMutation.mutate({ userId, status });
  };

  const handleChangeUserRole = async (role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN') => {
    const confirmed = window.confirm(`Are you sure you want to change this user's role to ${role}?`);
    if (!confirmed) return;
    changeUserRoleMutation.mutate({ userId, role });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'SUSPENDED':
        return 'destructive';
      case 'PENDING':
        return 'secondary';
      case 'DELETED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'destructive';
      case 'ADMIN':
        return 'default';
      case 'SELLER':
        return 'secondary';
      case 'BUYER':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getDomainStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return 'default';
      case 'PENDING_VERIFICATION':
        return 'secondary';
      case 'DRAFT':
        return 'outline';
      case 'SOLD':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading User</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The user you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/admin/users')}>Back to Users</Button>
        </div>
      </div>
    );
  }

  const userData = user as UserDetail;

  return (
    <QueryErrorBoundary context="Admin User Detail Page">
      <StandardPageLayout
        title={`${userData.name || 'User'} Details`}
        description={`Manage user account and view detailed information`}
        isLoading={isLoading}
        loadingText="Loading user details..."
        error={error || (!user ? new Error('User not found') : undefined)}
        className="min-h-screen bg-gray-50"
      >
        {/* Navigation */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        
        <div className="flex items-center justify-between mb-6">
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Badge variant={getStatusBadgeVariant(userData.status)}>
                  {userData.status}
                </Badge>
                <Badge variant={getRoleBadgeVariant(userData.role)}>
                  {userData.role}
                </Badge>
              </div>
            </div>
          </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{userData.name || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </label>
                  <p className="text-gray-900">{userData.email}</p>
                  {userData.emailVerified && (
                    <div className="flex items-center mt-1">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Verified</span>
                    </div>
                  )}
                </div>
                
                {userData.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <Phone className="h-4 w-4 mr-1" />
                      Phone
                    </label>
                    <p className="text-gray-900">{userData.phone}</p>
                  </div>
                )}
                
                {userData.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <Building className="h-4 w-4 mr-1" />
                      Company
                    </label>
                    <p className="text-gray-900">{userData.company}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined
                  </label>
                  <p className="text-gray-900">{new Date(userData.createdAt).toLocaleDateString()}</p>
                </div>
                
                {userData.lastLoginAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <Activity className="h-4 w-4 mr-1" />
                      Last Login
                    </label>
                    <p className="text-gray-900">{new Date(userData.lastLoginAt).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Status</label>
                  <div className="flex space-x-2">
                    {userData.status === 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateUserStatus('SUSPENDED')}
                        disabled={updateUserStatusMutation.isPending}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateUserStatus('ACTIVE')}
                        disabled={updateUserStatusMutation.isPending}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                </div>
                
                {(session.user as any).role === 'SUPER_ADMIN' && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Role</label>
                    <Select
                      value={userData.role}
                      onValueChange={(role) => handleChangeUserRole(role as any)}
                      disabled={changeUserRoleMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUYER">Buyer</SelectItem>
                        <SelectItem value="SELLER">Seller</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userData._count.ownedDomains}</div>
                    <div className="text-sm text-gray-600">Domains Owned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{userData._count.buyerInquiries}</div>
                    <div className="text-sm text-gray-600">Buyer Inquiries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{userData._count.sellerInquiries}</div>
                    <div className="text-sm text-gray-600">Seller Inquiries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{userData._count.buyerDeals + userData._count.sellerDeals}</div>
                    <div className="text-sm text-gray-600">Total Deals</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Domains */}
            {userData.ownedDomains.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    Owned Domains ({userData.ownedDomains.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userData.ownedDomains.map((domain) => (
                      <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{domain.name}</span>
                            <Badge variant={getDomainStatusBadgeVariant(domain.status)}>
                              {domain.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {formatPrice(domain.price)} • Listed {new Date(domain.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/domains/${encodeURIComponent(domain.name)}?from=user&userId=${userData.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Buyer Inquiries */}
            {userData.buyerInquiries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Buyer Inquiries ({userData.buyerInquiries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userData.buyerInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{inquiry.domain.name}</span>
                            <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Inquired {new Date(inquiry.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/inquiries/${inquiry.id}?from=user&userId=${userData.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seller Inquiries */}
            {userData.sellerInquiries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Seller Inquiries ({userData.sellerInquiries.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userData.sellerInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{inquiry.domain.name}</span>
                            <Badge variant={getStatusBadgeVariant(inquiry.status)}>
                              {inquiry.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Received {new Date(inquiry.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/inquiries/${inquiry.id}?from=user&userId=${userData.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {userData.ownedDomains.length === 0 && 
             userData.buyerInquiries.length === 0 && 
             userData.sellerInquiries.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
                  <p className="text-gray-600">This user hasn&apos;t performed any actions on the platform yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
