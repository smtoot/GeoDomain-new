'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Users, 
  Globe, 
  MessageSquare, 
  DollarSign, 
  Home,
  FileText,
  CreditCard,
  Settings
} from 'lucide-react';

interface AdminNavigationProps {
  pendingInquiries?: number;
  pendingMessages?: number;
}

export function AdminNavigation({ pendingInquiries = 0, pendingMessages = 0 }: AdminNavigationProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Home,
      current: pathname === '/admin',
    },
    {
      name: 'User Management',
      href: '/admin/users',
      icon: Users,
      current: pathname === '/admin/users',
    },
    {
      name: 'Domain Management',
      href: '/admin/domains',
      icon: Globe,
      current: pathname === '/admin/domains',
    },
    {
      name: 'Inquiry Moderation',
      href: '/admin/inquiries',
      icon: MessageSquare,
      current: pathname === '/admin/inquiries',
      badge: pendingInquiries > 0 ? pendingInquiries.toString() : undefined,
    },
    {
      name: 'Message Moderation',
      href: '/admin/messages',
      icon: FileText,
      current: pathname === '/admin/messages',
      badge: pendingMessages > 0 ? pendingMessages.toString() : undefined,
    },
    {
      name: 'Deal Management',
      href: '/admin/deals',
      icon: DollarSign,
      current: pathname === '/admin/deals',
    },
    {
      name: 'Payment Verification',
      href: '/admin/payments',
      icon: CreditCard,
      current: pathname === '/admin/payments',
    },
  ];

  return (
    <nav className="h-full p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>
      
      <div className="space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-200 transition-all hover:text-white hover:bg-gray-700',
                item.current && 'bg-gray-700 text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
