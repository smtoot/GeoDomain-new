'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Globe, 
  FileText,
  User,
  Calendar,
  Search,
  Eye,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AdminGuard } from '@/components/security/AdminGuard';
import { QueryErrorBoundary } from '@/components/error';

export default function AdminVerificationsPage() {
  const { data: session, status } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<any>(null);
  const [moderationAction, setModerationAction] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending verification attempts
  const { data: verificationData, isLoading, refetch } = trpc.admin.domains.getPendingVerificationAttempts.useQuery(
    { page: 1, limit: 50 },
    { enabled: status === 'authenticated' }
  );

  // Moderate verification attempt mutation
  const moderateAttemptMutation = trpc.admin.domains.moderateVerificationAttempt.useMutation({
    onSuccess: () => {
      toast.success('Verification attempt moderated successfully');
      setSelectedAttempt(null);
      setAdminNotes('');
      setRejectionReason('');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to moderate verification attempt');
    },
  });

  const attempts = verificationData?.attempts || [];

  // Filter attempts based on search term
  const filteredAttempts = attempts.filter(attempt => {
    const searchLower = searchTerm.toLowerCase();
    return (
      attempt.domain.name.toLowerCase().includes(searchLower) ||
      attempt.domain.owner.name.toLowerCase().includes(searchLower) ||
      attempt.domain.owner.email.toLowerCase().includes(searchLower) ||
      attempt.method.toLowerCase().includes(searchLower)
    );
  });

  const handleModeration = async () => {
    if (!selectedAttempt) return;

    setIsProcessing(true);
    try {
      await moderateAttemptMutation.mutateAsync({
        attemptId: selectedAttempt.id,
        action: moderationAction,
        adminNotes: adminNotes || undefined,
        rejectionReason: rejectionReason || undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'DNS_TXT':
        return <Globe className="h-4 w-4" />;
      case 'FILE_UPLOAD':
        return <FileText className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'DNS_TXT':
        return 'DNS TXT Record';
      case 'FILE_UPLOAD':
        return 'File Upload';
      default:
        return method;
    }
  };

  if (status === 'loading') {
    return (
      <AdminGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading verification attempts...</p>
          </div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <QueryErrorBoundary context="Admin Verifications Page">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Domain Verification Management</h1>
            <p className="text-gray-600 mt-2">
              Review and approve domain ownership verification attempts
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by domain name, owner name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Verifications</p>
                    <p className="text-2xl font-bold text-gray-900">{attempts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Globe className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">DNS Verifications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {attempts.filter(a => a.method === 'DNS_TXT').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">File Verifications</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {attempts.filter(a => a.method === 'FILE_UPLOAD').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Verification Attempts List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading verification attempts...</p>
              </div>
            ) : filteredAttempts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Verifications</h3>
                  <p className="text-gray-600">
                    {searchTerm ? 'No verification attempts match your search criteria.' : 'All verification attempts have been reviewed.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAttempts.map((attempt) => (
                <Card key={attempt.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {attempt.domain.name}
                          </h3>
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            {getMethodIcon(attempt.method)}
                            <span>{getMethodLabel(attempt.method)}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>
                              <strong>Owner:</strong> {attempt.domain.owner.name} ({attempt.domain.owner.email})
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>
                              <strong>Submitted:</strong> {new Date(attempt.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {attempt.token && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium text-gray-600">Verification Token</Label>
                            <div className="mt-1">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                                {attempt.token}
                              </code>
                            </div>
                          </div>
                        )}

                        {attempt.fileUrl && (
                          <div className="mt-3">
                            <Label className="text-sm font-medium text-gray-600">Verification File</Label>
                            <div className="mt-1">
                              <a 
                                href={attempt.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline"
                              >
                                {attempt.fileUrl}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-6">
                        <Button
                          onClick={() => setSelectedAttempt(attempt)}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Review</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Moderation Modal */}
          {selectedAttempt && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Review Verification Attempt</span>
                  </CardTitle>
                  <CardDescription>
                    Domain: {selectedAttempt.domain.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Domain and Owner Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Domain Name</Label>
                      <p className="text-lg font-semibold text-gray-900">{selectedAttempt.domain.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Verification Method</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        {getMethodIcon(selectedAttempt.method)}
                        <span>{getMethodLabel(selectedAttempt.method)}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Owner</Label>
                      <p className="text-gray-900">{selectedAttempt.domain.owner.name}</p>
                      <p className="text-sm text-gray-600">{selectedAttempt.domain.owner.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Submitted</Label>
                      <p className="text-gray-900">{new Date(selectedAttempt.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Verification Details */}
                  {selectedAttempt.token && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Verification Token</Label>
                      <div className="mt-1">
                        <code className="bg-gray-100 px-3 py-2 rounded text-sm font-mono block">
                          {selectedAttempt.token}
                        </code>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedAttempt.method === 'DNS_TXT' 
                          ? 'Check if this TXT record exists in the domain\'s DNS settings'
                          : 'Check if this token is present in the verification file'
                        }
                      </p>
                    </div>
                  )}

                  {selectedAttempt.fileUrl && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Verification File URL</Label>
                      <div className="mt-1">
                        <a 
                          href={selectedAttempt.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {selectedAttempt.fileUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Moderation Actions */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Moderation Action</Label>
                      <div className="flex space-x-4 mt-2">
                        <Button
                          variant={moderationAction === 'APPROVE' ? 'default' : 'outline'}
                          onClick={() => setModerationAction('APPROVE')}
                          className="flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </Button>
                        <Button
                          variant={moderationAction === 'REJECT' ? 'destructive' : 'outline'}
                          onClick={() => setModerationAction('REJECT')}
                          className="flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </Button>
                      </div>
                    </div>

                    {moderationAction === 'REJECT' && (
                      <div>
                        <Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-600">
                          Rejection Reason *
                        </Label>
                        <Input
                          id="rejectionReason"
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why the verification is being rejected..."
                          className="mt-1"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-600">
                        Admin Notes
                      </Label>
                      <Textarea
                        id="adminNotes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add any additional notes about this verification..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedAttempt(null);
                        setAdminNotes('');
                        setRejectionReason('');
                        setModerationAction('APPROVE');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleModeration}
                      disabled={isProcessing || (moderationAction === 'REJECT' && !rejectionReason.trim())}
                      className={moderationAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                    >
                      {isProcessing ? 'Processing...' : `${moderationAction === 'APPROVE' ? 'Approve' : 'Reject'} Verification`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </QueryErrorBoundary>
    </AdminGuard>
  );
}
