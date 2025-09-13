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
    }
