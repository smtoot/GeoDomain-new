'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Plus, Settings, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface DomainHealthCardProps {
  totalDomains: number;
  domainsChange: number;
}

export function DomainHealthCard({ totalDomains, domainsChange }: DomainHealthCardProps) {
  const getChangeIcon = (change: number) => {
    if (change > 0) return <span className="text-green-600">↗</span>;
    if (change < 0) return <span className="text-red-600">↘</span>;
    return <span className="text-gray-600">→</span>;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Domain Portfolio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{totalDomains}</div>
            <div className="text-sm text-gray-600">Total Domains</div>
            <div className="flex items-center justify-center mt-1">
              {getChangeIcon(domainsChange)}
              <span className={`text-sm ml-1 ${getChangeColor(domainsChange)}`}>
                {domainsChange > 0 ? '+' : ''}{domainsChange}%
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{totalDomains}</div>
            <div className="text-xs text-gray-500">All domains verified</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Pending</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-xs text-gray-500">No pending verifications</div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/domains/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Domain
            </Button>
          </Link>
          <Link href="/dashboard/domains">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Domains
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
