import Redis from 'ioredis';

// Enhanced cache strategy configuration
export const ADVANCED_CACHE_CONFIG = {
  // Predictive caching
  PREDICTIVE: {
    ENABLED: true,
    CONFIDENCE_THRESHOLD: 0.7,
    LOOKBACK_WINDOW: 24 * 60 * 60 * 1000, // 24 hours
    PATTERN_DETECTION: {
      ENABLED: true,
      MIN_OCCURRENCES: 3,
      TIME_WINDOW: 60 * 60 * 1000 // 1 hour
    }
  },
  
  // Cache warming
  WARMING: {
    ENABLED: true,
    BATCH_SIZE: 50,
    CONCURRENT_LIMIT: 10,
    PRIORITY_LEVELS: {
      HIGH: { ttl: 3600, preload: true },
      MEDIUM: { ttl: 1800, preload: false },
      LOW: { ttl: 900, preload: false }
    }
  },
  
  // Intelligent invalidation
  INVALIDATION: {
    ENABLED: true,
    PATTERN_MATCHING: true,
    DEPENDENCY_TRACKING: true,
    GRACEFUL_DEGRADATION: true,
    BATCH_INVALIDATION: true
  }
};

// Enhanced cache strategy interface
export interface AdvancedCacheStrategy {
  get<T>(client: Redis, key: string): Promise<T | null>;
  set<T>(client: Redis, key: string, value: T, ttl?: number): Promise<boolean>;
  mget<T>(client: Redis, keys: string[]): Promise<(T | null)[]>;
  mset<T>(client: Redis, entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean>;
  deletePattern(client: Redis, pattern: string): Promise<number>;
  warmCache<T>(client: Redis, keys: string[], priority: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<void>;
  predictAndCache<T>(client: Redis, key: string, accessPattern: string[]): Promise<void>;
}

// Standard cache strategy with enhanced features
export class StandardCacheStrategy implements AdvancedCacheStrategy {
  async get<T>(client: Redis, key: string): Promise<T | null> {
    try {
      const value = await client.get(key);
      if (value === null) return null;
      
      // Track access pattern for predictive caching
      if (ADVANCED_CACHE_CONFIG.PREDICTIVE.ENABLED) {
        await this.trackAccessPattern(key);
      }
      
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  async set<T>(client: Redis, key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await client.setex(key, ttl, serialized);
      } else {
        await client.set(key, serialized);
      }
      
      // Track key dependencies
      if (ADVANCED_CACHE_CONFIG.INVALIDATION.DEPENDENCY_TRACKING) {
        await this.trackDependencies(key, value);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async mget<T>(client: Redis, keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await client.mget(...keys);
      return values.map(value => value ? JSON.parse(value) : null);
    } catch (error) {
      return keys.map(() => null);
    }
  }

  async mset<T>(client: Redis, entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = client.pipeline();
      
      for (const { key, value, ttl } of entries) {
        const serialized = JSON.stringify(value);
        if (ttl) {
          pipeline.setex(key, ttl, serialized);
        } else {
          pipeline.set(key, serialized);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(client: Redis, key: string): Promise<boolean> {
    try {
      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      return false;
    }
  }

  async deletePattern(client: Redis, pattern: string): Promise<number> {
    try {
      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;

      if (ADVANCED_CACHE_CONFIG.INVALIDATION.BATCH_INVALIDATION) {
        // Delete in batches to avoid blocking
        const batchSize = 100;
        let deletedCount = 0;
        
        for (let i = 0; i < keys.length; i += batchSize) {
          const batch = keys.slice(i, i + batchSize);
          const deleted = await client.del(...batch);
          deletedCount += deleted;
        }
        
        return deletedCount;
      } else {
        return await client.del(...keys);
      }
    } catch (error) {
      return 0;
    }
  }

  async warmCache<T>(client: Redis, keys: string[], priority: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<void> {
    if (!ADVANCED_CACHE_CONFIG.WARMING.ENABLED) return;

    const config = ADVANCED_CACHE_CONFIG.WARMING.PRIORITY_LEVELS[priority];
    
    try {
      // Process keys in batches
      for (let i = 0; i < keys.length; i += ADVANCED_CACHE_CONFIG.WARMING.BATCH_SIZE) {
        const batch = keys.slice(i, i + ADVANCED_CACHE_CONFIG.WARMING.BATCH_SIZE);
        
        // In a real implementation, you would fetch data for these keys
        // For now, we'll just mark them as warmed
        const pipeline = client.pipeline();
        
        for (const key of batch) {
          pipeline.setex(`warmed:${key}`, config.ttl, 'true');
        }
        
        await pipeline.exec();
      }
    } catch (error) {
      }
  }

  async predictAndCache<T>(client: Redis, key: string, accessPattern: string[]): Promise<void> {
    if (!ADVANCED_CACHE_CONFIG.PREDICTIVE.ENABLED) return;

    try {
      // Analyze access pattern and predict next likely access
      const patternKey = `pattern:${key}`;
      const patternData = await client.get(patternKey);
      
      if (patternData) {
        const pattern = JSON.parse(patternData);
        const confidence = this.calculateConfidence(accessPattern, pattern.history);
        
        if (confidence > ADVANCED_CACHE_CONFIG.PREDICTIVE.CONFIDENCE_THRESHOLD) {
          // Pre-warm related cache entries
          await this.warmCache(client, pattern.relatedKeys, 'MEDIUM');
        }
      }
      
      // Update access pattern
      await this.updateAccessPattern(key, accessPattern);
    } catch (error) {
      }
  }

  private async trackAccessPattern(key: string): Promise<void> {
    try {
      const patternKey = `access:${key}`;
      const now = Date.now();
      
      // Track access timestamp
      await this.redis?.zadd(patternKey, now, now.toString());
      
      // Keep only recent accesses
      const cutoff = now - ADVANCED_CACHE_CONFIG.PREDICTIVE.LOOKBACK_WINDOW;
      await this.redis?.zremrangebyscore(patternKey, 0, cutoff);
    } catch (error) {
      // Silently fail for pattern tracking
    }
  }

  private async updateAccessPattern(key: string, accessPattern: string[]): Promise<void> {
    try {
      const patternKey = `pattern:${key}`;
      const now = Date.now();
      
      const patternData = {
        key,
        history: accessPattern,
        lastUpdated: now,
        accessCount: 1
      };
      
      await this.redis?.setex(patternKey, 3600, JSON.stringify(patternData));
    } catch (error) {
      // Silently fail for pattern tracking
    }
  }

  private calculateConfidence(current: string[], history: string[]): number {
    if (history.length === 0) return 0;
    
    const matches = current.filter(item => history.includes(item));
    return matches.length / Math.max(current.length, history.length);
  }

  private async trackDependencies(key: string, value: any): Promise<void> {
    try {
      // Extract potential dependencies from the value
      const dependencies = this.extractDependencies(value);
      
      if (dependencies.length > 0) {
        const depKey = `deps:${key}`;
        await this.redis?.setex(depKey, 3600, JSON.stringify(dependencies));
      }
    } catch (error) {
      // Silently fail for dependency tracking
    }
  }

  private extractDependencies(value: any): string[] {
    const dependencies: string[] = [];
    
    if (typeof value === 'object' && value !== null) {
      if (value.id) dependencies.push(`id:${value.id}`);
      if (value.userId) dependencies.push(`user:${value.userId}`);
      if (value.domainId) dependencies.push(`domain:${value.domainId}`);
      if (value.category) dependencies.push(`category:${value.category}`);
    }
    
    return dependencies;
  }

  private redis?: Redis;
  
  setRedisClient(client: Redis): void {
    this.redis = client;
  }
}

// Compressed cache strategy with enhanced features
export class CompressedCacheStrategy implements AdvancedCacheStrategy {
  async get<T>(client: Redis, key: string): Promise<T | null> {
    try {
      const value = await client.get(key);
      if (value === null) return null;
      
      // Decompress the value
      const decompressed = this.decompress(value);
      return JSON.parse(decompressed);
    } catch (error) {
      return null;
    }
  }

  async set<T>(client: Redis, key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const serialized = JSON.stringify(value);
      const compressed = this.compress(serialized);
      
      if (ttl) {
        await client.setex(key, ttl, compressed);
      } else {
        await client.set(key, compressed);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async mget<T>(client: Redis, keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await client.mget(...keys);
      return values.map(value => {
        if (!value) return null;
        try {
          const decompressed = this.decompress(value);
          return JSON.parse(decompressed);
        } catch {
          return null;
        }
      });
    } catch (error) {
      return keys.map(() => null);
    }
  }

  async mset<T>(client: Redis, entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    try {
      const pipeline = client.pipeline();
      
      for (const { key, value, ttl } of entries) {
        const serialized = JSON.stringify(value);
        const compressed = this.compress(serialized);
        
        if (ttl) {
          pipeline.setex(key, ttl, compressed);
        } else {
          pipeline.set(key, compressed);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(client: Redis, key: string): Promise<boolean> {
    try {
      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      return false;
    }
  }

  async deletePattern(client: Redis, pattern: string): Promise<number> {
    try {
      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await client.del(...keys);
    } catch (error) {
      return 0;
    }
  }

  async warmCache<T>(client: Redis, keys: string[], priority: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<void> {
    // Compression strategy doesn't affect warming
    return;
  }

  async predictAndCache<T>(client: Redis, key: string, accessPattern: string[]): Promise<void> {
    // Compression strategy doesn't affect predictive caching
    return;
  }

  private compress(data: string): string {
    // Simple base64 compression for demonstration
    // In production, use proper compression like gzip or lz4
    return Buffer.from(data).toString('base64');
  }

  private decompress(data: string): string {
    // Simple base64 decompression for demonstration
    return Buffer.from(data, 'base64').toString('utf-8');
  }
}

// Enhanced cache strategy factory
export class EnhancedCacheStrategyFactory {
  static create(strategy: 'standard' | 'compressed' | 'predictive'): AdvancedCacheStrategy {
    switch (strategy) {
      case 'compressed':
        return new CompressedCacheStrategy();
      case 'predictive':
        return new StandardCacheStrategy(); // Standard strategy with predictive features
      case 'standard':
      default:
        return new StandardCacheStrategy();
    }
  }

  static createWithConfig(config: {
    strategy: 'standard' | 'compressed' | 'predictive';
    compression?: boolean;
    predictive?: boolean;
  }): AdvancedCacheStrategy {
    if (config.compression) {
      return new CompressedCacheStrategy();
    }
    
    if (config.predictive) {
      return new StandardCacheStrategy();
    }
    
    return new StandardCacheStrategy();
  }
}

// Backward compatibility interfaces and classes
export interface CacheStrategy {
  get<T>(client: Redis, key: string): Promise<T | null>;
  set<T>(client: Redis, key: string, value: T, ttl?: number): Promise<boolean>;
  delete(client: Redis, key: string): Promise<boolean>;
  mget<T>(client: Redis, keys: string[]): Promise<(T | null)[]>;
  mset<T>(client: Redis, entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean>;
  deletePattern(client: Redis, pattern: string): Promise<number>;
}

// Backward compatibility class
export class CacheStrategyFactory {
  static create(strategy: 'standard' | 'compressed' = 'standard'): CacheStrategy {
    switch (strategy) {
      case 'compressed':
        return new CompressedCacheStrategy();
      case 'standard':
      default:
        return new StandardCacheStrategy();
    }
  }
}

