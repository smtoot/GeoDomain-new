'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal,
  UserPlus,
  Shield,
  CheckCircle,
  UserX,
  Mail,
  Calendar,
  Eye
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserManagementProps {
  users: User[];
  onUpdatePermissions: (userId: string, role: string, status: string) => Promise<void>;
  isLoading?: boolean;
}

export default function UserManagement({
  users,
  onUpdatePermissions,
  isLoading = false
}: UserManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdatePermissions = async (userId: string, role: string, status: string) => {
    setIsProcessing(true);
    try {
      await onUpdatePermissions(userId, role, status);
      setSelectedUser(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="role-filter">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="BUYER">Buyer</SelectItem>
                  <SelectItem value="SELLER">Seller</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
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

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-500" />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.name || 'Unnamed User'}
                        </h3>
                        <Badge 
                          variant={user.role === 'SUPER_ADMIN' ? 'destructive' : 
                                  user.role === 'ADMIN' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.role}
                        </Badge>
                        <Badge 
                          variant={user.status === 'ACTIVE' ? 'default' : 
                                  user.status === 'SUSPENDED' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {user.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Joined {formatDate(user.createdAt)}</span>
                        </div>
                        {user.lastLoginAt && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>Last login {formatDate(user.lastLoginAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>User Details - {user.name || user.email}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Name:</span>
                              <p className="font-medium">{user.name || 'Not provided'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Email:</span>
                              <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Role:</span>
                              <Badge variant="outline" className="text-xs">
                                {user.role}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-gray-600">Status:</span>
                              <Badge 
                                variant={user.status === 'ACTIVE' ? 'default' : 
                                        user.status === 'SUSPENDED' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {user.status}
                              </Badge>
                            </div>
                            <div>
                              <span className="text-gray-600">Joined:</span>
                              <p className="font-medium">{formatDate(user.createdAt)}</p>
                            </div>
                            {user.lastLoginAt && (
                              <div>
                                <span className="text-gray-600">Last Login:</span>
                                <p className="font-medium">{formatDate(user.lastLoginAt)}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* Quick Actions */}
                          <div className="space-y-2">
                            <h4 className="font-medium">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePermissions(
                                  user.id, 
                                  user.role === 'ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
                                  user.status
                                )}
                                disabled={isProcessing || user.role === 'SUPER_ADMIN'}
                              >
                                <Shield className="h-4 w-4 mr-2" />
                                {user.role === 'ADMIN' ? 'Make Super Admin' : 'Make Admin'}
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdatePermissions(
                                  user.id,
                                  user.role,
                                  user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                                )}
                                disabled={isProcessing}
                              >
                                {user.status === 'ACTIVE' ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspend
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
              <Users className="h-12 w-12 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' 
                ? 'Try adjusting your filters or search terms.'
                : 'No users have been registered yet.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
