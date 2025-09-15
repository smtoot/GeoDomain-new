'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AdminHeader } from './AdminHeader';
import { AdminNavigation } from './AdminNavigation';
import { AdminGuard } from '@/components/security/AdminGuard';
import { Button } from '@/components/ui/button';
import { X, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileAdminLayoutProps {
  children: React.ReactNode;
  systemOverview?: {
    pendingInquiries: number;
    pendingMessages: number;
    pendingVerifications: number;
  };
}

export function MobileAdminLayout({ children, systemOverview }: MobileAdminLayoutProps) {
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isSidebarOpen) {
        const sidebar = document.getElementById('admin-sidebar');
        const menuButton = document.getElementById('mobile-menu-button');
        
        if (sidebar && !sidebar.contains(event.target as Node) && 
            menuButton && !menuButton.contains(event.target as Node)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        
        <div className="flex relative">
          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              id="mobile-menu-button"
              variant="ghost"
              size="sm"
              className="fixed top-20 left-4 z-50 bg-white shadow-lg border"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Sidebar Navigation */}
          <aside 
            id="admin-sidebar"
            className={cn(
              'bg-gray-800 text-white transition-transform duration-300 ease-in-out',
              // Desktop: always visible, fixed width
              'lg:w-48 lg:static lg:transform-none',
              // Mobile: overlay, slide in from left
              isMobile ? [
                'fixed inset-y-0 left-0 w-64 z-40',
                'transform transition-transform duration-300 ease-in-out',
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              ] : 'w-48'
            )}
          >
            <div className="h-full overflow-y-auto">
              <AdminNavigation 
                userRole={(session?.user as any)?.role || 'ADMIN'}
                pendingInquiries={systemOverview?.pendingInquiries || 0}
                pendingMessages={systemOverview?.pendingMessages || 0}
                verificationCount={systemOverview?.pendingVerifications || 0}
              />
            </div>
          </aside>

          {/* Mobile Overlay */}
          {isMobile && isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          
          {/* Main Content */}
          <main className={cn(
            'flex-1 overflow-auto transition-all duration-300',
            // Desktop: normal margin
            'lg:ml-0',
            // Mobile: full width when sidebar closed, margin when open
            isMobile ? (isSidebarOpen ? 'ml-0' : 'ml-0') : 'ml-0'
          )}>
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
