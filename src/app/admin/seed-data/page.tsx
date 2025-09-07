'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

export default function SeedDataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{
    success: boolean;
    message: string;
    data?: {
      categories: number;
      states: number;
      cities: number;
    };
  } | null>(null);

  // Redirect if not authenticated or not admin
  if (status === 'unauthenticated' || !session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
    router.push('/login');
    return null;
  }

  const handleSeedData = async () => {
    setIsSeeding(true);
    setSeedResult(null);

    try {
      const response = await fetch('/api/admin/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setSeedResult({
          success: true,
          message: result.message,
          data: result.data
        });
      } else {
        setSeedResult({
          success: false,
          message: result.error || 'Failed to seed data'
        });
      }
    } catch (error) {
      setSeedResult({
        success: false,
        message: 'Network error occurred while seeding data'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Seed Admin Data
            </CardTitle>
            <CardDescription>
              Populate the database with initial categories, states, and cities data.
              This will add comprehensive data for the admin management system.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {seedResult && (
              <Alert className={seedResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {seedResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={seedResult.success ? 'text-green-800' : 'text-red-800'}>
                    {seedResult.message}
                    {seedResult.data && (
                      <div className="mt-2 text-sm">
                        <div>• {seedResult.data.categories} categories</div>
                        <div>• {seedResult.data.states} states</div>
                        <div>• {seedResult.data.cities} cities</div>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">What will be seeded:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  <li><strong>Categories:</strong> 50+ domain categories (hotels, restaurants, real estate, etc.)</li>
                  <li><strong>States:</strong> All 50 US states with abbreviations</li>
                  <li><strong>Cities:</strong> Top 50 US cities by population, mapped to their states</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Important Note:</h4>
                <p className="text-sm text-yellow-700">
                  This operation will create or update existing data. If data already exists, it will be updated with the latest information.
                  This is safe to run multiple times.
                </p>
              </div>

              <Button 
                onClick={handleSeedData} 
                disabled={isSeeding}
                className="w-full"
                size="lg"
              >
                {isSeeding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Seeding Data...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Seed Admin Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
