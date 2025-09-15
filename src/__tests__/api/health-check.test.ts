import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
    },
    domain: {
      count: jest.fn(),
    },
    inquiry: {
      count: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('@/lib/cache/redis', () => ({
  cache: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  },
}));

jest.mock('@/lib/errors/api-errors', () => ({
  logError: jest.fn(),
  createTRPCError: jest.fn().mockImplementation((code, message) => ({
    code,
    message,
  })),
}));

describe('Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health/check', () => {
    it('should return healthy status when all services are working', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma, cache } = await import('@/lib/prisma');
      const { cache: redisCache } = await import('@/lib/cache/redis');

      // Mock successful database queries
      (prisma.user.count as jest.Mock).mockResolvedValue(150);
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      // Mock successful cache operations
      (redisCache.set as jest.Mock).mockResolvedValue(true);
      (redisCache.get as jest.Mock).mockResolvedValue('test');
      (redisCache.del as jest.Mock).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('healthy');
      expect(data.data.database.status).toBe('connected');
      expect(data.data.cache.status).toBe('connected');
    });

    it('should return database statistics', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');

      // Mock database counts
      (prisma.user.count as jest.Mock).mockResolvedValue(150);
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.database.statistics).toEqual({
        users: 150,
        domains: 500,
        inquiries: 75,
      });
    });

    it('should include performance metrics', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');

      // Mock database operations
      (prisma.user.count as jest.Mock).mockResolvedValue(150);
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.performance).toBeDefined();
      expect(data.data.performance.totalResponseTime).toBeGreaterThan(0);
      expect(data.data.performance.memory).toBeDefined();
      expect(data.data.performance.memory.used).toBeGreaterThan(0);
    });

    it('should include system information', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');

      // Mock database operations
      (prisma.user.count as jest.Mock).mockResolvedValue(150);
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.timestamp).toBeDefined();
      expect(data.data.uptime).toBeGreaterThan(0);
      expect(data.data.environment).toBeDefined();
    });

    it('should handle database connection errors', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');

      // Mock database error
      (prisma.user.count as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.database.status).toBe('error');
      expect(data.data.database.error).toContain('Database connection failed');
    });

    it('should handle cache connection errors', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');
      const { cache: redisCache } = await import('@/lib/cache/redis');

      // Mock successful database operations
      (prisma.user.count as jest.Mock).mockResolvedValue(150);
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      // Mock cache error
      (redisCache.set as jest.Mock).mockRejectedValue(new Error('Cache connection failed'));

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.cache.status).toBe('error');
      expect(data.data.cache.error).toContain('Cache connection failed');
    });

    it('should handle unexpected errors gracefully', async () => {
      const { GET } = await import('@/app/api/health/check/route');

      // Mock unexpected error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Mock prisma to throw unexpected error
      const { prisma } = await import('@/lib/prisma');
      (prisma.user.count as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should measure response time accurately', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');

      // Mock database operations with delay
      (prisma.user.count as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(150), 10))
      );
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.performance.totalResponseTime).toBeGreaterThan(10);
    });

    it('should include memory usage information', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');

      // Mock database operations
      (prisma.user.count as jest.Mock).mockResolvedValue(150);
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);
      const data = await response.json();

      expect(data.data.performance.memory).toBeDefined();
      expect(data.data.performance.memory.used).toBeGreaterThan(0);
      expect(data.data.performance.memory.total).toBeGreaterThan(0);
    });

    it('should return proper JSON content type', async () => {
      const { GET } = await import('@/app/api/health/check/route');
      const { prisma } = await import('@/lib/prisma');

      // Mock database operations
      (prisma.user.count as jest.Mock).mockResolvedValue(150);
      (prisma.domain.count as jest.Mock).mockResolvedValue(500);
      (prisma.inquiry.count as jest.Mock).mockResolvedValue(75);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ count: 1 }]);

      const request = new NextRequest('http://localhost:3000/api/health/check');
      const response = await GET(request);

      expect(response.headers.get('content-type')).toBe('application/json');
    });
  });
});
