import { prisma } from '@/lib/prisma';
import { createTRPCError, ErrorCode } from '@/lib/errors/api-errors';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  apiKeyId?: string;
  memoryUsage: number;
  cpuUsage: number;
  databaseQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'response_time' | 'error_rate' | 'memory_usage' | 'cpu_usage';
  threshold: number;
  currentValue: number;
  endpoint?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

export interface PerformanceReport {
  period: string;
  totalRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  errorRate: number;
  topSlowEndpoints: Array<{
    endpoint: string;
    averageResponseTime: number;
    requestCount: number;
  }>;
  topErrorEndpoints: Array<{
    endpoint: string;
    errorCount: number;
    errorRate: number;
  }>;
  databasePerformance: {
    averageQueryTime: number;
    slowQueries: number;
    totalQueries: number;
  };
  cachePerformance: {
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  };
}

/**
 * Record performance metrics for an API request
 */
export async function recordPerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
  try {
    await prisma.performanceMetrics.create({
      data: {
        endpoint: metrics.endpoint,
        method: metrics.method,
        responseTime: metrics.responseTime,
        statusCode: metrics.statusCode,
        timestamp: metrics.timestamp,
        userId: metrics.userId,
        apiKeyId: metrics.apiKeyId,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        databaseQueries: metrics.databaseQueries,
        cacheHits: metrics.cacheHits,
        cacheMisses: metrics.cacheMisses,
      },
    });
  } catch (error) {
    // Don't throw error for performance logging failures
    console.error('Failed to record performance metrics:', error);
  }
}

/**
 * Get performance metrics for a specific time period
 */
export async function getPerformanceMetrics(
  startDate: Date,
  endDate: Date,
  endpoint?: string
): Promise<PerformanceMetrics[]> {
  try {
    const whereClause: any = {
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (endpoint) {
      whereClause.endpoint = endpoint;
    }

    const metrics = await prisma.performanceMetrics.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 1000, // Limit to prevent memory issues
    });

    return metrics.map(metric => ({
      endpoint: metric.endpoint,
      method: metric.method,
      responseTime: metric.responseTime,
      statusCode: metric.statusCode,
      timestamp: metric.timestamp,
      userId: metric.userId || undefined,
      apiKeyId: metric.apiKeyId || undefined,
      memoryUsage: metric.memoryUsage,
      cpuUsage: metric.cpuUsage,
      databaseQueries: metric.databaseQueries,
      cacheHits: metric.cacheHits,
      cacheMisses: metric.cacheMisses,
    }));
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get performance metrics', error, ErrorCode.DATABASE_ERROR);
  }
}

/**
 * Generate performance report for a time period
 */
export async function generatePerformanceReport(
  startDate: Date,
  endDate: Date
): Promise<PerformanceReport> {
  try {
    // Get aggregated metrics
    const [
      totalRequests,
      averageResponseTime,
      responseTimePercentiles,
      errorCount,
      topSlowEndpoints,
      topErrorEndpoints,
      databaseMetrics,
      cacheMetrics,
    ] = await Promise.all([
      // Total requests
      prisma.performanceMetrics.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
      }),

      // Average response time
      prisma.performanceMetrics.aggregate({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _avg: { responseTime: true },
      }),

      // Response time percentiles (simplified calculation)
      prisma.performanceMetrics.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        select: { responseTime: true },
        orderBy: { responseTime: 'asc' },
      }),

      // Error count
      prisma.performanceMetrics.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          statusCode: { gte: 400 },
        },
      }),

      // Top slow endpoints
      prisma.performanceMetrics.groupBy({
        by: ['endpoint'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _avg: { responseTime: true },
        _count: { endpoint: true },
        orderBy: { _avg: { responseTime: 'desc' } },
        take: 10,
      }),

      // Top error endpoints
      prisma.performanceMetrics.groupBy({
        by: ['endpoint'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
          statusCode: { gte: 400 },
        },
        _count: { endpoint: true },
        orderBy: { _count: { endpoint: 'desc' } },
        take: 10,
      }),

      // Database performance
      prisma.performanceMetrics.aggregate({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _avg: { databaseQueries: true },
        _sum: { databaseQueries: true },
      }),

      // Cache performance
      prisma.performanceMetrics.aggregate({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _sum: { cacheHits: true, cacheMisses: true },
      }),
    ]);

    // Calculate percentiles
    const sortedResponseTimes = responseTimePercentiles.map(m => m.responseTime).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedResponseTimes.length * 0.95);
    const p99Index = Math.floor(sortedResponseTimes.length * 0.99);
    const p95ResponseTime = sortedResponseTimes[p95Index] || 0;
    const p99ResponseTime = sortedResponseTimes[p99Index] || 0;

    // Calculate error rate
    const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Calculate cache hit rate
    const totalCacheRequests = (cacheMetrics._sum.cacheHits || 0) + (cacheMetrics._sum.cacheMisses || 0);
    const cacheHitRate = totalCacheRequests > 0 ? ((cacheMetrics._sum.cacheHits || 0) / totalCacheRequests) * 100 : 0;

    return {
      period: `${startDate.toISOString()} to ${endDate.toISOString()}`,
      totalRequests,
      averageResponseTime: averageResponseTime._avg.responseTime || 0,
      p95ResponseTime,
      p99ResponseTime,
      errorRate,
      topSlowEndpoints: topSlowEndpoints.map(endpoint => ({
        endpoint: endpoint.endpoint,
        averageResponseTime: endpoint._avg.responseTime || 0,
        requestCount: endpoint._count.endpoint,
      })),
      topErrorEndpoints: topErrorEndpoints.map(endpoint => ({
        endpoint: endpoint.endpoint,
        errorCount: endpoint._count.endpoint,
        errorRate: totalRequests > 0 ? (endpoint._count.endpoint / totalRequests) * 100 : 0,
      })),
      databasePerformance: {
        averageQueryTime: databaseMetrics._avg.databaseQueries || 0,
        slowQueries: 0, // Would need additional logic to determine slow queries
        totalQueries: databaseMetrics._sum.databaseQueries || 0,
      },
      cachePerformance: {
        hitRate: cacheHitRate,
        totalHits: cacheMetrics._sum.cacheHits || 0,
        totalMisses: cacheMetrics._sum.cacheMisses || 0,
      },
    };
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to generate performance report', error, ErrorCode.DATABASE_ERROR);
  }
}

