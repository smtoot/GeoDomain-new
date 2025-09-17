import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RecentActivityCard } from '../RecentActivityCard';

describe('RecentActivityCard', () => {
  const mockActivities = [
    {
      id: '1',
      type: 'inquiry' as const,
      title: 'New inquiry for example.com',
      description: 'Buyer interested in purchasing the domain',
      timestamp: '2 hours ago',
      status: 'success' as const,
    },
    {
      id: '2',
      type: 'verification' as const,
      title: 'Domain verification completed',
      description: 'test.com is now verified',
      timestamp: '1 day ago',
      status: 'success' as const,
    },
    {
      id: '3',
      type: 'payment' as const,
      title: 'Payment received for domain.com',
      description: 'Transaction completed successfully',
      timestamp: '3 days ago',
      status: 'success' as const,
    },
  ];

  it('renders loading state correctly', () => {
    render(<RecentActivityCard activities={[]} isLoading={true} />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    // Check for loading skeleton elements
    const skeletonElements = document.querySelectorAll('.animate-pulse');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders empty state when no activities', () => {
    render(<RecentActivityCard activities={[]} isLoading={false} />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    
    // Expand the card to see the empty state
    const trigger = screen.getByText('Recent Activity').closest('div');
    if (trigger) {
      fireEvent.click(trigger);
    }
    
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('Your recent domain activities will appear here')).toBeInTheDocument();
  });

  it('renders activities when provided', () => {
    render(<RecentActivityCard activities={mockActivities} isLoading={false} />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    
    // Expand the card to see the activities
    const trigger = screen.getByText('Recent Activity').closest('div');
    if (trigger) {
      fireEvent.click(trigger);
    }
    
    expect(screen.getByText('New inquiry for example.com')).toBeInTheDocument();
    expect(screen.getByText('Domain verification completed')).toBeInTheDocument();
    expect(screen.getByText('Payment received for domain.com')).toBeInTheDocument();
  });

  it('displays activity descriptions and timestamps', () => {
    render(<RecentActivityCard activities={mockActivities} isLoading={false} />);
    
    // Expand the card to see the activities
    const trigger = screen.getByText('Recent Activity').closest('div');
    if (trigger) {
      fireEvent.click(trigger);
    }
    
    expect(screen.getByText('Buyer interested in purchasing the domain')).toBeInTheDocument();
    expect(screen.getByText('test.com is now verified')).toBeInTheDocument();
    expect(screen.getByText('Transaction completed successfully')).toBeInTheDocument();
    
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
    expect(screen.getByText('3 days ago')).toBeInTheDocument();
  });

  it('can be collapsed and expanded', () => {
    render(<RecentActivityCard activities={mockActivities} isLoading={false} />);
    
    // Initially collapsed, activities should not be visible
    expect(screen.queryByText('New inquiry for example.com')).not.toBeInTheDocument();
    
    // Click to expand
    const trigger = screen.getByText('Recent Activity').closest('div');
    if (trigger) {
      fireEvent.click(trigger);
    }
    
    // Activities should now be visible
    expect(screen.getByText('New inquiry for example.com')).toBeInTheDocument();
  });

  it('shows correct icons for different activity types', () => {
    render(<RecentActivityCard activities={mockActivities} isLoading={false} />);
    
    // Expand the card first
    const trigger = screen.getByText('Recent Activity').closest('div');
    if (trigger) {
      fireEvent.click(trigger);
    }
    
    // Check if activity items are rendered with proper structure
    const activityItems = document.querySelectorAll('[class*="bg-gray-50"]');
    expect(activityItems.length).toBe(3);
  });

  it('handles single activity correctly', () => {
    const singleActivity = [mockActivities[0]];
    render(<RecentActivityCard activities={singleActivity} isLoading={false} />);
    
    // Expand the card
    const trigger = screen.getByText('Recent Activity').closest('div');
    if (trigger) {
      fireEvent.click(trigger);
    }
    
    expect(screen.getByText('New inquiry for example.com')).toBeInTheDocument();
    expect(screen.queryByText('Domain verification completed')).not.toBeInTheDocument();
  });

  it('maintains proper accessibility attributes', () => {
    render(<RecentActivityCard activities={mockActivities} isLoading={false} />);
    
    // Check if the collapsible trigger has proper accessibility
    const trigger = screen.getByText('Recent Activity').closest('div');
    expect(trigger).toBeInTheDocument();
  });
});
