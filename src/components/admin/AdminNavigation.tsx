'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getAdminNavigationForRole, getAdminNavigationByCategory } from './AdminNavigationConfig';

interface AdminNavigationProps {
  userRole?: string;
  pendingInquiries?: number;
  pendingMessages?: number;
  verificationCount?: number;
}

export function AdminNavigation({ 
  userRole = 'ADMIN', 
  pendingInquiries = 0, 
  pendingMessages = 0,
  verificationCount = 0 
}: AdminNavigationProps) {
  const pathname = usePathname();

  // Get navigation items based on user role
  const navigationItems = getAdminNavigationForRole(userRole);
  
  // Group navigation by category for better organization
  const navigationByCategory = getAdminNavigationByCategory(navigationItems);

  const getBadgeCount = (itemName: string) => {
    switch (itemName) {
      case 'Verification Management':
        return verificationCount > 0 ? verificationCount.toString() : undefined;
      case 'Inquiry Moderation':
        return pendingInquiries > 0 ? pendingInquiries.toString() : undefined;
      case 'Message Moderation':
        return pendingMessages > 0 ? pendingMessages.toString() : undefined;
      default:
        return undefined;
    }
  };

  const categoryLabels = {
    core: 'Core Functions',
    management: 'Content Management',
    system: 'System Management',
    analytics: 'Analytics & Monitoring'
  };

  return (
    <nav className="h-full p-2">
      <div className="mb-4">
        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
      </div>
      
      <div className="space-y-4">
        {Object.entries(navigationByCategory).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
              {categoryLabels[category as keyof typeof categoryLabels] || category}
            </h3>
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                const badge = getBadgeCount(item.name);
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 rounded-lg px-2 py-1.5 text-gray-200 transition-all hover:text-white hover:bg-gray-700 text-sm',
                      isActive && 'bg-gray-700 text-white'
                    )}
                    title={item.description}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{item.name}</span>
                    {badge && (
                      <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-medium text-white">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
