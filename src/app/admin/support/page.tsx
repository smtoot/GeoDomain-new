'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
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
  Flag,
  Globe,
  CreditCard,
  Users,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [assignedAdminFilter, setAssignedAdminFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch support tickets with filters
  const { data: ticketsData, isLoading, error, refetch } = trpc.support.getAllTickets.useQuery({
    status: statusFilter && statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter && priorityFilter !== "all" ? priorityFilter : undefined,
    category: categoryFilter && categoryFilter !== "all" ? categoryFilter : undefined,
    assignedAdminId: assignedAdminFilter && assignedAdminFilter !== "all" ? assignedAdminFilter : undefined,
    search: searchQuery || undefined,
    limit: 20,
  });

  // Fetch support statistics
  const { data: statsData } = trpc.support.getSupportStats.useQuery();

  // Fetch admins for assignment filter
  const { data: adminsData } = trpc.admin.users.listUsers.useQuery({
    role: 'ADMIN',
    limit: 50,
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DOMAIN_INQUIRY':
        return <Globe className="h-4 w-4" />;
      case 'TRANSACTION_ISSUE':
        return <CreditCard className="h-4 w-4" />;
      case 'TECHNICAL_SUPPORT':
        return <AlertCircle className="h-4 w-4" />;
      case 'ACCOUNT_ISSUE':
        return <User className="h-4 w-4" />;
      case 'PAYMENT_ISSUE':
        return <CreditCard className="h-4 w-4" />;
      case 'GENERAL_QUESTION':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Redirect if not admin
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

  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  const tickets = ticketsData?.tickets || [];
  const stats = statsData?.stats;

  return (
    <StandardPageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Support Management</h1>
          <p className="text-gray-600 mt-2">
            Manage and respond to customer support tickets
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Closed</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="WAITING_FOR_USER">Waiting for User</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="DOMAIN_INQUIRY">Domain Inquiry</SelectItem>
                    <SelectItem value="TRANSACTION_ISSUE">Transaction Issue</SelectItem>
                    <SelectItem value="TECHNICAL_SUPPORT">Technical Support</SelectItem>
                    <SelectItem value="ACCOUNT_ISSUE">Account Issue</SelectItem>
                    <SelectItem value="PAYMENT_ISSUE">Payment Issue</SelectItem>
                    <SelectItem value="GENERAL_QUESTION">General Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Assigned Admin</label>
                <Select value={assignedAdminFilter} onValueChange={setAssignedAdminFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Admins</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {adminsData?.users?.map((admin: any) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.name || admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatusFilter('all');
                    setPriorityFilter('all');
                    setCategoryFilter('all');
                    setAssignedAdminFilter('all');
                    setSearchQuery('');
                  }}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  <p className="text-gray-600">
                    No tickets match your current filters.
                  </p>
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
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(ticket.category)}
                            {getCategoryDisplay(ticket.category)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Flag className="h-3 w-3" />
                            {ticket.priority}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {ticket.user.name || ticket.user.email}
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

                        {/* Assigned Admin */}
                        {ticket.assignedAdmin && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="h-3 w-3" />
                            Assigned to: {ticket.assignedAdmin.name || ticket.assignedAdmin.email}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Link href={`/admin/support/${ticket.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Manage
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

        {/* Pagination Info */}
        {ticketsData && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Showing {tickets.length} of {ticketsData.total} tickets
            {ticketsData.hasMore && (
              <span className="ml-2">• Load more to see additional tickets</span>
            )}
          </div>
        )}
      </div>
    </StandardPageLayout>
  );
}
