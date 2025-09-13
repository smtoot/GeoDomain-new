import { cacheManager, CACHE_TTL } from './cache';
import { cacheUtils } from './cache-utils';

// Wholesale-specific cache keys
export const WHOLESALE_CACHE_KEYS = {
  CONFIG: 'wholesale:config',
  DOMAINS: 'wholesale:domains',
  STATS: 'wholesale:stats',
  ANALYTICS: 'wholesale:analytics',
  SELLER_PERFORMANCE: 'wholesale:seller-performance',
  TOP_CATEGORIES: 'wholesale:top-categories',
  TOP_STATES: 'wholesale:top-states',
  RECENT_SALES: 'wholesale:recent-sales',
} as const;

// Cache TTL for wholesale data (in seconds)
export const WHOLESALE_CACHE_TTL = {
  CONFIG: 300, // 5 minutes
  DOMAINS: 60, // 1 minute
  STATS: 120, // 2 minutes
  ANALYTICS: 300, // 5 minutes
  SELLER_PERFORMANCE: 600, // 10 minutes
  TOP_CATEGORIES: 900, // 15 minutes
  TOP_STATES: 900, // 15 minutes
  RECENT_SALES: 60, // 1 minute
} as const;

// Wholesale cache utilities
export class WholesaleCacheManager {
  // Get wholesale configuration with caching
  static async getConfig<T>(fetchFn: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      WHOLESALE_CACHE_KEYS.CONFIG,
      fetchFn,
      WHOLESALE_CACHE_TTL.CONFIG
    );
  }

  // Get wholesale domains with caching
  static async getDomains<T>(
    filters: any,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = cacheUtils.wholesaleDomainsKey(filters);
    return cacheManager.getOrSet(
      cacheKey,
      fetchFn,
      WHOLESALE_CACHE_TTL.DOMAINS
    );
  }

  // Get wholesale statistics with caching
  static async getStats<T>(fetchFn: () => Promise<T>): Promise<T> {
    return cacheManager.getOrSet(
      WHOLESALE_CACHE_KEYS.STATS,
      fetchFn,
      WHOLESALE_CACHE_TTL.STATS
    );
  }

  // Get advanced analytics with caching
  static async getAnalytics<T>(
    timeRange: string,
    metricType: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `${WHOLESALE_CACHE_KEYS.ANALYTICS}:${timeRange}:${metricType}`;
    return cacheManager.getOrSet(
      cacheKey,
      fetchFn,
      WHOLESALE_CACHE_TTL.ANALYTICS
    );
  }

  // Get seller performance with caching
  static async getSellerPerformance<T>(
    timeRange: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `${WHOLESALE_CACHE_KEYS.SELLER_PERFORMANCE}:${timeRange}`;
    return cacheManager.getOrSet(
      cacheKey,
      fetchFn,
      WHOLESALE_CACHE_TTL.SELLER_PERFORMANCE
    );
  }

  // Get top categories with caching
  static async getTopCategories<T>(
    timeRange: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `${WHOLESALE_CACHE_KEYS.TOP_CATEGORIES}:${timeRange}`;
    return cacheManager.getOrSet(
      cacheKey,
      fetchFn,
      WHOLESALE_CACHE_TTL.TOP_CATEGORIES
    );
  }

  // Get top states with caching
  static async getTopStates<T>(
    timeRange: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `${WHOLESALE_CACHE_KEYS.TOP_STATES}:${timeRange}`;
    return cacheManager.getOrSet(
      cacheKey,
      fetchFn,
      WHOLESALE_CACHE_TTL.TOP_STATES
    );
  }

  // Get recent sales with caching
  static async getRecentSales<T>(
    timeRange: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = `${WHOLESALE_CACHE_KEYS.RECENT_SALES}:${timeRange}`;
    return cacheManager.getOrSet(
      cacheKey,
      fetchFn,
      WHOLESALE_CACHE_TTL.RECENT_SALES
    );
  }

  // Invalidate wholesale cache
  static async invalidateWholesaleCache(): Promise<void> {
    const keys = Object.values(WHOLESALE_CACHE_KEYS);
    await Promise.all(keys.map(key => cacheManager.delete(key)));
  }

  // Invalidate specific cache keys
  static async invalidateConfig(): Promise<void> {
    await cacheManager.delete(WHOLESALE_CACHE_KEYS.CONFIG);
  }

  static async invalidateDomains(): Promise<void> {
    // Delete all domain-related cache keys
    const pattern = `${WHOLESALE_CACHE_KEYS.DOMAINS}*`;
    await cacheManager.deletePattern(pattern);
  }

  static async invalidateStats(): Promise<void> {
    await cacheManager.delete(WHOLESALE_CACHE_KEYS.STATS);
  }

  static async invalidateAnalytics(): Promise<void> {
    const pattern = `${WHOLESALE_CACHE_KEYS.ANALYTICS}*`;
    await cacheManager.deletePattern(pattern);
  }

  // Warm up cache with frequently accessed data
  static async warmUpCache(fetchFunctions: {
    getConfig: () => Promise<any>;
    getStats: () => Promise<any>;
    getDomains: () => Promise<any>;
  }): Promise<void> {
    try {
      await Promise.all([
        this.getConfig(fetchFunctions.getConfig),
        this.getStats(fetchFunctions.getStats),
        this.getDomains({}, fetchFunctions.getDomains),
      ]);
    } catch (error) {
      console.error('Failed to warm up wholesale cache:', error);
    }
  }

  // Get cache statistics
  static async getCacheStats(): Promise<{
    hitRate: number;
    missRate: number;
    totalRequests: number;
    cacheSize: number;
  }> {
    return cacheManager.getStats();
  }
}

// Cache invalidation triggers
export const wholesaleCacheInvalidation = {
  // Invalidate when configuration changes
  onConfigUpdate: async () => {
    await WholesaleCacheManager.invalidateConfig();
  },

  // Invalidate when domains are added/updated/removed
  onDomainUpdate: async () => {
    await WholesaleCacheManager.invalidateDomains();
    await WholesaleCacheManager.invalidateStats();
    await WholesaleCacheManager.invalidateAnalytics();
  },

  // Invalidate when sales occur
  onSaleUpdate: async () => {
    await WholesaleCacheManager.invalidateStats();
    await WholesaleCacheManager.invalidateAnalytics();
  },

  // Invalidate all wholesale cache
  onWholesaleUpdate: async () => {
    await WholesaleCacheManager.invalidateWholesaleCache();
  },
};
