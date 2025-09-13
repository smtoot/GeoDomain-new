import { Metadata } from 'next'

// SEO configuration
export const SEO_CONFIG = {
  // Default meta tags
  DEFAULT: {
    title: 'GeoDomain - Premium Domain Marketplace',
    description: 'Discover and purchase premium domains for your business. Professional domain marketplace with verified listings and secure transactions.',
    keywords: 'domains, domain marketplace, premium domains, business domains, domain investment',
    author: 'GeoDomain',
    robots: 'index, follow',
    viewport: 'width=device-width, initial-scale=1',
    charset: 'utf-8',
  },
  // Open Graph defaults
  OPEN_GRAPH: {
    type: 'website',
    siteName: 'GeoDomain',
    locale: 'en_US',
    image: '/og-image.jpg',
    imageWidth: 1200,
    imageHeight: 630,
  },
  // Twitter Card defaults
  TWITTER: {
    card: 'summary_large_image',
    site: '@geodomain',
    creator: '@geodomain',
  },
  // Structured data types
  STRUCTURED_DATA: {
    ORGANIZATION: 'Organization',
    WEBSITE: 'WebSite',
    DOMAIN_LISTING: 'Product',
    SEARCH_ACTION: 'SearchAction',
    BREADCRUMB: 'BreadcrumbList',
  },
}

// SEO metadata interface
export interface SEOMetadata {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  robots?: string
  openGraph?: {
    title?: string
    description?: string
    type?: string
    url?: string
    image?: string
    imageWidth?: number
    imageHeight?: number
    siteName?: string
    locale?: string
  }
  twitter?: {
    card?: string
    site?: string
    creator?: string
    title?: string
    description?: string
    image?: string
  }
  structuredData?: any[]
  alternates?: {
    canonical?: string
    languages?: Record<string, string>
  }
}

// Generate dynamic meta tags
export function generateMetadata(seoData: SEOMetadata): Metadata {
  const {
    title,
    description,
    keywords,
    canonical,
    robots,
    openGraph,
    twitter,
    structuredData,
    alternates,
  } = seoData

  const meta: Metadata = {
    title: title || SEO_CONFIG.DEFAULT.title,
    description: description || SEO_CONFIG.DEFAULT.description,
    keywords: keywords?.join(', ') || SEO_CONFIG.DEFAULT.keywords,
    robots: robots || SEO_CONFIG.DEFAULT.robots,
    authors: [{ name: SEO_CONFIG.DEFAULT.author }],
    viewport: SEO_CONFIG.DEFAULT.viewport,
    alternates: {
      canonical: canonical || alternates?.canonical,
      languages: alternates?.languages,
    },
    openGraph: {
      title: openGraph?.title || title || SEO_CONFIG.DEFAULT.title,
      description: openGraph?.description || description || SEO_CONFIG.DEFAULT.description,
      type: openGraph?.type || SEO_CONFIG.OPEN_GRAPH.type,
      url: openGraph?.url || canonical,
      siteName: openGraph?.siteName || SEO_CONFIG.OPEN_GRAPH.siteName,
      locale: openGraph?.locale || SEO_CONFIG.OPEN_GRAPH.locale,
      images: [
        {
          url: openGraph?.image || SEO_CONFIG.OPEN_GRAPH.image,
          width: openGraph?.imageWidth || SEO_CONFIG.OPEN_GRAPH.imageWidth,
          height: openGraph?.imageHeight || SEO_CONFIG.OPEN_GRAPH.imageHeight,
          alt: openGraph?.title || title || SEO_CONFIG.DEFAULT.title,
        },
      ],
    },
    twitter: {
      card: twitter?.card || SEO_CONFIG.TWITTER.card,
      site: twitter?.site || SEO_CONFIG.TWITTER.site,
      creator: twitter?.creator || SEO_CONFIG.TWITTER.creator,
      title: twitter?.title || title || SEO_CONFIG.DEFAULT.title,
      description: twitter?.description || description || SEO_CONFIG.DEFAULT.description,
      images: twitter?.image || openGraph?.image || SEO_CONFIG.OPEN_GRAPH.image,
    },
  }

  // Add structured data if provided
  if (structuredData && structuredData.length > 0) {
    meta.other = {
      ...meta.other,
      'structured-data': JSON.stringify(structuredData),
    }
  }

  return meta
}

// Generate structured data for different page types
export const structuredData = {
  // Organization structured data
  organization: (data: {
    name: string
    url: string
    logo: string
    description?: string
    contactPoint?: {
      telephone: string
      contactType: string
      email?: string
    }
    sameAs?: string[]
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    contactPoint: data.contactPoint ? {
      '@type': 'ContactPoint',
      telephone: data.contactPoint.telephone,
      contactType: data.contactPoint.contactType,
      email: data.contactPoint.email,
    } : undefined,
    sameAs: data.sameAs,
  }),

  // Website structured data
  website: (data: {
    name: string
    url: string
    description?: string
    potentialAction?: {
      '@type': string
      target: string
      'query-input': string
    }
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    description: data.description,
    potentialAction: data.potentialAction,
  }),

  // Domain listing structured data
  domainListing: (data: {
    name: string
    description: string
    url: string
    image?: string
    price: number
    priceCurrency: string
    availability: string
    category: string
    seller: {
      '@type': string
      name: string
    }
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    url: data.url,
    image: data.image,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.priceCurrency,
      availability: data.availability,
      seller: data.seller,
    },
    category: data.category,
  }),

  // Search action structured data
  searchAction: (data: {
    target: string
    queryInput: string
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    potentialAction: {
      '@type': 'SearchAction',
      target: data.target,
      'query-input': data.queryInput,
    },
  }),

  // Breadcrumb structured data
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),

  // FAQ structured data
  faq: (questions: Array<{ question: string; answer: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }),
}

