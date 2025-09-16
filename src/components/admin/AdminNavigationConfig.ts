import { 
  Home, 
  Users, 
  Globe, 
  MessageSquare, 
  FileText, 
  DollarSign, 
  CreditCard, 
  Tag, 
  MapPin, 
  Building2, 
  HelpCircle, 
  Database, 
  ShoppingCart, 
  BarChart3, 
  Bell, 
  Shield,
  Settings,
  AlertTriangle,
  Activity,
  Search
} from 'lucide-react';

export interface AdminNavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  description?: string;
  category?: 'core' | 'management' | 'system' | 'analytics';
  requiresSuperAdmin?: boolean;
}

export const ADMIN_NAVIGATION_CONFIG: AdminNavigationItem[] = [
  // TIER 1: CORE ADMIN (4 items)
  {
    name: 'Admin Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Overview and quick actions',
    category: 'core'
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    description: 'Manage users, roles, and permissions',
    category: 'core'
  },
  {
    name: 'Domain Management',
    href: '/admin/domains',
    icon: Globe,
    description: 'Review and moderate domain listings',
    category: 'core'
  },
  {
    name: 'Verification Management',
    href: '/admin/verifications',
    icon: Shield,
    description: 'Domain ownership verification',
    category: 'core'
  },

  // TIER 2: CONTENT MODERATION (4 items)
  {
    name: 'Inquiry Moderation',
    href: '/admin/inquiries',
    icon: MessageSquare,
    description: 'Review and moderate inquiries',
    category: 'management'
  },
  {
    name: 'Message Moderation',
    href: '/admin/messages',
    icon: FileText,
    description: 'Moderate user messages',
    category: 'management'
  },
  {
    name: 'Flagged Content',
    href: '/admin/flagged-messages',
    icon: AlertTriangle,
    description: 'Review messages flagged for contact information',
    category: 'management'
  },
  {
    name: 'Deal Management',
    href: '/admin/deals',
    icon: DollarSign,
    description: 'Manage domain deals and transactions (merged)',
    category: 'management'
  },

  // TIER 3: BUSINESS OPERATIONS (3 items)
  {
    name: 'Wholesale Management',
    href: '/admin/wholesale',
    icon: ShoppingCart,
    description: 'Manage wholesale domains and configuration',
    category: 'management'
  },
  {
    name: 'Payment Management',
    href: '/admin/payments',
    icon: CreditCard,
    description: 'Verify and process payments',
    category: 'management'
  },
  {
    name: 'Support Management',
    href: '/admin/support',
    icon: HelpCircle,
    description: 'Handle support tickets',
    category: 'management'
  },

  // TIER 4: SYSTEM CONFIGURATION (4 items)
  {
    name: 'Feature Flags',
    href: '/admin/feature-flags',
    icon: Settings,
    description: 'Manage hybrid inquiry system features',
    category: 'system'
  },
  {
    name: 'Categories & Locations',
    href: '/admin/categories',
    icon: Tag,
    description: 'Manage domain categories, states, and cities',
    category: 'system'
  },
  {
    name: 'Performance Monitoring',
    href: '/admin/performance',
    icon: Activity,
    description: 'Monitor system performance and metrics',
    category: 'system'
  },
  {
    name: 'Global Search',
    href: '/admin/search',
    icon: Search,
    description: 'Search across all system data',
    category: 'system'
  },

  // TIER 5: ANALYTICS & TOOLS (2 items)
  {
    name: 'System Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    description: 'View system analytics and reports',
    category: 'analytics'
  },
  {
    name: 'Notifications',
    href: '/admin/notifications',
    icon: Bell,
    description: 'Manage system notifications',
    category: 'analytics'
  },

  // SUPER ADMIN ONLY (1 item)
  {
    name: 'Seed Data',
    href: '/admin/seed-data',
    icon: Database,
    description: 'Initialize system data',
    category: 'system',
    requiresSuperAdmin: true
  }
];

export const getAdminNavigationByCategory = (items: AdminNavigationItem[]) => {
  return items.reduce((acc, item) => {
    const category = item.category || 'core';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, AdminNavigationItem[]>);
};

export const getAdminNavigationForRole = (userRole: string) => {
  return ADMIN_NAVIGATION_CONFIG.filter(item => {
    // Super admin can see everything
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }
    // Regular admin can see everything except super admin only items
    if (userRole === 'ADMIN') {
      return !item.requiresSuperAdmin;
    }
    // Non-admin users shouldn't see admin navigation
    return false;
  });
};