/**
 * Check for performance alerts
 */
export async function checkPerformanceAlerts(): Promise<PerformanceAlert[]> {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get recent metrics
    const recentMetrics = await prisma.performanceMetrics.findMany({
      where: {
        timestamp: { gte: oneHourAgo },
      },
    });

    const alerts: PerformanceAlert[] = [];

    // Check response time alerts
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length;
    if (avgResponseTime > 1000) { // 1 second threshold
      alerts.push({
        id: `response_time_${now.getTime()}`,
        type: 'response_time',
        threshold: 1000,
        currentValue: avgResponseTime,
        message: `Average response time is ${avgResponseTime.toFixed(2)}ms, exceeding 1000ms threshold`,
        severity: avgResponseTime > 2000 ? 'critical' : avgResponseTime > 1500 ? 'high' : 'medium',
        timestamp: now,
      });
    }

    // Check error rate alerts
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / recentMetrics.length) * 100;
    if (errorRate > 5) { // 5% error rate threshold
      alerts.push({
        id: `error_rate_${now.getTime()}`,
        type: 'error_rate',
        threshold: 5,
        currentValue: errorRate,
        message: `Error rate is ${errorRate.toFixed(2)}%, exceeding 5% threshold`,
        severity: errorRate > 20 ? 'critical' : errorRate > 10 ? 'high' : 'medium',
        timestamp: now,
      });
    }

    // Check memory usage alerts
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length;
    if (avgMemoryUsage > 500 * 1024 * 1024) { // 500MB threshold
      alerts.push({
        id: `memory_usage_${now.getTime()}`,
        type: 'memory_usage',
        threshold: 500 * 1024 * 1024,
        currentValue: avgMemoryUsage,
        message: `Average memory usage is ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB, exceeding 500MB threshold`,
        severity: avgMemoryUsage > 1000 * 1024 * 1024 ? 'critical' : 'high',
        timestamp: now,
      });
    }

    return alerts;
  } catch (error) {
    console.error('Failed to check performance alerts:', error);
    return [];
  }
}

/**
 * Get system resource usage
 */
export function getSystemResourceUsage(): {
  memory: NodeJS.MemoryUsage;
  cpu: number;
  uptime: number;
} {
  const memory = process.memoryUsage();
  
  // Simple CPU usage calculation (this is a basic implementation)
  const cpuUsage = process.cpuUsage();
  const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
  
  return {
    memory,
    cpu: cpuPercent,
    uptime: process.uptime(),
  };
}

/**
 * Clean up old performance metrics
 */
export async function cleanupOldMetrics(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.performanceMetrics.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Failed to cleanup old performance metrics:', error);
    return 0;
  }
}

/**
 * Get real-time performance dashboard data
 */
export async function getRealtimeDashboard(): Promise<{
  currentRequests: number;
  averageResponseTime: number;
  errorRate: number;
  activeUsers: number;
  systemResources: {
    memory: NodeJS.MemoryUsage;
    cpu: number;
    uptime: number;
  };
  recentAlerts: PerformanceAlert[];
}> {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      recentMetrics,
      activeUsers,
      recentAlerts,
    ] = await Promise.all([
      prisma.performanceMetrics.findMany({
        where: {
          timestamp: { gte: fiveMinutesAgo },
        },
      }),
      prisma.performanceMetrics.findMany({
        where: {
          timestamp: { gte: fiveMinutesAgo },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      checkPerformanceAlerts(),
    ]);

    const currentRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length 
      : 0;
    const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = currentRequests > 0 ? (errorCount / currentRequests) * 100 : 0;

    return {
      currentRequests,
      averageResponseTime,
      errorRate,
      activeUsers: activeUsers.length,
      systemResources: getSystemResourceUsage(),
      recentAlerts,
    };
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get realtime dashboard data', error, ErrorCode.DATABASE_ERROR);
  }
}
