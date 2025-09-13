import { prisma } from '../prisma';
import { cacheManager, CACHE_TTL, cacheUtils } from '../cache';
import { dbLogger } from '../utils/logger';

// Enhanced database operations with caching and optimization
export class DatabaseManager {
  private static instance: DatabaseManager;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // Optimized domain queries with caching
  async getDomainsWithCache(filters: any, limit: number = 10, offset: number = 0) {
    const cacheKey = cacheUtils.domainListKey({ ...filters, limit, offset });
    
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        // Optimized query with proper indexing
        const domains = await prisma.domain.findMany({
          where: {
            status: 'PUBLISHED',
            ...filters,
          },
          select: {
            id: true,
            name: true,
            price: true,
            priceType: true,
            description: true,
            geographicScope: true,
            state: true,
            city: true,
            category: true,
            logoUrl: true,
            metaTitle: true,
            metaDescription: true,
            tags: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            publishedAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
          orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        });

        const duration = Date.now() - startTime;
        dbLogger.info(`Domain query executed in ${duration}ms`, { filters, limit, offset });
        
        return domains;
      },
      CACHE_TTL.MEDIUM
    );
  }

  // Optimized domain search with full-text search capabilities
  async searchDomains(query: string, filters: any, limit: number = 10, offset: number = 0) {
    const cacheKey = cacheUtils.searchKey(query, { ...filters, limit, offset });
    
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        // Build optimized search query
        const whereClause: any = {
          status: 'PUBLISHED',
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { tags: { hasSome: [query] } },
            { category: { contains: query, mode: 'insensitive' } },
            { state: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
          ],
          ...filters,
        };

        const domains = await prisma.domain.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            price: true,
            priceType: true,
            description: true,
            geographicScope: true,
            state: true,
            city: true,
            category: true,
            logoUrl: true,
            tags: true,
            status: true,
            createdAt: true,
            publishedAt: true,
            owner: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
          orderBy: [
            { publishedAt: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        });

        const duration = Date.now() - startTime;
        dbLogger.info(`Domain search executed in ${duration}ms`, { query, filters, limit, offset });
        
        return domains;
      },
      CACHE_TTL.SHORT
    );
  }

  // Optimized inquiry queries
  async getInquiriesWithCache(filters: any, limit: number = 10, offset: number = 0) {
    const cacheKey = cacheUtils.inquiryListKey({ ...filters, limit, offset });
    
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        const inquiries = await prisma.inquiry.findMany({
          where: filters,
          select: {
            id: true,
            message: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              },
            },
            domain: {
              select: {
                id: true,
                name: true,
                price: true,
                category: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });

        const duration = Date.now() - startTime;
        dbLogger.info(`Inquiry query executed in ${duration}ms`, { filters, limit, offset });
        
        return inquiries;
      },
      CACHE_TTL.MEDIUM
    );
  }

  // Optimized dashboard queries
  async getDashboardData(userId: string) {
    const cacheKey = cacheUtils.dashboardKey(userId);
    
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        // Parallel queries for better performance
        const [recentInquiries, recentDomains, recentDeals, stats] = await Promise.all([
          // Recent inquiries
          prisma.inquiry.findMany({
            where: { domain: { ownerId: userId } },
            select: {
              id: true,
              message: true,
              status: true,
              createdAt: true,
              buyer: { select: { name: true, company: true } },
              domain: { select: { name: true, price: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          
          // Recent domains
          prisma.domain.findMany({
            where: { ownerId: userId },
            select: {
              id: true,
              name: true,
              status: true,
              createdAt: true,
              publishedAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          
          // Recent deals
          prisma.deal.findMany({
            where: { 
              OR: [
                { buyerId: userId },
                { sellerId: userId },
              ],
            },
            select: {
              id: true,
              status: true,
              agreedPrice: true,
              createdAt: true,
              domain: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          
          // Statistics
          Promise.all([
            prisma.domain.count({ where: { ownerId: userId } }),
            prisma.inquiry.count({ where: { domain: { ownerId: userId } } }),
            prisma.deal.count({ 
              where: { 
                OR: [
                  { buyerId: userId },
                  { sellerId: userId },
                ],
              },
            }),
          ]),
        ]);

        const [domainCount, inquiryCount, dealCount] = stats;
        
        const duration = Date.now() - startTime;
        dbLogger.info(`Dashboard data query executed in ${duration}ms`, { userId });
        
        return {
          recentInquiries,
          recentDomains,
          recentDeals,
          stats: {
            domainCount,
            inquiryCount,
            dealCount,
          },
        };
      },
      CACHE_TTL.SHORT
    );
  }

  // Batch operations for better performance
  async batchGetDomains(ids: string[]) {
    const cacheKey = `batch_domains:${ids.sort().join(',')}`;
    
    return cacheManager.getOrSet(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        const domains = await prisma.domain.findMany({
          where: { id: { in: ids } },
          select: {
            id: true,
            name: true,
            price: true,
            priceType: true,
            description: true,
            category: true,
            status: true,
            createdAt: true,
          },
        });

        const duration = Date.now() - startTime;
        dbLogger.info(`Batch domain query executed in ${duration}ms`, { count: ids.length });
        
        return domains;
      },
      CACHE_TTL.MEDIUM
    );
  }

  // Connection health check
  async checkConnection() {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const duration = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime: duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      dbLogger.error('Database connection check failed', { error });
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Warm up cache with common queries
  async warmupCache() {
    try {
      dbLogger.info('Starting cache warmup...');
      
      // Warm up common queries
      await Promise.all([
        this.getDomainsWithCache({}, 20, 0),
        this.getInquiriesWithCache({}, 20, 0),
      ]);
      
      dbLogger.info('Cache warmup completed successfully');
    } catch (error) {
      dbLogger.error('Cache warmup failed', { error });
    }
  }

  // Cleanup and optimization
  async optimize() {
    try {
      // Run database optimization queries
      await prisma.$executeRaw`VACUUM`;
      await prisma.$executeRaw`ANALYZE`;
      
      dbLogger.info('Database optimization completed');
    } catch (error) {
      dbLogger.error('Database optimization failed', { error });
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();

// Utility functions for common database operations
export const dbUtils = {
  // Pagination helper
  paginate: (page: number = 1, limit: number = 10) => ({
    skip: (page - 1) * limit,
    take: limit,
  }),
  
  // Filter builder
  buildFilters: (filters: any) => {
    const where: any = {};
    
    if (filters.category) where.category = filters.category;
    if (filters.geographicScope) where.geographicScope = filters.geographicScope;
    if (filters.state) where.state = filters.state;
    if (filters.city) where.city = filters.city;
    if (filters.minPrice) where.price = { gte: filters.minPrice };
    if (filters.maxPrice) where.price = { ...where.price, lte: filters.maxPrice };
    if (filters.status) where.status = filters.status;
    
    return where;
  },
  
  // Sort builder
  buildSort: (sortBy: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') => {
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    return orderBy;
  },
};
