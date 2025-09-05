'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console for debugging
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private isDatabaseError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('database') ||
      message.includes('prisma') ||
      message.includes('sqlite') ||
      message.includes('connection') ||
      message.includes('unable to open')
    );
  }

  private isNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('connection refused')
    );
  }

  private getErrorType(error: Error): 'database' | 'network' | 'application' | 'unknown' {
    if (this.isDatabaseError(error)) return 'database';
    if (this.isNetworkError(error)) return 'network';
    if (error.name === 'TypeError' || error.name === 'ReferenceError') return 'application';
    return 'unknown';
  }

  private getErrorMessage(error: Error): string {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case 'database':
        return 'Database connection issue detected. This might be a temporary problem.';
      case 'network':
        return 'Network connection issue detected. Please check your internet connection.';
      case 'application':
        return 'An application error occurred. This might be a bug in the code.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  private getErrorActions(error: Error) {
    const errorType = this.getErrorType(error);
    
    switch (errorType) {
      case 'database':
        return (
          <>
            <Button onClick={this.handleRetry} className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={this.handleGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </>
        );
      case 'network':
        return (
          <>
            <Button onClick={this.handleRetry} className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </>
        );
      default:
        return (
          <>
            <Button onClick={this.handleRetry} className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={this.handleGoHome}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </>
        );
    }
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const errorType = error ? this.getErrorType(error) : 'unknown';
      const errorMessage = error ? this.getErrorMessage(error) : 'An unknown error occurred';
      const errorActions = error ? this.getErrorActions(error) : null;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl text-gray-900">
                {errorType === 'database' && 'Database Error'}
                {errorType === 'network' && 'Network Error'}
                {errorType === 'application' && 'Application Error'}
                {errorType === 'unknown' && 'Something Went Wrong'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>
              
              {error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Show error details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto">
                    <div className="mb-2">
                      <strong>Error:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex justify-center space-x-2">
                {errorActions}
              </div>

              {errorType === 'database' && (
                <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
                  <p className="font-medium">Database Error Help:</p>
                  <ul className="mt-1 text-xs space-y-1">
                    <li>• Try refreshing the page</li>
                    <li>• Check if the database is accessible</li>
                    <li>• Contact support if the problem persists</li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandling() {
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('Global error caught:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error);
    
    // You can add error reporting logic here
    // e.g., send to error tracking service
    
    // Show user-friendly error message
    if (typeof window !== 'undefined') {
      // You can use toast notifications here
      console.error('User-friendly error message:', error.message);
    }
  };

  return { handleError };
}
