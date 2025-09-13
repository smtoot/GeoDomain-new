import { LRUCache } from 'lru-cache';

// Enhanced cache configuration with better performance
const cacheConfig = {
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes default TTL
  updateAgeOnGet: true, // Update age when accessed
  allowStale: true, // Allow stale items to be returned
  updateAgeOnHas: true, // Update age when checking existence
  noDisposeOnSet: true, // Don't dispose on set
  dispose: (key: string, value: any) => {
    // Cleanup function for disposed items
    if (value && typeof value.cleanup === 'function') {
      value.cleanup();
    }
  },
};

// Main cache instance
export const cache = new LRUCache<string, any>(cacheConfig);

// Cache keys for different data types
export const CACHE_KEYS = {
  DOMAINS: 'domains',
  DOMAIN: 'domain',
  INQUIRIES: 'inquiries',
  INQUIRY: 'inquiry',
  DEALS: 'deals',
  DEAL: 'deal',
  USER: 'user',
  USERS: 'users',
  DASHBOARD: 'dashboard',
  SEARCH: 'search',
  CATEGORIES: 'categories',
  STATS: 'stats',
} as const;

// Cache TTL values in milliseconds
export const CACHE_TTL = {
  SHORT: 1000 * 60 * 1, // 1 minute
  MEDIUM: 1000 * 60 * 5, // 5 minutes
  LONG: 1000 * 60 * 15, // 15 minutes
  VERY_LONG: 1000 * 60 * 60, // 1 hour
} as const;

// Enhanced cache operations
export class CacheManager {
  private static instance: CacheManager;
  private cache: LRUCache<string, any>;

  private constructor() {
    this.cache = cache;
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  // Set with TTL
  set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): void {
    this.cache.set(key, value, { ttl });
  }

  // Get with type safety
  get<T>(key: string): T | undefined {
    return this.cache.get(key) as T;
  }

  // Get or set with fallback
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fallback();
    this.set(key, value, ttl);
    return value;
  }

  // Delete single key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      max: this.cache.max,
      ttl: this.cache.ttl,
      hasDispose: 'dispose' in this.cache,
      noDisposeOnSet: this.cache.noDisposeOnSet,
    };
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    return invalidated;
  }

  // Invalidate related caches
  invalidateRelated(entity: string, id?: string): number {
    let invalidated = 0;
    
    // Invalidate entity-specific caches
    invalidated += this.invalidatePattern(entity);
    
    // Invalidate related entity caches
    if (entity === CACHE_KEYS.DOMAIN) {
      invalidated += this.invalidatePattern(CACHE_KEYS.INQUIRIES);
      invalidated += this.invalidatePattern(CACHE_KEYS.DEALS);
      invalidated += this.invalidatePattern(CACHE_KEYS.SEARCH);
    }
    
    if (entity === CACHE_KEYS.INQUIRY) {
      invalidated += this.invalidatePattern(CACHE_KEYS.DASHBOARD);
    }
    
    if (entity === CACHE_KEYS.DEAL) {
      invalidated += this.invalidatePattern(CACHE_KEYS.DASHBOARD);
    }
    
    if (entity === CACHE_KEYS.USER) {
      invalidated += this.invalidatePattern(CACHE_KEYS.DASHBOARD);
    }
    
    return invalidated;
  }

  // Warm up cache with common queries
  async warmup(): Promise<void> {
    // This will be implemented in the database layer
    }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();

// Utility functions for common cache operations
export const cacheUtils = {
  // Generate cache key for domain
  domainKey: (id: string) => `${CACHE_KEYS.DOMAIN}:${id}`,
  
  // Generate cache key for domain list
  domainListKey: (filters: any) => `${CACHE_KEYS.DOMAINS}:${JSON.stringify(filters)}`,
  
  // Generate cache key for inquiry
  inquiryKey: (id: string) => `${CACHE_KEYS.INQUIRY}:${id}`,
  
  // Generate cache key for inquiry list
  inquiryListKey: (filters: any) => `${CACHE_KEYS.INQUIRIES}:${JSON.stringify(filters)}`,
  
  // Generate cache key for deal
  dealKey: (id: string) => `${CACHE_KEYS.DEAL}:${id}`,
  
  // Generate cache key for user
  userKey: (id: string) => `${CACHE_KEYS.USER}:${id}`,
  
  // Generate cache key for dashboard
  dashboardKey: (userId: string) => `${CACHE_KEYS.DASHBOARD}:${userId}`,
  
  // Generate cache key for search
  searchKey: (query: string, filters: any) => 
    `${CACHE_KEYS.SEARCH}:${query}:${JSON.stringify(filters)}`,
};

// Cache middleware for tRPC procedures
export const withCache = <T extends any[], R>(
  procedure: any,
  keyGenerator: (...args: any[]) => string,
  ttl: number = CACHE_TTL.MEDIUM
) => {
  return procedure.use(async ({ next, input, ctx, ...rest }: any) => {
    const cacheKey = keyGenerator(input, ctx, ...rest);
    
    // Try to get from cache first
    const cached = cacheManager.get<R>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
    
    // Execute procedure
    const result = await next();
    
    // Cache the result
    cacheManager.set(cacheKey, result, ttl);
    
    return result;
  });
};

// Cache invalidation middleware
export const withCacheInvalidation = (
  procedure: any,
  entity: string,
  idExtractor?: (input: any) => string
) => {
  return procedure.use(async ({ next, input, ctx, ...rest }: any) => {
    const result = await next();
    
    // Invalidate related caches
    if (idExtractor) {
      const id = idExtractor(input);
      if (id) {
        cacheManager.invalidateRelated(entity, id);
      }
    } else {
      cacheManager.invalidateRelated(entity);
    }
    
    return result;
  });
};
