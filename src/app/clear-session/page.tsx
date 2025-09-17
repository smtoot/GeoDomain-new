'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function ClearSessionPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  const clearSession = async () => {
    setIsClearing(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/clear-session');
      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: data.message
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setResult({
          success: false,
          message: data.message || 'Failed to clear session'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    } finally {
      setIsClearing(false);
    }
  };

  const clearSessionManually = () => {
    // Clear cookies manually using JavaScript
    const cookiesToClear = [
      'next-auth.session-token',
      'next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.session-token',
      '__Host-next-auth.csrf-token'
    ];

    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.vercel.app;`;
    });

    setResult({
      success: true,
      message: 'Session cleared manually. Please refresh the page and log in again.'
    });

    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Clear Authentication Session
          </CardTitle>
          <CardDescription>
            This will clear your current authentication session to resolve login issues.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result && (
            <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              onClick={clearSession} 
              disabled={isClearing}
              className="w-full"
            >
              {isClearing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Clearing Session...
                </>
              ) : (
                'Clear Session (Recommended)'
              )}
            </Button>

            <Button 
              onClick={clearSessionManually}
              variant="outline"
              className="w-full"
            >
              Clear Session Manually
            </Button>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>What this does:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Clears all authentication cookies</li>
              <li>Forces you to log in again</li>
              <li>Resolves token/session mismatch issues</li>
            </ul>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>After clearing:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You'll be redirected to the login page</li>
              <li>Log in with your credentials</li>
              <li>Dashboard pages should work correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
