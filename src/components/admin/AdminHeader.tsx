'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlobalSearch, SearchShortcuts } from './GlobalSearch';
import { 
  User, 
  LogOut, 
  Settings, 
  Bell,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  className?: string;
}

export function AdminHeader({ className }: AdminHeaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const handleProfileClick = () => {
    router.push('/dashboard/settings');
  };

  return (
    <header className={`bg-white border-b border-gray-200 ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <button
                onClick={() => router.push('/admin')}
                className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
              >
                GeoDomain Admin
              </button>
            </div>
          </div>

          {/* Center - Global Search */}
          <div className="flex-1 max-w-lg mx-8 hidden md:block">
            <GlobalSearch 
              placeholder="Search users, domains, inquiries..."
              className="w-full"
            />
          </div>

          {/* Right side - User menu and actions */}
          <div className="flex items-center space-x-4">
            {/* Search Shortcuts - Desktop */}
            <div className="hidden lg:block">
              <SearchShortcuts />
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => router.push('/admin/notifications')}
            >
              <Bell className="h-5 w-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
              >
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2"
                onClick={handleProfileClick}
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:block text-sm font-medium">
                  {session?.user?.name || 'Admin'}
                </span>
                <Badge variant="outline" className="text-xs">
                  {(session?.user as any)?.role || 'ADMIN'}
                </Badge>
              </Button>
            </div>

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* Sign Out */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <GlobalSearch 
            placeholder="Search..."
            className="w-full"
          />
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              <SearchShortcuts />
              <div className="pt-2 border-t border-gray-200">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push('/admin/notifications');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push('/admin/settings');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
