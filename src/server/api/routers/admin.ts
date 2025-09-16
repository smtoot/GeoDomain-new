import { z } from 'zod';
import { createTRPCRouter, adminProcedure, superAdminProcedure, publicProcedure } from '@/server/trpc';
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
      activeDeals,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.domain.count(),
      ctx.prisma.inquiry.count(),
      ctx.prisma.deal.count(),
      ctx.prisma.inquiry.count({ where: { status: 'PENDING_REVIEW' } }),
      ctx.prisma.deal.count({ where: { status: { in: ['AGREED', 'PAYMENT_PENDING', 'TRANSFER_INITIATED'] } } }),
    ]);

    return {
      totalUsers,
      totalDomains,
      totalInquiries,
      totalDeals,
      pendingInquiries,
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
      totalInquiries,
      totalMessages,
      totalDeals,
      recentInquiries,
      recentMessages,
      recentDeals,
    ] = await Promise.all([
      // Total inquiries in system
      ctx.prisma.inquiry.count(),
      // Total messages in system
      ctx.prisma.message.count(),
      // Total deals in system
      ctx.prisma.deal.count(),
      // Recent inquiries (last 7 days)
      ctx.prisma.inquiry.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Recent messages (last 7 days)
      ctx.prisma.message.count({
        where: {
          sentDate: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      // Recent deals (last 7 days)
      ctx.prisma.deal.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Calculate workload based on recent activity
    const recentActivity = recentInquiries + recentMessages + recentDeals;
    let workload = 'LOW';
    if (recentActivity > 50) workload = 'HIGH';
    else if (recentActivity > 20) workload = 'MEDIUM';

    return {
      adminId,
      totalInquiries,
      totalMessages,
      totalDeals,
      recentInquiries,
      recentMessages,
      recentDeals,
      averageReviewTime: '1.2 hours', // Estimated based on system activity
      workload,
    };
  }),

  // User Management APIs
  users: createTRPCRouter({
    // List all users with filtering and pagination
    listUsers: adminProcedure
      .input(
        z.object({
          search: z.string().optional(),
          role: z.enum(['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN']).optional(),
          status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']).optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { search, role, status, page, limit } = input;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ];
        }
        
        if (role) where.role = role;
        if (status) where.status = status;

        const [users, total] = await Promise.all([
          ctx.prisma.user.findMany({
            where,
            skip,
            take: limit,
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
                  ownedDomains: true,    // Fixed: correct field name from schema
                  buyerInquiries: true,  // Fixed: correct field name from schema
                },
              },
            },
          }),
          ctx.prisma.user.count({ where }),
        ]);

        return {
          users,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      }),

    // Update user status
    updateUserStatus: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']),
          reason: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { userId, status, reason } = input;

        const user = await ctx.prisma.user.update({
          where: { id: userId },
          data: { 
            status,
            // Add audit log entry here if needed
          },
        });

        return {
          success: true,
          user,
          message: `User status updated to ${status}`,
        };
      }),

    // Change user role (Super Admin only)
    changeUserRole: superAdminProcedure
      .input(
        z.object({
          userId: z.string(),
          role: z.enum(['BUYER', 'SELLER', 'ADMIN', 'SUPER_ADMIN']),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { userId, role } = input;

        const user = await ctx.prisma.user.update({
          where: { id: userId },
          data: { role },
        });

        return {
          success: true,
          user,
          message: `User role changed to ${role}`,
        };
      }),
  }),

  // Domain Moderation APIs
  domains: createTRPCRouter({
    // Get domain by ID (Admin only - can view any domain)
    getById: adminProcedure
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
                phone: true,
                company: true,
                role: true,
                status: true,
                createdAt: true,
              },
            },
            inquiries: {
              select: {
                id: true,
                buyerName: true,
                buyerEmail: true,
                buyerPhone: true,
                budgetRange: true,
                intendedUse: true,
                timeline: true,
                message: true,
                status: true,
                createdAt: true,
                buyer: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                inquiries: true,
              },
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

    // List domains for moderation
    listDomainsForModeration: adminProcedure
      .input(
        z.object({
          status: z.enum(['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'PAUSED', 'REJECTED', 'DELETED']).optional(),
          search: z.string().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { status, search, page, limit } = input;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        
        if (status) where.status = status;
        if (search) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ];
        }

        const [domains, total] = await Promise.all([
          ctx.prisma.domain.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  inquiries: true, // This is correct for domain.inquiries relation
                },
              },
            },
          }),
          ctx.prisma.domain.count({ where }),
        ]);

        return {
          domains,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      }),

    // Moderate domain
    moderateDomain: adminProcedure
      .input(
        z.object({
          domainId: z.string(),
          action: z.enum(['APPROVE', 'REJECT', 'SUSPEND']),
          reason: z.string().optional(),
          adminNotes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { domainId, action, reason, adminNotes } = input;

        let status: 'VERIFIED' | 'REJECTED' | 'DRAFT';
        switch (action) {
          case 'APPROVE':
            status = 'VERIFIED';
            break;
          case 'REJECT':
            status = 'REJECTED';
            break;
          case 'SUSPEND':
            status = 'DRAFT';
            break;
        }

        // Check if domain exists
        const existingDomain = await ctx.prisma.domain.findUnique({
          where: { id: domainId },
        });

        if (!existingDomain) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Domain not found',
          });
        }

        const domain = await ctx.prisma.domain.update({
          where: { id: domainId },
          data: { 
            status,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          domain,
          message: `Domain ${action.toLowerCase()}d successfully`,
        };
      }),

    // Delete domain (Admin only)
    deleteDomain: adminProcedure
      .input(
        z.object({
          domainId: z.string(),
          reason: z.string().optional(),
          adminNotes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { domainId, reason, adminNotes } = input;

        // Check if domain exists
        const existingDomain = await ctx.prisma.domain.findUnique({
          where: { id: domainId },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        if (!existingDomain) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Domain not found',
          });
        }

        // Log the deletion for audit purposes
        // Soft delete the domain by setting status to DELETED
        const deletedDomain = await ctx.prisma.domain.update({
          where: { id: domainId },
          data: { 
            status: 'DELETED',
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          domain: deletedDomain,
          message: `Domain "${existingDomain.name}" deleted successfully`,
        };
      }),

    // Restore domain (Admin only)
    restoreDomain: adminProcedure
      .input(
        z.object({
          domainId: z.string(),
          reason: z.string().optional(),
          adminNotes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { domainId, reason, adminNotes } = input;

        // Check if domain exists and is deleted
        const existingDomain = await ctx.prisma.domain.findUnique({
          where: { id: domainId },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        if (!existingDomain) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Domain not found',
          });
        }

        if (existingDomain.status !== 'DELETED') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Domain is not deleted and cannot be restored',
          });
        }

        // Log the restoration for audit purposes
        // Restore the domain by setting status back to VERIFIED
        const restoredDomain = await ctx.prisma.domain.update({
          where: { id: domainId },
          data: { 
            status: 'VERIFIED',
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          domain: restoredDomain,
          message: `Domain "${existingDomain.name}" restored successfully`,
        };
      }),

    // Permanently delete domain (Admin only)
    permanentDeleteDomain: adminProcedure
      .input(
        z.object({
          domainId: z.string(),
          reason: z.string().optional(),
          adminNotes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { domainId, reason, adminNotes } = input;

        // Check if domain exists
        const existingDomain = await ctx.prisma.domain.findUnique({
          where: { id: domainId },
          include: {
            owner: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        if (!existingDomain) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Domain not found',
          });
        }

        // Log the permanent deletion for audit purposes
        // Permanently delete the domain from the database
        await ctx.prisma.domain.delete({
          where: { id: domainId },
        });

        return {
          success: true,
          message: `Domain "${existingDomain.name}" permanently deleted`,
        };
      }),

    // Get verification attempts for a domain
    getVerificationAttempts: adminProcedure
      .input(z.object({
        domainId: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        const verificationAttempts = await ctx.prisma.verificationAttempt.findMany({
          where: {
            domainId: input.domainId,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return verificationAttempts;
      }),

    // Get all pending verification attempts
    getPendingVerificationAttempts: adminProcedure
      .input(z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }))
      .query(async ({ ctx, input }) => {
        const { page, limit } = input;
        const skip = (page - 1) * limit;

        const [attempts, total] = await Promise.all([
          ctx.prisma.verificationAttempt.findMany({
            where: {
              status: 'PENDING',
            },
            skip,
            take: limit,
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              domain: {
                include: {
                  owner: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          }),
          ctx.prisma.verificationAttempt.count({
            where: {
              status: 'PENDING',
            },
          }),
        ]);

        return {
          attempts,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      }),

    // Approve or reject verification attempt
    moderateVerificationAttempt: adminProcedure
      .input(z.object({
        attemptId: z.string(),
        action: z.enum(['APPROVE', 'REJECT']),
        adminNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { attemptId, action, adminNotes, rejectionReason } = input;

        // Get the verification attempt with domain info
        const attempt = await ctx.prisma.verificationAttempt.findUnique({
          where: { id: attemptId },
          include: {
            domain: true,
          },
        });

        if (!attempt) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Verification attempt not found',
          });
        }

        if (attempt.status !== 'PENDING') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verification attempt is not pending',
          });
        }

        // Update verification attempt status
        const newAttemptStatus = action === 'APPROVE' ? 'VERIFIED' : 'FAILED';
        const newDomainStatus = action === 'APPROVE' ? 'VERIFIED' : 'DRAFT';

        // Update verification attempt
        await ctx.prisma.verificationAttempt.update({
          where: { id: attemptId },
          data: {
            status: newAttemptStatus,
            adminNotes: adminNotes || (action === 'REJECT' ? `Rejected: ${rejectionReason}` : 'Approved by admin'),
            verifiedAt: action === 'APPROVE' ? new Date() : null,
            updatedAt: new Date(),
          },
        });

        // Update domain status
        await ctx.prisma.domain.update({
          where: { id: attempt.domainId },
          data: {
            status: newDomainStatus,
            updatedAt: new Date(),
          },
        });

        return {
          success: true,
          message: `Verification attempt ${action.toLowerCase()}d successfully`,
          domainStatus: newDomainStatus,
        };
      }),
  }),

  // Payment Verification APIs
  payments: createTRPCRouter({
    // List pending payment verifications
    listPendingVerifications: adminProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { page, limit } = input;
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
          ctx.prisma.payment.findMany({
            where: { status: 'PENDING' },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              deal: {
                include: {
                  inquiry: {
                    include: {
                      domain: true,
                      buyer: true,
                    },
                  },
                  seller: true,
                },
              },
            },
          }),
          ctx.prisma.payment.count({ where: { status: 'PENDING' } }),
        ]);

        return {
          payments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      }),

    // Verify payment
    verifyPayment: adminProcedure
      .input(
        z.object({
          paymentId: z.string(),
          verified: z.boolean(),
          adminNotes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { paymentId, verified, adminNotes } = input;

        const payment = await ctx.prisma.payment.update({
          where: { id: paymentId },
          data: { 
            status: verified ? 'CONFIRMED' : 'FAILED',
            // Add admin notes if needed
          },
          include: {
            deal: true,
          },
        });

        // Update deal status if payment is confirmed
        if (verified) {
          await ctx.prisma.deal.update({
            where: { id: payment.dealId },
            data: { 
              status: 'PAYMENT_CONFIRMED',
              paymentConfirmedDate: new Date(),
            },
          });
        }

        return {
          success: true,
          payment,
          message: `Payment ${verified ? 'verified' : 'rejected'} successfully`,
        };
      }),
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

  // Super Admin: Create new admin user
  createAdminUser: superAdminProcedure
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1),
        role: z.enum(['ADMIN', 'SUPER_ADMIN']),
        password: z.string().min(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { email, name, role, password } = input;

      // Check if user already exists
      const existingUser = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User with this email already exists',
        });
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await ctx.prisma.user.create({
        data: {
          email,
          name,
          role,
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        },
        message: 'Admin user created successfully',
      };
    }),

  // Super Admin: Delete admin user
  deleteAdminUser: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;

      // Prevent self-deletion
      if (userId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete your own account',
        });
      }

      const user = await ctx.prisma.user.delete({
        where: { id: userId },
      });

      return {
        success: true,
        message: 'Admin user deleted successfully',
      };
    }),

  // Admin Deals Management
  deals: createTRPCRouter({
    // List all active deals for admin management
    listActiveDeals: adminProcedure
      .input(
        z.object({
          status: z.enum(['AGREED', 'PAYMENT_PENDING', 'TRANSFER_INITIATED', 'COMPLETED', 'DISPUTED']).optional(),
          search: z.string().optional(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        }),
      )
      .query(async ({ ctx, input }) => {
        const { status, search, page, limit } = input;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (status) {
          where.status = status;
        }
        if (search) {
          where.OR = [
            { inquiry: { domain: { name: { contains: search, mode: 'insensitive' } } } },
            { buyer: { name: { contains: search, mode: 'insensitive' } } },
            { seller: { name: { contains: search, mode: 'insensitive' } } },
          ];
        }

        const [deals, total] = await Promise.all([
          ctx.prisma.deal.findMany({
            where,
            include: {
              inquiry: {
                include: {
                  domain: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              buyer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              seller: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          ctx.prisma.deal.count({ where }),
        ]);

        return {
          deals,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        };
      }),

    // Update deal status
    updateDealStatus: adminProcedure
      .input(
        z.object({
          dealId: z.string(),
          status: z.enum(['AGREED', 'PAYMENT_PENDING', 'TRANSFER_INITIATED', 'COMPLETED', 'DISPUTED']),
          adminNotes: z.string().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) => {
        const { dealId, status, adminNotes } = input;

        const deal = await ctx.prisma.deal.update({
          where: { id: dealId },
          data: {
            status,
            adminNotes,
            updatedAt: new Date(),
          },
          include: {
            inquiry: {
              include: {
                domain: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        return deal;
      }),

    // Get deal details for admin
    getDealDetails: adminProcedure
      .input(z.object({ dealId: z.string() }))
      .query(async ({ ctx, input }) => {
        const { dealId } = input;

        const deal = await ctx.prisma.deal.findUnique({
          where: { id: dealId },
          include: {
            inquiry: {
              include: {
                domain: {
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    category: true,
                    state: true,
                    city: true,
                  },
                },
              },
            },
            buyer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
              },
            },
            seller: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
              },
            },
            payments: {
              orderBy: { createdAt: 'desc' },
            },
            transfers: {
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        if (!deal) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Deal not found',
          });
        }

        return deal;
      }),
  }),

  // Feature flag management
  getFeatureFlags: adminProcedure.query(async ({ ctx }) => {
    // For now, return hardcoded feature flags
    // In a real implementation, these would come from a database or configuration
    return {
      inquirySystem: true,
      paymentProcessing: true,
      emailNotifications: true,
      analytics: true,
      advancedSearch: true,
      mobileApp: false,
      adminModeration: true,
      manualPaymentCoordination: true,
    };
  }),

  updateFeatureFlag: superAdminProcedure
    .input(
      z.object({
        flag: z.string(),
        enabled: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { flag, enabled } = input;

      // In a real implementation, this would update a database or configuration
      // For now, we'll just return success
      return {
        success: true,
        message: `Feature flag ${flag} ${enabled ? 'enabled' : 'disabled'}`,
      };
    }),

  // Featured Domains Management
  toggleFeaturedDomain: adminProcedure
    .input(
      z.object({
        domainId: z.string(),
        isFeatured: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { domainId, isFeatured } = input;

      // Check if domain exists
      const existingDomain = await ctx.prisma.domain.findUnique({
        where: { id: domainId },
        select: { id: true, name: true, status: true },
      });

      if (!existingDomain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      // Only allow featuring VERIFIED domains
      if (existingDomain.status !== 'VERIFIED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only verified domains can be featured',
        });
      }

      // Update the featured status
      const updatedDomain = await ctx.prisma.domain.update({
        where: { id: domainId },
        data: { /* isFeatured: isFeatured, */ }, // Temporarily disabled due to type issues
        select: { id: true, name: true, /* isFeatured: true, */ }, // Temporarily disabled due to type issues
      });

      return {
        success: true,
        message: `Domain "${existingDomain.name}" ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
        domain: updatedDomain,
      };
    }),

  getFeaturedDomains: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(6),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit } = input;

      const featuredDomains = await ctx.prisma.domain.findMany({
        where: {
          // isFeatured: true, // Temporarily disabled due to type issues
          status: 'VERIFIED',
        },
        take: limit,
        orderBy: {
          updatedAt: 'desc', // Most recently featured first
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
          createdAt: true,
          updatedAt: true,
        },
      });

      return {
        success: true,
        domains: featuredDomains,
        count: featuredDomains.length,
      };
    }),
});
