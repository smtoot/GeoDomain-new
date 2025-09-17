import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SalesPerformanceCard } from '../SalesPerformanceCard';

describe('SalesPerformanceCard', () => {
  const mockProps = {
    totalRevenue: 50000,
    totalInquiries: 25,
    totalViews: 1000,
    totalDomains: 10,
    averageSalePrice: 2000,
    conversionRate: 2.5,
    revenueChange: 15,
    inquiriesChange: 8,
    viewsChange: -5,
    domainsChange: 0,
  };

  it('renders all performance metrics correctly', () => {
    render(<SalesPerformanceCard {...mockProps} />);
    
    // Check if all main metrics are displayed
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('$2,000')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    
    // Check if labels are present
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('Total Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Average Sale Price')).toBeInTheDocument();
    expect(screen.getByText('Total Views')).toBeInTheDocument();
  });

  it('displays positive change percentages with green indicators', () => {
    render(<SalesPerformanceCard {...mockProps} />);
    
    // Check for positive change indicators
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();
  });

  it('displays negative change percentages with red indicators', () => {
    render(<SalesPerformanceCard {...mockProps} />);
    
    // Check for negative change indicator
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('displays zero change percentage correctly', () => {
    render(<SalesPerformanceCard {...mockProps} />);
    
    // Check for zero change indicator
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows conversion rate in the average sale price section', () => {
    render(<SalesPerformanceCard {...mockProps} />);
    
    expect(screen.getByText('2.5% conversion rate')).toBeInTheDocument();
  });

  it('handles zero values gracefully', () => {
    const zeroProps = {
      ...mockProps,
      totalRevenue: 0,
      totalInquiries: 0,
      totalViews: 0,
      averageSalePrice: 0,
      conversionRate: 0,
    };
    
    render(<SalesPerformanceCard {...zeroProps} />);
    
    expect(screen.getByText('$0')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('0% conversion rate')).toBeInTheDocument();
  });

  it('formats currency correctly for different amounts', () => {
    const largeAmountProps = {
      ...mockProps,
      totalRevenue: 1234567,
      averageSalePrice: 98765,
    };
    
    render(<SalesPerformanceCard {...largeAmountProps} />);
    
    expect(screen.getByText('$1,234,567')).toBeInTheDocument();
    expect(screen.getByText('$98,765')).toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    const largeViewsProps = {
      ...mockProps,
      totalViews: 1234567,
    };
    
    render(<SalesPerformanceCard {...largeViewsProps} />);
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });
});
