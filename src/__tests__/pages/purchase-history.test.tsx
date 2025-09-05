import { render, screen } from '@testing-library/react';
import PurchaseHistoryPage from '../../app/dashboard/purchases/page';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'test-user', role: 'BUYER' } },
    status: 'authenticated'
  }),
}));

// Mock tRPC
jest.mock('../../lib/trpc', () => ({
  trpc: {
    useQuery: () => ({
      data: {
        purchases: [
          {
            id: '1',
            domainName: 'techstartup.com',
            amount: 2500,
            status: 'COMPLETED',
            createdAt: new Date('2024-01-15')
          },
          {
            id: '2',
            domainName: 'businesshub.com',
            amount: 5000,
            status: 'COMPLETED',
            createdAt: new Date('2024-01-20')
          }
        ]
      },
      isLoading: false,
      error: null
    }),
  },
}));

describe('Purchase History Page', () => {
  it('should render purchase history page with title', () => {
    render(<PurchaseHistoryPage />);
    
    expect(screen.getByText('Purchase History')).toBeInTheDocument();
    expect(screen.getByText('Track your domain purchases')).toBeInTheDocument();
  });

  it('should display purchase summary statistics', () => {
    render(<PurchaseHistoryPage />);
    
    expect(screen.getByText('Total Purchases')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('$7,500')).toBeInTheDocument();
    expect(screen.getByText('Average Purchase')).toBeInTheDocument();
    expect(screen.getByText('$3,750')).toBeInTheDocument();
  });

  it('should display purchase list', () => {
    render(<PurchaseHistoryPage />);
    
    expect(screen.getByText('techstartup.com')).toBeInTheDocument();
    expect(screen.getByText('businesshub.com')).toBeInTheDocument();
    expect(screen.getByText('$2,500')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('should render search and filter controls', () => {
    render(<PurchaseHistoryPage />);
    
    expect(screen.getByPlaceholderText('Search purchases...')).toBeInTheDocument();
    expect(screen.getByText('Filter by Status')).toBeInTheDocument();
  });

  it('should render export button', () => {
    render(<PurchaseHistoryPage />);
    
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
  });

  it('should render view domain buttons', () => {
    render(<PurchaseHistoryPage />);
    
    const viewButtons = screen.getAllByText('View Domain');
    expect(viewButtons).toHaveLength(2);
  });

  it('should show spending trends section', () => {
    render(<PurchaseHistoryPage />);
    
    expect(screen.getByText('Spending Trends')).toBeInTheDocument();
  });
});
