'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Globe, 
  FileText,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Trash2,
  RotateCcw,
  X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminDomainDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const domainId = params.id as string;

  const [moderationAction, setModerationAction] = useState<'APPROVE' | 'REJECT' | 'SUSPEND'>('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch domain details
  const { data: domain, isLoading, error } = trpc.admin.domains.getById.useQuery({ id: domainId }, {
    enabled: !!domainId && status === 'authenticated',
  });

  // Fetch verification attempts
  const { data: verificationAttempts } = trpc.admin.domains.getVerificationAttempts.useQuery(
    { domainId },
    { enabled: !!domainId && status === 'authenticated' }
  );

  // Moderate domain mutation
  const moderateDomainMutation = trpc.admin.domains.moderateDomain.useMutation({
    onSuccess: () => {
      toast.success('Domain moderated successfully');
      router.push('/admin/domains');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to moderate domain');
    },
  });

  // Delete domain mutation
  const deleteDomainMutation = trpc.admin.domains.deleteDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Domain deleted successfully');
      router.push('/admin/domains');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete domain');
    },
  });

  // Restore domain mutation
  const restoreDomainMutation = trpc.admin.domains.restoreDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Domain restored successfully');
      router.push('/admin/domains');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to restore domain');
    },
  });

  // Permanent delete domain mutation
  const permanentDeleteDomainMutation = trpc.admin.domains.permanentDeleteDomain.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || 'Domain permanently deleted');
      router.push('/admin/domains');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to permanently delete domain');
    },
  });

  // Authentication is handled by middleware, no need for client-side redirects

  const handleModerateDomain = async () => {
    if (!domain) return;

    try {
      await moderateDomainMutation.mutateAsync({
        domainId: domain.id,
        action: moderationAction,
        reason: rejectionReason || undefined,
        adminNotes: adminNotes || undefined,
      });
    } catch (error) {
      }
  };

  const handleDeleteDomain = async () => {
    if (!domain) return;

    const confirmMessage = `Are you sure you want to DELETE the domain "${domain.name}"?\n\nThis will soft-delete the domain (can be restored later).`;
    
    if (window.confirm(confirmMessage)) {
      const reason = prompt('Please provide a reason for deleting this domain (optional):');
      
      try {
        await deleteDomainMutation.mutateAsync({
          domainId: domain.id,
          reason: reason || 'Domain deleted by admin',
          adminNotes: `Domain deleted by ${session?.user?.name || 'Admin'}`,
        });
      } catch (error) {
        }
    }
  };

  const handleRestoreDomain = async () => {
    if (!domain) return;

    const confirmMessage = `Are you sure you want to RESTORE the domain "${domain.name}"?\n\nThis will make the domain available again in the marketplace.`;
    
    if (window.confirm(confirmMessage)) {
      const reason = prompt('Please provide a reason for restoring this domain (optional):');
      
      try {
        await restoreDomainMutation.mutateAsync({
          domainId: domain.id,
          reason: reason || 'Domain restored by admin',
          adminNotes: `Domain restored by ${session?.user?.name || 'Admin'}`,
        });
      } catch (error) {
        }
    }
  };

  const handlePermanentDeleteDomain = async () => {
    if (!domain) return;

    const confirmMessage = `⚠️ WARNING: Are you sure you want to PERMANENTLY DELETE the domain "${domain.name}"?\n\nThis action CANNOT be undone and will completely remove the domain from the database.`;
    
    if (window.confirm(confirmMessage)) {
      const doubleConfirm = window.confirm(`FINAL CONFIRMATION: This will PERMANENTLY DELETE "${domain.name}" from the database. This action is IRREVERSIBLE. Continue?`);
      
      if (doubleConfirm) {
        const reason = prompt('Please provide a reason for permanently deleting this domain (required):');
        
        if (reason && reason.trim()) {
          try {
            await permanentDeleteDomainMutation.mutateAsync({
              domainId: domain.id,
              reason: reason.trim(),
              adminNotes: `Domain permanently deleted by ${session?.user?.name || 'Admin'}`,
            });
          } catch (error) {
            }
        } else {
          toast.error('Reason is required for permanent deletion');
        }
      }
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'default';
      case 'PENDING_VERIFICATION': return 'secondary';
      case 'REJECTED': return 'destructive';
      case 'DRAFT': return 'outline';
      default: return 'outline';
    }
  };

  const getVerificationStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return { variant: 'default' as const, text: 'Verified' };
      case 'PENDING': return { variant: 'secondary' as const, text: 'Pending Review' };
      case 'FAILED': return { variant: 'destructive' as const, text: 'Failed' };
      default: return { variant: 'outline' as const, text: 'Unknown' };
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading domain details...</p>
        </div>
      </div>
    );
  }

  if (error || !domain) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Domain Not Found</h2>
          <p className="text-gray-600 mb-4">The domain you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/admin/domains')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Domains
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/admin/domains')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Domains
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{domain.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant={getStatusBadgeVariant(domain.status)}>
                  {domain.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Created {new Date(domain.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Domain Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Domain Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Domain Name</label>
                    <p className="text-lg font-semibold">{domain.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Price</label>
                    <p className="text-lg font-semibold">${domain.price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Geographic Scope</label>
                    <p className="text-lg">{domain.geographicScope}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-lg">{domain.category}</p>
                  </div>
                </div>
                
                {domain.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <p className="text-gray-900 mt-1">{domain.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Attempts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Verification Attempts
                </CardTitle>
                <CardDescription>
                  Review domain ownership verification attempts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificationAttempts && verificationAttempts.length > 0 ? (
                  <div className="space-y-4">
                    {verificationAttempts.map((attempt, index) => {
                      const statusBadge = getVerificationStatusBadge(attempt.status);
                      return (
                        <div key={attempt.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">Attempt #{index + 1}</span>
                              <Badge variant={statusBadge.variant}>
                                {statusBadge.text}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(attempt.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium">Method:</span> {attempt.method}
                            </div>
                            {attempt.token && (
                              <div>
                                <span className="font-medium">Token:</span> 
                                <code className="ml-1 bg-gray-100 px-1 rounded text-xs">
                                  {attempt.token}
                                </code>
                              </div>
                            )}
                            {attempt.fileUrl && (
                              <div>
                                <span className="font-medium">File:</span> {attempt.fileUrl}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No verification attempts found. The user needs to submit domain ownership verification.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Admin Actions */}
          <div className="space-y-6">
            {/* Moderation Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>
                  Moderate this domain listing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {domain.status === 'PENDING_VERIFICATION' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Action</label>
                      <select
                        value={moderationAction}
                        onChange={(e) => setModerationAction(e.target.value as any)}
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="APPROVE">Approve Domain</option>
                        <option value="REJECT">Reject Domain</option>
                        <option value="SUSPEND">Suspend Domain</option>
                      </select>
                    </div>

                    {moderationAction === 'REJECT' && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why the domain is being rejected..."
                          className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                          rows={3}
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-700">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes about this domain..."
                        className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={handleModerateDomain}
                      disabled={moderateDomainMutation.isPending}
                      className="w-full"
                      variant={moderationAction === 'APPROVE' ? 'default' : 'destructive'}
                    >
                      {moderateDomainMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {moderationAction === 'APPROVE' ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          {moderationAction} Domain
                        </>
                      )}
                    </Button>
                  </>
                )}

                {/* Domain Management Section */}
                {domain.status !== 'DELETED' ? (
                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-800 flex items-center">
                        <Trash2 className="h-5 w-5 mr-2" />
                        Delete Domain
                      </CardTitle>
                      <CardDescription className="text-red-600">
                        Soft-delete this domain from the system. It can be restored later.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={handleDeleteDomain}
                        disabled={deleteDomainMutation.isPending}
                        variant="destructive"
                        className="w-full"
                      >
                        {deleteDomainMutation.isPending ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Domain
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {/* Restore Domain Section */}
                    <Card className="border-blue-200">
                      <CardHeader>
                        <CardTitle className="text-blue-800 flex items-center">
                          <RotateCcw className="h-5 w-5 mr-2" />
                          Restore Domain
                        </CardTitle>
                        <CardDescription className="text-blue-600">
                          Restore this domain and make it available again in the marketplace.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={handleRestoreDomain}
                          disabled={restoreDomainMutation.isPending}
                          variant="outline"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          {restoreDomainMutation.isPending ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restore Domain
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Permanent Delete Section */}
                    <Card className="border-red-300">
                      <CardHeader>
                        <CardTitle className="text-red-900 flex items-center">
                          <X className="h-5 w-5 mr-2" />
                          Permanent Delete
                        </CardTitle>
                        <CardDescription className="text-red-700">
                          ⚠️ Permanently remove this domain from the database. This action CANNOT be undone.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={handlePermanentDeleteDomain}
                          disabled={permanentDeleteDomainMutation.isPending}
                          variant="destructive"
                          className="w-full bg-red-800 hover:bg-red-900"
                        >
                          {permanentDeleteDomainMutation.isPending ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Permanently Deleting...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Permanent Delete
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {domain.status === 'VERIFIED' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      This domain has been approved and is live in the marketplace.
                    </AlertDescription>
                  </Alert>
                )}

                {domain.status === 'DRAFT' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      This domain is still in draft status. The user needs to submit it for verification.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Domain Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Domain Owner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Owner ID:</span> {domain.ownerId}
                  </div>
                  <div>
                    <span className="font-medium">Created:</span> {new Date(domain.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {new Date(domain.updatedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
