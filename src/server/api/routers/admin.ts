import { z } from 'zod';
import { createTRPCRouter, adminProcedure, superAdminProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

export const adminRouter = createTRPCRouter({
  // Get system overview
  getSystemOverview: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalDomains,
      totalInquiries,
      totalDeals,
      pendingInquiries,
      pendingMessages,
      activeDeals,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.domain.count(),
      ctx.prisma.inquiry.count(),
      ctx.prisma.deal.count(),
      ctx.prisma.inquiry.count({ where: { status: 'PENDING_REVIEW' } }),
      ctx.prisma.message.count({ where: { status: 'PENDING' } }),
      ctx.prisma.deal.count({ where: { status: { in: ['AGREED', 'PAYMENT_PENDING', 'TRANSFER_INITIATED'] } } }),
    ]);

    return {
      totalUsers,
      totalDomains,
      totalInquiries,
      totalDeals,
      pendingInquiries,
      pendingMessages,
      activeDeals,
    };
  }),

  // Get system analytics
  getSystemAnalytics: adminProcedure
    .input(
      z.object({
        period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { period } = input;

      // Calculate date range
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

      const [
        userGrowth,
        domainGrowth,
        inquiryGrowth,
        dealGrowth,
        revenueStats,
      ] = await Promise.all([
        // User growth
        ctx.prisma.user.groupBy({
          by: ['role'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
        // Domain growth
        ctx.prisma.domain.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
        // Inquiry growth
        ctx.prisma.inquiry.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
        }),
        // Deal growth
        ctx.prisma.deal.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startDate } },
          _count: { id: true },
          _sum: { agreedPrice: true },
        }),
        // Revenue statistics
        ctx.prisma.deal.aggregate({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startDate },
          },
          _sum: { agreedPrice: true },
          _count: { id: true },
        }),
      ]);

      return {
        period,
        userGrowth,
        domainGrowth,
        inquiryGrowth,
        dealGrowth,
        revenueStats,
      };
    }),

  // Get admin workload metrics
  getAdminWorkload: adminProcedure.query(async ({ ctx }) => {
    const adminId = ctx.session.user.id;

          const [
        inquiriesReviewed,
        messagesReviewed,
        dealsProcessed,
      ] = await Promise.all([
      // Inquiries reviewed by this admin
      ctx.prisma.inquiry.count({
        where: { 
          moderations: {
            some: {
              adminId: adminId,
            },
          },
        },
      }),
      // Messages reviewed by this admin
      ctx.prisma.message.count({
        where: { 
          moderations: {
            some: {
              adminId: adminId,
            },
          },
        },
      }),
      // Deals processed by this admin
      ctx.prisma.deal.count({
        where: { 
          // Note: adminId field doesn't exist in Deal model
          // This would need to be tracked differently
        },
      }),
              // Average review time calculation would go here
        // For now, we'll use a placeholder
        Promise.resolve(null),
      ]);

    return {
      adminId,
      inquiriesReviewed,
      messagesReviewed,
      dealsProcessed,
      averageReviewTime: '2.5 hours', // Placeholder
      workload: 'MEDIUM', // Placeholder - would be calculated based on metrics
    };
  }),

  // Super Admin: Get all admin users
  getAdminUsers: superAdminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const where = {
        OR: [
          { role: 'ADMIN' as const },
          { role: 'SUPER_ADMIN' as const },
        ],
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
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              // Count inquiries reviewed by this admin
              // This would need a proper relationship in the schema
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

  // Super Admin: Create admin user
  createAdmin: superAdminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(2),
        role: z.enum(['ADMIN', 'SUPER_ADMIN']),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Create admin user
      const adminUser = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          role: input.role,
          password: input.password, // Note: This should be hashed in production
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      return adminUser;
    }),

  // Super Admin: Update admin permissions
  updateAdminPermissions: superAdminProcedure
    .input(
      z.object({
        adminId: z.string(),
        role: z.enum(['ADMIN', 'SUPER_ADMIN']),
        status: z.enum(['ACTIVE', 'SUSPENDED']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent super admin from demoting themselves
      if (input.adminId === ctx.session.user.id && input.role !== 'SUPER_ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot change your own role',
        });
      }

      const adminUser = await ctx.prisma.user.update({
        where: { id: input.adminId },
        data: {
          role: input.role,
          status: input.status,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });

      return adminUser;
    }),

  // Get system settings
  getSystemSettings: adminProcedure.query(async () => {
    // This would typically come from a settings table
    // For now, return default settings
    return {
      inquiryModerationEnabled: true,
      messageModerationEnabled: true,
      paymentVerificationEnabled: true,
      autoApproveInquiries: false,
      autoApproveMessages: false,
      maxInquiriesPerDay: 10,
      maxMessagesPerInquiry: 50,
      reviewTimeLimit: '48h',
      notificationSettings: {
        emailNotifications: true,
        inAppNotifications: true,
        adminAlerts: true,
      },
    };
  }),

  // Update system settings
  updateSystemSettings: superAdminProcedure
    .input(
      z.object({
        inquiryModerationEnabled: z.boolean().optional(),
        messageModerationEnabled: z.boolean().optional(),
        paymentVerificationEnabled: z.boolean().optional(),
        autoApproveInquiries: z.boolean().optional(),
        autoApproveMessages: z.boolean().optional(),
        maxInquiriesPerDay: z.number().min(1).max(100).optional(),
        maxMessagesPerInquiry: z.number().min(1).max(200).optional(),
        reviewTimeLimit: z.string().optional(),
        notificationSettings: z.object({
          emailNotifications: z.boolean().optional(),
          inAppNotifications: z.boolean().optional(),
          adminAlerts: z.boolean().optional(),
        }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // This would typically update a settings table
      // For now, just return the updated settings
      return {
        ...input,
        updatedBy: ctx.session.user.id,
        updatedAt: new Date(),
      };
    }),
});
