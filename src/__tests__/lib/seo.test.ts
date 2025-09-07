import {
  SEO_CONFIG,
  generateMetadata,
  structuredData,
  generateOpenGraphTags,
  generateTwitterTags,
  pageMetadata,
  generateSitemapData,
  generateRobotsTxt,
} from '@/lib/seo'

describe('SEO Utilities', () => {
  describe('SEO Configuration', () => {
    it('should have proper default configuration', () => {
      expect(SEO_CONFIG.DEFAULT.title).toBe('GeoDomain - Premium Domain Marketplace')
      expect(SEO_CONFIG.DEFAULT.description).toContain('Discover and purchase premium domains')
      expect(SEO_CONFIG.DEFAULT.keywords).toContain('domains')
      expect(SEO_CONFIG.DEFAULT.author).toBe('GeoDomain')
      expect(SEO_CONFIG.DEFAULT.robots).toBe('index, follow')
    })

    it('should have Open Graph configuration', () => {
      expect(SEO_CONFIG.OPEN_GRAPH.type).toBe('website')
      expect(SEO_CONFIG.OPEN_GRAPH.siteName).toBe('GeoDomain')
      expect(SEO_CONFIG.OPEN_GRAPH.locale).toBe('en_US')
      expect(SEO_CONFIG.OPEN_GRAPH.image).toBe('/og-image.jpg')
      expect(SEO_CONFIG.OPEN_GRAPH.imageWidth).toBe(1200)
      expect(SEO_CONFIG.OPEN_GRAPH.imageHeight).toBe(630)
    })

    it('should have Twitter Card configuration', () => {
      expect(SEO_CONFIG.TWITTER.card).toBe('summary_large_image')
      expect(SEO_CONFIG.TWITTER.site).toBe('@geodomain')
      expect(SEO_CONFIG.TWITTER.creator).toBe('@geodomain')
    })

    it('should have structured data types', () => {
      expect(SEO_CONFIG.STRUCTURED_DATA.ORGANIZATION).toBe('Organization')
      expect(SEO_CONFIG.STRUCTURED_DATA.WEBSITE).toBe('WebSite')
      expect(SEO_CONFIG.STRUCTURED_DATA.DOMAIN_LISTING).toBe('Product')
      expect(SEO_CONFIG.STRUCTURED_DATA.SEARCH_ACTION).toBe('SearchAction')
      expect(SEO_CONFIG.STRUCTURED_DATA.BREADCRUMB).toBe('BreadcrumbList')
    })
  })

  describe('Metadata Generation', () => {
    it('should generate metadata with default values', () => {
      const metadata = generateMetadata({})

      expect(metadata.title).toBe(SEO_CONFIG.DEFAULT.title)
      expect(metadata.description).toBe(SEO_CONFIG.DEFAULT.description)
      expect(metadata.keywords).toBe(SEO_CONFIG.DEFAULT.keywords)
      expect(metadata.robots).toBe(SEO_CONFIG.DEFAULT.robots)
      expect(metadata.authors).toEqual([{ name: SEO_CONFIG.DEFAULT.author }])
      expect(metadata.viewport).toBe(SEO_CONFIG.DEFAULT.viewport)
    })

    it('should generate metadata with custom values', () => {
      const customData = {
        title: 'Custom Title',
        description: 'Custom description',
        keywords: ['custom', 'keywords'],
        canonical: 'https://example.com/custom',
        robots: 'noindex, nofollow',
      }

      const metadata = generateMetadata(customData)

      expect(metadata.title).toBe('Custom Title')
      expect(metadata.description).toBe('Custom description')
      expect(metadata.keywords).toBe('custom, keywords')
      expect(metadata.robots).toBe('noindex, nofollow')
      expect(metadata.alternates?.canonical).toBe('https://example.com/custom')
    })

    it('should generate Open Graph metadata', () => {
      const customData = {
        title: 'Custom Title',
        description: 'Custom description',
        openGraph: {
          title: 'OG Title',
          description: 'OG Description',
          type: 'article',
          url: 'https://example.com/article',
          image: '/custom-image.jpg',
          imageWidth: 800,
          imageHeight: 600,
        },
      }

      const metadata = generateMetadata(customData)

      expect(metadata.openGraph?.title).toBe('OG Title')
      expect(metadata.openGraph?.description).toBe('OG Description')
      expect(metadata.openGraph?.url).toBe('https://example.com/article')
      expect(metadata.openGraph?.images).toBeDefined()
    })

    it('should generate Twitter metadata', () => {
      const customData = {
        title: 'Custom Title',
        description: 'Custom description',
        twitter: {
          title: 'Twitter Title',
          description: 'Twitter Description',
          image: '/twitter-image.jpg',
          card: 'summary',
          site: '@customsite',
          creator: '@customcreator',
        },
      }

      const metadata = generateMetadata(customData)

      expect(metadata.twitter?.title).toBe('Twitter Title')
      expect(metadata.twitter?.description).toBe('Twitter Description')
      expect(metadata.twitter?.images).toBe('/twitter-image.jpg')
    })

    it('should include structured data in metadata', () => {
      const customData = {
        structuredData: [
          { '@type': 'Organization', name: 'Test Org' },
          { '@type': 'WebSite', name: 'Test Site' },
        ],
      }

      const metadata = generateMetadata(customData)

      expect(metadata.other?.['structured-data']).toBeDefined()
      expect(metadata.other?.['structured-data']).toContain('Test Org')
      expect(metadata.other?.['structured-data']).toContain('Test Site')
    })
  })

  describe('Structured Data Generation', () => {
    it('should generate organization structured data', () => {
      const data = {
        name: 'Test Organization',
        url: 'https://test.com',
        logo: 'https://test.com/logo.png',
        description: 'Test description',
        contactPoint: {
          telephone: '+1-555-0123',
          contactType: 'customer service',
          email: 'test@test.com',
        },
        sameAs: ['https://twitter.com/test'],
      }

      const result = structuredData.organization(data)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Organization')
      expect(result.name).toBe('Test Organization')
      expect(result.url).toBe('https://test.com')
      expect(result.logo).toBe('https://test.com/logo.png')
      expect(result.description).toBe('Test description')
      expect(result.contactPoint?.['@type']).toBe('ContactPoint')
      expect(result.contactPoint?.telephone).toBe('+1-555-0123')
      expect(result.sameAs).toEqual(['https://twitter.com/test'])
    })

    it('should generate website structured data', () => {
      const data = {
        name: 'Test Website',
        url: 'https://test.com',
        description: 'Test website description',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://test.com/domains?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      }

      const result = structuredData.website(data)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('WebSite')
      expect(result.name).toBe('Test Website')
      expect(result.url).toBe('https://test.com')
      expect(result.description).toBe('Test website description')
      expect(result.potentialAction?.['@type']).toBe('SearchAction')
    })

    it('should generate domain listing structured data', () => {
      const data = {
        name: 'example.com',
        description: 'Premium domain for sale',
        url: 'https://test.com/domains/example.com',
        image: '/domain-image.jpg',
        price: 5000,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        category: 'Technology',
        seller: {
          '@type': 'Organization',
          name: 'Test Seller',
        },
      }

      const result = structuredData.domainListing(data)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('Product')
      expect(result.name).toBe('example.com')
      expect(result.description).toBe('Premium domain for sale')
      expect(result.offers?.['@type']).toBe('Offer')
      expect(result.offers?.price).toBe(5000)
      expect(result.offers?.priceCurrency).toBe('USD')
      expect(result.offers?.availability).toBe('https://schema.org/InStock')
      expect(result.category).toBe('Technology')
    })

    it('should generate search action structured data', () => {
      const data = {
        target: 'https://test.com/domains?q={search_term_string}',
        queryInput: 'required name=search_term_string',
      }

      const result = structuredData.searchAction(data)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('WebSite')
      expect(result.potentialAction?.['@type']).toBe('SearchAction')
      expect(result.potentialAction?.target).toBe('https://test.com/domains?q={search_term_string}')
      expect(result.potentialAction?.['query-input']).toBe('required name=search_term_string')
    })

    it('should generate breadcrumb structured data', () => {
      const items = [
        { name: 'Home', url: 'https://test.com' },
        { name: 'Domains', url: 'https://test.com/domains' },
        { name: 'example.com', url: 'https://test.com/domains/example.com' },
      ]

      const result = structuredData.breadcrumb(items)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('BreadcrumbList')
      expect(result.itemListElement).toHaveLength(3)
      expect(result.itemListElement?.[0]['@type']).toBe('ListItem')
      expect(result.itemListElement?.[0].position).toBe(1)
      expect(result.itemListElement?.[0].name).toBe('Home')
      expect(result.itemListElement?.[0].item).toBe('https://test.com')
    })

    it('should generate FAQ structured data', () => {
      const questions = [
        { question: 'What is GeoDomain?', answer: 'A premium domain marketplace' },
        { question: 'How do I buy a domain?', answer: 'Contact the seller directly' },
      ]

      const result = structuredData.faq(questions)

      expect(result['@context']).toBe('https://schema.org')
      expect(result['@type']).toBe('FAQPage')
      expect(result.mainEntity).toHaveLength(2)
      expect(result.mainEntity?.[0]['@type']).toBe('Question')
      expect(result.mainEntity?.[0].name).toBe('What is GeoDomain?')
      expect(result.mainEntity?.[0].acceptedAnswer?.['@type']).toBe('Answer')
      expect(result.mainEntity?.[0].acceptedAnswer?.text).toBe('A premium domain marketplace')
    })
  })

  describe('Open Graph Tags Generation', () => {
    it('should generate Open Graph tags with custom data', () => {
      const data = {
        title: 'Custom Title',
        description: 'Custom description',
        url: 'https://test.com/article',
        image: '/custom-image.jpg',
        type: 'article',
        siteName: 'Custom Site',
        locale: 'en_GB',
      }

      const result = generateOpenGraphTags(data)

      expect(result['og:title']).toBe('Custom Title')
      expect(result['og:description']).toBe('Custom description')
      expect(result['og:url']).toBe('https://test.com/article')
      expect(result['og:image']).toBe('/custom-image.jpg')
      expect(result['og:type']).toBe('article')
      expect(result['og:site_name']).toBe('Custom Site')
      expect(result['og:locale']).toBe('en_GB')
      expect(result['og:image:width']).toBe(1200)
      expect(result['og:image:height']).toBe(630)
    })

    it('should generate Open Graph tags with default values', () => {
      const data = {
        title: 'Custom Title',
        description: 'Custom description',
        url: 'https://test.com',
      }

      const result = generateOpenGraphTags(data)

      expect(result['og:title']).toBe('Custom Title')
      expect(result['og:description']).toBe('Custom description')
      expect(result['og:url']).toBe('https://test.com')
      expect(result['og:image']).toBe('/og-image.jpg')
      expect(result['og:type']).toBe('website')
      expect(result['og:site_name']).toBe('GeoDomain')
      expect(result['og:locale']).toBe('en_US')
    })
  })

  describe('Twitter Tags Generation', () => {
    it('should generate Twitter tags with custom data', () => {
      const data = {
        title: 'Custom Title',
        description: 'Custom description',
        image: '/twitter-image.jpg',
        card: 'summary',
        site: '@customsite',
        creator: '@customcreator',
      }

      const result = generateTwitterTags(data)

      expect(result['twitter:card']).toBe('summary')
      expect(result['twitter:site']).toBe('@customsite')
      expect(result['twitter:creator']).toBe('@customcreator')
      expect(result['twitter:title']).toBe('Custom Title')
      expect(result['twitter:description']).toBe('Custom description')
      expect(result['twitter:image']).toBe('/twitter-image.jpg')
    })

    it('should generate Twitter tags with default values', () => {
      const data = {
        title: 'Custom Title',
        description: 'Custom description',
      }

      const result = generateTwitterTags(data)

      expect(result['twitter:card']).toBe('summary_large_image')
      expect(result['twitter:site']).toBe('@geodomain')
      expect(result['twitter:creator']).toBe('@geodomain')
      expect(result['twitter:title']).toBe('Custom Title')
      expect(result['twitter:description']).toBe('Custom description')
      expect(result['twitter:image']).toBe('/og-image.jpg')
    })
  })

  describe('Page Metadata Generation', () => {
    it('should generate home page metadata', () => {
      const metadata = pageMetadata.home()

      expect(metadata.title).toBe('GeoDomain - Premium Domain Marketplace')
      expect(metadata.description).toContain('Discover and purchase premium domains')
      expect(metadata.keywords).toContain('domains')
      expect(metadata.keywords).toContain('domain marketplace')
      expect(metadata.other?.['structured-data']).toBeDefined()
    })

    it('should generate domain listing metadata', () => {
      const metadata = pageMetadata.domain({
        name: 'example.com',
        description: 'Premium technology domain',
        price: 10000,
        category: 'Technology',
        sellerName: 'Premium Seller',
      })

      expect(metadata.title).toBe('example.com - Premium Domain for Sale | GeoDomain')
      expect(metadata.description).toContain('Premium technology domain')
      expect(metadata.description).toContain('$10,000')
      expect(metadata.description).toContain('Technology')
      expect(metadata.description).toContain('Premium Seller')
      expect(metadata.keywords).toContain('example.com')
      expect(metadata.keywords).toContain('domain for sale')
    })

    it('should generate search results metadata', () => {
      const metadata = pageMetadata.search('technology', 25)

      expect(metadata.title).toBe('Search Results for "technology" | GeoDomain')
      expect(metadata.description).toContain('Found 25 domains')
      expect(metadata.description).toContain('"technology"')
      expect(metadata.keywords).toContain('technology')
      expect(metadata.keywords).toContain('domain search')
    })

    it('should generate about page metadata', () => {
      const metadata = pageMetadata.about()

      expect(metadata.title).toBe('About GeoDomain | Premium Domain Marketplace')
      expect(metadata.description).toContain('Learn about GeoDomain')
      expect(metadata.description).toContain('trusted marketplace')
      expect(metadata.keywords).toContain('about geodomain')
    })

    it('should generate contact page metadata', () => {
      const metadata = pageMetadata.contact()

      expect(metadata.title).toBe('Contact GeoDomain | Get in Touch')
      expect(metadata.description).toContain('Contact GeoDomain')
      expect(metadata.description).toContain('support')
      expect(metadata.keywords).toContain('contact geodomain')
    })

    it('should generate dashboard metadata with noindex', () => {
      const metadata = pageMetadata.dashboard()

      expect(metadata.title).toBe('Dashboard | GeoDomain')
      expect(metadata.description).toContain('Manage your domains')
      expect(metadata.robots).toBe('noindex, nofollow')
    })

    it('should generate login metadata with noindex', () => {
      const metadata = pageMetadata.login()

      expect(metadata.title).toBe('Login | GeoDomain')
      expect(metadata.description).toContain('Sign in to your GeoDomain account')
      expect(metadata.robots).toBe('noindex, nofollow')
    })
  })

  describe('Sitemap Generation', () => {
    it('should generate sitemap data', () => {
      const sitemapData = generateSitemapData()

      expect(sitemapData).toHaveLength(5)
      
      // Check home page
      const homePage = sitemapData.find(item => item.url === 'https://geodomain.com')
      expect(homePage).toBeDefined()
      expect(homePage?.changeFrequency).toBe('daily')
      expect(homePage?.priority).toBe(1.0)

      // Check about page
      const aboutPage = sitemapData.find(item => item.url === 'https://geodomain.com/about')
      expect(aboutPage).toBeDefined()
      expect(aboutPage?.changeFrequency).toBe('monthly')
      expect(aboutPage?.priority).toBe(0.8)

      // Check search page
      const searchPage = sitemapData.find(item => item.url === 'https://geodomain.com/domains')
      expect(searchPage).toBeDefined()
      expect(searchPage?.changeFrequency).toBe('daily')
      expect(searchPage?.priority).toBe(0.9)
    })

    it('should include lastModified in sitemap data', () => {
      const sitemapData = generateSitemapData()

      sitemapData.forEach(item => {
        expect(item.lastModified).toBeInstanceOf(Date)
        expect(item.lastModified.getTime()).toBeLessThanOrEqual(Date.now())
      })
    })
  })

  describe('Robots.txt Generation', () => {
    it('should generate robots.txt content', () => {
      const robotsContent = generateRobotsTxt()

      expect(robotsContent).toContain('User-agent: *')
      expect(robotsContent).toContain('Allow: /')
      expect(robotsContent).toContain('Sitemap: https://geodomain.com/sitemap.xml')
      expect(robotsContent).toContain('Disallow: /dashboard')
      expect(robotsContent).toContain('Disallow: /login')
      expect(robotsContent).toContain('Disallow: /admin')
      expect(robotsContent).toContain('Disallow: /api/')
      expect(robotsContent).toContain('Allow: /domains/')
      expect(robotsContent).toContain('Allow: /domains')
      expect(robotsContent).toContain('Crawl-delay: 1')
    })

    it('should include proper formatting in robots.txt', () => {
      const robotsContent = generateRobotsTxt()

      // Check for proper line breaks and structure
      const lines = robotsContent.split('\n')
      expect(lines.length).toBeGreaterThan(10)
      
      // Check for proper sections
      expect(robotsContent).toContain('# Sitemap')
      expect(robotsContent).toContain('# Disallow private pages')
      expect(robotsContent).toContain('# Allow search engines to crawl domain listings')
      expect(robotsContent).toContain('# Crawl delay (optional)')
    })
  })
})
