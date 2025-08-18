import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

export const paymentsRouter = createTRPCRouter({
  // Upload payment proof
  uploadProof: protectedProcedure
    .input(
      z.object({
        dealId: z.string(),
        paymentProofUrl: z.string().url('Payment proof must be a valid URL'),
        paymentMethod: z.enum(['ESCROW_COM', 'PAYPAL', 'WIRE_TRANSFER', 'CRYPTO', 'OTHER']),
        amount: z.number().positive('Amount must be positive'),
        currency: z.string().default('USD'),
        transactionId: z.string().optional(),
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

      // Only buyer can upload payment proof
      if (deal.buyerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the buyer can upload payment proof',
        });
      }

      if (deal.status !== 'PAYMENT_PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Deal is not in payment pending status',
        });
      }

      // Create payment record
      const payment = await ctx.prisma.payment.create({
        data: {
          dealId: input.dealId,
          paymentMethod: input.paymentMethod,
          amount: input.amount,
          currency: input.currency,
          paymentInstructions: input.paymentProofUrl || '',
          externalReference: input.transactionId,
          serviceProvider: input.paymentMethod,
          serviceInstructions: input.paymentProofUrl || '',
          adminNotes: input.notes,
          status: 'PENDING',
        },
        include: {
          deal: {
            select: {
              agreedPrice: true,
              currency: true,
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
          },
        },
      });

      return {
        success: true,
        paymentId: payment.id,
        status: payment.status,
        message: 'Payment proof uploaded successfully. Admin will verify and update status.',
      };
    }),

  // Get payment status
  getPaymentStatus: protectedProcedure
    .input(z.object({ dealId: z.string() }))
    .query(async ({ ctx, input }) => {
      const deal = await ctx.prisma.deal.findUnique({
        where: { id: input.dealId },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
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

      return {
        dealId: deal.id,
        dealStatus: deal.status,
        paymentStatus: deal.payments[0]?.status || 'NO_PAYMENT',
        payment: deal.payments[0] || null,
      };
    }),

  // Admin: Get pending payment verifications
  getPendingVerifications: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const where = {
        status: 'PENDING' as const,
      };

      const items = await ctx.prisma.payment.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          deal: {
            select: {
              id: true,
              agreedPrice: true,
              currency: true,
              status: true,
              inquiry: {
                select: {
                  buyerName: true,
                  buyerEmail: true,
                  domain: {
                    select: {
                      id: true,
                      name: true,
                      logoUrl: true,
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
          },
          // Note: Payment model doesn't have uploadedByUser relation
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

  // Admin: Verify payment
  verifyPayment: adminProcedure
    .input(
      z.object({
        paymentId: z.string(),
        action: z.enum(['APPROVE', 'REJECT']),
        adminNotes: z.string().optional(),
        rejectionReason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const payment = await ctx.prisma.payment.findUnique({
        where: { id: input.paymentId },
        include: {
          deal: true,
        },
      });

      if (!payment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Payment not found',
        });
      }

      if (payment.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Payment is not pending verification',
        });
      }

      let newStatus: 'CONFIRMED' | 'FAILED';
      let adminNotes = input.adminNotes;

      if (input.action === 'APPROVE') {
        newStatus = 'CONFIRMED';
        adminNotes = adminNotes || 'Payment verified by admin';
        
        // Update deal status to payment confirmed
        await ctx.prisma.deal.update({
          where: { id: payment.dealId },
          data: {
            status: 'PAYMENT_CONFIRMED',
            paymentConfirmedDate: new Date(),
          },
        });
      } else {
        newStatus = 'FAILED';
        if (!input.rejectionReason) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Rejection reason is required',
          });
        }
        adminNotes = `Rejected: ${input.rejectionReason}`;
      }

      const updatedPayment = await ctx.prisma.payment.update({
        where: { id: input.paymentId },
        data: {
          status: newStatus,
          adminNotes,
          verificationDate: new Date(),
        },
        include: {
          deal: {
            select: {
              id: true,
              status: true,
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
          },
        },
      });

      return updatedPayment;
    }),

  // Get payment history
  getPaymentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
        status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, status } = input;

      const where = {
        // Note: Payment model doesn't have uploadedBy field
        ...(status && { status }),
      };

      const items = await ctx.prisma.payment.findMany({
        take: limit + 1,
        where,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          deal: {
            select: {
              id: true,
              agreedPrice: true,
              currency: true,
              status: true,
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
