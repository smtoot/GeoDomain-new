import { render, screen } from '@testing-library/react';
import BuyerDashboard from '../../components/BuyerDashboard';
import '@testing-library/jest-dom';

// Mock tRPC
jest.mock('../../lib/trpc', () => ({
  trpc: {
    useQuery: (queryKey: string) => {
      if (queryKey === 'dashboard.getBuyerStats') {
        return {
          data: {
            totalInquiries: 5,
            pendingInquiries: 2,
            savedDomains: 3,
            totalSpent: 5000,
            inquiryChange: 10,
            savedChange: 5,
            spendingChange: 15
          },
          isLoading: false,
          error: null
        };
      }
      if (queryKey === 'dashboard.getBuyerActivity') {
        return {
          data: {
            inquiries: [
              { id: '1', message: 'Test inquiry 1', status: 'PENDING', createdAt: new Date() },
              { id: '2', message: 'Test inquiry 2', status: 'COMPLETED', createdAt: new Date() }
            ],
            purchases: [
              { id: '1', domainName: 'test.com', amount: 2500, status: 'COMPLETED' }
            ]
          },
          isLoading: false,
          error: null
        };
      }
      return { data: null, isLoading: false, error: null };
    },
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('BuyerDashboard Component', () => {
  it('should render buyer dashboard with statistics', () => {
    render(<BuyerDashboard />);
    
    // Check main sections
    expect(screen.getByText('Buyer Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    
    // Check statistics
    expect(screen.getByText('Total Inquiries')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Pending Inquiries')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Saved Domains')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
  });

  it('should render quick action buttons', () => {
    render(<BuyerDashboard />);
    
    expect(screen.getByText('Browse Domains')).toBeInTheDocument();
    expect(screen.getByText('Saved Domains')).toBeInTheDocument();
    expect(screen.getByText('Purchase History')).toBeInTheDocument();
    expect(screen.getByText('My Inquiries')).toBeInTheDocument();
  });

  it('should render recent activity', () => {
    render(<BuyerDashboard />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Test inquiry 1')).toBeInTheDocument();
    expect(screen.getByText('Test inquiry 2')).toBeInTheDocument();
    expect(screen.getByText('test.com')).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    // Mock loading state
    jest.mocked(require('../../lib/trpc').trpc.useQuery).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    render(<BuyerDashboard />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
