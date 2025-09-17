'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, BarChart3, Settings, Globe } from 'lucide-react';
import Link from 'next/link';

export function QuickActionsCard() {
  const quickActions = [
    {
      title: 'Add New Domain',
      description: 'List a new domain for sale',
      icon: <Plus className="h-5 w-5" />,
      href: '/domains/new',
      variant: 'default' as const,
    },
    {
      title: 'View Inquiries',
      description: 'Check buyer inquiries',
      icon: <MessageSquare className="h-5 w-5" />,
      href: '/dashboard/inquiries',
      variant: 'outline' as const,
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      icon: <BarChart3 className="h-5 w-5" />,
      href: '/dashboard/analytics',
      variant: 'outline' as const,
    },
    {
      title: 'Manage Domains',
      description: 'Edit domain listings',
      icon: <Globe className="h-5 w-5" />,
      href: '/dashboard/domains',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant={action.variant}
                className="w-full h-auto p-4 flex flex-col items-start gap-2 text-left"
              >
                <div className="flex items-center gap-2">
                  {action.icon}
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="text-sm text-gray-600">{action.description}</span>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
