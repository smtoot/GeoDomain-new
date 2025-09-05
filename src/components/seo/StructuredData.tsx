'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  data: any
  type?: 'application/ld+json' | 'application/json'
}

export default function StructuredData({ data, type = 'application/ld+json' }: StructuredDataProps) {
  useEffect(() => {
    // Create script element for structured data
    const script = document.createElement('script')
    script.type = type
    script.text = JSON.stringify(data)
    script.id = `structured-data-${Date.now()}`

    // Add to document head
    document.head.appendChild(script)

    // Cleanup on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [data, type])

  // This component doesn't render anything visible
  return null
}

// Predefined structured data components
export const OrganizationStructuredData = ({ data }: {
  data: {
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
  }
}) => {
  const structuredData = {
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
  }

  return <StructuredData data={structuredData} />
}

export const WebsiteStructuredData = ({ data }: {
  data: {
    name: string
    url: string
    description?: string
    potentialAction?: {
      '@type': string
      target: string
      'query-input': string
    }
  }
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    description: data.description,
    potentialAction: data.potentialAction,
  }

  return <StructuredData data={structuredData} />
}

export const DomainListingStructuredData = ({ data }: {
  data: {
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
  }
}) => {
  const structuredData = {
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
  }

  return <StructuredData data={structuredData} />
}

export const SearchActionStructuredData = ({ data }: {
  data: {
    target: string
    queryInput: string
  }
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    potentialAction: {
      '@type': 'SearchAction',
      target: data.target,
      'query-input': data.queryInput,
    },
  }

  return <StructuredData data={structuredData} />
}

export const BreadcrumbStructuredData = ({ items }: {
  items: Array<{ name: string; url: string }>
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <StructuredData data={structuredData} />
}

export const FAQStructuredData = ({ questions }: {
  questions: Array<{ question: string; answer: string }>
}) => {
  const structuredData = {
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
  }

  return <StructuredData data={structuredData} />
}

export const LocalBusinessStructuredData = ({ data }: {
  data: {
    name: string
    description: string
    url: string
    telephone: string
    address: {
      streetAddress: string
      addressLocality: string
      addressRegion: string
      postalCode: string
      addressCountry: string
    }
    geo: {
      latitude: number
      longitude: number
    }
    openingHours: string[]
    priceRange: string
  }
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: data.name,
    description: data.description,
    url: data.url,
    telephone: data.telephone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: data.address.streetAddress,
      addressLocality: data.address.addressLocality,
      addressRegion: data.address.addressRegion,
      postalCode: data.address.postalCode,
      addressCountry: data.address.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: data.geo.latitude,
      longitude: data.geo.longitude,
    },
    openingHours: data.openingHours,
    priceRange: data.priceRange,
  }

  return <StructuredData data={structuredData} />
}

export const ArticleStructuredData = ({ data }: {
  data: {
    headline: string
    description: string
    image: string
    author: {
      '@type': string
      name: string
    }
    publisher: {
      '@type': string
      name: string
      logo: {
        '@type': string
        url: string
      }
    }
    datePublished: string
    dateModified: string
  }
}) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    image: data.image,
    author: data.author,
    publisher: data.publisher,
    datePublished: data.datePublished,
    dateModified: data.dateModified,
  }

  return <StructuredData data={structuredData} />
}
