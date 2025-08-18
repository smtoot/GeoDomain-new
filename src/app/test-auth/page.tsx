'use client';

import { useState } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState('admin@geodomainland.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setResult(`Error: ${result.error}`);
      } else {
        setResult('Login successful!');
      }
    } catch (error) {
      setResult(`Exception: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setResult('Logged out');
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Session Status: {status}</p>
            {session && (
              <div className="mt-2 p-2 bg-green-50 rounded">
                <p className="text-sm">Logged in as: {session.user?.email}</p>
                <p className="text-sm">Role: {(session.user as any)?.role}</p>
              </div>
            )}
          </div>

          {!session ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@geodomainland.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogout} className="w-full">
              Logout
            </Button>
          )}

          {result && (
            <div className="mt-4 p-2 bg-gray-50 rounded">
              <p className="text-sm">{result}</p>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500">
            <p>Demo Accounts:</p>
            <p>Admin: admin@geodomainland.com / admin123</p>
            <p>Buyer: buyer1@test.com / buyer123</p>
            <p>Seller: seller1@test.com / seller123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
