import { NextResponse } from 'next/server'
import { generateRobotsTxt } from '@/lib/seo'

export async function GET() {
  try {
    const robotsContent = generateRobotsTxt()
    
    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  } catch (error) {
    console.error('Error generating robots.txt:', error)
    
    // Return a basic robots.txt on error
    const fallbackRobots = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://geodomain.com/sitemap.xml

# Disallow private pages
Disallow: /dashboard
Disallow: /login
Disallow: /admin
Disallow: /api/`

    return new NextResponse(fallbackRobots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}
