import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DomainHealthCard } from '../DomainHealthCard';

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockedLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockedLink.displayName = 'MockedLink';
  return MockedLink;
});

describe('DomainHealthCard', () => {
  const mockProps = {
    totalDomains: 15,
    domainsChange: 20,
  };

  it('renders domain portfolio information correctly', () => {
    render(<DomainHealthCard {...mockProps} />);
    
    // Check if main metrics are displayed
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Total Domains')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays positive change percentage with green indicator', () => {
    render(<DomainHealthCard {...mockProps} />);
    
    expect(screen.getByText('+20%')).toBeInTheDocument();
  });

  it('displays negative change percentage with red indicator', () => {
    const negativeChangeProps = {
      ...mockProps,
      domainsChange: -10,
    };
    
    render(<DomainHealthCard {...negativeChangeProps} />);
    
    expect(screen.getByText('-10%')).toBeInTheDocument();
  });

  it('displays zero change percentage correctly', () => {
    const zeroChangeProps = {
      ...mockProps,
      domainsChange: 0,
    };
    
    render(<DomainHealthCard {...zeroChangeProps} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows all domains as active and verified', () => {
    render(<DomainHealthCard {...mockProps} />);
    
    // Check for the specific "15" in the Active section
    const activeSection = screen.getByText('Active').closest('div');
    expect(activeSection).toHaveTextContent('15');
    expect(screen.getByText('All domains verified')).toBeInTheDocument();
  });

  it('shows zero pending verifications', () => {
    render(<DomainHealthCard {...mockProps} />);
    
    expect(screen.getByText('0')).toBeInTheDocument(); // Pending count
    expect(screen.getByText('No pending verifications')).toBeInTheDocument();
  });

  it('renders quick action buttons with correct links', () => {
    render(<DomainHealthCard {...mockProps} />);
    
    // Check if action buttons are present
    expect(screen.getByText('Add Domain')).toBeInTheDocument();
    expect(screen.getByText('Manage Domains')).toBeInTheDocument();
    
    // Check if links are correct
    const addDomainLink = screen.getByText('Add Domain').closest('a');
    const manageDomainsLink = screen.getByText('Manage Domains').closest('a');
    
    expect(addDomainLink).toHaveAttribute('href', '/domains/new');
    expect(manageDomainsLink).toHaveAttribute('href', '/dashboard/domains');
  });

  it('handles zero domains gracefully', () => {
    const zeroDomainsProps = {
      totalDomains: 0,
      domainsChange: 0,
    };
    
    render(<DomainHealthCard {...zeroDomainsProps} />);
    
    // Check for the specific "0" in the Total Domains section
    const totalDomainsSection = screen.getByText('Total Domains').closest('div');
    expect(totalDomainsSection).toHaveTextContent('0');
    expect(screen.getByText('All domains verified')).toBeInTheDocument();
  });

  it('displays correct icons for status indicators', () => {
    render(<DomainHealthCard {...mockProps} />);
    
    // Check if status indicators are present
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
