import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the Upstash Redis client
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  flushall: jest.fn(),
};

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => mockRedis),
}));

describe('Redis Cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Cache Operations', () => {
    it('should get cached value', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      const mockValue = { data: 'test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(mockValue));
      
      const result = await cache.get('test-key');
      
      expect(result).toEqual(mockValue);
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null for non-existent key', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      mockRedis.get.mockResolvedValue(null);
      
      const result = await cache.get('non-existent-key');
      
      expect(result).toBeNull();
    });

    it('should set cached value with TTL', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      const testValue = { data: 'test' };
      mockRedis.setex.mockResolvedValue('OK');
      
      await cache.set('test-key', testValue, 300);
      
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testValue));
    });

    it('should delete cached value', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      mockRedis.del.mockResolvedValue(1);
      
      const result = await cache.del('test-key');
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('test-key');
    });

    it('should return false when delete fails', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      mockRedis.del.mockResolvedValue(0);
      
      const result = await cache.del('non-existent-key');
      
      expect(result).toBe(false);
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate domain search cache keys', async () => {
      const { cacheKeys } = await import('@/lib/cache/redis');
      
      const key = cacheKeys.domainSearch('tech', { category: 'Technology' });
      
      expect(key).toContain('domain:search:');
      expect(key).toContain('tech');
      expect(key).toContain('Technology');
    });

    it('should generate user cache keys', async () => {
      const { cacheKeys } = await import('@/lib/cache/redis');
      
      const key = cacheKeys.user('user-123');
      
      expect(key).toBe('user:user-123');
    });

    it('should generate domain cache keys', async () => {
      const { cacheKeys } = await import('@/lib/cache/redis');
      
      const key = cacheKeys.domain('domain-123');
      
      expect(key).toBe('domain:domain-123');
    });

    it('should generate inquiry cache keys', async () => {
      const { cacheKeys } = await import('@/lib/cache/redis');
      
      const key = cacheKeys.inquiry('inquiry-123');
      
      expect(key).toBe('inquiry:inquiry-123');
    });
  });

  describe('Cache Utilities', () => {
    it('should check if key exists', async () => {
      const { cacheUtils } = await import('@/lib/cache/redis');
      
      mockRedis.exists.mockResolvedValue(1);
      
      const exists = await cacheUtils.exists('test-key');
      
      expect(exists).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('test-key');
    });

    it('should set expiration for key', async () => {
      const { cacheUtils } = await import('@/lib/cache/redis');
      
      mockRedis.expire.mockResolvedValue(1);
      
      const result = await cacheUtils.expire('test-key', 300);
      
      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('test-key', 300);
    });

    it('should get TTL for key', async () => {
      const { cacheUtils } = await import('@/lib/cache/redis');
      
      mockRedis.ttl.mockResolvedValue(250);
      
      const ttl = await cacheUtils.ttl('test-key');
      
      expect(ttl).toBe(250);
      expect(mockRedis.ttl).toHaveBeenCalledWith('test-key');
    });

    it('should clear all cache', async () => {
      const { cacheUtils } = await import('@/lib/cache/redis');
      
      mockRedis.flushall.mockResolvedValue('OK');
      
      const result = await cacheUtils.clear();
      
      expect(result).toBe(true);
      expect(mockRedis.flushall).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));
      
      const result = await cache.get('test-key');
      
      expect(result).toBeNull();
    });

    it('should handle Redis set errors gracefully', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      mockRedis.setex.mockRejectedValue(new Error('Redis set failed'));
      
      const result = await cache.set('test-key', { data: 'test' }, 300);
      
      expect(result).toBe(false);
    });

    it('should handle Redis delete errors gracefully', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      mockRedis.del.mockRejectedValue(new Error('Redis delete failed'));
      
      const result = await cache.del('test-key');
      
      expect(result).toBe(false);
    });
  });

  describe('Data Serialization', () => {
    it('should handle complex objects', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      const complexObject = {
        user: { id: '123', name: 'John' },
        domains: [{ id: '1', name: 'example.com' }],
        metadata: { created: new Date(), active: true }
      };
      
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(complexObject));
      
      await cache.set('complex-key', complexObject, 300);
      const result = await cache.get('complex-key');
      
      expect(result).toEqual(complexObject);
    });

    it('should handle arrays', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      const array = [1, 2, 3, { nested: 'value' }];
      
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(array));
      
      await cache.set('array-key', array, 300);
      const result = await cache.get('array-key');
      
      expect(result).toEqual(array);
    });

    it('should handle primitive values', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      const primitive = 'simple string';
      
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify(primitive));
      
      await cache.set('primitive-key', primitive, 300);
      const result = await cache.get('primitive-key');
      
      expect(result).toBe(primitive);
    });
  });

  describe('Cache Performance', () => {
    it('should use default TTL when not specified', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      const testValue = { data: 'test' };
      mockRedis.setex.mockResolvedValue('OK');
      
      await cache.set('test-key', testValue);
      
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 300, JSON.stringify(testValue));
    });

    it('should handle concurrent operations', async () => {
      const { cache } = await import('@/lib/cache/redis');
      
      mockRedis.get.mockResolvedValue(JSON.stringify({ data: 'test' }));
      
      const promises = Array.from({ length: 10 }, (_, i) => 
        cache.get(`key-${i}`)
      );
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(10);
      expect(mockRedis.get).toHaveBeenCalledTimes(10);
    });
  });
});
