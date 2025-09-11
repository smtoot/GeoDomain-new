import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../../trpc";
import { prisma } from "@/lib/prisma";
import { cacheManager, CACHE_TTL } from "@/lib/cache";
import { GeographicScope, DomainStatus, PriceType } from "@prisma/client";

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

  // Get all domains - EXACT COPY of debugDatabase for testing
  getAllDomains: publicProcedure
    .query(async () => {
      try {
        // Get all domains with comprehensive data for domains page
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

        // Count domains by status - EXACT COPY of debugDatabase
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
          message: 'getAll EXACT COPY of debugDatabase'
        };
      } catch (error) {
        console.error('❌ [DOMAINS] Error in getAll:', error);
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
        console.error('❌ [DOMAINS] Error in testGetAll:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
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

  // Ultra-simple test getById endpoint - hardcoded data
  ultraSimpleGetById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input: { id } }) => {
      try {
        console.log(`🔍 [DOMAINS] ultraSimpleGetById called with ID: ${id}`);
        
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

        console.log(`🔍 [DOMAINS] ultraSimpleGetById returning hardcoded data:`, hardcodedDomain);

        return {
          success: true,
          data: hardcodedDomain,
          message: 'ultraSimpleGetById - hardcoded data, no database query'
        };
      } catch (error) {
        console.error('❌ [DOMAINS] Error in ultraSimpleGetById:', error);
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
        console.log(`🔍 [DOMAINS] primitiveTestGetById called with ID: ${id}`);
        
        // Return only primitive types to test tRPC transformation
        const primitiveData = {
          id: id,
          name: 'test-domain.com',
          status: 'VERIFIED',
          price: 10000,
          message: 'primitiveTestGetById - only strings and numbers'
        };

        console.log(`🔍 [DOMAINS] primitiveTestGetById returning primitive data:`, primitiveData);

        return {
          success: true,
          data: primitiveData,
          message: 'primitiveTestGetById - only primitive types'
        };
      } catch (error) {
        console.error('❌ [DOMAINS] Error in primitiveTestGetById:', error);
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
        console.log(`🔍 [DOMAINS] noTransformerTestGetById called with ID: ${id}`);
        
        // Return simple data without any complex types
        const simpleData = {
          id: id,
          name: 'test-domain.com',
          status: 'VERIFIED',
          price: 10000,
          message: 'noTransformerTestGetById - bypassing superjson'
        };

        console.log(`🔍 [DOMAINS] noTransformerTestGetById returning simple data:`, simpleData);

        // Try to return without any transformation
        return simpleData;
      } catch (error) {
        console.error('❌ [DOMAINS] Error in noTransformerTestGetById:', error);
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
        console.log(`🔍 [DOMAINS] testGetById called with ID: ${id}`);
        
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

        console.log(`🔍 [DOMAINS] testGetById database query result:`, domain);

        if (!domain) {
          console.log(`❌ [DOMAINS] Domain not found for ID: ${id}`);
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
        console.error('❌ [DOMAINS] Error in testGetById:', error);
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
        console.log(`🔍 [DOMAINS] getById called with ID: ${id}`);
        
        // Generate cache key
        const cacheKey = `domains.getById:${id}`;
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          console.log(`💾 [CACHE] Hit for ${cacheKey}`);
          return cached;
        }
        
        console.log(`💾 [CACHE] Miss for ${cacheKey}`);
        
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
            expirationDate: true,
            publishedAt: true,
            submittedForVerificationAt: true,
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

        console.log(`🔍 [DOMAINS] Database query result:`, domain);

        if (!domain) {
          console.log(`❌ [DOMAINS] Domain not found for ID: ${id}`);
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
        console.error('❌ [DOMAINS] Error in getById:', error);
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
        console.log(`🔍 [DOMAINS] getByName called with name: ${name}`);
        
        // Generate cache key
        const cacheKey = `domains.getByName:${name}`;
        
        // Try to get from cache first
        const cached = cacheManager.get(cacheKey);
        if (cached !== undefined) {
          console.log(`💾 [CACHE] Hit for ${cacheKey}`);
          return cached;
        }
        
        console.log(`💾 [CACHE] Miss for ${cacheKey}`);
        
        // Find domain by name with all necessary relations
        // Use findFirst to get the active (non-deleted) domain when there are duplicates
        const domain = await prisma.domain.findFirst({
          where: { 
            name,
            status: { not: 'DELETED' } // Only get active domains
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
        console.error('❌ [DOMAINS] Error in getByName:', error);
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
        console.log('🔍 [CREATE DOMAIN] Starting domain creation...');
        console.log('🔍 [CREATE DOMAIN] Session user:', ctx.session?.user);
        console.log('🔍 [CREATE DOMAIN] User ID:', ctx.session?.user?.id);
        
        // Validate session and user ID
        if (!ctx.session?.user?.id) {
          console.error('❌ [CREATE DOMAIN] No user ID in session');
          throw new Error('User not authenticated');
        }

        // Verify user exists in database
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { id: true, email: true, role: true }
        });

        if (!user) {
          console.error('❌ [CREATE DOMAIN] User not found in database:', ctx.session.user.id);
          throw new Error('User not found in database');
        }

        console.log('✅ [CREATE DOMAIN] User verified:', user);

        // Validate domain name uniqueness (only check non-deleted domains)
        console.log('🔍 [CREATE DOMAIN] Checking domain name uniqueness for:', input.name);
        const existingDomain = await prisma.domain.findFirst({
          where: { 
            name: input.name,
            status: { not: 'DELETED' }
          },
        });

        console.log('🔍 [CREATE DOMAIN] Existing domain check result:', existingDomain ? { id: existingDomain.id, name: existingDomain.name, status: existingDomain.status } : 'none found');

        if (existingDomain) {
          console.error('❌ [CREATE DOMAIN] Domain name already exists:', input.name);
          throw new Error('Domain name already exists');
        }

        console.log('🔍 [CREATE DOMAIN] Creating domain with data:', {
          ...input,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          ownerId: ctx.session.user.id,
          status: 'DRAFT',
          publishedAt: null,
        });

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
        console.error('❌ [CREATE DOMAIN] Error creating domain:', error);
        
        // Provide more specific error messages
        if (error instanceof Error) {
          if (error.message.includes('Foreign key constraint')) {
            console.error('❌ [CREATE DOMAIN] Foreign key constraint error - user ID issue');
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
        console.error('Error updating domain:', error);
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
        console.error('Error submitting domain for verification:', error);
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
        console.error('Error generating verification token:', error);
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
              submittedForVerificationAt: new Date(),
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
        console.error('Error submitting verification attempt:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to submit verification attempt');
      }
    }),

  // Delete domain
  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input: id, ctx }) => {
      try {
        console.log('🔍 [DELETE DOMAIN] Starting delete procedure for ID:', id);
        console.log('🔍 [DELETE DOMAIN] User ID:', ctx.session?.user?.id);
        
        // Check ownership
        const domain = await prisma.domain.findUnique({
          where: { id },
        });

        console.log('🔍 [DELETE DOMAIN] Found domain:', domain ? { id: domain.id, name: domain.name, ownerId: domain.ownerId } : 'null');

        if (!domain) {
          console.error('❌ [DELETE DOMAIN] Domain not found for ID:', id);
          throw new Error('Domain not found');
        }

        if (domain.ownerId !== ctx.session.user.id) {
          console.error('❌ [DELETE DOMAIN] Unauthorized delete attempt. Domain owner:', domain.ownerId, 'User:', ctx.session.user.id);
          throw new Error('Unauthorized to delete this domain');
        }

        console.log('🔍 [DELETE DOMAIN] Authorization passed, updating domain status to DELETED');

        // Soft delete by updating status
        const updatedDomain = await prisma.domain.update({
          where: { id },
          data: { status: 'DELETED' as DomainStatus },
        });

        console.log('✅ [DELETE DOMAIN] Domain successfully deleted:', updatedDomain.id);

        return {
          success: true,
          message: 'Domain deleted successfully',
        };
      } catch (error) {
        console.error('❌ [DELETE DOMAIN] Error deleting domain:', error);
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
          // Exclude deleted domains by default unless specifically requested
          status: filters.status || { not: 'DELETED' },
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
        console.error('❌ [DOMAINS] Error fetching user domains:', error);
        console.error('❌ [DOMAINS] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          input,
          userId: ctx.session?.user?.id
        });
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
