import { NextResponse } from 'next/server'
import { performanceMonitor } from '@/lib/monitoring/monitoring'
import { cache } from '@/lib/cache'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get performance metrics
    const performanceStats = performanceMonitor.getStats()
    
    // Get cache statistics
    const cacheStats = {
      size: cache.size,
      maxSize: cache.max,
      hitRate: cache.calculatedSize || 0
    }
    
    // Get database connection status
    const dbStatus = await prisma.$queryRaw`SELECT 1 as connected`
    
    // Get system information
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      title: process.title,
    }
    
    // Calculate memory usage percentages
    const memUsage = process.memoryUsage()
    const memoryStats = {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      heapUsagePercent: ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2) + '%'
    }
    
    const monitoringData = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      
      // Performance metrics
      performance: {
        ...performanceStats,
        memoryStats,
        uptime: `${(process.uptime() / 3600).toFixed(2)} hours`
      },
      
      // Service health
      services: {
        database: { status: 'healthy', connected: !!dbStatus },
        cache: { status: 'healthy', ...cacheStats },
        monitoring: { status: 'active', metricsCount: performanceStats.totalRequests || 0 }
      },
      
      // System information
      system: systemInfo,
      
      // Configuration
      config: {
        nodeEnv: process.env.NODE_ENV,
        logLevel: process.env.LOG_LEVEL || 'info',
        databaseProvider: 'sqlite',
        cacheProvider: process.env.REDIS_URL ? 'redis' : 'disabled',
        features: {
          paymentVerification: process.env.PAYMENT_VERIFICATION_ENABLED === 'true',
          moderationQueue: process.env.MODERATION_QUEUE_ENABLED === 'true'
        }
      }
    }
    
    return NextResponse.json(monitoringData, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
  } catch (error) {
    console.error('Monitoring stats error:', error)
    
    return NextResponse.json({
      error: 'Failed to retrieve monitoring statistics',
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Clear metrics endpoint (for testing/reset purposes)
export async function DELETE() {
  try {
    performanceMonitor.clearMetrics()
    
    return NextResponse.json({
      message: 'Performance metrics cleared successfully',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Failed to clear metrics:', error)
    
    return NextResponse.json({
      error: 'Failed to clear performance metrics',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
