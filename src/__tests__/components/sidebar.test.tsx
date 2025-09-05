import { render, screen } from '@testing-library/react';
import { Sidebar } from '../../components/layout/sidebar';
import { SessionProvider } from 'next-auth/react';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock tRPC
jest.mock('../../lib/trpc', () => ({
  trpc: {
    useQuery: () => ({ data: 0, isLoading: false }),
  },
}));

describe('Sidebar Component', () => {
  const renderSidebar = (userRole: string) => {
    const mockSession = {
      user: { 
        id: 'test-id',
        name: 'Test User',
        email: 'test@test.com',
        role: userRole 
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    return render(
      <SessionProvider session={mockSession}>
        <Sidebar />
      </SessionProvider>
    );
  };

  it('should render buyer navigation for BUYER role', () => {
    renderSidebar('BUYER');
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Browse Domains')).toBeInTheDocument();
    expect(screen.getByText('Saved Domains')).toBeInTheDocument();
    expect(screen.getByText('Purchase History')).toBeInTheDocument();
    expect(screen.getByText('My Inquiries')).toBeInTheDocument();
    
    // Should NOT show seller-specific items
    expect(screen.queryByText('My Domains')).not.toBeInTheDocument();
    expect(screen.queryByText('Add Domain')).not.toBeInTheDocument();
  });

  it('should render seller navigation for SELLER role', () => {
    renderSidebar('SELLER');
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Domains')).toBeInTheDocument();
    expect(screen.getByText('Add Domain')).toBeInTheDocument();
    expect(screen.getByText('Deals')).toBeInTheDocument();
    
    // Should NOT show buyer-specific items
    expect(screen.queryByText('Saved Domains')).not.toBeInTheDocument();
    expect(screen.queryByText('Purchase History')).not.toBeInTheDocument();
  });

  it('should render admin navigation for ADMIN role', () => {
    renderSidebar('ADMIN');
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('should default to BUYER role when no role specified', () => {
    const mockSession = {
      user: { 
        id: 'test-id',
        name: 'Test User',
        email: 'test@test.com'
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    render(
      <SessionProvider session={mockSession}>
        <Sidebar />
      </SessionProvider>
    );

    expect(screen.getByText('Browse Domains')).toBeInTheDocument();
    expect(screen.getByText('Saved Domains')).toBeInTheDocument();
  });
});
