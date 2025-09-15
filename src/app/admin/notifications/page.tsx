'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Send, 
  Users, 
  Globe, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminNotificationsPage() {
  const [selectedTab, setSelectedTab] = useState('manage');
  const [notificationType, setNotificationType] = useState('all');
  const [targetAudience, setTargetAudience] = useState('all');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch notifications (placeholder - would need to implement this endpoint)
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = trpc.admin.getSystemOverview.useQuery();

  const handleSendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error('Please fill in both title and message');
      return;
    }

    setIsSending(true);
    try {
      // Simulate sending notification
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Notification sent successfully!');
      setNotificationTitle('');
      setNotificationMessage('');
      refetchNotifications();
    } catch (error) {
      toast.error('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    toast.success('Notification marked as read');
    refetchNotifications();
  };

  const handleDeleteNotification = (notificationId: string) => {
    toast.success('Notification deleted');
    refetchNotifications();
  };

  // Mock notification data
  const mockNotifications = [
    {
      id: '1',
      title: 'New User Registration',
      message: 'A new user has registered on the platform',
      type: 'user',
      priority: 'low',
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      read: false,
      targetAudience: 'admin'
    },
    {
      id: '2',
      title: 'Domain Verification Required',
      message: '5 domains are pending verification',
      type: 'domain',
      priority: 'medium',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      read: true,
      targetAudience: 'admin'
    },
    {
      id: '3',
      title: 'Payment Processed',
      message: 'A payment of $299 has been processed successfully',
      type: 'payment',
      priority: 'high',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      read: false,
      targetAudience: 'admin'
    },
    {
      id: '4',
      title: 'System Maintenance',
      message: 'Scheduled maintenance will occur tonight at 2 AM',
      type: 'system',
      priority: 'high',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      read: true,
      targetAudience: 'all'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user': return <Users className="h-4 w-4" />;
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'system': return <AlertTriangle className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  if (notificationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bell className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification Management</h1>
        <p className="text-gray-600 mt-2">
          Manage system notifications and send announcements to users
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manage">Manage Notifications</TabsTrigger>
          <TabsTrigger value="send">Send Notification</TabsTrigger>
        </TabsList>

        <TabsContent value="manage" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="domain">Domain</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="audience-filter">Audience</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                      <SelectItem value="seller">Sellers Only</SelectItem>
                      <SelectItem value="buyer">Buyers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>
                {mockNotifications.filter(n => notificationType === 'all' || n.type === notificationType).length} notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockNotifications
                  .filter(n => notificationType === 'all' || n.type === notificationType)
                  .map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg ${
                        notification.read ? 'bg-gray-50' : 'bg-white border-blue-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-gray-900">{notification.title}</h4>
                              <Badge variant={getPriorityColor(notification.priority) as any}>
                                {notification.priority}
                              </Badge>
                              {!notification.read && (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                  New
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(notification.createdAt)}
                              </span>
                              <span>Target: {notification.targetAudience}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteNotification(notification.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send New Notification</CardTitle>
              <CardDescription>
                Create and send notifications to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="notification-type">Notification Type</Label>
                  <Select value={notificationType} onValueChange={setNotificationType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">Announcement</SelectItem>
                      <SelectItem value="system">System Update</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="promotion">Promotion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="admin">Admins Only</SelectItem>
                      <SelectItem value="seller">Sellers Only</SelectItem>
                      <SelectItem value="buyer">Buyers Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notification-title">Title</Label>
                <Input
                  id="notification-title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                  placeholder="Enter notification title"
                />
              </div>

              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter notification message"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSendNotification}
                  disabled={isSending || !notificationTitle.trim() || !notificationMessage.trim()}
                >
                  {isSending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
