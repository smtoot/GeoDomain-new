import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
  getSellerStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;

      // Get basic counts using simple Prisma queries
      const totalInquiries = await ctx.prisma.inquiry.count({
        where: { sellerId: userId }
      });

      const openInquiries = await ctx.prisma.inquiry.count({
        where: { 
          sellerId: userId,
          status: 'OPEN'
        }
      });

      const totalDomains = await ctx.prisma.domain.count({
        where: { ownerId: userId }
      });

      const verifiedDomains = await ctx.prisma.domain.count({
        where: { 
          ownerId: userId,
          status: 'VERIFIED'
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

      // Calculate simple metrics
      const conversionRate = totalInquiries > 0 ? Math.round((completedDeals / totalInquiries) * 100) : 0;

      return {
        stats: {
          total: totalInquiries,
          open: openInquiries,
          closed: totalInquiries - openInquiries,
          domains: totalDomains,
          verifiedDomains: verifiedDomains,
          deals: totalDeals,
          completedDeals: completedDeals,
          conversionRate: conversionRate,
          avgResponseTime: 24, // Default value
        }
      };
    } catch (error) {
      console.error("Error in getSellerStats:", error);
      return {
        stats: {
          total: 0,
          open: 0,
          closed: 0,
          domains: 0,
          verifiedDomains: 0,
          deals: 0,
          completedDeals: 0,
          conversionRate: 0,
          avgResponseTime: 0,
        }
      };
    }
  }),

  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    try {
      const userId = ctx.session.user.id;

      // Get recent inquiries
      const recentInquiries = await ctx.prisma.inquiry.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          domain: {
            select: { name: true }
          },
          buyer: {
            select: { name: true, email: true }
          }
        }
      });

      return {
        inquiries: recentInquiries.map(inquiry => ({
          id: inquiry.id,
          type: 'inquiry',
          message: `New inquiry for ${inquiry.domain.name}`,
          from: inquiry.buyer.name || inquiry.buyer.email,
          date: inquiry.createdAt,
        }))
      };
    } catch (error) {
      console.error("Error in getRecentActivity:", error);
      return { inquiries: [] };
    }
  }),
});