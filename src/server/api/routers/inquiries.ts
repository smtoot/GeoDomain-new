import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const inquiriesRouter = createTRPCRouter({
  getSellerInquiryCount: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;
      
      const count = await ctx.prisma.inquiry.count({
        where: { sellerId: userId }
      });

      return { count };
    } catch (error) {
      console.error("Error in getSellerInquiryCount:", error);
      return { count: 0 };
    }
  }),

  getSellerInquiries: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;
        const { limit, cursor } = input;

        const inquiries = await ctx.prisma.inquiry.findMany({
          take: limit + 1,
          where: { sellerId: userId },
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
          },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (inquiries.length > limit) {
          const nextItem = inquiries.pop();
          nextCursor = nextItem!.id;
        }

        return {
          items: inquiries,
          nextCursor,
        };
      } catch (error) {
        console.error("Error in getSellerInquiries:", error);
        return { items: [], nextCursor: undefined };
      }
    }),

  getSellerStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;

      const totalInquiries = await ctx.prisma.inquiry.count({
        where: { sellerId: userId }
      });

      const openInquiries = await ctx.prisma.inquiry.count({
        where: { 
          sellerId: userId,
          status: 'OPEN'
        }
      });

      const totalDeals = await ctx.prisma.deal.count({
        where: { sellerId: userId }
      });

      const completedDeals = await ctx.prisma.deal.count({
        where: {
          sellerId: userId,
          status: 'COMPLETED'
        }
      });

      const conversionRate = totalInquiries > 0 ? Math.round((completedDeals / totalInquiries) * 100) : 0;

      return {
        stats: {
          total: totalInquiries,
          open: openInquiries,
          closed: totalInquiries - openInquiries,
          deals: totalDeals,
          completedDeals: completedDeals,
          conversionRate: conversionRate,
          avgResponseTime: 24,
        }
      };
    } catch (error) {
      console.error("Error in getSellerStats:", error);
      return {
        stats: {
          total: 0,
          open: 0,
          closed: 0,
          deals: 0,
          completedDeals: 0,
          conversionRate: 0,
          avgResponseTime: 0,
        }
      };
    }
    }),
});