// Generate Open Graph tags
export function generateOpenGraphTags(data: {
  title: string
  description: string
  url: string
  image?: string
  type?: string
  siteName?: string
  locale?: string
}) {
  const {
    title,
    description,
    url,
    image = SEO_CONFIG.OPEN_GRAPH.image,
    type = SEO_CONFIG.OPEN_GRAPH.type,
    siteName = SEO_CONFIG.OPEN_GRAPH.siteName,
    locale = SEO_CONFIG.OPEN_GRAPH.locale,
  } = data

  return {
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:image': image,
    'og:type': type,
    'og:site_name': siteName,
    'og:locale': locale,
    'og:image:width': SEO_CONFIG.OPEN_GRAPH.imageWidth,
    'og:image:height': SEO_CONFIG.OPEN_GRAPH.imageHeight,
  }
}

// Generate Twitter Card tags
export function generateTwitterTags(data: {
  title: string
  description: string
  image?: string
  card?: string
  site?: string
  creator?: string
}) {
  const {
    title,
    description,
    image = SEO_CONFIG.OPEN_GRAPH.image,
    card = SEO_CONFIG.TWITTER.card,
    site = SEO_CONFIG.TWITTER.site,
    creator = SEO_CONFIG.TWITTER.creator,
  } = data

  return {
    'twitter:card': card,
    'twitter:site': site,
    'twitter:creator': creator,
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': image,
  }
}

// Generate meta tags for different page types
export const pageMetadata = {
  // Home page
  home: () => generateMetadata({
    title: 'GeoDomain - Premium Domain Marketplace',
    description: 'Discover and purchase premium domains for your business. Professional domain marketplace with verified listings and secure transactions.',
    keywords: ['domains', 'domain marketplace', 'premium domains', 'business domains', 'domain investment'],
    structuredData: [
      structuredData.organization({
        name: 'GeoDomain',
        url: 'https://geodomain.com',
        logo: 'https://geodomain.com/logo.png',
        description: 'Premium domain marketplace for businesses and investors',
        contactPoint: {
          telephone: '+1-555-0123',
          contactType: 'customer service',
          email: 'support@geodomain.com',
        },
        sameAs: [
          'https://twitter.com/geodomain',
          'https://linkedin.com/company/geodomain',
        ],
      }),
      structuredData.website({
        name: 'GeoDomain',
        url: 'https://geodomain.com',
        description: 'Premium domain marketplace',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://geodomain.com/domains?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }),
    ],
  }),

  // Domain listing page
  domain: (data: {
    name: string
    description: string
    price: number
    category: string
    sellerName: string
  }) => generateMetadata({
    title: `${data.name} - Premium Domain for Sale | GeoDomain`,
    description: `${data.description} Available for $${data.price.toLocaleString()}. ${data.category} domain from verified seller ${data.sellerName}.`,
    keywords: [data.name, 'domain for sale', data.category, 'premium domain'],
    structuredData: [
      structuredData.domainListing({
        name: data.name,
        description: data.description,
        url: `https://geodomain.com/domains/${data.name}`,
        price: data.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        category: data.category,
        seller: {
          '@type': 'Organization',
          name: data.sellerName,
        },
      }),
    ],
  }),

  // Search results page
  search: (query: string, resultsCount: number) => generateMetadata({
    title: `Search Results for "${query}" | GeoDomain`,
    description: `Found ${resultsCount} domains matching "${query}". Browse premium domains for sale on GeoDomain.`,
    keywords: [query, 'domain search', 'domains for sale'],
    structuredData: [
      structuredData.searchAction({
        target: `https://geodomain.com/domains?q={search_term_string}`,
        queryInput: 'required name=search_term_string',
      }),
    ],
  }),

  // About page
  about: () => generateMetadata({
    title: 'About GeoDomain | Premium Domain Marketplace',
    description: 'Learn about GeoDomain, the trusted marketplace for premium domains. Our mission, team, and commitment to quality domain listings.',
    keywords: ['about geodomain', 'domain marketplace', 'company information'],
  }),

  // Contact page
  contact: () => generateMetadata({
    title: 'Contact GeoDomain | Get in Touch',
    description: 'Contact GeoDomain for support, domain inquiries, or business partnerships. Our team is here to help with all your domain needs.',
    keywords: ['contact geodomain', 'support', 'domain help'],
  }),

  // Dashboard page
  dashboard: () => generateMetadata({
    title: 'Dashboard | GeoDomain',
    description: 'Manage your domains, inquiries, and account settings on GeoDomain.',
    robots: 'noindex, nofollow', // Private page
  }),

  // Login page
  login: () => generateMetadata({
    title: 'Login | GeoDomain',
    description: 'Sign in to your GeoDomain account to manage your domains and listings.',
    robots: 'noindex, nofollow', // Private page
  }),
}

// Generate sitemap data
export function generateSitemapData() {
  const baseUrl = 'https://geodomain.com'
  
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/domains`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/domains`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]
}

// Generate robots.txt content
export function generateRobotsTxt() {
  return `User-agent: *
Allow: /

# Sitemap
Sitemap: https://geodomain.com/sitemap.xml

# Disallow private pages
Disallow: /dashboard
Disallow: /login
Disallow: /admin
Disallow: /api/

# Allow search engines to crawl domain listings
Allow: /domains/
Allow: /domains

# Crawl delay (optional)
Crawl-delay: 1`
}

