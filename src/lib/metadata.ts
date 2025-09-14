import { Metadata } from 'next'

// Base metadata configuration
export const baseMetadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://geo-domain-new.vercel.app'),
  title: {
    default: 'GeoDomainLand - Premium Geographic Domain Marketplace',
    template: '%s | GeoDomainLand'
  },
  description: 'Discover and trade premium geographic domain names. Connect with buyers and sellers worldwide for the perfect location-based domain.',
  keywords: ['domain names', 'geographic domains', 'domain marketplace', 'domain trading', 'location domains'],
  authors: [{ name: 'GeoDomainLand Team' }],
  creator: 'GeoDomainLand',
  publisher: 'GeoDomainLand',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://geo-domain-new.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://geo-domain-new.vercel.app',
    siteName: 'GeoDomainLand',
    title: 'GeoDomainLand - Premium Geographic Domain Marketplace',
    description: 'Discover and trade premium geographic domain names. Connect with buyers and sellers worldwide for the perfect location-based domain.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'GeoDomainLand - Premium Geographic Domain Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GeoDomainLand - Premium Geographic Domain Marketplace',
    description: 'Discover and trade premium geographic domain names. Connect with buyers and sellers worldwide for the perfect location-based domain.',
    images: ['/og-image.jpg'],
    creator: '@geodomainland',
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
  },
}

// Viewport configuration
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

// Helper function to generate page-specific metadata
export function generatePageMetadata({
  title,
  description,
  path = '',
  noIndex = false,
}: {
  title: string
  description?: string
  path?: string
  noIndex?: boolean
}): Metadata {
  return {
    ...baseMetadata,
    title,
    description: description || baseMetadata.description,
    openGraph: {
      ...baseMetadata.openGraph,
      title,
      description: description || baseMetadata.description,
      url: `${baseMetadata.metadataBase}${path}`,
    },
    twitter: {
      ...baseMetadata.twitter,
      title,
      description: description || baseMetadata.description,
    },
    robots: noIndex ? {
      index: false,
      follow: false,
    } : baseMetadata.robots,
  }
}
