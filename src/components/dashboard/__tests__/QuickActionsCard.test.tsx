import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuickActionsCard } from '../QuickActionsCard';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockedLink.displayName = 'MockedLink';
  return MockedLink;
});

describe('QuickActionsCard', () => {
  it('renders all quick action buttons', () => {
    render(<QuickActionsCard />);
    
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.getByText('Add New Domain')).toBeInTheDocument();
    expect(screen.getByText('View Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Manage Domains')).toBeInTheDocument();
  });

  it('displays correct descriptions for each action', () => {
    render(<QuickActionsCard />);
    
    expect(screen.getByText('List a new domain for sale')).toBeInTheDocument();
    expect(screen.getByText('Check buyer inquiries')).toBeInTheDocument();
    expect(screen.getByText('View performance metrics')).toBeInTheDocument();
    expect(screen.getByText('Edit domain listings')).toBeInTheDocument();
  });

  it('has correct links for each action', () => {
    render(<QuickActionsCard />);
    
    // Check if all links have correct href attributes
    const addDomainLink = screen.getByText('Add New Domain').closest('a');
    const viewInquiriesLink = screen.getByText('View Inquiries').closest('a');
    const analyticsLink = screen.getByText('Analytics').closest('a');
    const manageDomainsLink = screen.getByText('Manage Domains').closest('a');
    
    expect(addDomainLink).toHaveAttribute('href', '/domains/new');
    expect(viewInquiriesLink).toHaveAttribute('href', '/dashboard/inquiries');
    expect(analyticsLink).toHaveAttribute('href', '/dashboard/analytics');
    expect(manageDomainsLink).toHaveAttribute('href', '/dashboard/domains');
  });

  it('renders buttons with correct variants', () => {
    render(<QuickActionsCard />);
    
    // Check if buttons have correct styling classes
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(4);
    
    // First button should be default variant (Add New Domain)
    const addDomainButton = screen.getByText('Add New Domain').closest('button');
    expect(addDomainButton).toHaveClass('bg-primary');
    
    // Other buttons should be outline variant
    const otherButtons = buttons.slice(1);
    otherButtons.forEach(button => {
      expect(button).toHaveClass('border');
    });
  });

  it('displays icons for each action', () => {
    render(<QuickActionsCard />);
    
    // Check if icons are present (they should be rendered as SVG elements)
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThanOrEqual(4); // At least 4 icons
  });

  it('has proper button layout and styling', () => {
    render(<QuickActionsCard />);
    
    // Check if buttons are in a grid layout by looking for the grid container
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toBeInTheDocument();
  });

  it('handles responsive design classes', () => {
    render(<QuickActionsCard />);
    
    // Check if responsive grid classes are applied
    const gridContainer = document.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2');
  });

  it('maintains proper button accessibility', () => {
    render(<QuickActionsCard />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });
});
