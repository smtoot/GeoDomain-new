'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Tag,
  Flag
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function SupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  const { data: ticketsData, isLoading, error, refetch } = trpc.support.getUserTickets.useQuery({
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    limit: 20,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'WAITING_FOR_USER':
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'RESOLVED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'CLOSED':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'default';
      case 'IN_PROGRESS':
        return 'secondary';
      case 'WAITING_FOR_USER':
        return 'outline';
      case 'RESOLVED':
        return 'default';
      case 'CLOSED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'outline';
      case 'MEDIUM':
        return 'default';
      case 'HIGH':
        return 'secondary';
      case 'URGENT':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getCategoryDisplay = (category: string) => {
    switch (category) {
      case 'DOMAIN_INQUIRY':
        return 'Domain Inquiry';
      case 'TRANSACTION_ISSUE':
        return 'Transaction Issue';
      case 'TECHNICAL_SUPPORT':
        return 'Technical Support';
      case 'ACCOUNT_ISSUE':
        return 'Account Issue';
      case 'PAYMENT_ISSUE':
        return 'Payment Issue';
      case 'GENERAL_QUESTION':
        return 'General Question';
      default:
        return category;
    }
  };

  const tickets = ticketsData?.tickets || [];

  return (
    <StandardPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
              <p className="text-gray-600 mt-2">
                Get help with your domains, transactions, and account issues
              </p>
            </div>
            <Link href="/support/new">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              <SelectItem value="DOMAIN_INQUIRY">Domain Inquiry</SelectItem>
              <SelectItem value="TRANSACTION_ISSUE">Transaction Issue</SelectItem>
              <SelectItem value="TECHNICAL_SUPPORT">Technical Support</SelectItem>
              <SelectItem value="ACCOUNT_ISSUE">Account Issue</SelectItem>
              <SelectItem value="PAYMENT_ISSUE">Payment Issue</SelectItem>
              <SelectItem value="GENERAL_QUESTION">General Question</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        <QueryErrorBoundary>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <LoadingCardSkeleton key={i} />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Error Loading Tickets
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {error.message || 'Failed to load support tickets'}
                  </p>
                  <Button onClick={() => refetch()} variant="outline">
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Support Tickets
                  </h3>
                  <p className="text-gray-600 mb-6">
                    You haven't created any support tickets yet. Need help? Create your first ticket.
                  </p>
                  <Link href="/support/new">
                    <Button className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Support Ticket
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket: any) => (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(ticket.status)}
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {ticket.title}
                          </h3>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {ticket.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {getCategoryDisplay(ticket.category)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            {ticket.priority}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket._count.messages} messages
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Link href={`/support/${ticket.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </QueryErrorBoundary>

        {/* Stats */}
        {ticketsData && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {ticketsData.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Tickets</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {tickets.filter(t => t.status === 'RESOLVED').length}
                  </div>
                  <div className="text-sm text-gray-600">Resolved</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {tickets.filter(t => t.status === 'CLOSED').length}
                  </div>
                  <div className="text-sm text-gray-600">Closed</div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
