import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';

export default function AdminLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Admin Dashboard...
          </h2>
          <p className="text-gray-600">
            Please wait while we load your admin panel.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
