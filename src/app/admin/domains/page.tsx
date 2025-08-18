'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { 
  Globe, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Check,
  X,
  AlertTriangle,
  DollarSign,
  User,
  Calendar,
  Shield,
  Edit
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';

export default function AdminDomainModerationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [selectedDomain, setSelectedDomain] = useState<any>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | 'request-changes'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestedChanges, setRequestedChanges] = useState<string[]>(['']);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect if not admin
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  // Mock data for domains - in real implementation, this would come from tRPC
  const mockDomains = [
    {
      id: '1',
      name: 'example.com',
      description: 'Premium domain for sale',
      price: 5000,
      status: 'PENDING_REVIEW',
      verificationStatus: 'VERIFIED',
      seller: { name: 'John Doe', email: 'john@example.com' },
      createdAt: new Date('2024-01-15'),
      category: 'Technology',
      keywords: ['tech', 'startup', 'business'],
      traffic: 1000,
      age: '5 years',
    },
    {
      id: '2',
      name: 'startup.io',
      description: 'Perfect for tech startups',
      price: 8000,
      status: 'ACTIVE',
      verificationStatus: 'VERIFIED',
      seller: { name: 'Jane Smith', email: 'jane@example.com' },
      createdAt: new Date('2024-01-10'),
      category: 'Technology',
      keywords: ['startup', 'tech', 'innovation'],
      traffic: 2000,
      age: '3 years',
    },
    {
      id: '3',
      name: 'business.net',
      description: 'Professional business domain',
      price: 3000,
      status: 'PENDING_REVIEW',
      verificationStatus: 'PENDING',
      seller: { name: 'Bob Wilson', email: 'bob@example.com' },
      createdAt: new Date('2024-01-20'),
      category: 'Business',
      keywords: ['business', 'professional', 'corporate'],
      traffic: 500,
      age: '2 years',
    },
  ];

  const filteredDomains = mockDomains.filter(domain => {
    const matchesSearch = domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         domain.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || domain.status === statusFilter;
    const matchesVerification = verificationFilter === 'ALL' || domain.verificationStatus === verificationFilter;
    return matchesSearch && matchesStatus && matchesVerification;
  });

  const handleModeration = async () => {
    if (!selectedDomain) return;

    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`Domain ${moderationAction === 'approve' ? 'approved' : moderationAction === 'reject' ? 'rejected' : 'changes requested'} successfully`);
      setSelectedDomain(null);
      setAdminNotes('');
      setRejectionReason('');
      setRequestedChanges(['']);
    } catch (error) {
      toast.error('Failed to moderate domain');
    } finally {
      setIsProcessing(false);
    }
  };

  const addRequestedChange = () => {
    setRequestedChanges([...requestedChanges, '']);
  };

  const removeRequestedChange = (index: number) => {
    setRequestedChanges(requestedChanges.filter((_, i) => i !== index));
  };

  const updateRequestedChange = (index: number, value: string) => {
    const newChanges = [...requestedChanges];
    newChanges[index] = value;
    setRequestedChanges(newChanges);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'PENDING_REVIEW': return 'secondary';
      case 'SUSPENDED': return 'destructive';
      default: return 'outline';
    }
  };

  const getVerificationBadgeVariant = (status: string) => {
    switch (status) {
      case 'VERIFIED': return 'default';
      case 'PENDING': return 'secondary';
      case 'FAILED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Domain Moderation</h1>
            <p className="text-gray-600">Review and moderate domain listings</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {filteredDomains.length} domains
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {filteredDomains.filter(d => d.status === 'PENDING_REVIEW').length} pending
            </Badge>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Domains</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by domain name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="verification-filter">Verification</Label>
              <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Verification</SelectItem>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domains List */}
      {filteredDomains.length > 0 ? (
        <div className="space-y-4">
          {filteredDomains.map((domain) => (
            <Card key={domain.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {domain.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Listed on {formatDate(domain.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(domain.status)}>
                          {domain.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getVerificationBadgeVariant(domain.verificationStatus)}>
                          {domain.verificationStatus}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">${domain.price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Seller:</span>
                        <span className="font-medium">{domain.seller.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">{domain.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">Age:</span>
                        <span className="font-medium">{domain.age}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Description:</h4>
                      <p className="text-sm text-gray-600">{domain.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>Traffic: {domain.traffic} visits/month</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Keywords: {domain.keywords.join(', ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-48">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedDomain(domain)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Review Domain - {domain.name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          {/* Domain Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Domain Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Domain:</span>
                                <p className="font-medium">{domain.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Price:</span>
                                <p className="font-medium">${domain.price.toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Seller:</span>
                                <p className="font-medium">{domain.seller.name} ({domain.seller.email})</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Category:</span>
                                <p className="font-medium">{domain.category}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Age:</span>
                                <p className="font-medium">{domain.age}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Traffic:</span>
                                <p className="font-medium">{domain.traffic} visits/month</p>
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 text-sm">Description:</span>
                              <p className="text-sm mt-1">{domain.description}</p>
                            </div>
                            
                            <div>
                              <span className="text-gray-600 text-sm">Keywords:</span>
                              <p className="text-sm mt-1">{domain.keywords.join(', ')}</p>
                            </div>
                          </div>

                          {/* Moderation Actions */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Moderation Action</h3>
                            
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Button
                                  variant={moderationAction === 'approve' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setModerationAction('approve')}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant={moderationAction === 'reject' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setModerationAction('reject')}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  variant={moderationAction === 'request-changes' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setModerationAction('request-changes')}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Request Changes
                                </Button>
                              </div>

                              {/* Admin Notes */}
                              <div>
                                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                                <Textarea
                                  id="adminNotes"
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add any notes about this domain..."
                                  rows={3}
                                />
                              </div>

                              {/* Rejection Reason */}
                              {moderationAction === 'reject' && (
                                <div>
                                  <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                                  <Textarea
                                    id="rejectionReason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this domain was rejected..."
                                    rows={3}
                                    required
                                  />
                                </div>
                              )}

                              {/* Requested Changes */}
                              {moderationAction === 'request-changes' && (
                                <div>
                                  <Label>Requested Changes *</Label>
                                  <div className="space-y-2">
                                    {requestedChanges.map((change, index) => (
                                      <div key={index} className="flex gap-2">
                                        <Input
                                          value={change}
                                          onChange={(e) => updateRequestedChange(index, e.target.value)}
                                          placeholder={`Change ${index + 1}`}
                                        />
                                        {requestedChanges.length > 1 && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeRequestedChange(index)}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    ))}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={addRequestedChange}
                                    >
                                      Add Another Change
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setSelectedDomain(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleModeration}
                              disabled={isProcessing}
                            >
                              {isProcessing ? 'Processing...' : 'Submit Decision'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Globe className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'ALL' || verificationFilter !== 'ALL' 
                ? 'Try adjusting your filters or search terms.'
                : 'No domains have been listed yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
