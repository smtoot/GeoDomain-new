import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Notification types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Notification priority
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: 'system' | 'inquiry' | 'message' | 'deal' | 'payment' | 'domain';
  read: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

// Notification store state
interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  
  // Actions
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  getNotificationsByCategory: (category: Notification['category']) => Notification[];
  getUnreadNotifications: () => Notification[];
}

// Notification preferences
export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  categories: {
    system: boolean;
    inquiry: boolean;
    message: boolean;
    deal: boolean;
    payment: boolean;
    domain: boolean;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

// Default notification preferences
const defaultPreferences: NotificationPreferences = {
  email: true,
  push: false,
  inApp: true,
  categories: {
    system: true,
    inquiry: true,
    message: true,
    deal: true,
    payment: true,
    domain: true,
  },
  frequency: 'immediate',
};

// Create notification store
export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      preferences: defaultPreferences,

      addNotification: (notificationData) => {
        const notification: Notification = {
          ...notificationData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          read: false,
        };

        set((state) => {
          const newNotifications = [notification, ...state.notifications];
          const unreadCount = newNotifications.filter(n => !n.read).length;
          
          return {
            notifications: newNotifications.slice(0, 100), // Keep only last 100 notifications
            unreadCount,
          };
        });

        // Check if we should send email notification
        const { preferences } = get();
        if (preferences.email && preferences.categories[notification.category]) {
          // This would trigger email sending in a real implementation
          console.log('Sending email notification:', notification);
        }
      },

      markAsRead: (id: string) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          );
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id: string) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter(n => n.id !== id);
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount,
          };
        });
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        }));
      },

      getNotificationsByCategory: (category) => {
        const { notifications } = get();
        return notifications.filter(n => n.category === category);
      },

      getUnreadNotifications: () => {
        const { notifications } = get();
        return notifications.filter(n => !n.read);
      },
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    }
  )
);

// Notification utility functions
export const createNotification = (
  type: NotificationType,
  title: string,
  message: string,
  category: Notification['category'],
  priority: NotificationPriority = 'medium',
  options?: {
    actionUrl?: string;
    actionText?: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
  }
) => {
  const { addNotification } = useNotificationStore.getState();
  
  addNotification({
    type,
    title,
    message,
    priority,
    category,
    ...options,
  });
};

// Predefined notification creators
export const createInquiryNotification = (
  domainName: string,
  buyerName: string,
  priority: NotificationPriority = 'medium'
) => {
  createNotification(
    'info',
    'New Domain Inquiry',
    `${buyerName} submitted an inquiry for ${domainName}`,
    'inquiry',
    priority,
    {
      actionUrl: `/admin/inquiries`,
      actionText: 'Review Inquiry',
    }
  );
};

export const createMessageNotification = (
  senderName: string,
  domainName: string,
  priority: NotificationPriority = 'medium'
) => {
  createNotification(
    'info',
    'New Message',
    `${senderName} sent a message about ${domainName}`,
    'message',
    priority,
    {
      actionUrl: `/admin/messages`,
      actionText: 'Review Message',
    }
  );
};

export const createPaymentNotification = (
  domainName: string,
  amount: string,
  priority: NotificationPriority = 'high'
) => {
  createNotification(
    'success',
    'Payment Verification Required',
    `Payment of ${amount} received for ${domainName}`,
    'payment',
    priority,
    {
      actionUrl: `/admin/payments`,
      actionText: 'Verify Payment',
    }
  );
};

export const createDealStatusNotification = (
  domainName: string,
  status: string,
  priority: NotificationPriority = 'medium'
) => {
  createNotification(
    'success',
    'Deal Status Updated',
    `Deal for ${domainName} status changed to ${status}`,
    'deal',
    priority,
    {
      actionUrl: `/admin/deals`,
      actionText: 'View Deal',
    }
  );
};

export const createDomainVerificationNotification = (
  domainName: string,
  status: string,
  priority: NotificationPriority = 'medium'
) => {
  createNotification(
    status === 'VERIFIED' ? 'success' : 'warning',
    'Domain Verification',
    `Domain ${domainName} verification status: ${status}`,
    'domain',
    priority,
    {
      actionUrl: `/admin/domains`,
      actionText: 'View Domain',
    }
  );
};

export const createSystemNotification = (
  title: string,
  message: string,
  type: NotificationType = 'info',
  priority: NotificationPriority = 'medium'
) => {
  createNotification(
    type,
    title,
    message,
    'system',
    priority
  );
};

// Clean up expired notifications
export const cleanupExpiredNotifications = () => {
  const { notifications, removeNotification } = useNotificationStore.getState();
  const now = new Date();
  
  notifications.forEach(notification => {
    if (notification.expiresAt && notification.expiresAt < now) {
      removeNotification(notification.id);
    }
  });
};

// Initialize cleanup interval
if (typeof window !== 'undefined') {
  setInterval(cleanupExpiredNotifications, 60000); // Clean up every minute
}
