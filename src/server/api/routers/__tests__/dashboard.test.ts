import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardRouter } from '../dashboard';

// Mock Prisma client
const mockPrisma = {
  $queryRaw: vi.fn(),
  domain: {
    groupBy: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
  inquiry: {
    groupBy: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
  deal: {
    aggregate: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
  domainAnalytics: {
    aggregate: vi.fn(),
  },
} as unknown as {
  $queryRaw: ReturnType<typeof vi.fn>;
  domain: {
    groupBy: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  inquiry: {
    groupBy: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  deal: {
    aggregate: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
  domainAnalytics: {
    aggregate: ReturnType<typeof vi.fn>;
  };
};

// Mock cache
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
};

// Mock session
const mockSession = {
  user: {
    id: 'test-user-id',
    role: 'SELLER',
  },
};

describe('Dashboard Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSellerStats', () => {
    it('should return seller statistics with correct structure', async () => {
      // Mock the raw SQL query result
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          total_domains: BigInt(10),
          total_inquiries: BigInt(25),
          total_revenue: BigInt(50000),
          total_sales: BigInt(5),
          total_views: BigInt(1000),
        },
      ]);

      // Mock recent activity query
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          recent_inquiries: BigInt(5),
          recent_domains: BigInt(2),
          recent_views: BigInt(200),
        },
      ]);

      // Mock previous period query
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          previous_views: BigInt(150),
          previous_revenue: BigInt(40000),
          previous_domains: BigInt(1),
          previous_inquiries: BigInt(3),
        },
      ]);

      // Mock cache to return null (no cached data)
      mockCache.get.mockResolvedValue(null);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      const result = await dashboardRouter
        .createCaller(ctx)
        .getSellerStats();

      expect(result).toEqual({
        totalViews: 1000,
        totalInquiries: 25,
        totalRevenue: 50000,
        totalDomains: 10,
        totalSales: 5,
        viewsChange: 33, // (200-150)/150 * 100 = 33%
        inquiriesChange: 67, // (5-3)/3 * 100 = 67%
        revenueChange: 25, // (50000-40000)/40000 * 100 = 25%
        domainsChange: 100, // (2-1)/1 * 100 = 100%
      });
    });

    it('should return cached data when available', async () => {
      const cachedData = {
        totalViews: 1000,
        totalInquiries: 25,
        totalRevenue: 50000,
        totalDomains: 10,
        totalSales: 5,
        viewsChange: 10,
        inquiriesChange: 15,
        revenueChange: 20,
        domainsChange: 5,
      };

      mockCache.get.mockResolvedValue(cachedData);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      const result = await dashboardRouter
        .createCaller(ctx)
        .getSellerStats();

      expect(result).toEqual(cachedData);
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('should handle zero values correctly', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          total_domains: BigInt(0),
          total_inquiries: BigInt(0),
          total_revenue: BigInt(0),
          total_sales: BigInt(0),
          total_views: BigInt(0),
        },
      ]);

      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          recent_inquiries: BigInt(0),
          recent_domains: BigInt(0),
          recent_views: BigInt(0),
        },
      ]);

      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          previous_views: BigInt(0),
          previous_revenue: BigInt(0),
          previous_domains: BigInt(0),
          previous_inquiries: BigInt(0),
        },
      ]);

      mockCache.get.mockResolvedValue(null);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      const result = await dashboardRouter
        .createCaller(ctx)
        .getSellerStats();

      expect(result.totalViews).toBe(0);
      expect(result.totalInquiries).toBe(0);
      expect(result.totalRevenue).toBe(0);
      expect(result.totalDomains).toBe(0);
      expect(result.totalSales).toBe(0);
      expect(result.viewsChange).toBe(0);
      expect(result.inquiriesChange).toBe(0);
      expect(result.revenueChange).toBe(0);
      expect(result.domainsChange).toBe(0);
    });

    it('should handle cache errors gracefully', async () => {
      // Mock cache error
      mockCache.get.mockRejectedValue(new Error('Cache error'));

      // Mock the raw SQL queries
      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          total_domains: BigInt(5),
          total_inquiries: BigInt(10),
          total_revenue: BigInt(25000),
          total_sales: BigInt(2),
          total_views: BigInt(500),
        },
      ]);

      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          recent_inquiries: BigInt(2),
          recent_domains: BigInt(1),
          recent_views: BigInt(100),
        },
      ]);

      mockPrisma.$queryRaw.mockResolvedValueOnce([
        {
          previous_views: BigInt(80),
          previous_revenue: BigInt(20000),
          previous_domains: BigInt(0),
          previous_inquiries: BigInt(1),
        },
      ]);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      const result = await dashboardRouter
        .createCaller(ctx)
        .getSellerStats();

      expect(result).toBeDefined();
      expect(result.totalDomains).toBe(5);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activities with correct structure', async () => {
      const mockInquiries = [
        {
          id: '1',
          createdAt: new Date('2024-01-15'),
          domain: { name: 'example.com' },
        },
      ];

      const mockDomains = [
        {
          name: 'test.com',
          updatedAt: new Date('2024-01-14'),
        },
      ];

      const mockDeals = [
        {
          id: '1',
          updatedAt: new Date('2024-01-13'),
          domain: { name: 'domain.com' },
        },
      ];

      mockPrisma.inquiry.findMany.mockResolvedValue(mockInquiries);
      mockPrisma.domain.findMany.mockResolvedValue(mockDomains);
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      const result = await dashboardRouter
        .createCaller(ctx)
        .getRecentActivity();

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type');
      expect(result[0]).toHaveProperty('title');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('status');
    });

    it('should sort activities by actual date, not formatted strings', async () => {
      const mockInquiries = [
        {
          id: '1',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          domain: { name: 'example.com' },
        },
      ];

      const mockDomains = [
        {
          name: 'test.com',
          updatedAt: new Date('2024-01-15T12:00:00Z'),
        },
      ];

      const mockDeals = [
        {
          id: '1',
          updatedAt: new Date('2024-01-15T14:00:00Z'),
          domain: { name: 'domain.com' },
        },
      ];

      mockPrisma.inquiry.findMany.mockResolvedValue(mockInquiries);
      mockPrisma.domain.findMany.mockResolvedValue(mockDomains);
      mockPrisma.deal.findMany.mockResolvedValue(mockDeals);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      const result = await dashboardRouter
        .createCaller(ctx)
        .getRecentActivity();

      // Should be sorted by most recent first (deal at 14:00, domain at 12:00, inquiry at 10:00)
      expect(result[0].title).toContain('Payment received');
      expect(result[1].title).toContain('Domain verification');
      expect(result[2].title).toContain('New inquiry');
    });
  });

  describe('getDomainPerformance', () => {
    it('should return domain performance data with correct structure', async () => {
      const mockDomains = [
        {
          id: '1',
          name: 'example.com',
          status: 'VERIFIED',
          price: 5000,
          createdAt: new Date('2024-01-01'),
        },
      ];

      const mockInquiryCounts = [
        {
          domainId: '1',
          _count: { id: 3 },
        },
      ];

      mockPrisma.domain.findMany.mockResolvedValue(mockDomains);
      mockPrisma.inquiry.groupBy.mockResolvedValue(mockInquiryCounts);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      const result = await dashboardRouter
        .createCaller(ctx)
        .getDomainPerformance({ limit: 5 });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: '1',
        name: 'example.com',
        status: 'VERIFIED',
        price: 5000,
        inquiries: 3,
        views: 0,
        revenue: 0,
        createdAt: new Date('2024-01-01'),
      });
    });

    it('should only count inquiries with OPEN or CLOSED status', async () => {
      const mockDomains = [
        {
          id: '1',
          name: 'example.com',
          status: 'VERIFIED',
          price: 5000,
          createdAt: new Date('2024-01-01'),
        },
      ];

      mockPrisma.domain.findMany.mockResolvedValue(mockDomains);
      mockPrisma.inquiry.groupBy.mockResolvedValue([]);

      const ctx = {
        prisma: mockPrisma,
        session: mockSession,
      };

      await dashboardRouter
        .createCaller(ctx)
        .getDomainPerformance({ limit: 5 });

      // Verify that the inquiry count query includes the correct status filter
      expect(mockPrisma.inquiry.groupBy).toHaveBeenCalledWith({
        by: ['domainId'],
        where: {
          domain: { ownerId: 'test-user-id' },
          status: { in: ['OPEN', 'CLOSED'] },
        },
        _count: {
          id: true,
        },
      });
    });
  });
});
