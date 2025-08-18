import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal('')),
});

export const usersRouter = createTRPCRouter({
  // Get current user profile
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        avatar: true,
        phone: true,
        company: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    return user;
  }),

  // Update current user profile
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.update({
        where: { id: ctx.session.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          phone: true,
          company: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      return user;
    }),

  // Get user analytics
  getAnalytics: protectedProcedure
    .input(
      z.object({
        period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { period } = input;
      const userId = ctx.session.user.id;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Get domain statistics
      const domainStats = await ctx.prisma.domain.groupBy({
        by: ['status'],
        where: {
          ownerId: userId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
      });

      // Get inquiry statistics (for sellers)
      const inquiryStats = await ctx.prisma.inquiry.groupBy({
        by: ['status'],
        where: {
          sellerId: userId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
      });

      // Get deal statistics
      const dealStats = await ctx.prisma.deal.groupBy({
        by: ['status'],
        where: {
          OR: [
            { buyerId: userId },
            { sellerId: userId },
          ],
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          agreedPrice: true,
        },
      });

      return {
        period,
        domains: domainStats,
        inquiries: inquiryStats,
        deals: dealStats,
      };
    }),

  // Admin: Get all users
  getAll: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        search: z.string().optional(),
        role: z.enum(['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN']).optional(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, search, role, status } = input;

      const where = {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
        ...(role && { role }),
        ...(status && { status }),
      };

      const items = await ctx.prisma.user.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          phone: true,
          company: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              ownedDomains: true,
              buyerInquiries: true,
              sellerInquiries: true,
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

  // Admin: Get user by ID
  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          phone: true,
          company: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          ownedDomains: {
            select: {
              id: true,
              name: true,
              price: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          buyerInquiries: {
            select: {
              id: true,
              domain: {
                select: {
                  id: true,
                  name: true,
                },
              },
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          sellerInquiries: {
            select: {
              id: true,
              domain: {
                select: {
                  id: true,
                  name: true,
                },
              },
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              ownedDomains: true,
              buyerInquiries: true,
              sellerInquiries: true,
              buyerDeals: true,
              sellerDeals: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  // Admin: Update user status
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Prevent admin from suspending themselves
      if (input.id === ctx.session.user.id && input.status === 'SUSPENDED') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot suspend your own account',
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { status: input.status },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          phone: true,
          company: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      return updatedUser;
    }),

  // Admin: Update user role
  updateRole: adminProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.enum(['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      // Prevent admin from changing their own role to non-admin
      if (input.id === ctx.session.user.id && !['ADMIN', 'SUPER_ADMIN'].includes(input.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot change your own role to non-admin',
        });
      }

      const updatedUser = await ctx.prisma.user.update({
        where: { id: input.id },
        data: { role: input.role },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatar: true,
          phone: true,
          company: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      return updatedUser;
    }),
});
