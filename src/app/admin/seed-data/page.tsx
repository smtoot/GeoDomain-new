'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, AlertCircle } from 'lucide-react';

export default function SeedDataPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigratingDomains, setIsMigratingDomains] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    needsMigration?: boolean;
    existingTables?: string[];
    missingTables?: string[];
  } | null>(null);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [domainsMigrationResult, setDomainsMigrationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
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

  const handleTestDatabase = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/test-db', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: result.needsMigration ? 'Database test completed - migration needed' : 'Database test completed - all tables exist',
          needsMigration: result.needsMigration,
          existingTables: result.results.existingTables,
          missingTables: result.missingTables
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Failed to test database'
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Network error occurred while testing database'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleMigrateDomains = async () => {
    setIsMigratingDomains(true);
    setDomainsMigrationResult(null);

    try {
      const response = await fetch('/api/admin/migrate-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setDomainsMigrationResult({
          success: true,
          message: result.message
        });
      } else {
        setDomainsMigrationResult({
          success: false,
          message: result.error || 'Failed to migrate domains table'
        });
      }
    } catch (error) {
      setDomainsMigrationResult({
        success: false,
        message: 'Network error occurred while migrating domains table'
      });
    } finally {
      setIsMigratingDomains(false);
    }
  };

  const handleMigrateSchema = async () => {
    setIsMigrating(true);
    setMigrationResult(null);

    try {
      const response = await fetch('/api/admin/migrate-schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMigrationResult({
          success: true,
          message: result.message
        });
      } else {
        setMigrationResult({
          success: false,
          message: result.error || 'Failed to migrate schema'
        });
      }
    } catch (error) {
      setMigrationResult({
        success: false,
        message: 'Network error occurred while migrating schema'
      });
    } finally {
      setIsMigrating(false);
    }
  };

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
    <QueryErrorBoundary context="Admin Seed Data Page">
      <StandardPageLayout
        title="Seed Admin Data"
        description="Populate the database with initial categories, states, and cities data. This will add comprehensive data for the admin management system."
        isLoading={isSeeding || isMigrating || isMigratingDomains || isTesting}
        loadingText="Processing database operations..."
      >
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Operations
              </CardTitle>
              <CardDescription>
                Manage database seeding, migration, and testing operations.
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">
            {testResult && (
              <Alert className={testResult.success ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? 'text-blue-800' : 'text-red-800'}>
                    {testResult.message}
                    {testResult.existingTables && (
                      <div className="mt-2 text-sm">
                        <div><strong>Existing tables:</strong> {testResult.existingTables.join(', ')}</div>
                        {testResult.missingTables && testResult.missingTables.length > 0 && (
                          <div><strong>Missing tables:</strong> {testResult.missingTables.join(', ')}</div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {domainsMigrationResult && (
              <Alert className={domainsMigrationResult.success ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {domainsMigrationResult.success ? (
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={domainsMigrationResult.success ? 'text-orange-800' : 'text-red-800'}>
                    {domainsMigrationResult.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {migrationResult && (
              <Alert className={migrationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <div className="flex items-center gap-2">
                  {migrationResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={migrationResult.success ? 'text-green-800' : 'text-red-800'}>
                    {migrationResult.message}
                  </AlertDescription>
                </div>
              </Alert>
            )}

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

              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Step 0: Test Database Connection</h4>
                  <p className="text-sm text-gray-700 mb-3">
                    First, test the database connection and check which tables already exist.
                  </p>
                  <Button 
                    onClick={handleTestDatabase} 
                    disabled={isTesting || isMigrating || isSeeding}
                    variant="outline"
                    className="w-full"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing Database...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Test Database
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-800 mb-2">Step 1: Update Domains Table</h4>
                  <p className="text-sm text-orange-700 mb-3">
                    Add new columns (stateId, cityId, categoryId) to the existing domains table.
                    This is required for the new admin data system.
                  </p>
                  <Button 
                    onClick={handleMigrateDomains} 
                    disabled={isMigratingDomains || isMigrating || isSeeding || isTesting}
                    variant="outline"
                    className="w-full"
                  >
                    {isMigratingDomains ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Domains Table...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Update Domains Table
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Step 2: Create Database Tables</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Create the required database tables for categories, states, and cities.
                    This only needs to be done once.
                  </p>
                  <Button 
                    onClick={handleMigrateSchema} 
                    disabled={isMigrating || isSeeding || isTesting || isMigratingDomains}
                    variant="outline"
                    className="w-full"
                  >
                    {isMigrating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Tables...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Create Database Tables
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Step 3: Seed Data</h4>
                  <p className="text-sm text-green-700 mb-3">
                    After creating the tables, populate them with categories, states, and cities data.
                  </p>
                  <Button 
                    onClick={handleSeedData} 
                    disabled={isSeeding || isMigrating || isTesting || isMigratingDomains}
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
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </StandardPageLayout>
    </QueryErrorBoundary>
  );
}
