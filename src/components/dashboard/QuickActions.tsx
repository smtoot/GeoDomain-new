'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  Search,
  MessageSquare,
  Settings,
  BarChart3,
  Globe,
  FileText,
  DollarSign,
  Shield,
  Bell,
  User,
  CreditCard
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant: 'default' | 'outline' | 'secondary';
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface QuickActionsProps {
  userRole: 'BUYER' | 'SELLER' | 'ADMIN';
  pendingActions?: number;
  unreadMessages?: number;
}

export function QuickActions({ userRole, pendingActions = 0, unreadMessages = 0 }: QuickActionsProps) {
  const getActionsForRole = (role: string): QuickAction[] => {
    const baseActions: QuickAction[] = [
      {
        id: 'analytics',
        title: 'View Analytics',
        description: 'Track your performance and insights',
        icon: <BarChart3 className="h-5 w-5" />,
        href: '/dashboard/analytics',
        variant: 'outline'
      },
      {
        id: 'settings',
        title: 'Account Settings',
        description: 'Manage your profile and preferences',
        icon: <Settings className="h-5 w-5" />,
        href: '/dashboard/settings',
        variant: 'outline'
      }
    ];

    if (role === 'SELLER') {
      return [
        {
          id: 'add-domain',
          title: 'Add New Domain',
          description: 'List a new domain for sale',
          icon: <Plus className="h-5 w-5" />,
          href: '/domains/new',
          variant: 'default'
        },
        {
          id: 'my-domains',
          title: 'My Domains',
          description: 'Manage your domain listings',
          icon: <Globe className="h-5 w-5" />,
          href: '/dashboard/domains',
          variant: 'outline'
        },
        {
          id: 'inquiries',
          title: 'View Inquiries',
          description: 'Check buyer inquiries',
          icon: <MessageSquare className="h-5 w-5" />,
          href: '/inquiries',
          variant: 'outline',
          badge: unreadMessages > 0 ? unreadMessages.toString() : undefined,
          badgeVariant: unreadMessages > 0 ? 'destructive' : undefined
        },
        {
          id: 'deals',
          title: 'Active Deals',
          description: 'Manage ongoing transactions',
          icon: <DollarSign className="h-5 w-5" />,
          href: '/deals',
          variant: 'outline',
          badge: pendingActions > 0 ? pendingActions.toString() : undefined,
          badgeVariant: pendingActions > 0 ? 'secondary' : undefined
        },
        ...baseActions
      ];
    }

    if (role === 'BUYER') {
      return [
        {
          id: 'browse-domains',
          title: 'Browse Domains',
          description: 'Search and discover domains',
          icon: <Search className="h-5 w-5" />,
          href: '/domains',
          variant: 'default'
        },
        {
          id: 'my-inquiries',
          title: 'My Inquiries',
          description: 'Track your domain inquiries',
          icon: <MessageSquare className="h-5 w-5" />,
          href: '/inquiries',
          variant: 'outline'
        },
        {
          id: 'saved-domains',
          title: 'Saved Domains',
          description: 'View your bookmarked domains',
          icon: <Globe className="h-5 w-5" />,
          href: '/dashboard/saved',
          variant: 'outline'
        },
        {
          id: 'purchase-history',
          title: 'Purchase History',
          description: 'View your completed transactions',
          icon: <FileText className="h-5 w-5" />,
          href: '/dashboard/purchases',
          variant: 'outline'
        },
        ...baseActions
      ];
    }

    if (role === 'ADMIN') {
      return [
        {
          id: 'user-management',
          title: 'User Management',
          description: 'Manage platform users',
          icon: <User className="h-5 w-5" />,
          href: '/admin/users',
          variant: 'default'
        },
        {
          id: 'moderation',
          title: 'Content Moderation',
          description: 'Review domains and inquiries',
          icon: <Shield className="h-5 w-5" />,
          href: '/admin/moderation',
          variant: 'outline',
          badge: pendingActions > 0 ? pendingActions.toString() : undefined,
          badgeVariant: pendingActions > 0 ? 'destructive' : undefined
        },
        {
          id: 'transactions',
          title: 'Transaction Monitoring',
          description: 'Monitor platform transactions',
          icon: <DollarSign className="h-5 w-5" />,
          href: '/admin/transactions',
          variant: 'outline'
        },
        {
          id: 'notifications',
          title: 'System Notifications',
          description: 'Manage platform notifications',
          icon: <Bell className="h-5 w-5" />,
          href: '/admin/notifications',
          variant: 'outline'
        },
        {
          id: 'billing',
          title: 'Billing Management',
          description: 'Manage platform billing',
          icon: <CreditCard className="h-5 w-5" />,
          href: '/admin/billing',
          variant: 'outline'
        },
        ...baseActions
      ];
    }

    return baseActions;
  };

  const actions = getActionsForRole(userRole);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          {userRole === 'SELLER' && 'Manage your domains and sales'}
          {userRole === 'BUYER' && 'Browse domains and track inquiries'}
          {userRole === 'ADMIN' && 'Manage platform operations'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => (
            <Link key={action.id} href={action.href}>
              <Button 
                variant={action.variant} 
                className="w-full justify-start h-auto p-4"
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="flex-shrink-0">
                    {action.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{action.title}</span>
                      {action.badge && (
                        <Badge variant={action.badgeVariant || 'default'} className="text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
