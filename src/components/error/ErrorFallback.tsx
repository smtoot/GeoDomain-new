'use client';

import { AlertCircle, RefreshCw, Home, Wifi, Database, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  context?: string;
  showDetails?: boolean;
}

export function ErrorFallback({ error, resetError, context, showDetails = false }: ErrorFallbackProps) {
  const getErrorIcon = (error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return <Wifi className="h-6 w-6 text-orange-600" />;
    }
    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return <Database className="h-6 w-6 text-red-600" />;
    }
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return <Server className="h-6 w-6 text-red-600" />;
    }
    return <AlertCircle className="h-6 w-6 text-red-600" />;
  };

  const getErrorTitle = (error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Connection Error';
    }
    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return 'Database Error';
    }
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return 'Server Error';
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'Access Denied';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'Not Found';
    }
    return 'Something Went Wrong';
  };

  const getErrorMessage = (error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (message.includes('database') || message.includes('prisma') || message.includes('sql')) {
      return 'There was a problem accessing the database. Please try again in a moment.';
    }
    if (message.includes('server') || message.includes('500') || message.includes('internal')) {
      return 'The server encountered an unexpected error. Please try again later.';
    }
    if (message.includes('unauthorized') || message.includes('403')) {
      return 'You don\'t have permission to access this resource. Please log in or contact support.';
    }
    if (message.includes('not found') || message.includes('404')) {
      return 'The requested resource could not be found. It may have been moved or deleted.';
    }
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  const getErrorActions = (error: Error) => {
    const message = error.message.toLowerCase();
    if (message.includes('unauthorized') || message.includes('403')) {
      return (
        <>
          <Link href="/login">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Login
            </Button>
          </Link>
          <Button variant="outline" onClick={resetError}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </>
      );
    }
    if (message.includes('not found') || message.includes('404')) {
      return (
        <>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Button variant="outline" onClick={resetError}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </>
      );
    }
    return (
      <>
        <Button onClick={resetError}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Link href="/">
          <Button variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </>
    );
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            {getErrorIcon(error)}
          </div>
          <CardTitle className="text-xl text-gray-900">
            {getErrorTitle(error)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            {getErrorMessage(error)}
          </p>
          
          {context && (
            <p className="text-sm text-gray-500">
              Context: {context}
            </p>
          )}

          {(showDetails || process.env.NODE_ENV === 'development') && (
            <details className="text-left">
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
            {getErrorActions(error)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
