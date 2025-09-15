import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    domain: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    inquiry: {
      count: jest.fn(),
      findMany: jest.fn(),
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
    user: jest.fn((userId: string) => `user:${userId}`),
  },
}));

jest.mock('@/lib/errors/api-errors', () => ({
  createDatabaseError: jest.fn().mockImplementation((message: string) => ({
    code: 'INTERNAL_SERVER_ERROR',
    message,
  })),
}));

describe('Dashboard Router Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSellerStats', () => {
    it('should return seller statistics with caching', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock database queries
      (prisma.domain.count as jest.Mock).mockResolvedValue(12);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(45);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ total: 125000 }]);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inquiry.findMany as jest.Mock).mockResolvedValue([]);

      // Mock cache set
      (cache.set as jest.Mock).mockResolvedValue(true);

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      const result = await dashboardRouter.getSellerStats.query(mockCtx as any);

      expect(result).toBeDefined();
      expect(result.totalDomains).toBe(12);
      expect(result.totalInquiries).toBe(45);
      expect(result.totalRevenue).toBe(125000);
      expect(cache.get).toHaveBeenCalledWith('user:user-123');
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return cached data when available', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { cache } = await import('@/lib/cache/redis');

      const cachedData = {
        totalViews: 1000,
        totalInquiries: 30,
        totalRevenue: 50000,
        totalDomains: 8,
        viewsChange: 10,
        inquiriesChange: 5,
        revenueChange: 15,
        domainsChange: 0,
      };

      (cache.get as jest.Mock).mockResolvedValue(cachedData);

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      const result = await dashboardRouter.getSellerStats.query(mockCtx as any);

      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith('user:user-123');
    });

    it('should calculate change percentages correctly', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock current period data
      (prisma.domain.count as jest.Mock).mockResolvedValue(12);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(45);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ total: 125000 }]);

      // Mock previous period data (30-60 days ago)
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inquiry.findMany as jest.Mock).mockResolvedValue([]);

      (cache.set as jest.Mock).mockResolvedValue(true);

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      const result = await dashboardRouter.getSellerStats.query(mockCtx as any);

      expect(result).toBeDefined();
      expect(typeof result.viewsChange).toBe('number');
      expect(typeof result.inquiriesChange).toBe('number');
      expect(typeof result.revenueChange).toBe('number');
      expect(typeof result.domainsChange).toBe('number');
    });

    it('should handle database errors gracefully', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock database error
      (prisma.domain.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      await expect(dashboardRouter.getSellerStats.query(mockCtx as any)).rejects.toThrow();
    });
  });

  describe('getBuyerStats', () => {
    it('should return buyer statistics with caching', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock database queries
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(8);
      (prisma.domain.count as jest.Mock).mockResolvedValue(15);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ total: 25000 }]);
      (prisma.inquiry.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);

      (cache.set as jest.Mock).mockResolvedValue(true);

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      const result = await dashboardRouter.getBuyerStats.query(mockCtx as any);

      expect(result).toBeDefined();
      expect(result.totalInquiries).toBe(8);
      expect(result.totalSavedDomains).toBe(15);
      expect(result.totalSpent).toBe(25000);
      expect(cache.get).toHaveBeenCalledWith('user:user-123');
      expect(cache.set).toHaveBeenCalled();
    });

    it('should return cached buyer data when available', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { cache } = await import('@/lib/cache/redis');

      const cachedData = {
        totalInquiries: 5,
        pendingInquiries: 1,
        openInquiries: 2,
        closedInquiries: 2,
        totalSavedDomains: 10,
        totalPurchases: 1,
        totalSpent: 15000,
        recentActivity: 3,
        inquiriesChange: 20,
        spendingChange: 50,
        savedChange: 10,
        activityChange: 15,
      };

      (cache.get as jest.Mock).mockResolvedValue(cachedData);

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      const result = await dashboardRouter.getBuyerStats.query(mockCtx as any);

      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith('user:user-123');
    });

    it('should calculate buyer change percentages correctly', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock current period data
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(8);
      (prisma.domain.count as jest.Mock).mockResolvedValue(15);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ total: 25000 }]);

      // Mock previous period data
      (prisma.inquiry.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);

      (cache.set as jest.Mock).mockResolvedValue(true);

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      const result = await dashboardRouter.getBuyerStats.query(mockCtx as any);

      expect(result).toBeDefined();
      expect(typeof result.inquiriesChange).toBe('number');
      expect(typeof result.spendingChange).toBe('number');
      expect(typeof result.savedChange).toBe('number');
      expect(typeof result.activityChange).toBe('number');
    });

    it('should handle buyer statistics database errors', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      // Mock cache miss
      (cache.get as jest.Mock).mockResolvedValue(null);

      // Mock database error
      (prisma.inquiry.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      await expect(dashboardRouter.getBuyerStats.query(mockCtx as any)).rejects.toThrow();
    });
  });

  describe('Cache Integration', () => {
    it('should use correct cache keys', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { cache, cacheKeys } = await import('@/lib/cache/redis');

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(true);

      const mockCtx = {
        session: {
          user: { id: 'user-456' },
        },
      };

      await dashboardRouter.getSellerStats.query(mockCtx as any);

      expect(cacheKeys.user).toHaveBeenCalledWith('seller-stats:user-456');
    });

    it('should set cache with correct TTL', async () => {
      const { dashboardRouter } = await import('@/server/api/routers/dashboard');
      const { prisma } = await import('@/lib/prisma');
      const { cache } = await import('@/lib/cache/redis');

      (cache.get as jest.Mock).mockResolvedValue(null);
      (cache.set as jest.Mock).mockResolvedValue(true);

      // Mock database queries
      (prisma.domain.count as jest.Mock).mockResolvedValue(12);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(45);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ total: 125000 }]);
      (prisma.domain.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inquiry.findMany as jest.Mock).mockResolvedValue([]);

      const mockCtx = {
        session: {
          user: { id: 'user-123' },
        },
      };

      await dashboardRouter.getSellerStats.query(mockCtx as any);

      expect(cache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        600 // 10 minutes TTL
      );
    });
  });
});
