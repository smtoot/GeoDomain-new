import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

const domainSchema = z.object({
  name: z.string().min(1, 'Domain name is required'),
  price: z.number().positive('Price must be positive'),
  priceType: z.enum(['FIXED', 'NEGOTIABLE', 'MAKE_OFFER']),
  description: z.string().optional(),
  
  // Enhanced Geographic Classification
  geographicScope: z.enum(['NATIONAL', 'STATE', 'CITY']),
  state: z.string().optional(),
  city: z.string().optional(),
  
  // Enhanced Category Classification
  category: z.string().min(1, 'Category is required'),
  
  logoUrl: z.string().url().optional().or(z.literal('')),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine((data) => {
  // Validate geographic scope requirements
  if (data.geographicScope === 'STATE' && !data.state) {
    return false;
  }
  if (data.geographicScope === 'CITY' && (!data.state || !data.city)) {
    return false;
  }
  return true;
}, {
  message: "Please fill in all required geographic fields for your selected scope",
  path: ["geographicScope"]
});

export const domainsRouter = createTRPCRouter({
  // Get all public domains
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        search: z.string().optional(),
        category: z.string().optional(),
        geographicScope: z.enum(['NATIONAL', 'STATE', 'CITY']).optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        status: z.enum(['VERIFIED', 'PUBLISHED']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { 
        limit, 
        cursor, 
        search, 
        category,
        geographicScope,
        state, 
        city,
        priceMin, 
        priceMax, 
        status 
      } = input;

      const where = {
        status: status || { in: ['VERIFIED', 'PUBLISHED'] },
        ...(search && {
          OR: [
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        }),
        ...(category && { category }),
        ...(geographicScope && { geographicScope }),
        ...(state && { state }),
        ...(city && { city }),
        ...(priceMin && { price: { gte: priceMin } }),
        ...(priceMax && { price: { lte: priceMax } }),
      } as any;

      const items = await ctx.prisma.domain.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // Get domain by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.id },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          analytics: {
            orderBy: { date: 'desc' },
            take: 30,
          },
        },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      return domain;
    }),

  // Get user's domains
  getMyDomains: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.enum(['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'PUBLISHED', 'PAUSED']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;

      const where = {
        ownerId: ctx.session.user.id,
        ...(status && { status }),
      };

      const items = await ctx.prisma.domain.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          analytics: {
            orderBy: { date: 'desc' },
            take: 7,
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  // Create domain
  create: protectedProcedure
    .input(domainSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if user is a seller
      if (ctx.session.user.role !== 'SELLER') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only sellers can create domains',
        });
      }

      const domain = await ctx.prisma.domain.create({
        data: {
          ...input,
          ownerId: ctx.session.user.id,
          status: 'DRAFT',
          tags: input.tags ? JSON.stringify(input.tags) : null,
        },
      });

      return domain;
    }),

  // Update domain
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: domainSchema.partial(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.id },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own domains',
        });
      }

      const updatedDomain = await ctx.prisma.domain.update({
        where: { id: input.id },
        data: {
          ...input.data,
          tags: input.data.tags ? JSON.stringify(input.data.tags) : undefined,
        },
      });

      return updatedDomain;
    }),

  // Delete domain
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.id },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own domains',
        });
      }

      await ctx.prisma.domain.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Pause/Unpause domain
  togglePause: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.id },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only pause your own domains',
        });
      }

      const newStatus = domain.status === 'PAUSED' ? 'VERIFIED' : 'PAUSED';

      const updatedDomain = await ctx.prisma.domain.update({
        where: { id: input.id },
        data: { status: newStatus },
      });

      return updatedDomain;
    }),
});
