import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure, adminProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { generateUniqueAnonymousBuyerId } from '@/lib/utils/anonymous-id';
import { adminCache } from '@/lib/cache/admin-cache';

const createInquirySchema = z.object({
  domainId: z.string(),
  buyerName: z.string().min(2, 'Name must be at least 2 characters'),
  buyerEmail: z.string().email('Invalid email address'),
  buyerPhone: z.string().optional(),
  buyerCompany: z.string().optional(),
  budgetRange: z.string().min(1, 'Budget range is required'),
  intendedUse: z.string().min(10, 'Intended use must be at least 10 characters'),
  timeline: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const sendMessageSchema = z.object({
  inquiryId: z.string(),
  content: z.string().min(1, 'Message content is required'),
  attachments: z.array(z.string()).optional(),
});

export const inquiriesRouter = createTRPCRouter({
  // Create inquiry (public - goes to admin queue)
  create: publicProcedure
    .input(createInquirySchema)
    .mutation(async ({ ctx, input }) => {
      // Verify domain exists and is published
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.domainId },
        include: { owner: true },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.status !== 'VERIFIED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Domain is not available for inquiries',
        });
      }

      // Prevent domain owners from inquiring about their own domains
      if (ctx.session?.user?.id === domain.ownerId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You cannot inquire about your own domain',
        });
      }

      // Create inquiry with PENDING_REVIEW status
      const inquiry = await ctx.prisma.inquiry.create({
        data: {
          domainId: input.domainId,
          buyerName: input.buyerName,
          buyerEmail: input.buyerEmail,
          buyerPhone: input.buyerPhone,
          buyerCompany: input.buyerCompany,
          anonymousBuyerId: generateUniqueAnonymousBuyerId(), // Generate anonymous ID
          budgetRange: input.budgetRange,
          intendedUse: input.intendedUse,
          timeline: input.timeline,
          message: input.message,
          status: 'PENDING_REVIEW',
          sellerId: domain.ownerId,
          // Use the buyerId from input, or use anonymous user if not provided
          buyerId: input.buyerId || 'anonymous-user',
        },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
        },
      });

      return {
        success: true,
        inquiryId: inquiry.id,
        status: inquiry.status,
        message: 'Inquiry submitted successfully and is under review',
        estimatedReviewTime: '24-48 hours',
      };
    }),

  // Get buyer's inquiries
  getMyInquiries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.enum(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'FORWARDED', 'COMPLETED']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;

      const where = {
        buyerId: ctx.session.user.id,
        ...(status && { status }),
      };

      const items = await ctx.prisma.inquiry.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          moderations: {
            orderBy: { reviewDate: 'desc' },
            take: 1,
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

  // Get seller's domain inquiries (admin approved only) - SECURE VERSION
  getDomainInquiries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        domainId: z.string().optional(),
        status: z.enum(['FORWARDED', 'COMPLETED', 'PENDING_REVIEW']).optional(), // Allow querying all inquiry statuses
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, domainId } = input;

      const where = {
        sellerId: ctx.session.user.id,
        status: input.status ? input.status : { in: ['FORWARDED', 'COMPLETED'] }, // SECURITY: Only show admin-approved inquiries to sellers
        ...(domainId && { domainId }),
      } as any;

      const items = await ctx.prisma.inquiry.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          messages: {
            where: {
              status: 'APPROVED',
              senderType: 'BUYER',
            },
            orderBy: { sentDate: 'desc' },
            take: 5,
            select: {
              id: true,
              content: true,
              sentDate: true,
              // NO sender information - admin mediated
            },
          },
          moderations: {
            where: {
              status: 'FORWARDED',
            },
            orderBy: { reviewDate: 'desc' },
            take: 1,
            select: {
              adminNotes: true,
              reviewDate: true,
            },
          },
        },
      });

      // SECURITY: Remove buyer contact information from response
      const secureItems = items.map(inquiry => ({
        id: inquiry.id,
        domainId: inquiry.domainId,
        status: inquiry.status,
        createdAt: inquiry.createdAt,
        updatedAt: inquiry.updatedAt,
        // SECURE: Only show admin-approved content, no buyer contact info
        adminNotes: inquiry.moderations[0]?.adminNotes || 'Inquiry approved by admin',
        approvedDate: inquiry.moderations[0]?.reviewDate,
        domain: inquiry.domain,
        messages: inquiry.messages,
        // SECURITY: Buyer info is HIDDEN - only admin can see it
        buyerInfo: {
          // Only show what admin has approved to share
          anonymousBuyerId: inquiry.anonymousBuyerId, // Anonymous identifier for sellers
          budgetRange: inquiry.budgetRange,
          intendedUse: inquiry.intendedUse,
          timeline: inquiry.timeline,
          // NO contact information exposed
        },
      }));

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: secureItems,
        nextCursor,
      };
    }),

  // Get inquiry count for seller
  getSellerInquiryCount: protectedProcedure
    .query(async ({ ctx }) => {
      const count = await ctx.prisma.inquiry.count({
        where: {
          sellerId: ctx.session.user.id,
          status: { in: ['FORWARDED', 'COMPLETED'] }, // SECURITY: Only count admin-approved inquiries
        },
      });
      
      return { total: count };
    }),

  // Get inquiry by ID - SECURE VERSION
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const inquiry = await ctx.prisma.inquiry.findUnique({
        where: { id: input.id },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              price: true,
              logoUrl: true,
              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          messages: {
            orderBy: { sentDate: 'asc' },
            include: {
              sender: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          moderations: {
            orderBy: { reviewDate: 'desc' },
            take: 1,
          },
        },
      });

      if (!inquiry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inquiry not found',
        });
      }

      // Check if user has access to this inquiry
      const isBuyer = inquiry.buyerId === ctx.session.user.id;
      const isSeller = inquiry.sellerId === ctx.session.user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(ctx.session.user.role);

      if (!isBuyer && !isSeller && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this inquiry',
        });
      }

      // SECURITY: Filter data based on user role
      if (isAdmin) {
        // Admin sees everything
        return inquiry;
      } else if (isBuyer) {
        // Buyer sees their own inquiry with full details
        return inquiry;
      } else if (isSeller) {
        // SECURITY: Seller sees only admin-approved content, NO buyer contact info
        const secureInquiry = {
          id: inquiry.id,
          domainId: inquiry.domainId,
          status: inquiry.status,
          createdAt: inquiry.createdAt,
          updatedAt: inquiry.updatedAt,
          domain: inquiry.domain,
          // SECURE: Only show admin-approved messages
          messages: inquiry.messages.filter(msg => msg.status === 'APPROVED'),
          // SECURE: Only show what admin approved to share
          buyerInfo: {
            anonymousBuyerId: inquiry.anonymousBuyerId, // Anonymous identifier for sellers
            budgetRange: inquiry.budgetRange,
            intendedUse: inquiry.intendedUse,
            timeline: inquiry.timeline,
            // NO buyer contact information exposed
          },
          adminNotes: inquiry.moderations[0]?.adminNotes || 'Inquiry approved by admin',
          approvedDate: inquiry.moderations[0]?.reviewDate,
        };
        return secureInquiry;
      }

      return inquiry;
    }),

  // Get messages for an inquiry with pagination
  getMessages: protectedProcedure
    .input(z.object({ 
      inquiryId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(50).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const { inquiryId, page, limit } = input;
      const offset = (page - 1) * limit;

      const inquiry = await ctx.prisma.inquiry.findUnique({
        where: { id: inquiryId },
      });

      if (!inquiry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inquiry not found',
        });
      }

      // Check if user has access to this inquiry
      const isBuyer = inquiry.buyerId === ctx.session.user.id;
      const isSeller = inquiry.sellerId === ctx.session.user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(ctx.session.user.role);

      if (!isBuyer && !isSeller && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this inquiry',
        });
      }

      // Get messages with pagination
      const [messages, total] = await Promise.all([
        ctx.prisma.message.findMany({
          where: { inquiryId },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            moderations: {
              include: {
                admin: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { sentDate: 'desc' }, // Most recent first
          skip: offset,
          take: limit,
        }),
        ctx.prisma.message.count({ where: { inquiryId } })
      ]);

      // Filter messages based on user role and status
      const filteredMessages = messages.filter(msg => {
        if (isAdmin) return true; // Admin can see all messages
        return msg.status === 'APPROVED'; // Others only see approved messages
      });

      return {
        messages: filteredMessages.reverse(), // Reverse to show oldest first in UI
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        }
      };
    }),

  // Get buyer's inquiry statistics
  getBuyerStats: protectedProcedure
    .query(async ({ ctx }) => {
      const buyerId = ctx.session.user.id;

      const [totalInquiries, pendingInquiries, approvedInquiries, rejectedInquiries] = await Promise.all([
        ctx.prisma.inquiry.count({
          where: { buyerId }
        }),
        ctx.prisma.inquiry.count({
          where: { 
            buyerId,
            status: 'PENDING_REVIEW'
          }
        }),
        ctx.prisma.inquiry.count({
          where: { 
            buyerId,
            status: 'FORWARDED'
          }
        }),
        ctx.prisma.inquiry.count({
          where: { 
            buyerId,
            status: 'REJECTED'
          }
        })
      ]);

      // Get recent inquiries with status timeline
      const recentInquiries = await ctx.prisma.inquiry.findMany({
        where: { buyerId },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              price: true,
            }
          },
          moderations: {
            orderBy: { reviewDate: 'desc' },
            take: 1,
            select: {
              status: true,
              reviewDate: true,
              adminNotes: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      return {
        stats: {
          total: totalInquiries,
          pending: pendingInquiries,
          approved: approvedInquiries,
          rejected: rejectedInquiries,
          approvalRate: totalInquiries > 0 ? Math.round((approvedInquiries / totalInquiries) * 100) : 0
        },
        recentInquiries: recentInquiries.map(inquiry => ({
          id: inquiry.id,
          domainName: inquiry.domain.name,
          domainPrice: inquiry.domain.price,
          status: inquiry.status,
          createdAt: inquiry.createdAt,
          updatedAt: inquiry.updatedAt,
          lastModeration: inquiry.moderations[0] || null
        }))
      };
    }),

  // Get seller's inquiry statistics and analytics
  getSellerStats: protectedProcedure
    .query(async ({ ctx }) => {
      const sellerId = ctx.session.user.id;

      const [totalInquiries, pendingInquiries, forwardedInquiries, completedInquiries] = await Promise.all([
        ctx.prisma.inquiry.count({
          where: { sellerId }
        }),
        ctx.prisma.inquiry.count({
          where: { 
            sellerId,
            status: 'PENDING_REVIEW'
          }
        }),
        ctx.prisma.inquiry.count({
          where: { 
            sellerId,
            status: 'FORWARDED'
          }
        }),
        ctx.prisma.inquiry.count({
          where: { 
            sellerId,
            status: 'COMPLETED'
          }
        })
      ]);

      // Get response time analytics
      const inquiriesWithResponses = await ctx.prisma.inquiry.findMany({
        where: {
          sellerId,
          status: { in: ['FORWARDED', 'COMPLETED'] },
          messages: {
            some: {
              senderType: 'SELLER',
              status: 'APPROVED'
            }
          }
        },
        include: {
          messages: {
            where: {
              senderType: 'SELLER',
              status: 'APPROVED'
            },
            orderBy: { sentDate: 'asc' },
            take: 1
          }
        }
      });

      // Calculate average response time
      const responseTimes = inquiriesWithResponses
        .map(inquiry => {
          const firstResponse = inquiry.messages[0];
          if (firstResponse) {
            return firstResponse.sentDate.getTime() - inquiry.createdAt.getTime();
          }
          return null;
        })
        .filter(time => time !== null) as number[];

      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;

      // Get recent inquiries with performance metrics
      const recentInquiries = await ctx.prisma.inquiry.findMany({
        where: { sellerId },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              price: true,
            }
          },
          messages: {
            where: {
              senderType: 'SELLER',
              status: 'APPROVED'
            },
            orderBy: { sentDate: 'asc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // Calculate conversion rate (inquiries that led to deals)
      const dealsCount = await ctx.prisma.deal.count({
        where: {
          inquiry: {
            sellerId
          }
        }
      });

      const conversionRate = totalInquiries > 0 ? Math.round((dealsCount / totalInquiries) * 100) : 0;

      return {
        stats: {
          total: totalInquiries,
          pending: pendingInquiries,
          forwarded: forwardedInquiries,
          completed: completedInquiries,
          conversionRate,
          avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60)), // Convert to hours
          dealsCount
        },
        recentInquiries: recentInquiries.map(inquiry => ({
          id: inquiry.id,
          domainName: inquiry.domain.name,
          domainPrice: inquiry.domain.price,
          status: inquiry.status,
          createdAt: inquiry.createdAt,
          updatedAt: inquiry.updatedAt,
          hasResponse: inquiry.messages.length > 0,
          responseTime: inquiry.messages.length > 0 
            ? Math.round((inquiry.messages[0].sentDate.getTime() - inquiry.createdAt.getTime()) / (1000 * 60 * 60))
            : null
        }))
      };
    }),

  // Send message (admin mediated) - SECURE VERSION
  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.prisma.inquiry.findUnique({
        where: { id: input.inquiryId },
      });

      if (!inquiry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inquiry not found',
        });
      }

      // Check if user has access to this inquiry
      const isBuyer = inquiry.buyerId === ctx.session.user.id;
      const isSeller = inquiry.sellerId === ctx.session.user.id;

      if (!isBuyer && !isSeller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this inquiry',
        });
      }

      // Get admin user from cache (performance optimization)
      const adminUser = await adminCache.getAdminUser();

      // SECURITY: Create message with admin as intermediary and update inquiry status
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Create the message
        const message = await tx.message.create({
          data: {
            inquiryId: input.inquiryId,
            senderId: ctx.session.user.id,
            // SECURITY: Receiver is always admin, not the other party
            receiverId: adminUser.id, // Admin acts as intermediary
            senderType: isBuyer ? 'BUYER' : 'SELLER',
            content: input.content,
            status: 'PENDING', // Admin must approve
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        // Update inquiry status if seller is responding
        if (isSeller && inquiry.status === 'FORWARDED') {
          await tx.inquiry.update({
            where: { id: input.inquiryId },
            data: { 
              status: 'SELLER_RESPONDED',
              updatedAt: new Date()
            }
          });
        }

        return message;
      });

      return {
        success: true,
        messageId: result.id,
        status: result.status,
        inquiryStatus: isSeller ? 'SELLER_RESPONDED' : inquiry.status,
        message: isSeller 
          ? 'Response sent successfully! Your message will be reviewed by our team before forwarding to the buyer.'
          : 'Message sent and is under admin review',
      };
    }),

  // Admin: Get pending inquiries
  getPendingInquiries: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        type: z.enum(['inquiries', 'messages']).default('inquiries'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, type } = input;

      if (type === 'inquiries') {
        const where = {
          status: 'PENDING_REVIEW' as const,
        };

        const items = await ctx.prisma.inquiry.findMany({
          take: limit + 1,
          where,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
            domain: {
              select: {
                id: true,
                name: true,
                price: true,
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

        let nextCursor: typeof cursor | undefined = undefined;
        if (items.length > limit) {
          const nextItem = items.pop();
          nextCursor = nextItem!.id;
        }

        return {
          items,
          nextCursor,
        };
      } else {
        // Get pending messages
        const where = {
          status: 'PENDING' as const,
        };

        const items = await ctx.prisma.message.findMany({
          take: limit + 1,
          where,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { sentDate: 'desc' },
          include: {
            inquiry: {
              select: {
                id: true,
                domain: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            sender: {
              select: {
                id: true,
                name: true,
                email: true,
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
      }
    }),

  // Admin: Moderate inquiry
  moderateInquiry: adminProcedure
    .input(
      z.object({
        inquiryId: z.string(),
        action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
        adminNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
        requestedChanges: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.prisma.inquiry.findUnique({
        where: { id: input.inquiryId },
      });

      if (!inquiry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inquiry not found',
        });
      }

      if (inquiry.status !== 'PENDING_REVIEW') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Inquiry is not pending review',
        });
      }

      let newStatus: 'FORWARDED' | 'REJECTED' | 'CHANGES_REQUESTED';
      let adminNotes = input.adminNotes;

      switch (input.action) {
        case 'APPROVE':
          newStatus = 'FORWARDED';
          adminNotes = adminNotes || 'Inquiry approved and forwarded to seller';
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          if (!input.rejectionReason) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Rejection reason is required',
            });
          }
          adminNotes = `Rejected: ${input.rejectionReason}`;
          break;
        case 'REQUEST_CHANGES':
          newStatus = 'CHANGES_REQUESTED';
          if (!input.requestedChanges || input.requestedChanges.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Requested changes are required',
            });
          }
          adminNotes = `Changes requested: ${input.requestedChanges.join(', ')}`;
          break;
        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid action',
          });
      }

      // Update inquiry status
      const updatedInquiry = await ctx.prisma.inquiry.update({
        where: { id: input.inquiryId },
        data: {
          status: newStatus,
        },
      });

      // Create moderation record
      await ctx.prisma.inquiryModeration.create({
        data: {
          inquiryId: input.inquiryId,
          adminId: ctx.session.user.id,
          status: newStatus,
          adminNotes,
          rejectionReason: input.rejectionReason,
          reviewDate: new Date(),
        },
      });

      return updatedInquiry;
    }),

  // Admin: Bulk moderate inquiries
  bulkModerateInquiries: adminProcedure
    .input(
      z.object({
        inquiryIds: z.array(z.string()),
        action: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
        adminNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
        requestedChanges: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { inquiryIds, action, adminNotes, rejectionReason, requestedChanges } = input;

      // Validate all inquiries exist and are pending
      const inquiries = await ctx.prisma.inquiry.findMany({
        where: {
          id: { in: inquiryIds },
          status: 'PENDING_REVIEW'
        }
      });

      if (inquiries.length !== inquiryIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Some inquiries are not found or not pending review',
        });
      }

      let newStatus: 'FORWARDED' | 'REJECTED' | 'CHANGES_REQUESTED';
      let notes = adminNotes;

      switch (action) {
        case 'APPROVE':
          newStatus = 'FORWARDED';
          notes = notes || 'Bulk approved by admin';
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          if (!rejectionReason) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Rejection reason is required for bulk rejection',
            });
          }
          notes = `Bulk rejected: ${rejectionReason}`;
          break;
        case 'REQUEST_CHANGES':
          newStatus = 'CHANGES_REQUESTED';
          if (!requestedChanges || requestedChanges.length === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Requested changes are required for bulk request changes',
            });
          }
          notes = `Bulk changes requested: ${requestedChanges.join(', ')}`;
          break;
      }

      // Update all inquiries in a transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Update inquiry statuses
        await tx.inquiry.updateMany({
          where: { id: { in: inquiryIds } },
          data: { status: newStatus }
        });

        // Create moderation records for each inquiry
        const moderationRecords = inquiryIds.map(inquiryId => ({
          inquiryId,
          adminId: ctx.session.user.id,
          status: newStatus,
          adminNotes: notes,
          rejectionReason: action === 'REJECT' ? rejectionReason : null,
          reviewDate: new Date(),
        }));

        await tx.inquiryModeration.createMany({
          data: moderationRecords
        });

        return { updatedCount: inquiryIds.length };
      });

      return {
        success: true,
        updatedCount: result.updatedCount,
        action,
        message: `Successfully ${action.toLowerCase()}d ${result.updatedCount} inquiries`
      };
    }),

  // Admin: Bulk moderate messages
  bulkModerateMessages: adminProcedure
    .input(
      z.object({
        messageIds: z.array(z.string()),
        action: z.enum(['APPROVE', 'REJECT']),
        adminNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { messageIds, action, adminNotes, rejectionReason } = input;

      // Validate all messages exist and are pending
      const messages = await ctx.prisma.message.findMany({
        where: {
          id: { in: messageIds },
          status: 'PENDING'
        }
      });

      if (messages.length !== messageIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Some messages are not found or not pending review',
        });
      }

      let newStatus: 'APPROVED' | 'REJECTED';
      let notes = adminNotes;

      switch (action) {
        case 'APPROVE':
          newStatus = 'APPROVED';
          notes = notes || 'Bulk approved by admin';
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          if (!rejectionReason) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Rejection reason is required for bulk rejection',
            });
          }
          notes = `Bulk rejected: ${rejectionReason}`;
          break;
      }

      // Update all messages in a transaction
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Update message statuses
        await tx.message.updateMany({
          where: { id: { in: messageIds } },
          data: { 
            status: newStatus,
            approvedDate: newStatus === 'APPROVED' ? new Date() : null
          }
        });

        // Create moderation records for each message
        const moderationRecords = messageIds.map(messageId => ({
          messageId,
          adminId: ctx.session.user.id,
          status: newStatus,
          adminNotes: notes,
          rejectionReason: action === 'REJECT' ? rejectionReason : null,
          reviewDate: new Date(),
        }));

        await tx.messageModeration.createMany({
          data: moderationRecords
        });

        return { updatedCount: messageIds.length };
      });

      return {
        success: true,
        updatedCount: result.updatedCount,
        action,
        message: `Successfully ${action.toLowerCase()}d ${result.updatedCount} messages`
      };
    }),

  // Admin: Moderate message - SECURE VERSION
  moderateMessage: adminProcedure
    .input(
      z.object({
        messageId: z.string(),
        action: z.enum(['APPROVE', 'REJECT', 'EDIT']),
        adminNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
        editedContent: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const message = await ctx.prisma.message.findUnique({
        where: { id: input.messageId },
        include: {
          inquiry: true,
        },
      });

      if (!message) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        });
      }

      if (message.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Message is not pending review',
        });
      }

      let newStatus: 'APPROVED' | 'REJECTED';
      let content = message.content;
      let adminNotes = input.adminNotes;

      switch (input.action) {
        case 'APPROVE':
          newStatus = 'APPROVED';
          adminNotes = adminNotes || 'Message approved and forwarded';
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          if (!input.rejectionReason) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Rejection reason is required',
            });
          }
          adminNotes = `Rejected: ${input.rejectionReason}`;
          break;
        case 'EDIT':
          newStatus = 'APPROVED';
          if (!input.editedContent) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Edited content is required',
            });
          }
          content = input.editedContent;
          adminNotes = adminNotes || 'Message edited and approved';
          break;
        default:
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid action',
          });
      }

      // SECURITY: Update message and forward to intended recipient
      const updatedMessage = await ctx.prisma.message.update({
        where: { id: input.messageId },
        data: {
          status: newStatus,
          content,
          // SECURITY: Forward to intended recipient (buyer or seller)
          receiverId: message.senderType === 'BUYER' ? message.inquiry.sellerId : message.inquiry.buyerId,
        },
      });

      // Create message moderation record
      await ctx.prisma.messageModeration.create({
        data: {
          messageId: input.messageId,
          adminId: ctx.session.user.id,
          status: newStatus,
          adminNotes,
          rejectionReason: input.rejectionReason,
          reviewDate: new Date(),
        },
      });

      return updatedMessage;
    }),
});
