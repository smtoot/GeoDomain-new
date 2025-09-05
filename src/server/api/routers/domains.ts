import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { prisma } from "@/lib/prisma";
import { cacheManager, CACHE_TTL } from "@/lib/cache";

// Input validation schemas
const domainFiltersSchema = z.object({
  category: z.string().optional(),
  geographicScope: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  status: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const searchSchema = z.object({
  query: z.string().min(1),
  filters: domainFiltersSchema.optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});

const createDomainSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  priceType: z.enum(['FIXED', 'NEGOTIABLE', 'AUCTION']),
  description: z.string().min(10),
  geographicScope: z.string(),
  state: z.string().optional(),
  city: z.string().optional(),
  category: z.string(),
  logoUrl: z.string().url().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const domainsRouter = createTRPCRouter({
  // Simple test endpoint
  test: publicProcedure
    .query(async () => {
      try {
        const count = await prisma.domain.count();
        
        // Get a few sample domains to see their status
        const sampleDomains = await prisma.domain.findMany({
          take: 5,
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          }
        });
        
        return {
          success: true,
          count,
          sampleDomains: sampleDomains,
          message: 'Test successful',
        };
      } catch (error) {
        console.error('Test error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Test simple findMany
  testFindMany: publicProcedure
    .query(async () => {
      try {
        const domains = await prisma.domain.findMany({
          take: 1,
          select: {
            id: true,
            name: true,
          },
        });
        return {
          success: true,
          data: domains,
          message: 'FindMany test successful',
        };
      } catch (error) {
        console.error('FindMany test error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Test findMany with status filter
  testWithStatus: publicProcedure
    .query(async () => {
      try {
        const domains = await prisma.domain.findMany({
          where: {
            status: 'VERIFIED',
          },
          take: 1,
          select: {
            id: true,
            name: true,
            status: true,
          },
        });
        return {
          success: true,
          data: domains,
          message: 'Status filter test successful',
        };
      } catch (error) {
        console.error('Status filter test error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Get all domains - simplified version without caching
  getAll: publicProcedure
    .input(domainFiltersSchema.extend({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      try {
        const { limit, offset, ...filters } = input;
        
        console.log('🔍 [DOMAINS] Fetching domains with filters:', { limit, offset, filters });
        
        // Build where clause manually
        const where: any = {
          status: 'VERIFIED', // Restored - we confirmed domains are VERIFIED
        };
        
        if (filters.category) where.category = filters.category;
        if (filters.geographicScope) where.geographicScope = filters.geographicScope;
        if (filters.state) where.state = filters.state;
        if (filters.city) where.city = filters.city;
        if (filters.minPrice) where.price = { gte: filters.minPrice };
        if (filters.maxPrice) where.price = { ...where.price, lte: filters.maxPrice };
        
        console.log('🔍 [DOMAINS] Where clause:', where);
        
        const domains = await prisma.domain.findMany({
          where,
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
            owner: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
          orderBy: [
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        });
        
        console.log('🔍 [DOMAINS] Found domains:', domains.length);
        
        const result = {
          success: true,
          data: domains,
          pagination: {
            limit,
            offset,
            hasMore: domains.length === limit,
          },
        };
        
        return result;
      } catch (error) {
        console.error('❌ [DOMAINS] Error fetching domains:', error);
        return {
          success: false,
          data: [],
          error: error instanceof Error ? error.message : 'Unknown error',
          pagination: {
            limit: input.limit,
            offset: input.offset,
            hasMore: false,
          },
        };
      }
    }),

  // Search domains - simplified version
  search: publicProcedure
    .input(searchSchema)
    .query(async ({ input }) => {
      try {
        const { query, filters = {}, limit, offset } = input;
        
        // Generate cache key
        const cacheKey = `domains.search:${JSON.stringify({ query, filters, limit, offset })}`;
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          console.log(`💾 [CACHE] Hit for ${cacheKey}`);
          return cached;
        }
        
        console.log(`💾 [CACHE] Miss for ${cacheKey}`);
        
        const where: any = {
          status: 'VERIFIED',
          OR: [
            { name: { contains: query } },
            { description: { contains: query } },
            { category: { contains: query } },
            { state: { contains: query } },
            { city: { contains: query } },
          ],
        };
        
        if (filters && typeof filters === 'object') {
          const typedFilters = filters as any;
          if (typedFilters.category) where.category = typedFilters.category;
          if (typedFilters.geographicScope) where.geographicScope = typedFilters.geographicScope;
          if (typedFilters.state) where.state = typedFilters.state;
          if (typedFilters.city) where.city = typedFilters.city;
        }
        
        const domains = await prisma.domain.findMany({
        where,
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
          owner: {
            select: {
              id: true,
              name: true,
              company: true,
            },
          },
        },
          orderBy: [
            { createdAt: 'desc' },
          ],
          take: limit,
          skip: offset,
        });
        
        const result = {
          success: true,
          data: domains,
          query,
          pagination: {
            limit,
            offset,
            hasMore: domains.length === limit,
          },
        };
        
        // Cache the result
        cacheManager.set(cacheKey, result, CACHE_TTL.MEDIUM);
        
        return result;
      } catch (error) {
        console.error('Error searching domains:', error);
        throw new Error('Failed to search domains');
      }
    }),

  // Get domain by ID - with caching
  getById: publicProcedure
    .input(z.string())
    .query(async ({ input: id }) => {
      try {
        // Generate cache key
        const cacheKey = `domains.getById:${id}`;
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          console.log(`💾 [CACHE] Hit for ${cacheKey}`);
          return cached;
        }
        
        console.log(`💾 [CACHE] Miss for ${cacheKey}`);
        
        const domain = await prisma.domain.findUnique({
          where: { id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
                company: true,
              email: true,
              },
            },
            inquiries: {
              where: { status: 'PENDING' },
              select: {
                id: true,
                message: true,
                createdAt: true,
                buyer: {
                  select: {
                    id: true,
                    name: true,
              company: true,
            },
          },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
          },
        },
      });

      if (!domain) {
          throw new Error('Domain not found');
        }

        const result = {
          success: true,
          data: domain,
        };
        
        // Cache the result
        cacheManager.set(cacheKey, result, CACHE_TTL.MEDIUM);
        
        return result;
      } catch (error) {
        console.error('Error fetching domain:', error);
        throw new Error('Failed to fetch domain');
      }
    }),

  // Create domain
  create: protectedProcedure
    .input(createDomainSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate domain name uniqueness
        const existingDomain = await prisma.domain.findUnique({
          where: { name: input.name },
        });

        if (existingDomain) {
          throw new Error('Domain name already exists');
        }

        const domain = await prisma.domain.create({
        data: {
          ...input,
          ownerId: ctx.session.user.id,
          status: 'DRAFT',
            publishedAt: null,
        },
      });

        return {
          success: true,
          data: domain,
          message: 'Domain created successfully',
        };
      } catch (error) {
        console.error('Error creating domain:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to create domain');
      }
    }),

  // Update domain
  update: protectedProcedure
    .input(z.object({
        id: z.string(),
      data: createDomainSchema.partial(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, data } = input;

        // Check ownership
        const existingDomain = await prisma.domain.findUnique({
          where: { id },
        });

        if (!existingDomain) {
          throw new Error('Domain not found');
        }

        if (existingDomain.ownerId !== ctx.session.user.id) {
          throw new Error('Unauthorized to update this domain');
        }

        const updatedDomain = await prisma.domain.update({
          where: { id },
          data,
        });

        return {
          success: true,
          data: updatedDomain,
          message: 'Domain updated successfully',
        };
      } catch (error) {
        console.error('Error updating domain:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update domain');
      }
    }),

  // Delete domain
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: id, ctx }) => {
      try {
        // Check ownership
        const domain = await prisma.domain.findUnique({
          where: { id },
      });

      if (!domain) {
          throw new Error('Domain not found');
      }

      if (domain.ownerId !== ctx.session.user.id) {
          throw new Error('Unauthorized to delete this domain');
        }

        // Soft delete by updating status
        await prisma.domain.update({
          where: { id },
          data: { status: 'DELETED' },
        });

        return {
          success: true,
          message: 'Domain deleted successfully',
        };
      } catch (error) {
        console.error('Error deleting domain:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to delete domain');
      }
    }),

  // Publish domain
  publish: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: id, ctx }) => {
      try {
        // Check ownership
        const domain = await prisma.domain.findUnique({
          where: { id },
      });

      if (!domain) {
          throw new Error('Domain not found');
        }

        if (domain.ownerId !== ctx.session.user.id) {
          throw new Error('Unauthorized to publish this domain');
        }

        const updatedDomain = await prisma.domain.update({
          where: { id },
          data: {
            status: 'VERIFIED',
            publishedAt: new Date(),
          },
        });

        return {
          success: true,
          data: updatedDomain,
          message: 'Domain published successfully',
        };
      } catch (error) {
        console.error('Error publishing domain:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to publish domain');
      }
    }),

  // Get user's domains - with caching
  getMyDomains: protectedProcedure
    .input(domainFiltersSchema.extend({
      limit: z.number().min(1).max(100).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const { limit, offset, ...filters } = input;
        
        // Generate cache key (include user ID for security)
        const cacheKey = `domains.getMyDomains:${ctx.session.user.id}:${JSON.stringify({ limit, offset, ...filters })}`;
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          console.log(`💾 [CACHE] Hit for ${cacheKey}`);
          return cached;
        }
        
        console.log(`💾 [CACHE] Miss for ${cacheKey}`);
        
        const where: any = {
          ownerId: ctx.session.user.id,
        };
        
        if (filters.category) where.category = filters.category;
        if (filters.geographicScope) where.geographicScope = filters.geographicScope;
        if (filters.state) where.state = filters.state;
        if (filters.city) where.city = filters.city;
        if (filters.status) where.status = filters.status;
        
        const orderBy: any = {};
        orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';

        const domains = await prisma.domain.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
          include: {
            inquiries: {
              where: { status: 'PENDING' },
              select: { id: true },
            },
          },
        });

        const result = {
          success: true,
          data: domains,
          pagination: {
            limit,
            offset,
            hasMore: domains.length === limit,
          },
        };
        
        // Cache the result (shorter TTL for user-specific data)
        cacheManager.set(cacheKey, result, CACHE_TTL.SHORT);
        
        return result;
      } catch (error) {
        console.error('Error fetching user domains:', error);
        throw new Error('Failed to fetch user domains');
      }
    }),

  // Get domain statistics
  getStats: publicProcedure
    .query(async () => {
      try {
        // Generate cache key
        const cacheKey = 'domains.getStats';
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          console.log(`💾 [CACHE] Hit for ${cacheKey}`);
          return cached;
        }
        
        console.log(`💾 [CACHE] Miss for ${cacheKey}`);
        
        const [totalDomains, verifiedDomains, totalCategories, totalStates] = await Promise.all([
          prisma.domain.count(),
          prisma.domain.count({ where: { status: 'VERIFIED' } }),
          prisma.domain.groupBy({
            by: ['category'],
            _count: { category: true },
          }),
          prisma.domain.groupBy({
            by: ['state'],
            _count: { state: true },
          }),
        ]);

        const result = {
          success: true,
          data: {
            total: totalDomains,
            published: verifiedDomains,
            draft: totalDomains - verifiedDomains,
            categories: totalCategories.length,
            states: totalStates.length,
          },
        };
        
        // Cache the result
        cacheManager.set(cacheKey, result, CACHE_TTL.MEDIUM);
        
        return result;
      } catch (error) {
        console.error('Error fetching domain stats:', error);
        throw new Error('Failed to fetch domain statistics');
      }
    }),
});
