import { recordPerformanceMetrics } from './advanced-monitoring';
import { getSystemResourceUsage } from './advanced-monitoring';

export interface PerformanceContext {
  startTime: number;
  endpoint: string;
  method: string;
  userId?: string;
  apiKeyId?: string;
  databaseQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Create performance monitoring middleware
 */
export function createPerformanceMiddleware() {
  return async ({ ctx, next, path, type }: any) => {
    const startTime = Date.now();
    const systemResources = getSystemResourceUsage();
    
    const performanceContext: PerformanceContext = {
      startTime,
      endpoint: path,
      method: type,
      userId: ctx.session?.user?.id || ctx.apiKey?.userId,
      apiKeyId: ctx.apiKey?.apiKeyId,
      databaseQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    // Track database queries (this would need to be integrated with Prisma)
    const originalQuery = ctx.prisma?.$queryRaw;
    if (originalQuery) {
      ctx.prisma.$queryRaw = async (...args: any[]) => {
        performanceContext.databaseQueries++;
        return originalQuery.apply(ctx.prisma, args);
      };
    }

    // Track cache operations (this would need to be integrated with cache system)
    const originalCacheGet = ctx.cache?.get;
    if (originalCacheGet) {
      ctx.cache.get = async (...args: any[]) => {
        const result = await originalCacheGet.apply(ctx.cache, args);
        if (result !== null) {
          performanceContext.cacheHits++;
        } else {
          performanceContext.cacheMisses++;
        }
        return result;
      };
    }

    try {
      const result = await next();
      
      // Record successful request metrics
      const responseTime = Date.now() - startTime;
      const finalSystemResources = getSystemResourceUsage();
      
      await recordPerformanceMetrics({
        endpoint: performanceContext.endpoint,
        method: performanceContext.method,
        responseTime,
        statusCode: 200,
        timestamp: new Date(),
        userId: performanceContext.userId,
        apiKeyId: performanceContext.apiKeyId,
        memoryUsage: finalSystemResources.memory.heapUsed,
        cpuUsage: finalSystemResources.cpu,
        databaseQueries: performanceContext.databaseQueries,
        cacheHits: performanceContext.cacheHits,
        cacheMisses: performanceContext.cacheMisses,
      });

      return result;
    } catch (error) {
      // Record error metrics
      const responseTime = Date.now() - startTime;
      const finalSystemResources = getSystemResourceUsage();
      
      let statusCode = 500;
      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'UNAUTHORIZED':
            statusCode = 401;
            break;
          case 'FORBIDDEN':
            statusCode = 403;
            break;
          case 'NOT_FOUND':
            statusCode = 404;
            break;
          case 'TOO_MANY_REQUESTS':
            statusCode = 429;
            break;
          case 'BAD_REQUEST':
            statusCode = 400;
            break;
          default:
            statusCode = 500;
        }
      }

      await recordPerformanceMetrics({
        endpoint: performanceContext.endpoint,
        method: performanceContext.method,
        responseTime,
        statusCode,
        timestamp: new Date(),
        userId: performanceContext.userId,
        apiKeyId: performanceContext.apiKeyId,
        memoryUsage: finalSystemResources.memory.heapUsed,
        cpuUsage: finalSystemResources.cpu,
        databaseQueries: performanceContext.databaseQueries,
        cacheHits: performanceContext.cacheHits,
        cacheMisses: performanceContext.cacheMisses,
      });

      throw error;
    }
  };
}

/**
 * Create database query monitoring middleware
 */
export function createDatabaseMonitoringMiddleware() {
  return async ({ ctx, next }: any) => {
    const queryCount = { count: 0 };
    const slowQueries: Array<{ query: string; duration: number }> = [];

    // Wrap Prisma client to monitor queries
    if (ctx.prisma) {
      const originalQuery = ctx.prisma.$queryRaw;
      const originalExecute = ctx.prisma.$executeRaw;

      ctx.prisma.$queryRaw = async (...args: any[]) => {
        const startTime = Date.now();
        queryCount.count++;
        
        try {
          const result = await originalQuery.apply(ctx.prisma, args);
          const duration = Date.now() - startTime;
          
          if (duration > 1000) { // Log slow queries (>1 second)
            slowQueries.push({
              query: args[0] || 'Unknown query',
              duration,
            });
          }
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`Database query error after ${duration}ms:`, error);
          throw error;
        }
      };

      ctx.prisma.$executeRaw = async (...args: any[]) => {
        const startTime = Date.now();
        queryCount.count++;
        
        try {
          const result = await originalExecute.apply(ctx.prisma, args);
          const duration = Date.now() - startTime;
          
          if (duration > 1000) { // Log slow queries (>1 second)
            slowQueries.push({
              query: args[0] || 'Unknown query',
              duration,
            });
          }
          
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`Database execute error after ${duration}ms:`, error);
          throw error;
        }
      };
    }

    const result = await next();

    // Log slow queries if any
    if (slowQueries.length > 0) {
      console.warn(`Slow queries detected:`, slowQueries);
    }

    // Add query count to context for performance recording
    ctx.databaseQueries = queryCount.count;

    return result;
  };
}

/**
 * Create cache monitoring middleware
 */
export function createCacheMonitoringMiddleware() {
  return async ({ ctx, next }: any) => {
    const cacheStats = { hits: 0, misses: 0 };

    // Wrap cache operations to monitor hits/misses
    if (ctx.cache) {
      const originalGet = ctx.cache.get;
      const originalSet = ctx.cache.set;

      ctx.cache.get = async (...args: any[]) => {
        const result = await originalGet.apply(ctx.cache, args);
        if (result !== null) {
          cacheStats.hits++;
        } else {
          cacheStats.misses++;
        }
        return result;
      };

      ctx.cache.set = async (...args: any[]) => {
        return originalSet.apply(ctx.cache, args);
      };
    }

    const result = await next();

    // Add cache stats to context for performance recording
    ctx.cacheHits = cacheStats.hits;
    ctx.cacheMisses = cacheStats.misses;

    return result;
  };
}

/**
 * Create comprehensive performance monitoring middleware
 */
export function createComprehensivePerformanceMiddleware() {
  return async ({ ctx, next, path, type }: any) => {
    const startTime = Date.now();
    const initialMemory = process.memoryUsage();
    
    // Initialize performance tracking
    const performanceData = {
      startTime,
      endpoint: path,
      method: type,
      userId: ctx.session?.user?.id || ctx.apiKey?.userId,
      apiKeyId: ctx.apiKey?.apiKeyId,
      databaseQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      memoryStart: initialMemory.heapUsed,
    };

    try {
      const result = await next();
      
      // Calculate performance metrics
      const endTime = Date.now();
      const finalMemory = process.memoryUsage();
      const responseTime = endTime - startTime;
      const memoryDelta = finalMemory.heapUsed - performanceData.memoryStart;

      // Log performance metrics
      console.log(`Performance: ${path} - ${responseTime}ms, ${performanceData.databaseQueries} queries, ${performanceData.cacheHits} cache hits, ${memoryDelta} bytes memory delta`);

      return result;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.error(`Performance Error: ${path} - ${responseTime}ms, ${performanceData.databaseQueries} queries, ${performanceData.cacheHits} cache hits`);
      
      throw error;
    }
  };
}
