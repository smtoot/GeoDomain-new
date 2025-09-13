'use client';

import { useCallback } from 'react';
import { showErrorToast } from '@/components/error/ErrorToast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  context?: string;
  onError?: (error: Error) => void;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    showToast = true,
    logError = true,
    context,
    onError
  } = options;

  const handleError = useCallback((error: Error, customContext?: string) => {
    const errorContext = customContext || context || 'Unknown context';
    
    // Log error
    if (logError) {
      }

    // Show toast notification
    if (showToast) {
      showErrorToast(error, {
        title: `Error in ${errorContext}`,
        message: error.message,
      });
    }

    // Call custom error handler
    if (onError) {
      onError(error);
    }
  }, [showToast, logError, context, onError]);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    customContext?: string
  ): Promise<T | null> => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, customContext);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
}
