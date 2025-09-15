import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminWholesaleConfigPage from '../page';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock tRPC
jest.mock('@/trpc/react', () => ({
  api: {
    wholesaleConfig: {
      getConfig: {
        useQuery: jest.fn(),
      },
      getPricingSummary: {
        useQuery: jest.fn(),
      },
      updateConfig: {
        useMutation: jest.fn(),
      },
    },
  },
}));

describe('AdminWholesaleConfigPage', () => {
  const mockPush = jest.fn();
  const mockRefetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'admin-id',
          role: 'ADMIN',
        },
      },
      status: 'authenticated',
    });
  });

  it('should render admin interface for admin users', () => {
    const mockConfig = {
      wholesalePrice: 299,
      commissionAmount: 25,
      updatedAt: new Date(),
    };

    const mockSummary = {
      totalDomains: 10,
      totalRevenue: 250,
      commissionAmount: 25,
      lastUpdated: new Date(),
    };

    // Mock tRPC queries
    const { api } = require('@/trpc/react');
    api.wholesaleConfig.getConfig.useQuery.mockReturnValue({
      data: mockConfig,
      isLoading: false,
    });
    api.wholesaleConfig.getPricingSummary.useQuery.mockReturnValue({
      data: mockSummary,
      isLoading: false,
    });
    api.wholesaleConfig.updateConfig.useMutation.mockReturnValue({
      mutateAsync: jest.fn(),
    });

    render(<AdminWholesaleConfigPage />);

    expect(screen.getByText('Wholesale Configuration')).toBeInTheDocument();
    expect(screen.getByText('Update Configuration')).toBeInTheDocument();
    expect(screen.getByText('Current Configuration')).toBeInTheDocument();
    expect(screen.getByText('Summary Statistics')).toBeInTheDocument();
  });

  it('should redirect non-admin users', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: {
          id: 'user-id',
          role: 'SELLER',
        },
      },
      status: 'authenticated',
    });

    render(<AdminWholesaleConfigPage />);

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('should show loading state', () => {
    const { api } = require('@/trpc/react');
    api.wholesaleConfig.getConfig.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });
    api.wholesaleConfig.getPricingSummary.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<AdminWholesaleConfigPage />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should update configuration when form is submitted', async () => {
    const mockConfig = {
      wholesalePrice: 299,
      commissionAmount: 25,
      updatedAt: new Date(),
    };

    const mockSummary = {
      totalDomains: 10,
      totalRevenue: 250,
      commissionAmount: 25,
      lastUpdated: new Date(),
    };

    const mockMutateAsync = jest.fn().mockResolvedValue({});

    const { api } = require('@/trpc/react');
    api.wholesaleConfig.getConfig.useQuery.mockReturnValue({
      data: mockConfig,
      isLoading: false,
      refetch: mockRefetch,
    });
    api.wholesaleConfig.getPricingSummary.useQuery.mockReturnValue({
      data: mockSummary,
      isLoading: false,
    });
    api.wholesaleConfig.updateConfig.useMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });

    render(<AdminWholesaleConfigPage />);

    // Update the wholesale price
    const priceInput = screen.getByLabelText('Wholesale Price ($)');
    fireEvent.change(priceInput, { target: { value: '399' } });

    // Update the commission amount
    const commissionInput = screen.getByLabelText('Commission Amount ($)');
    fireEvent.change(commissionInput, { target: { value: '30' } });

    // Submit the form
    const submitButton = screen.getByText('Update Configuration');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        wholesalePrice: 399,
        commissionAmount: 30,
      });
    });
  });
});
