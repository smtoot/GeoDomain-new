import { render, screen } from '@testing-library/react';
import SavedDomainsPage from '../../app/dashboard/saved/page';
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
        savedDomains: [
          {
            id: '1',
            name: 'testdomain.com',
            price: 1000,
            priceType: 'FIXED',
            category: 'Technology',
            description: 'A great tech domain'
          },
          {
            id: '2',
            name: 'business.com',
            price: 5000,
            priceType: 'FIXED',
            category: 'Business',
            description: 'Perfect for business'
          }
        ]
      },
      isLoading: false,
      error: null
    }),
  },
}));

describe('Saved Domains Page', () => {
  it('should render saved domains page with title', () => {
    render(<SavedDomainsPage />);
    
    expect(screen.getByText('Saved Domains')).toBeInTheDocument();
    expect(screen.getByText('Manage your favorite domains')).toBeInTheDocument();
  });

  it('should display saved domains list', () => {
    render(<SavedDomainsPage />);
    
    expect(screen.getByText('testdomain.com')).toBeInTheDocument();
    expect(screen.getByText('business.com')).toBeInTheDocument();
    expect(screen.getByText('$1,000')).toBeInTheDocument();
    expect(screen.getByText('$5,000')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });

  it('should render search and filter controls', () => {
    render(<SavedDomainsPage />);
    
    expect(screen.getByPlaceholderText('Search saved domains...')).toBeInTheDocument();
    expect(screen.getByText('Filter by Category')).toBeInTheDocument();
  });

  it('should render action buttons for each domain', () => {
    render(<SavedDomainsPage />);
    
    // Should have view and inquire buttons for each domain
    const viewButtons = screen.getAllByText('View Domain');
    const inquireButtons = screen.getAllByText('Inquire');
    
    expect(viewButtons).toHaveLength(2);
    expect(inquireButtons).toHaveLength(2);
  });

  it('should show summary statistics', () => {
    render(<SavedDomainsPage />);
    
    expect(screen.getByText('Total Saved')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
