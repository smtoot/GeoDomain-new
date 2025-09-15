'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminWholesaleConfigPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [wholesalePrice, setWholesalePrice] = useState<number>(299);
  const [commissionAmount, setCommissionAmount] = useState<number>(25);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || (session.user as any).role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Get current configuration
  const { data: config, isLoading: configLoading, refetch: refetchConfig } = trpc.wholesaleConfig.getConfig.useQuery();
  
  // Get pricing summary
  const { data: summary, isLoading: summaryLoading } = trpc.wholesaleConfig.getPricingSummary.useQuery();

  // Update configuration mutation
  const updateConfig = trpc.wholesaleConfig.updateConfig.useMutation({
    onSuccess: () => {
      setSuccess('Configuration updated successfully!');
      setError(null);
      setIsUpdating(false);
      toast.success('Wholesale configuration updated');
      refetchConfig();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess(null);
      setIsUpdating(false);
      toast.error('Failed to update configuration: ' + error.message);
    },
  });

  // Initialize form with current config
  useEffect(() => {
    if (config) {
      setWholesalePrice(config.wholesalePrice);
      setCommissionAmount(config.commissionAmount);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    try {
      await updateConfig.mutateAsync({
        wholesalePrice,
        commissionAmount,
      });
    } catch (error) {
      // Error handled in onError
    }
  };

  const sellerPayout = wholesalePrice - commissionAmount;

  if (status === 'loading' || configLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session || (session.user as any).role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wholesale Configuration</h1>
          <p className="text-muted-foreground">
            Manage global wholesale pricing and commission settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Update Configuration
            </CardTitle>
            <CardDescription>
              Set the global wholesale price and commission amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Wholesale Price ($)</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    min="50"
                    step="0.01"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    placeholder="299.00"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This price will apply to ALL wholesale domains
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionAmount">Commission Amount ($)</Label>
                  <Input
                    id="commissionAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                    placeholder="25.00"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Platform commission per wholesale sale
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Calculation Preview:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Wholesale Price:</span>
                      <span className="font-medium">${wholesalePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission:</span>
                      <span className="font-medium">-${commissionAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span>Seller Payout:</span>
                      <span className="font-bold text-green-600">${sellerPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Configuration
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Configuration & Summary */}
        <div className="space-y-6">
          {/* Current Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
              <CardDescription>
                Last updated: {config?.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'Never'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Wholesale Price:</span>
                  <span className="text-lg font-bold">${config?.wholesalePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Commission:</span>
                  <span className="text-lg font-bold">${config?.commissionAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium">Seller Payout:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${((config?.wholesalePrice || 0) - (config?.commissionAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Summary Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Wholesale Domains:
                  </span>
                  <span className="text-lg font-bold">{summary?.totalDomains || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Revenue:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${summary?.totalRevenue.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenue per Sale:</span>
                  <span className="text-lg font-bold">
                    ${summary?.commissionAmount.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Updated:
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {summary?.lastUpdated ? new Date(summary.lastUpdated).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
