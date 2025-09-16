import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

const createDealSchema = z.object({
  inquiryId: z.string(),
  agreedPrice: z.number().positive('Price must be positive'),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['ESCROW_COM', 'PAYPAL', 'WIRE_TRANSFER', 'CRYPTO', 'OTHER']),
  paymentInstructions: z.string().min(10, 'Payment instructions must be at least 10 characters'),
  timeline: z.string().min(1, 'Timeline is required'),
  terms: z.string().min(10, 'Terms must be at least 10 characters'),
});

export const dealsRouter = createTRPCRouter({
  // Create deal agreement
  createAgreement: adminProcedure
    .input(createDealSchema)
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.prisma.inquiry.findUnique({
        where: { id: input.inquiryId },
        include: {
          domain: {
            select: {
              id: true,
              name: true,
              ownerId: true,
            },
          },
        },
      });

      if (!inquiry) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Inquiry not found',
        });
      }

      if (inquiry.status !== 'OPEN') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Inquiry must be open before creating a deal',
        });
      }

      // Check if deal already exists for this inquiry
      const existingDeal = await ctx.prisma.deal.findFirst({
        where: { inquiryId: input.inquiryId },
      });

      if (existingDeal) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Deal already exists for this inquiry',
        });
      }

      const deal = await ctx.prisma.deal.create({
        data: {
          inquiryId: input.inquiryId,
          buyerId: inquiry.buyerId!,
          sellerId: inquiry.sellerId,
          domainId: inquiry.domainId,
          agreedPrice: input.agreedPrice,
          currency: input.currency,
          paymentMethod: input.paymentMethod,
          paymentInstructions: input.paymentInstructions,
          timeline: input.timeline,
          terms: input.terms,
          status: 'AGREED',
          agreedDate: new Date(),
        },
        include: {
          inquiry: {
            select: {
              buyerName: true,
              buyerEmail: true,
              domain: {
                select: {
                  name: true,
                  owner: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Update inquiry status to CONVERTED_TO_DEAL
      await ctx.prisma.inquiry.update({
        where: { id: input.inquiryId },
        data: { 
          status: 'CONVERTED_TO_DEAL',
          updatedAt: new Date()
        },
      });

      return {
        success: true,
        dealId: deal.id,
        status: deal.status,
        message: 'Deal agreement created successfully and inquiry status updated',
      };
    }),

  // Get user's deals
  getMyDeals: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.enum(['NEGOTIATING', 'AGREED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'TRANSFER_INITIATED', 'COMPLETED', 'DISPUTED']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;

      const where = {
        OR: [
          { buyerId: ctx.session.user.id },
          { sellerId: ctx.session.user.id },
        ],
        ...(status && { status }),
      };

      const items = await ctx.prisma.deal.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          inquiry: {
            select: {
              buyerName: true,
              buyerEmail: true,
              domain: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
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

  // Get deal by ID
  getDealById: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.prisma.deal.findUnique({
        where: { id: input.dealId },
        include: {
          inquiry: {
            select: {
              buyerName: true,
              buyerEmail: true,
              buyerPhone: true,
              buyerCompany: true,
              budgetRange: true,
              intendedUse: true,
              timeline: true,
              message: true,
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
                      phone: true,
                    },
                  },
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
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          // Note: No admin relation in Deal model
        },
      });

      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      // Check if user has access to this deal
      const isBuyer = deal.buyerId === ctx.session.user.id;
      const isSeller = deal.sellerId === ctx.session.user.id;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(ctx.session.user.role);

      if (!isBuyer && !isSeller && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this deal',
        });
      }

      return deal;
    }),

  // Update deal status
  updateDealStatus: adminProcedure
    .input(
      z.object({
        dealId: z.string(),
        status: z.enum(['AGREED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'TRANSFER_INITIATED', 'COMPLETED', 'DISPUTED']),
        adminNotes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.prisma.deal.findUnique({
        where: { id: input.dealId },
      });

      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      const updatedDeal = await ctx.prisma.deal.update({
        where: { id: input.dealId },
        data: {
          status: input.status,
          adminNotes: input.adminNotes,
          ...(input.status === 'PAYMENT_CONFIRMED' && { paymentConfirmedDate: new Date() }),
          ...(input.status === 'TRANSFER_INITIATED' && { transferInitiatedDate: new Date() }),
          ...(input.status === 'COMPLETED' && { completedDate: new Date() }),
        },
        include: {
          inquiry: {
            select: {
              buyerName: true,
              buyerEmail: true,
              domain: {
                select: {
                  name: true,
                  owner: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return updatedDeal;
    }),

  // Track payment
  trackPayment: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        paymentProof: z.string().url('Payment proof must be a valid URL'),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const deal = await ctx.prisma.deal.findUnique({
        where: { id: input.dealId },
      });

      if (!deal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Deal not found',
        });
      }

      // Only buyer can track payment
      if (deal.buyerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the buyer can track payment',
        });
      }

      if (deal.status !== 'PAYMENT_PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Deal is not in payment pending status',
        });
      }

      const updatedDeal = await ctx.prisma.deal.update({
        where: { id: input.dealId },
        data: {
          status: 'PAYMENT_CONFIRMED',
          paymentConfirmedDate: new Date(),
          adminNotes: input.notes ? `Payment proof provided: ${input.notes}` : 'Payment proof provided',
        },
        include: {
          inquiry: {
            select: {
              buyerName: true,
              buyerEmail: true,
              domain: {
                select: {
                  name: true,
                  owner: {
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        dealId: updatedDeal.id,
        status: updatedDeal.status,
        message: 'Payment tracked successfully. Admin will verify and update status.',
      };
    }),

  // Admin: Get all active deals
  getActiveDeals: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.enum(['AGREED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'TRANSFER_INITIATED', 'COMPLETED', 'DISPUTED']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;

      const where = {
        ...(status && { status }),
      };

      const items = await ctx.prisma.deal.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          inquiry: {
            select: {
              buyerName: true,
              buyerEmail: true,
              domain: {
                select: {
                  id: true,
                  name: true,
                  logoUrl: true,
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
});
