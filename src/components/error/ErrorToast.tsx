'use client';

import { toast } from 'react-hot-toast';
import { AlertCircle, Wifi, Database, Server, Shield } from 'lucide-react';

export interface ErrorToastOptions {
  title?: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function showErrorToast(error: Error, options: ErrorToastOptions = {}) {
  const getErrorIcon = (error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return <Wifi className="h-4 w-4 text-orange-600" />;
    }
    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return <Database className="h-4 w-4 text-red-600" />;
    }
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return <Server className="h-4 w-4 text-red-600" />;
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return <Shield className="h-4 w-4 text-red-600" />;
    }
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getErrorMessage = (error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Connection failed. Please check your internet connection.';
    }
    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return 'Database error. Please try again.';
    }
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return 'Server error. Please try again later.';
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'Access denied. Please log in again.';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'Resource not found.';
    }
    return options.message || error.message || 'An unexpected error occurred.';
  };

  const title = options.title || 'Error';
  const message = getErrorMessage(error);
  const duration = options.duration || 5000;

  toast.error(
    (t) => (
      <div className="flex items-start space-x-3">
        {getErrorIcon(error)}
        <div className="flex-1">
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-600 mt-1">{message}</div>
          {options.action && (
            <button
              onClick={() => {
                options.action!.onClick();
                toast.dismiss(t.id);
              }}
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
            >
              {options.action.label}
            </button>
          )}
        </div>
      </div>
    ),
    {
      duration,
      id: `error-${Date.now()}`, // Prevent duplicate toasts
    }
  );
}

export function showSuccessToast(message: string, options: { duration?: number } = {}) {
  toast.success(message, {
    duration: options.duration || 3000,
  });
}

export function showInfoToast(message: string, options: { duration?: number } = {}) {
  toast(message, {
    duration: options.duration || 3000,
    icon: 'ℹ️',
  });
}
