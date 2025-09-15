import { Redis } from "@upstash/redis";

// Initialize Redis connection
const redis = Redis.fromEnv();

// Cache configuration
const CACHE_CONFIG = {
  // Default TTL in seconds
  DEFAULT_TTL: 300, // 5 minutes
  
  // Specific TTL configurations
  DOMAIN_SEARCH: 300, // 5 minutes
  USER_PROFILE: 600, // 10 minutes
  API_RESPONSE: 60, // 1 minute
  STATIC_DATA: 3600, // 1 hour
  SESSION_DATA: 1800, // 30 minutes
};

// Cache key prefixes
const CACHE_PREFIXES = {
  DOMAIN: "domain:",
  USER: "user:",
  SEARCH: "search:",
  API: "api:",
  SESSION: "session:",
  STATIC: "static:",
};

// Main cache utility class
export class Cache {
  private redis: Redis;
  private defaultTTL: number;

  constructor(redis: Redis, defaultTTL: number = CACHE_CONFIG.DEFAULT_TTL) {
    this.redis = redis;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) return null;
      
      // Handle different data types
      if (typeof value === "string") {
        try {
          return JSON.parse(value) as T;
        } catch {
          return value as T;
        }
      }
      
      return value as T;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
      const cacheTTL = ttl || this.defaultTTL;
      
      await this.redis.setex(key, cacheTTL, serializedValue);
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await this.redis.mget(...keys);
      return values.map(value => {
        if (value === null) return null;
        if (typeof value === "string") {
          try {
            return JSON.parse(value) as T;
          } catch {
            return value as T;
          }
        }
        return value as T;
      });
    } catch (error) {
      console.error("Cache mget error:", error);
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset(keyValuePairs: Record<string, any>, ttl?: number): Promise<boolean> {
    try {
      const serializedPairs: Record<string, string> = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = typeof value === "string" ? value : JSON.stringify(value);
      }
      
      await this.redis.mset(serializedPairs);
      
      // Set TTL for all keys
      if (ttl) {
        const pipeline = this.redis.pipeline();
        for (const key of Object.keys(keyValuePairs)) {
          pipeline.expire(key, ttl);
        }
        await pipeline.exec();
      }
      
      return true;
    } catch (error) {
      console.error("Cache mset error:", error);
      return false;
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async incr(key: string, increment: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(key, increment);
    } catch (error) {
      console.error("Cache incr error:", error);
      return 0;
    }
  }

  /**
   * Set expiration for a key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      console.error("Cache expire error:", error);
      return false;
    }
  }

  /**
   * Get TTL for a key
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error("Cache ttl error:", error);
      return -1;
    }
  }
}

// Create cache instances for different use cases
export const cache = new Cache(redis, CACHE_CONFIG.DEFAULT_TTL);
export const domainCache = new Cache(redis, CACHE_CONFIG.DOMAIN_SEARCH);
export const userCache = new Cache(redis, CACHE_CONFIG.USER_PROFILE);
export const apiCache = new Cache(redis, CACHE_CONFIG.API_RESPONSE);
export const staticCache = new Cache(redis, CACHE_CONFIG.STATIC_DATA);
export const sessionCache = new Cache(redis, CACHE_CONFIG.SESSION_DATA);

// Cache key generators
export const cacheKeys = {
  domain: (id: string) => `${CACHE_PREFIXES.DOMAIN}${id}`,
  domainSearch: (query: string, filters?: any) => 
    `${CACHE_PREFIXES.SEARCH}domain:${query}:${JSON.stringify(filters || {})}`,
  user: (id: string) => `${CACHE_PREFIXES.USER}${id}`,
  userProfile: (id: string) => `${CACHE_PREFIXES.USER}profile:${id}`,
  apiResponse: (endpoint: string, params?: any) => 
    `${CACHE_PREFIXES.API}${endpoint}:${JSON.stringify(params || {})}`,
  session: (id: string) => `${CACHE_PREFIXES.SESSION}${id}`,
  static: (key: string) => `${CACHE_PREFIXES.STATIC}${key}`,
};

// Cache utility functions
export const cacheUtils = {
  /**
   * Get or set cache value
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    cacheInstance: Cache = cache
  ): Promise<T> {
    const cached = await cacheInstance.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    await cacheInstance.set(key, value, ttl);
    return value;
  },

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string, cacheInstance: Cache = cache): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }
  },

  /**
   * Clear all cache
   */
  async clearAll(cacheInstance: Cache = cache): Promise<void> {
    try {
      await redis.flushdb();
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      const info = await redis.info("memory");
      const keyspace = await redis.info("keyspace");
      return { info, keyspace };
    } catch (error) {
      console.error("Cache stats error:", error);
      return null;
    }
  },
};

// Cache decorator for functions
export function cached(ttl: number = CACHE_CONFIG.DEFAULT_TTL, cacheInstance: Cache = cache) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = `${propertyName}:${JSON.stringify(args)}`;
      
      const cached = await cacheInstance.get(key);
      if (cached !== null) {
        return cached;
      }

      const result = await method.apply(this, args);
      await cacheInstance.set(key, result, ttl);
      return result;
    };
  };
}

// Export all cache utilities
export default {
  cache,
  domainCache,
  userCache,
  apiCache,
  staticCache,
  sessionCache,
  cacheKeys,
  cacheUtils,
  CACHE_CONFIG,
  CACHE_PREFIXES,
};
