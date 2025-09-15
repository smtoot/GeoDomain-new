import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    domain: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('@/lib/cache/redis', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  cacheKeys: {
    domainSearch: jest.fn((query: string, filters: any) => 
      `domain:search:${JSON.stringify({ query, filters })}`
    ),
  },
}));

jest.mock('@/lib/security/sanitization', () => ({
  sanitization: {
    searchQuery: jest.fn((query: string) => query),
    input: jest.fn((input: any) => input),
  },
}));

jest.mock('@/lib/errors/api-errors', () => ({
  createDatabaseError: jest.fn().mockImplementation((message: string) => ({
    code: 'INTERNAL_SERVER_ERROR',
    message,
  })),
}));

describe('Domains Router Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should search domains with caching and sanitization', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');
      const { sanitization } = await import('@/lib/security/sanitization');

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock database queries
      (prisma.domain.count as jest.Mock).mockResolvedValue(25);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'domain-1',
          name: 'example.com',
          price: 15000,
          description: 'Great domain',
          owner: { id: 'user-1', name: 'John Doe' },
          analytics: [{ views: 100, inquiries: 5 }],
        },
      ]);

      (cache.set as jest.Mock).mockResolvedValue(true);

      const input = {
        query: 'example',
        filters: { category: 'Technology' },
        limit: 10,
        offset: 0,
      };

      const result = await domainsRouter.search.query(input);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('example.com');
      expect(result.pagination).toBeDefined();
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.offset).toBe(0);

      // Verify sanitization was called
      expect(sanitization.searchQuery).toHaveBeenCalledWith('example');
      expect(sanitization.input).toHaveBeenCalledWith({ category: 'Technology' });

      // Verify caching was used
      expect(cache.get).toHaveBeenCalled();
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return cached search results when available', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { cache } = await import('@/lib/cache/redis');

      const cachedData = {
        success: true,
        data: [
          {
            id: 'domain-1',
            name: 'cached.com',
            price: 20000,
            description: 'Cached domain',
            owner: { id: 'user-1', name: 'Jane Doe' },
            analytics: [{ views: 200, inquiries: 10 }],
          },
        ],
        pagination: {
          limit: 10,
          offset: 0,
          hasMore: false,
        },
      };

      (cache.get as jest.Mock).mockResolvedValue(cachedData);

      const input = {
        query: 'cached',
        limit: 10,
        offset: 0,
      };

      const result = await domainsRouter.search.query(input);

      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalled();
    });

    it('should handle search with filters', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.domain.count as jest.Mock).mockResolvedValue(5);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);
      (cache.set as jest.Mock).mockResolvedValue(true);

      const input = {
        query: 'tech',
        filters: {
          category: 'Technology',
          geographicScope: 'National',
          minPrice: 10000,
          maxPrice: 50000,
        },
        limit: 20,
        offset: 0,
      };

      const result = await domainsRouter.search.query(input);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.pagination.limit).toBe(20);
    });

    it('should handle empty search results', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.domain.count as jest.Mock).mockResolvedValue(0);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);
      (cache.set as jest.Mock).mockResolvedValue(true);

      const input = {
        query: 'nonexistent',
        limit: 10,
        offset: 0,
      };

      const result = await domainsRouter.search.query(input);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.hasMore).toBe(false);
    });

    it('should handle database errors gracefully', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.domain.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const input = {
        query: 'test',
        limit: 10,
        offset: 0,
      };

      await expect(domainsRouter.search.query(input)).rejects.toThrow();
    });

    it('should use correct cache key for search', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { cache, cacheKeys } = await import('@/lib/cache/redis');

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(true);

      const input = {
        query: 'test',
        filters: { category: 'Tech' },
        limit: 10,
        offset: 0,
      };

      await domainsRouter.search.query(input);

      expect(cacheKeys.domainSearch).toHaveBeenCalledWith('test', { category: 'Tech' });
    });

    it('should set cache with correct TTL', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      (cache.get as jest.Mock).mockResolvedValue(null);
      (prisma.domain.count as jest.Mock).mockResolvedValue(0);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);
      (cache.set as jest.Mock).mockResolvedValue(true);

      const input = {
        query: 'test',
        limit: 10,
        offset: 0,
      };

      await domainsRouter.search.query(input);

      expect(cache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        300 // 5 minutes TTL
      );
    });
  });

  describe('test', () => {
    it('should return test data with domain statistics', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');

      (prisma.domain.count as jest.Mock).mockResolvedValue(100);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'domain-1',
          name: 'test.com',
          status: 'VERIFIED',
          price: 15000,
        },
      ]);

      const result = await domainsRouter.test.query();

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.totalDomains).toBe(100);
      expect(result.data.sampleDomains).toHaveLength(1);
      expect(result.data.sampleDomains[0].name).toBe('test.com');
    });

    it('should handle test endpoint database errors', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');

      (prisma.domain.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const result = await domainsRouter.test.query();

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('getById', () => {
    it('should return domain by ID with owner and analytics', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');

      const mockDomain = {
        id: 'domain-123',
        name: 'example.com',
        price: 25000,
        description: 'Premium domain',
        status: 'VERIFIED',
        owner: {
          id: 'user-456',
          name: 'Domain Owner',
          company: 'Domain Co',
        },
        analytics: [
          { views: 500, inquiries: 25, date: new Date() },
        ],
        inquiries: [
          { id: 'inquiry-1', status: 'OPEN', message: 'Interested in this domain' },
        ],
      };

      (prisma.domain.findFirst as jest.Mock).mockResolvedValue(mockDomain);

      const input = { id: 'domain-123' };
      const result = await domainsRouter.getById.query(input);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data.id).toBe('domain-123');
      expect(result.data.name).toBe('example.com');
      expect(result.data.owner).toBeDefined();
      expect(result.data.analytics).toBeDefined();
      expect(result.data.inquiries).toBeDefined();
    });

    it('should return not found for non-existent domain', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { prisma } = await import('@/lib/prisma');

      (prisma.domain.findFirst as jest.Mock).mockResolvedValue(null);

      const input = { id: 'non-existent' };
      const result = await domainsRouter.getById.query(input);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Domain not found');
    });
  });

  describe('Sanitization Integration', () => {
    it('should sanitize search query input', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { sanitization } = await import('@/lib/security/sanitization');

      const maliciousQuery = '<script>alert("xss")</script>test';
      const sanitizedQuery = 'test';

      (sanitization.searchQuery as jest.Mock).mockReturnValue(sanitizedQuery);

      const input = {
        query: maliciousQuery,
        limit: 10,
        offset: 0,
      };

      await domainsRouter.search.query(input);

      expect(sanitization.searchQuery).toHaveBeenCalledWith(maliciousQuery);
    });

    it('should sanitize filter input', async () => {
      const { domainsRouter } = await import('@/server/api/routers/domains');
      const { sanitization } = await import('@/lib/security/sanitization');

      const maliciousFilters = {
        category: '<script>alert("xss")</script>Tech',
        description: '<img src="x" onerror="alert(1)">Safe description',
      };

      const sanitizedFilters = {
        category: 'Tech',
        description: 'Safe description',
      };

      (sanitization.input as jest.Mock).mockReturnValue(sanitizedFilters);

      const input = {
        query: 'test',
        filters: maliciousFilters,
        limit: 10,
        offset: 0,
      };

      await domainsRouter.search.query(input);

      expect(sanitization.input).toHaveBeenCalledWith(maliciousFilters);
    });
  });
});
