'use client';

import { useCallback } from 'react';
import { showErrorToast } from '@/components/error/ErrorToast';

export interface QueryErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
  onError?: (error: Error) => void;
  retryable?: boolean;
}

export function useQueryErrorHandler(options: QueryErrorHandlerOptions = {}) {
  const {
    showToast = true,
    logError = true,
    context,
    onError,
    retryable = true
  } = options;

  const handleQueryError = useCallback((error: Error, customContext?: string) => {
    const errorContext = customContext || context || 'Query';
    
    // Log error
    if (logError) {
      }

    // Show toast notification
    if (showToast) {
      showErrorToast(error, {
        title: `Failed to load ${errorContext}`,
        message: getQueryErrorMessage(error),
        action: retryable ? {
          label: 'Retry',
          onClick: () => window.location.reload()
        } : undefined
      });
    }

    // Call custom error handler
    if (onError) {
      onError(error);
    }
  }, [showToast, logError, context, onError, retryable]);

  const handleMutationError = useCallback((error: Error, customContext?: string) => {
    const errorContext = customContext || context || 'Operation';
    
    // Log error
    if (logError) {
      }

    // Show toast notification
    if (showToast) {
      showErrorToast(error, {
        title: `Failed to ${errorContext.toLowerCase()}`,
        message: getMutationErrorMessage(error),
      });
    }

    // Call custom error handler
    if (onError) {
      onError(error);
    }
  }, [showToast, logError, context, onError]);

  return {
    handleQueryError,
    handleMutationError,
  };
}

function getQueryErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (message.includes('unauthorized') || message.includes('403')) {
    return 'You need to log in to access this data.';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'The requested data could not be found.';
  }
  if (message.includes('timeout')) {
    return 'The request timed out. Please try again.';
  }
  if (message.includes('server') || message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  return 'Failed to load data. Please try again.';
}

function getMutationErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  if (message.includes('unauthorized') || message.includes('403')) {
    return 'You don\'t have permission to perform this action.';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'Please check your input and try again.';
  }
  if (message.includes('conflict') || message.includes('409')) {
    return 'This action conflicts with existing data. Please refresh and try again.';
  }
  if (message.includes('server') || message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  
  return 'Operation failed. Please try again.';
}
