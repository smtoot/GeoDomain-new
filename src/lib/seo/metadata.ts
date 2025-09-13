/**
 * Centralized metadata configuration
 * Fixes metadata issues and provides consistent SEO setup
 */

import { Metadata, Viewport } from 'next';

// Base configuration
const baseUrl = process.env.NEXTAUTH_URL || 'https://geodomain.com';
const siteName = 'GeoDomain';
const siteDescription = 'Premium domain marketplace for geographic and location-based domains';

// Default metadata
export const defaultMetadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'domain marketplace',
    'geographic domains',
    'location domains',
    'premium domains',
    'domain buying',
    'domain selling',
    'real estate domains',
    'business domains',
  ],
  authors: [{ name: 'GeoDomain Team' }],
  creator: 'GeoDomain',
  publisher: 'GeoDomain',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    title: siteName,
    description: siteDescription,
    siteName,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: ['/og-image.png'],
    creator: '@geodomain',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
    yandex: process.env.YANDEX_VERIFICATION_ID,
    yahoo: process.env.YAHOO_VERIFICATION_ID,
  },
  alternates: {
    canonical: baseUrl,
  },
};

// Viewport configuration
export const defaultViewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

// Page-specific metadata generators
export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
}): Metadata {
  const url = path ? `${baseUrl}${path}` : baseUrl;
  
  return {
    ...defaultMetadata,
    title,
    description: description || defaultMetadata.description,
    keywords: [...(defaultMetadata.keywords as string[]), ...keywords],
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description: description || defaultMetadata.description,
      url,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description: description || defaultMetadata.description,
    },
    robots: noIndex ? {
      index: false,
      follow: false,
    } : defaultMetadata.robots,
    alternates: {
      canonical: url,
    },
  };
}

// Domain-specific metadata
export function generateDomainMetadata(domain: {
  name: string;
  price: number;
  description?: string;
  category?: string;
  state?: string;
  city?: string;
}): Metadata {
  const title = `${domain.name} - Premium Domain for Sale`;
  const description = domain.description || 
    `Premium domain ${domain.name} available for purchase. ${domain.price ? `Starting at $${domain.price.toLocaleString()}.` : 'Contact for pricing.'} ${domain.category ? `Category: ${domain.category}.` : ''} ${domain.state ? `Located in ${domain.state}.` : ''}`;
  
  return generatePageMetadata({
    title,
    description,
    path: `/domains/${encodeURIComponent(domain.name)}`,
    keywords: [
      domain.name,
      'domain for sale',
      'premium domain',
      domain.category || '',
      domain.state || '',
      domain.city || '',
    ].filter(Boolean),
  });
}

// User dashboard metadata
export function generateDashboardMetadata(page: string): Metadata {
  const pageTitles: Record<string, string> = {
    '': 'Dashboard',
    'domains': 'My Domains',
    'inquiries': 'My Inquiries',
    'deals': 'My Deals',
    'purchases': 'Purchase History',
    'saved': 'Saved Domains',
    'settings': 'Account Settings',
  };

  const title = pageTitles[page] || 'Dashboard';
  
  return generatePageMetadata({
    title,
    description: `Manage your ${title.toLowerCase()} on ${siteName}`,
    path: `/dashboard/${page}`,
    noIndex: true, // Don't index user dashboard pages
  });
}

// Admin metadata
export function generateAdminMetadata(page: string): Metadata {
  const pageTitles: Record<string, string> = {
    '': 'Admin Dashboard',
    'users': 'User Management',
    'domains': 'Domain Management',
    'inquiries': 'Inquiry Management',
    'deals': 'Deal Management',
    'payments': 'Payment Management',
    'support': 'Support Tickets',
    'categories': 'Category Management',
    'states': 'State Management',
    'cities': 'City Management',
    'performance': 'Performance Monitoring',
    'seed-data': 'Seed Data Management',
  };

  const title = pageTitles[page] || 'Admin';
  
  return generatePageMetadata({
    title,
    description: `Admin panel for ${title.toLowerCase()} on ${siteName}`,
    path: `/admin/${page}`,
    noIndex: true, // Don't index admin pages
  });
}

// Auth page metadata
export function generateAuthMetadata(page: 'login' | 'register' | 'forgot-password' | 'reset-password'): Metadata {
  const pageData = {
    login: {
      title: 'Sign In',
      description: 'Sign in to your GeoDomain account to manage your domains and inquiries.',
    },
    register: {
      title: 'Create Account',
      description: 'Join GeoDomain to buy and sell premium geographic domains.',
    },
    'forgot-password': {
      title: 'Forgot Password',
      description: 'Reset your GeoDomain account password.',
    },
    'reset-password': {
      title: 'Reset Password',
      description: 'Set a new password for your GeoDomain account.',
    },
  };

  const data = pageData[page];
  
  return generatePageMetadata({
    title: data.title,
    description: data.description,
    path: `/${page}`,
    noIndex: true, // Don't index auth pages
  });
}

// Support metadata
export function generateSupportMetadata(page: string = ''): Metadata {
  const pageTitles: Record<string, string> = {
    '': 'Support Center',
    'new': 'Create Support Ticket',
  };

  const title = pageTitles[page] || 'Support';
  
  return generatePageMetadata({
    title,
    description: `Get help and support for ${siteName}. Contact our support team for assistance.`,
    path: `/support/${page}`,
  });
}

// Search metadata
export function generateSearchMetadata(query?: string): Metadata {
  const title = query ? `Search Results for "${query}"` : 'Domain Search';
  const description = query 
    ? `Find domains related to "${query}" on ${siteName}`
    : `Search for premium domains on ${siteName}`;
  
  return generatePageMetadata({
    title,
    description,
    path: query ? `/search?q=${encodeURIComponent(query)}` : '/search',
    keywords: query ? [query, 'domain search', 'find domains'] : ['domain search', 'find domains'],
  });
}

// Error page metadata
export function generateErrorMetadata(status: number): Metadata {
  const errorData: Record<number, { title: string; description: string }> = {
    404: {
      title: 'Page Not Found',
      description: 'The page you are looking for could not be found.',
    },
    500: {
      title: 'Server Error',
      description: 'We encountered an error while processing your request.',
    },
  };

  const data = errorData[status] || {
    title: 'Error',
    description: 'An error occurred.',
  };
  
  return generatePageMetadata({
    title: data.title,
    description: data.description,
    noIndex: true, // Don't index error pages
  });
}

// Utility function to merge metadata
export function mergeMetadata(base: Metadata, override: Metadata): Metadata {
  return {
    ...base,
    ...override,
    openGraph: {
      ...base.openGraph,
      ...override.openGraph,
    },
    twitter: {
      ...base.twitter,
      ...override.twitter,
    },
    robots: override.robots || base.robots,
    alternates: override.alternates || base.alternates,
  };
}
