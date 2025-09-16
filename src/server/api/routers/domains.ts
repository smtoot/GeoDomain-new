import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { prisma } from "@/lib/prisma";
import { cacheManager, CACHE_TTL } from "@/lib/cache";
import { GeographicScope, DomainStatus, PriceType } from "@prisma/client";
import { cache, cacheKeys, cacheUtils } from "@/lib/cache/redis";
import { sanitization } from "@/lib/security/sanitization";
import { createDatabaseError } from "@/lib/errors/api-errors";

// Input validation schemas
const domainFiltersSchema = z.object({
  category: z.string().optional(),
  geographicScope: z.nativeEnum(GeographicScope).optional(),
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
  priceType: z.nativeEnum(PriceType),
  description: z.string().min(10),
  geographicScope: z.nativeEnum(GeographicScope),
  state: z.string().optional(),
  city: z.string().optional(),
  category: z.string(),
  logoUrl: z.string().url().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const domainsRouter = createTRPCRouter({
  /**
   * Get form options for domain creation
   * @description Returns categories, states, and cities for form dropdowns
   * @returns Object containing categories, states, and cities arrays
   */
  getFormOptions: publicProcedure
    .query(async () => {
      try {
        const [categories, states] = await Promise.all([
          // Get all enabled categories
          prisma.domainCategory.findMany({
            where: { enabled: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              description: true,
            }
          }),
          // Get all enabled states
          prisma.uSState.findMany({
            where: { enabled: true },
            orderBy: { sortOrder: 'asc' },
            select: {
              id: true,
              name: true,
              abbreviation: true,
            }
          }),
        ]);

        return {
          success: true,
          data: {
            categories: categories.map(cat => ({
              value: cat.name,
              label: cat.name,
              description: cat.description,
            })),
            states: states.map(state => ({
              id: state.id,
              value: state.name,
              label: state.name,
              abbreviation: state.abbreviation,
            })),
          }
        };
      } catch (error) {
        console.error('Error fetching form options:', error);
        return {
          success: false,
          data: {
            categories: [],
            states: [],
          }
        };
      }
    }),

  /**
   * Get cities for a specific state
   * @description Returns cities for a given state ID
   * @returns Array of cities
   */
  getCitiesByState: publicProcedure
    .input(z.object({
      stateId: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        const cities = await prisma.uSCity.findMany({
          where: { 
            stateId: input.stateId,
            enabled: true 
          },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            stateId: true,
          }
        });

        return {
          success: true,
          data: cities.map(city => ({
            value: city.name,
            label: city.name,
            stateId: city.stateId,
          }))
        };
      } catch (error) {
        console.error('Error fetching cities:', error);
        return {
          success: false,
          data: []
        };
      }
    }),

  /**
   * Simple test endpoint to verify domain router functionality
   * @description Returns basic domain statistics and sample data for testing
   * @returns Object containing domain count, sample domains, and success status
   */
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
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Ultra simple test - just return hardcoded data
  ultraSimple: publicProcedure
    .query(async () => {
      return {
        success: true,
        data: [
          { id: '1', name: 'test1.com', price: 1000 },
          { id: '2', name: 'test2.com', price: 2000 },
          { id: '3', name: 'test3.com', price: 3000 }
        ],
        message: 'Ultra simple test successful'
      };
    }),

  // Database debug endpoint - shows what's actually in the database
  debugDatabase: publicProcedure
    .query(async () => {
      try {
        // Get all domains with their status
        const allDomains = await prisma.domain.findMany({
          take: 10,
          select: {
            id: true,
            name: true,
            status: true,
            price: true,
            createdAt: true,
          },
        });

        // Count domains by status
        const statusCounts = await prisma.domain.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
        });

        return {
          success: true,
          totalDomains: allDomains.length,
          sampleDomains: allDomains,
          statusCounts: statusCounts,
          message: 'Database debug successful'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          message: 'Database debug failed'
        };
      }
    }),

  // Get all domains with optimized data for public page
  getAllDomains: publicProcedure
    .query(async () => {
      try {
        // Get all VERIFIED domains with comprehensive data for domains page
        const allDomains = await prisma.domain.findMany({
          where: {
            status: 'VERIFIED', // Only get verified domains for public page
          },
          take: 100, // Increased limit to get more domains
        orderBy: [
          { createdAt: 'desc' }, // Most recent domains first
        ],
          select: {
            id: true,
            name: true,
            status: true,
            price: true,
            priceType: true,
            description: true,
            geographicScope: true,
            createdAt: true,
            category: true,
            state: true,
            city: true,
            // isFeatured: true, // Temporarily disabled due to type issues
            ownerId: true,
            analytics: {
              select: {
                views: true,
                inquiries: true,
                date: true,
              },
            },
          },
        });

        // Get wholesale domain IDs for efficient lookup
        const wholesaleDomains = await prisma.wholesaleDomain.findMany({
          where: {
            status: 'ACTIVE',
          },
          select: {
            domainId: true,
          },
        });

        const wholesaleDomainIds = new Set(wholesaleDomains.map((wd: any) => wd.domainId));

        // Get category counts for VERIFIED domains
        const categoryCounts = await prisma.domain.groupBy({
          by: ['category'],
          where: {
            status: 'VERIFIED',
          },
          _count: {
            id: true,
          },
        });

        // Transform category counts to handle null categories
        const transformedCategoryCounts = categoryCounts.map(cat => ({
          category: cat.category || 'general',
          _count: cat._count,
        }));

        // Group by transformed category to combine null and 'general' categories
        const finalCategoryCounts = transformedCategoryCounts.reduce((acc, cat) => {
          const existing = acc.find(item => item.category === cat.category);
          if (existing) {
            existing._count.id += cat._count.id;
          } else {
            acc.push(cat);
          }
          return acc;
        }, [] as any[]);

        // Get state counts for VERIFIED domains
        const stateCounts = await prisma.domain.groupBy({
          by: ['state'],
          where: {
            status: 'VERIFIED',
            state: {
              not: null,
            },
          },
          _count: {
            id: true,
          },
        });

        // Get city counts for VERIFIED domains
        const cityCounts = await prisma.domain.groupBy({
          by: ['city'],
          where: {
            status: 'VERIFIED',
            city: {
              not: null,
            },
          },
          _count: {
            id: true,
          },
        });

        // Count domains by status
        const statusCounts = await prisma.domain.groupBy({
          by: ['status'],
          _count: {
            id: true,
          },
        });

        return {
          success: true,
          totalDomains: allDomains.length,
          sampleDomains: allDomains,
          wholesaleDomainIds: Array.from(wholesaleDomainIds), // Convert Set to Array for JSON serialization
          categoryCounts: finalCategoryCounts,
          stateCounts: stateCounts,
          cityCounts: cityCounts,
          statusCounts: statusCounts,
          message: 'Optimized domains data with proper counts and wholesale information'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Test endpoint - completely new name
  testGetAll: publicProcedure
    .query(async () => {
      try {
        // Get all domains with full data for domains page
        const allDomains = await prisma.domain.findMany({
          take: 10,
          select: {
            id: true,
            name: true,
            status: true,
            price: true,
            priceType: true,
            description: true,
            geographicScope: true,
            createdAt: true,
            category: true,
            state: true,
            city: true,
          },
        });

        return {
          success: true,
          totalDomains: allDomains.length,
          sampleDomains: allDomains,
          message: 'testGetAll - completely new endpoint'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  /**
   * Search domains with advanced filtering and caching
   * @description Searches for domains based on query string and optional filters
   * @param input.searchSchema - Search parameters including query, filters, pagination
   * @returns Paginated list of matching domains with owner and analytics data
   * @example
   * ```typescript
   * const results = await api.domains.search.query({
   *   query: "tech",
   *   filters: { category: "Technology", geographicScope: "National" },
   *   limit: 10,
   *   offset: 0
   * });
   * ```
   */
  search: publicProcedure
    .input(searchSchema)
    .query(async ({ input }) => {
      try {
        const { query, filters = {}, limit, offset } = input;
        
        // Sanitize input
        const sanitizedQuery = sanitization.searchQuery(query);
        const sanitizedFilters = sanitization.input(filters);
        
        // Generate cache key
        const cacheKey = cacheKeys.domainSearch(sanitizedQuery, sanitizedFilters);
        
        // Try to get from cache first
        const cached = await cache.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        const where: any = {
          status: 'VERIFIED',
          OR: [
            { name: { contains: sanitizedQuery, mode: 'insensitive' } },
            { description: { contains: sanitizedQuery, mode: 'insensitive' } },
            { category: { contains: sanitizedQuery, mode: 'insensitive' } },
            { state: { contains: sanitizedQuery, mode: 'insensitive' } },
            { city: { contains: sanitizedQuery, mode: 'insensitive' } },
          ],
        };
        
        if (sanitizedFilters && typeof sanitizedFilters === 'object') {
          const typedFilters = sanitizedFilters as any;
          if (typedFilters.category) where.category = typedFilters.category;
          if (typedFilters.geographicScope) where.geographicScope = typedFilters.geographicScope;
          if (typedFilters.state) where.state = typedFilters.state;
          if (typedFilters.city) where.city = typedFilters.city;
        }
        
        // Optimized query with proper includes to avoid N+1
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
            analytics: {
              select: {
                views: true,
                inquiries: true,
                date: true,
              },
              orderBy: {
                date: 'desc',
              },
              take: 1,
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
          query: sanitizedQuery,
          pagination: {
            limit,
            offset,
            hasMore: domains.length === limit,
          },
        };
        
        // Cache the result with Redis
        await cache.set(cacheKey, result, 300); // 5 minutes cache
        
        return result;
      } catch (error) {
        throw createDatabaseError('Failed to search domains');
      }
    }),

  // Ultra-simple test getById endpoint - hardcoded data
  ultraSimpleGetById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id } }) => {
      try {
        // Return hardcoded data to test tRPC transformation (using string dates)
        const hardcodedDomain = {
          id: id,
          name: 'test-domain.com',
          status: 'VERIFIED',
          price: 10000,
          createdAt: '2025-01-05T10:00:00.000Z', // String date instead of Date object
          description: 'Test domain for debugging',
          category: 'Technology',
          geographicScope: 'National',
          state: 'CA',
          city: 'San Francisco',
        };

        return {
          success: true,
          data: hardcodedDomain,
          message: 'ultraSimpleGetById - hardcoded data, no database query'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Primitive test endpoint - only strings and numbers
  primitiveTestGetById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id } }) => {
      try {
        // Return only primitive types to test tRPC transformation
        const primitiveData = {
          id: id,
          name: 'test-domain.com',
          status: 'VERIFIED',
          price: 10000,
          message: 'primitiveTestGetById - only strings and numbers'
        };

        return {
          success: true,
          data: primitiveData,
          message: 'primitiveTestGetById - only primitive types'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // No transformer test endpoint - bypass superjson
  noTransformerTestGetById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id } }) => {
      try {
        // Return simple data without any complex types
        const simpleData = {
          id: id,
          name: 'test-domain.com',
          status: 'VERIFIED',
          price: 10000,
          message: 'noTransformerTestGetById - bypassing superjson'
        };

        // Try to return without any transformation
        return simpleData;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
      };
      }
    }),

  // Simple test getById endpoint - no relations
  testGetById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id } }) => {
      try {
        const domain = await prisma.domain.findUnique({
          where: { id },
            select: {
              id: true,
              name: true,
            status: true,
            price: true,
            createdAt: true,
            description: true,
            category: true,
            geographicScope: true,
            state: true,
            city: true,
          },
        });

        if (!domain) {
          return {
            success: false,
            error: 'Domain not found',
          };
        }

        return {
          success: true,
          data: domain,
          message: 'testGetById - simple query without relations'
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Get domain by ID - with caching (fixed to work with seeded data)
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id } }) => {
      try {
        // Generate cache key
        const cacheKey = `domains.getById:${id}`;
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          return cached;
        }
        
        // Use the same working query pattern as testGetById (no owner relation)
        const domain = await prisma.domain.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            status: true,
            price: true,
            priceType: true,
            createdAt: true,
            description: true,
            category: true,
            geographicScope: true,
            state: true,
            city: true,
            ownerId: true, // Add ownerId for ownership verification
            logoUrl: true,
            metaTitle: true,
            metaDescription: true,
            tags: true,
            verificationToken: true,
            whoisData: true,
            registrar: true,
            analytics: {
              select: {
                views: true,
                inquiries: true,
                date: true,
              },
            },
            expirationDate: true,
            publishedAt: true,
            // submittedForVerificationAt: true, // Temporarily disabled due to type issues
            updatedAt: true,
                  // Only include inquiries if they exist (optional relation)
                  inquiries: {
                    where: { status: 'PENDING_REVIEW' },
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
          return {
            success: false,
            error: 'Domain not found',
          };
        }

        const result = {
          success: true,
          data: domain,
        };
        
        // Cache the result
        cacheManager.set(cacheKey, result, CACHE_TTL.MEDIUM);
        
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
      };
      }
    }),

  // Track domain view
  trackView: publicProcedure
    .input(z.object({ domainId: z.string() }))
    .mutation(async ({ input: { domainId }, ctx }) => {
      try {
        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Upsert analytics record for today
        await ctx.prisma.domainAnalytics.upsert({
          where: {
            domainId_date: {
              domainId,
              date: today,
            },
          },
          update: {
            views: {
              increment: 1,
            },
          },
          create: {
            domainId,
            date: today,
            views: 1,
            inquiries: 0,
          },
        });
        
        return {
          success: true,
          message: 'View tracked successfully',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Get domain by name
  getByName: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input: { name } }) => {
      try {
        // Generate cache key
        const cacheKey = `domains.getByName:${name}`;
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          return cached;
        }
        
        // Find domain by name with all necessary relations
        // Use findFirst to get the active (non-deleted) domain when there are duplicates
        // Use case-insensitive search for domain names
        const domain = await prisma.domain.findFirst({
          where: { 
            name: {
              equals: name,
              mode: 'insensitive'
            },
            status: { not: 'DELETED' as any } // Only get active domains
          },
          select: {
            id: true,
            name: true,
            status: true,
            price: true,
            priceType: true,
            createdAt: true,
            updatedAt: true,
            description: true,
            geographicScope: true,
            ownerId: true,
            category: true,
            state: true,
            city: true,
            analytics: {
              select: {
                views: true,
                inquiries: true,
                date: true,
              },
            },
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                company: true,
              }
            },
            inquiries: {
              where: { status: 'PENDING_REVIEW' },
              select: {
                id: true,
                message: true,
                createdAt: true,
                buyer: {
                  select: {
                    id: true,
                    name: true,
                    company: true,
                  }
                },
              },
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            _count: {
              select: {
                inquiries: true,
              }
            }
          },
        });

        if (!domain) {
          const result = {
            success: false,
            error: 'Domain not found',
            data: null,
          };
          
          // Cache the not found result for a short time
          cacheManager.set(cacheKey, result, CACHE_TTL.SHORT);
          return result;
        }

        const result = {
          success: true,
          data: {
            ...domain,
            inquiryCount: (domain as any)._count?.inquiries || 0,
          },
          message: 'Domain found successfully',
        };
        
        // Cache the result
        cacheManager.set(cacheKey, result, CACHE_TTL.MEDIUM);
        return result;
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),

  // Create domain
  create: protectedProcedure
    .input(createDomainSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validate session and user ID
        if (!ctx.session?.user?.id) {
          throw new Error('User not authenticated');
        }

        // Verify user exists in database
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { id: true, email: true, role: true }
        });

        if (!user) {
          throw new Error('User not found in database');
        }

        // Validate domain name uniqueness (only check non-deleted domains)
        const existingDomain = await prisma.domain.findFirst({
          where: { 
            name: input.name,
            status: { not: 'DELETED' as any }
          },
        });

        if (existingDomain) {
          throw new Error('Domain name already exists');
        }

        const domain = await prisma.domain.create({
        data: {
          ...input,
          tags: input.tags ? JSON.stringify(input.tags) : null,
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
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('Foreign key constraint')) {
            throw new Error('Authentication error: User not found. Please log in again.');
          }
          if (error.message.includes('Unique constraint')) {
            throw new Error('Domain name already exists. Please choose a different name.');
          }
          throw new Error(`Failed to create domain: ${error.message}`);
        }
        
        throw new Error('Failed to create domain: Unknown error occurred');
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
          data: {
            ...data,
            tags: data.tags ? JSON.stringify(data.tags) : undefined,
          },
        });

        return {
          success: true,
          data: updatedDomain,
          message: 'Domain updated successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to update domain');
      }
    }),

  // Submit domain for verification
  submitForVerification: protectedProcedure
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
          throw new Error('Unauthorized to submit this domain');
        }

        if (domain.status !== 'DRAFT') {
          throw new Error('Domain can only be submitted from draft status');
        }

        // Update status to pending verification
        const updatedDomain = await prisma.domain.update({
          where: { id },
          data: { 
            status: 'PENDING_VERIFICATION' as DomainStatus,
            // submittedForVerificationAt: new Date(), // Temporarily commented out until DB migration
          },
        });

        return {
          success: true,
          data: updatedDomain,
          message: 'Domain submitted for verification successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to submit domain for verification');
      }
    }),

  // Generate verification token
  generateVerificationToken: protectedProcedure
    .input(z.object({
      domainId: z.string(),
      method: z.enum(['DNS_TXT', 'FILE_UPLOAD'])
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check ownership
        const domain = await prisma.domain.findUnique({
          where: { id: input.domainId },
        });

        if (!domain) {
          throw new Error('Domain not found');
        }

        if (domain.ownerId !== ctx.session.user.id) {
          throw new Error('Unauthorized to generate verification token');
        }

        // Generate a unique verification token
        const token = `geodomain-verification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Store the verification attempt
        const verificationAttempt = await prisma.verificationAttempt.create({
          data: {
            domainId: input.domainId,
            method: input.method,
            token: input.method === 'DNS_TXT' ? token : null,
            status: 'PENDING',
          },
        });

        return {
          success: true,
          token,
          verificationAttemptId: verificationAttempt.id,
          message: 'Verification token generated successfully',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to generate verification token');
      }
    }),

  // Submit verification attempt
  submitVerificationAttempt: protectedProcedure
    .input(z.object({
      domainId: z.string(),
      method: z.enum(['DNS_TXT', 'FILE_UPLOAD']),
      token: z.string().optional(),
      file: z.any().optional(), // File object from form data
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Check ownership
        const domain = await prisma.domain.findUnique({
          where: { id: input.domainId },
        });

        if (!domain) {
          throw new Error('Domain not found');
        }

        if (domain.ownerId !== ctx.session.user.id) {
          throw new Error('Unauthorized to submit verification');
        }

        // Check if domain is in DRAFT status (only allow verification from DRAFT)
        if (domain.status !== 'DRAFT') {
          throw new Error(`Cannot submit verification for domain with status: ${domain.status}`);
        }

        // Check if there's already a pending verification attempt
        const existingAttempt = await prisma.verificationAttempt.findFirst({
          where: {
            domainId: input.domainId,
            status: 'PENDING',
          },
        });

        if (existingAttempt) {
          throw new Error('A verification attempt is already pending for this domain. Please wait for admin review.');
        }

        // Create verification attempt and update domain status in a transaction
        const result = await prisma.$transaction(async (tx) => {
          // Create verification attempt
          const verificationAttempt = await tx.verificationAttempt.create({
            data: {
              domainId: input.domainId,
              method: input.method,
              token: input.token || null,
              fileUrl: input.file ? `uploaded-${Date.now()}-${input.file.name}` : null,
              status: 'PENDING',
            },
          });

          // Update domain status to PENDING_VERIFICATION
          await tx.domain.update({
            where: { id: input.domainId },
            data: {
              status: 'PENDING_VERIFICATION',
              // submittedForVerificationAt: new Date(), // Temporarily disabled due to type issues
            },
          });

          return verificationAttempt;
        });

        return {
          success: true,
          data: result,
          message: 'Verification submitted successfully. Our team will review it within 24-48 hours.',
        };
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to submit verification attempt');
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
        const updatedDomain = await prisma.domain.update({
          where: { id },
          data: { status: 'DELETED' as any },
        });

        return {
          success: true,
          message: 'Domain deleted successfully',
        };
      } catch (error) {
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
          return cached;
        }
        
        const where: any = {
          ownerId: ctx.session.user.id,
          // Exclude deleted domains by default unless specifically requested
          status: filters.status || { not: 'DELETED' as any },
        };
        
        if (filters.category) where.category = filters.category;
        if (filters.geographicScope) where.geographicScope = filters.geographicScope;
        if (filters.state) where.state = filters.state;
        if (filters.city) where.city = filters.city;
        
        const orderBy: any = {};
        orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';

        const domains = await prisma.domain.findMany({
          where,
          orderBy,
          take: limit,
          skip: offset,
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
            verificationToken: true,
            whoisData: true,
            registrar: true,
            expirationDate: true,
            ownerId: true,
            createdAt: true,
            updatedAt: true,
            publishedAt: true,
            // submittedForVerificationAt: true, // Temporarily commented out until DB migration
            _count: {
              select: {
                inquiries: true,
              },
            },
            analytics: {
              select: {
                views: true,
                inquiries: true,
                date: true,
              },
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
        throw new Error(`Failed to fetch user domains: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          return cached;
        }
        
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
        throw new Error('Failed to fetch domain statistics');
      }
    }),
});
