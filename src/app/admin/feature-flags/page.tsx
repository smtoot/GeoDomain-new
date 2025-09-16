'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
// import { Progress } from '@/components/ui/progress'; // Component not available
import { StandardPageLayout } from '@/components/layout/StandardPageLayout';
import { QueryErrorBoundary } from '@/components/error';
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton';
import { 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { adminNotifications } from '@/components/notifications/ToastNotification';

export default function FeatureFlagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  // Show loading state while session is being validated
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Fetch real feature flags data from tRPC
  const { data: featureFlagsData, isLoading: flagsLoading, error: flagsError, refetch: refetchFlags } = trpc.featureFlags.getConfig.useQuery();
  
  // Fetch feature flag statistics
  const { data: statsData, isLoading: statsLoading, error: statsError } = trpc.featureFlags.getStats.useQuery();
  
  // Fetch hybrid system statistics
  const { data: hybridStatsData, isLoading: hybridStatsLoading, error: hybridStatsError } = trpc.featureFlags.getHybridSystemStats.useQuery();

  const featureFlags = featureFlagsData?.data || [];
  const stats = statsData?.data || { totalFlags: 0, enabledFlags: 0, enabledPercentage: 0, lastUpdated: new Date() };
  const hybridStats = hybridStatsData?.data || {
    totalInquiries: 0,
    openInquiries: 0,
    convertedDeals: 0,
    flaggedMessages: 0,
    directMessages: 0,
    adminMediatedMessages: 0
  };

  // tRPC mutations for feature flag management
  const toggleFeatureMutation = trpc.featureFlags.toggleFeature.useMutation({
    onSuccess: () => {
      adminNotifications.success('Feature flag updated successfully');
      refetchFlags();
    },
    onError: (error) => {
      adminNotifications.error(`Failed to update feature flag: ${error.message}`);
    },
  });

  const updateRolloutMutation = trpc.featureFlags.updateRollout.useMutation({
    onSuccess: () => {
      adminNotifications.success('Rollout percentage updated successfully');
      refetchFlags();
    },
    onError: (error) => {
      adminNotifications.error(`Failed to update rollout: ${error.message}`);
    },
  });

  const handleToggleFeature = async (featureId: string, enabled: boolean) => {
    setIsUpdating(true);
    try {
      await toggleFeatureMutation.mutateAsync({
        featureId,
        enabled
      });
    } catch (error) {
      // Error handling is done in the mutation onError callback
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateRollout = async (featureId: string, rolloutPercentage: number) => {
    setIsUpdating(true);
    try {
      await updateRolloutMutation.mutateAsync({
        featureId,
        rolloutPercentage
      });
    } catch (error) {
      // Error handling is done in the mutation onError callback
    } finally {
      setIsUpdating(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <StandardPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
            <p className="text-gray-600 mt-2">
              Manage the hybrid inquiry system features and rollout
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-gray-500" />
            <span className="text-sm text-gray-500">Admin Controls</span>
          </div>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current status of the hybrid inquiry system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : `${stats.enabledPercentage}%`}
                </div>
                <div className="text-sm text-gray-500">Rollout</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.enabledFlags}
                </div>
                <div className="text-sm text-gray-500">Active Features</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {hybridStatsLoading ? '...' : hybridStats.openInquiries}
                </div>
                <div className="text-sm text-gray-500">Open Inquiries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {hybridStatsLoading ? '...' : hybridStats.flaggedMessages}
                </div>
                <div className="text-sm text-gray-500">Flagged Messages</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        {flagsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <LoadingCardSkeleton key={i} />
            ))}
          </div>
        ) : flagsError ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-red-600">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>Failed to load feature flags: {flagsError.message}</p>
                <Button 
                  onClick={() => refetchFlags()} 
                  variant="outline" 
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featureFlags.map((feature) => (
            <Card key={feature.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{feature.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {feature.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {feature.enabled ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Impact and Risk */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Impact:</span>
                      <Badge className={getImpactColor(feature.impact)}>
                        {feature.impact}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">Risk:</span>
                      <Badge className={getRiskColor(feature.risk)}>
                        {feature.risk}
                      </Badge>
                    </div>
                  </div>

                  {/* Rollout Percentage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Rollout Percentage</Label>
                      <span className="text-sm text-gray-500">{feature.rolloutPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${feature.rolloutPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`toggle-${feature.id}`} className="text-sm">
                      Enable Feature
                    </Label>
                    <Switch
                      id={`toggle-${feature.id}`}
                      checked={feature.enabled}
                      onCheckedChange={(enabled) => handleToggleFeature(feature.id, enabled)}
                      disabled={isUpdating}
                    />
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {feature.enabled ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">Enabled</span>
                      </>
                    ) : (
                      <>
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* Warning Banner */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Feature Flag Management
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Feature flags are currently managed through environment variables. 
                  Changes require server restart. In production, consider implementing 
                  a database-backed feature flag system for real-time control.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common actions for managing the hybrid system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/inquiries')}
                className="flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                View Inquiries
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/flagged-messages')}
                className="flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Flagged Messages
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/admin/analytics')}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                System Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
}
