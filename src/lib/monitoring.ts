import { NextRequest, NextResponse } from 'next/server'

// Performance monitoring interface
export interface PerformanceMetrics {
  responseTime: number
  memoryUsage: number
  timestamp: string
  endpoint: string
  method: string
  statusCode: number
  userAgent?: string
  ipAddress?: string
}

// Monitoring configuration
export interface MonitoringConfig {
  enabled: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  trackMemory: boolean
  trackResponseTime: boolean
  trackErrors: boolean
}

// Default monitoring configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  enabled: process.env.NODE_ENV === 'production',
  logLevel: (process.env.LOG_LEVEL as MonitoringConfig['logLevel']) || 'info',
  trackMemory: true,
  trackResponseTime: true,
  trackErrors: true,
}

// Performance monitoring class
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private config: MonitoringConfig

  private constructor(config: MonitoringConfig) {
    this.config = config
  }

  static getInstance(config?: MonitoringConfig): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(config || defaultMonitoringConfig)
    }
    return PerformanceMonitor.instance
  }

  // Start monitoring a request
  startMonitoring(request: NextRequest): { startTime: number; startMemory: number } {
    const startTime = performance.now()
    const startMemory = process.memoryUsage().heapUsed
    
    return { startTime, startMemory }
  }

  // End monitoring and record metrics
  endMonitoring(
    startData: { startTime: number; startMemory: number },
    response: NextResponse,
    endpoint: string,
    method: string,
    userAgent?: string,
    ipAddress?: string
  ): void {
    if (!this.config.enabled) return

    const endTime = performance.now()
    const endMemory = process.memoryUsage().heapUsed
    
    const metrics: PerformanceMetrics = {
      responseTime: endTime - startData.startTime,
      memoryUsage: endMemory - startData.startMemory,
      timestamp: new Date().toISOString(),
      endpoint,
      method,
      statusCode: response.status,
      userAgent,
      ipAddress,
    }

    this.recordMetrics(metrics)
  }

  // Record performance metrics
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics)
    
    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // Log metrics based on configuration
    this.logMetrics(metrics)
  }

  // Log metrics based on log level
  private logMetrics(metrics: PerformanceMetrics): void {
    const { logLevel, trackResponseTime, trackMemory } = this.config

    if (logLevel === 'debug') {
      console.log('🔍 Performance Metrics:', metrics)
    } else if (logLevel === 'info' && (trackResponseTime || trackMemory)) {
      const logData: any = { endpoint: metrics.endpoint, method: metrics.method }
      
      if (trackResponseTime) {
        logData.responseTime = `${metrics.responseTime.toFixed(2)}ms`
      }
      
      if (trackMemory) {
        logData.memoryDelta = `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`
      }
      
      console.log('📊 Performance:', logData)
    }
  }

  // Get performance statistics
  getStats(): {
    totalRequests: number
    averageResponseTime: number
    averageMemoryUsage: number
    statusCodeDistribution: Record<number, number>
    topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>
  } {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        averageMemoryUsage: 0,
        statusCodeDistribution: {},
        topEndpoints: [],
      }
    }

    const totalRequests = this.metrics.length
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
    const averageMemoryUsage = this.metrics.reduce((sum, m) => sum + m.memoryUsage, 0) / totalRequests

    // Status code distribution
    const statusCodeDistribution: Record<number, number> = {}
    this.metrics.forEach(m => {
      statusCodeDistribution[m.statusCode] = (statusCodeDistribution[m.statusCode] || 0) + 1
    })

    // Top endpoints by request count
    const endpointStats: Record<string, { count: number; totalResponseTime: number }> = {}
    this.metrics.forEach(m => {
      if (!endpointStats[m.endpoint]) {
        endpointStats[m.endpoint] = { count: 0, totalResponseTime: 0 }
      }
      endpointStats[m.endpoint].count++
      endpointStats[m.endpoint].totalResponseTime += m.responseTime
    })

    const topEndpoints = Object.entries(endpointStats)
      .map(([endpoint, stats]) => ({
        endpoint,
        count: stats.count,
        avgResponseTime: stats.totalResponseTime / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalRequests,
      averageResponseTime,
      averageMemoryUsage,
      statusCodeDistribution,
      topEndpoints,
    }
  }

  // Clear metrics (useful for testing)
  clearMetrics(): void {
    this.metrics = []
  }
}

// Middleware for performance monitoring
export function withPerformanceMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const monitor = PerformanceMonitor.getInstance()
    const startData = monitor.startMonitoring(request)
    
    try {
      const response = await handler(request)
      
      monitor.endMonitoring(
        startData,
        response,
        request.nextUrl.pathname,
        request.method,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-forwarded-for')?.split(',')[0] || 
        'unknown'
      )
      
      return response
    } catch (error) {
      // Log error metrics
      if (defaultMonitoringConfig.trackErrors) {
        console.error('❌ Request failed:', {
          endpoint: request.nextUrl.pathname,
          method: request.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      }
      
      throw error
    }
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()
