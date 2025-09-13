/**
 * Enhanced Error Boundary Component
 * Provides comprehensive error handling for React components
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component' } = this.props;
    
    // Log error with appropriate level
    logger.error(`Error Boundary caught error (${level}):`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      level,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Auto-reset for non-critical errors after 30 seconds
    if (level !== 'critical') {
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetError();
      }, 30000);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.children !== this.props.children) {
      if (resetOnPropsChange) {
        this.resetError();
      }
    }

    // Reset if resetKeys have changed
    if (hasError && resetKeys && prevProps.resetKeys) {
      const hasResetKeyChanged = resetKeys.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      );
      
      if (hasResetKeyChanged) {
        this.resetError();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleRetry = () => {
    this.resetError();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Create bug report data
    const bugReport = {
      errorId,
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // In a real application, this would send to an error reporting service
    console.log('Bug Report:', bugReport);
    
    // For now, copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        alert('Bug report copied to clipboard. Please send it to support.');
      })
      .catch(() => {
        alert('Please copy the error details and send them to support.');
      });
  };

  render() {
    const { hasError, error, errorId } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render appropriate error UI based on level
      return this.renderErrorUI(level, error, errorId);
    }

    return children;
  }

  private renderErrorUI(level: string, error: Error | null, errorId: string) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (level === 'critical') {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-900">Critical Error</CardTitle>
              <CardDescription className="text-red-700">
                A critical error has occurred. Please contact support immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Error ID: {errorId}</p>
                {isDevelopment && error && (
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm text-gray-600 mb-2">
                      Error Details (Development)
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {error.message}
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReportBug} variant="outline" className="w-full">
                  <Bug className="w-4 h-4 mr-2" />
                  Report Bug
                </Button>
                <Button onClick={this.handleGoHome} className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (level === 'page') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle className="text-gray-900">Something went wrong</CardTitle>
              <CardDescription className="text-gray-600">
                We encountered an error while loading this page. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Error ID: {errorId}</p>
                {isDevelopment && error && (
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm text-gray-600 mb-2">
                      Error Details (Development)
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {error.message}
                    </pre>
                  </details>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex-1">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Component level error
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">Component Error</h3>
              <p className="text-sm text-red-700 mt-1">
                This component encountered an error and couldn't render properly.
              </p>
              {isDevelopment && error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-red-600">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs bg-red-100 p-2 rounded mt-1 overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// Hook for error boundary context
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logger.error('Error caught by useErrorHandler:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    });
  };
}

export default ErrorBoundary;
