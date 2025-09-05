'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Notification {
  id: string;
  type: 'inquiry' | 'deal' | 'domain' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export function RealTimeNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications with optimized caching
  const { data: initialNotifications } = trpc.dashboard.getRecentActivity.useQuery(
    undefined,
    {
      enabled: !!session?.user,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes instead of 30 seconds
      refetchOnWindowFocus: false
    }
  );

  // Fetch inquiry count for real-time updates with optimized caching
  const { data: inquiryCountData, refetch: refetchInquiryCount } = trpc.inquiries.getSellerInquiryCount.useQuery(
    undefined,
    {
      enabled: !!session?.user,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes instead of 30 seconds
      refetchOnWindowFocus: false
    }
  );

  // Initialize notifications from recent activity
  useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      const activityNotifications: Notification[] = initialNotifications.slice(0, 5).map((activity: any) => ({
        id: `activity-${activity.id || Date.now()}`,
        type: 'system',
        title: 'Recent Activity',
        message: activity.description || 'New activity on your account',
        timestamp: new Date(activity.createdAt || Date.now()),
        read: false,
      }));
      setNotifications(activityNotifications);
    }
  }, [initialNotifications]);

  // Handle real-time inquiry count updates
  useEffect(() => {
    if (inquiryCountData?.total && inquiryCountData.total > unreadCount) {
      const newNotification: Notification = {
        id: `inquiry-${Date.now()}`,
        type: 'inquiry',
        title: 'New Inquiry Received',
        message: `You have ${inquiryCountData.total} total inquiries`,
        timestamp: new Date(),
        read: false,
      };
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
      setUnreadCount(inquiryCountData.total);
    }
  }, [inquiryCountData?.total, unreadCount]);

  // Simulate real-time updates (in a real app, this would use WebSockets)
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      // Refetch inquiry count to check for updates
      refetchInquiryCount();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [session?.user, refetchInquiryCount]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inquiry':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'deal':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'domain':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'inquiry':
        return 'border-l-blue-500 bg-blue-50';
      case 'deal':
        return 'border-l-green-500 bg-green-50';
      case 'domain':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  if (!session?.user) return null;

  const unreadNotifications = notifications.filter(n => !n.read);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadNotifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadNotifications.length}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-l-4 ${getNotificationColor(notification.type)} mb-2 rounded-r-lg ${
                    !notification.read ? 'opacity-100' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Mark read
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
