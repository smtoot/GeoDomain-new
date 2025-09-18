import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, Clock } from 'lucide-react';

/**
 * Modern Toast Notification System
 * 
 * Provides consistent, accessible, and visually appealing notifications
 * to replace basic browser alerts throughout the application.
 */
export const showNotification = {
  success: (message: string, options?: { duration?: number }) => {
    toast.success(message, {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      duration: options?.duration || 4000,
      style: {
        background: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#166534',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      className: 'shadow-lg',
    });
  },
  
  error: (message: string, options?: { duration?: number }) => {
    toast.error(message, {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      duration: options?.duration || 6000,
      style: {
        background: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      className: 'shadow-lg',
    });
  },
  
  warning: (message: string, options?: { duration?: number }) => {
    toast(message, {
      icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      duration: options?.duration || 5000,
      style: {
        background: '#fffbeb',
        border: '1px solid #fed7aa',
        color: '#d97706',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      className: 'shadow-lg',
    });
  },
  
  info: (message: string, options?: { duration?: number }) => {
    toast(message, {
      icon: <Info className="h-5 w-5 text-blue-500" />,
      duration: options?.duration || 4000,
      style: {
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#2563eb',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      className: 'shadow-lg',
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      icon: <Clock className="h-5 w-5 text-blue-500 animate-spin" />,
      style: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#475569',
        borderRadius: '8px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: '500',
      },
      className: 'shadow-lg',
    });
  },

  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading: {
        render: messages.loading,
        icon: <Clock className="h-5 w-5 text-blue-500 animate-spin" />,
      },
      success: {
        render: typeof messages.success === 'function' 
          ? messages.success 
          : () => messages.success,
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      },
      error: {
        render: typeof messages.error === 'function' 
          ? messages.error 
          : () => messages.error,
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      },
    });
  },
};

/**
 * Inquiry-specific notification helpers
 */
export const inquiryNotifications = {
  submitted: () => {
    showNotification.success(
      'Inquiry submitted successfully! The seller will contact you soon.',
      { duration: 5000 }
    );
  },

  responseSent: () => {
    showNotification.success(
      'Response sent successfully! Your message will be reviewed by our team before forwarding to the buyer.',
      { duration: 5000 }
    );
  },

  responseFailed: () => {
    showNotification.error(
      'Failed to send response. Please try again.',
      { duration: 6000 }
    );
  },

  inquiryNotFound: () => {
    showNotification.error(
      'Inquiry not found. Please refresh the page and try again.',
      { duration: 6000 }
    );
  },

  accessDenied: () => {
    showNotification.error(
      'You do not have access to this inquiry.',
      { duration: 5000 }
    );
  },

  moderationRequired: () => {
    showNotification.info(
      'Your message is under review and will be forwarded once approved.',
      { duration: 4000 }
    );
  },
};

/**
 * Admin-specific notification helpers
 */
export const adminNotifications = {
  inquiryApproved: (count: number = 1) => {
    showNotification.success(
      `Successfully approved ${count} ${count === 1 ? 'inquiry' : 'inquiries'}`,
      { duration: 4000 }
    );
  },

  inquiryRejected: (count: number = 1) => {
    showNotification.warning(
      `Successfully rejected ${count} ${count === 1 ? 'inquiry' : 'inquiries'}`,
      { duration: 4000 }
    );
  },

  messageApproved: (count: number = 1) => {
    showNotification.success(
      `Successfully approved ${count} ${count === 1 ? 'message' : 'messages'}`,
      { duration: 4000 }
    );
  },

  messageRejected: (count: number = 1) => {
    showNotification.warning(
      `Successfully rejected ${count} ${count === 1 ? 'message' : 'messages'}`,
      { duration: 4000 }
    );
  },

  moderationFailed: (error: string) => {
    showNotification.error(
      `Moderation failed: ${error}`,
      { duration: 6000 }
    );
  },
};

/**
 * Domain-specific notification helpers
 */
export const domainNotifications = {
  domainCreated: () => {
    showNotification.success(
      'Domain listing created successfully! It will be reviewed before going live.',
      { duration: 5000 }
    );
  },

  domainUpdated: () => {
    showNotification.success(
      'Domain listing updated successfully!',
      { duration: 4000 }
    );
  },

  domainDeleted: () => {
    showNotification.warning(
      'Domain listing deleted successfully.',
      { duration: 4000 }
    );
  },

  verificationRequired: () => {
    showNotification.info(
      'Domain verification is required before it can be listed.',
      { duration: 5000 }
    );
  },
};

export default showNotification;
