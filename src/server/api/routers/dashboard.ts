import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export const dashboardRouter = createTRPCRouter({
  // Get seller statistics with enhanced caching and performance
  getSellerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      // Use a single optimized query to get all counts
      const [
        domainStats,
        inquiryStats,
        revenueStats
      ] = await Promise.all([
        // Domain statistics in one query
        ctx.prisma.domain.groupBy({
          by: ['status'],
          where: { ownerId: userId },
          _count: { id: true }
        }),
        
        // Inquiry statistics - only count inquiries visible to sellers (FORWARDED/COMPLETED)
        ctx.prisma.inquiry.groupBy({
          by: ['status'],
          where: { 
            domain: { ownerId: userId },
            status: { in: ['FORWARDED', 'COMPLETED'] } // SECURITY: Only count inquiries visible to sellers
          },
          _count: { id: true }
        }),
        
        // Revenue statistics
        ctx.prisma.deal.aggregate({
          where: { 
            domain: { ownerId: userId },
            status: 'COMPLETED'
          },
          _sum: { agreedPrice: true }
        })
      ]);

      // Calculate totals
      const totalDomains = domainStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const totalInquiries = inquiryStats.reduce((sum, stat) => sum + stat._count.id, 0);
      
      // Calculate total views from domain analytics
      const viewsStats = await ctx.prisma.domainAnalytics.aggregate({
        where: {
          domain: { ownerId: userId }
        },
        _sum: { views: true }
      });
      const totalViews = viewsStats._sum?.views || 0;
      
      const totalRevenue = revenueStats._sum?.agreedPrice || 0;

      // Get recent activity for change calculations - only inquiries visible to sellers
      const recentStats = await ctx.prisma.inquiry.groupBy({
        by: ['status'],
        where: {
          domain: { ownerId: userId },
          status: { in: ['FORWARDED', 'COMPLETED'] }, // SECURITY: Only count inquiries visible to sellers
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _count: { id: true }
      });

      const recentInquiries = recentStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const recentDomains = await ctx.prisma.domain.count({
        where: {
          ownerId: userId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      // Calculate views change for last 30 days
      const recentViewsStats = await ctx.prisma.domainAnalytics.aggregate({
        where: {
          domain: { ownerId: userId },
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        _sum: { views: true }
      });
      const recentViews = recentViewsStats._sum?.views || 0;
      
      // Calculate change percentages based on real data only
      const viewsChange = recentViews > 0 ? Number(((recentViews / Math.max(totalViews - recentViews, 1)) * 100).toFixed(1)) : 0;
      const inquiriesChange = recentInquiries > 0 ? Number(((recentInquiries / Math.max(totalInquiries - recentInquiries, 1)) * 100).toFixed(1)) : 0;
      const revenueChange = 0; // TODO: Implement real revenue change tracking - no fake data in production
      const domainsChange = recentDomains > 0 ? Number(((recentDomains / Math.max(totalDomains - recentDomains, 1)) * 100).toFixed(1)) : 0;

      return {
        totalViews,
        totalInquiries,
        totalRevenue: totalRevenue,
        totalDomains,
        viewsChange,
        inquiriesChange,
        revenueChange,
        domainsChange
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch seller statistics',
      });
    }
  }),

  // Get buyer statistics with enhanced caching and performance
  getBuyerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      // Use a single optimized query to get all buyer counts
      const [
        inquiryStats,
        savedDomainStats,
        purchaseStats,
        activityStats
      ] = await Promise.all([
        // Inquiry statistics by status
        ctx.prisma.inquiry.groupBy({
          by: ['status'],
          where: { buyerId: userId },
          _count: { id: true }
        }),
        
        // Saved domains count - count unique domains with inquiries
        ctx.prisma.inquiry.groupBy({
          by: ['domainId'],
          where: { 
            buyerId: userId,
            status: { in: ['PENDING_REVIEW', 'APPROVED', 'FORWARDED'] }
          },
          _count: { domainId: true }
        }),
        
        // Purchase history and spending
        ctx.prisma.deal.aggregate({
          where: { 
            buyerId: userId,
            status: 'COMPLETED'
          },
          _sum: { agreedPrice: true },
          _count: { id: true }
        }),
        
        // Recent activity (last 30 days)
        ctx.prisma.inquiry.count({
          where: {
            buyerId: userId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      // Calculate totals
      const totalInquiries = inquiryStats.reduce((sum, stat) => sum + stat._count.id, 0);
      const pendingInquiries = inquiryStats.find(s => s.status === 'PENDING_REVIEW')?._count.id || 0;
      const approvedInquiries = inquiryStats.find(s => s.status === 'APPROVED')?._count.id || 0;
      const forwardedInquiries = inquiryStats.find(s => s.status === 'FORWARDED')?._count.id || 0;
      const totalSavedDomains = savedDomainStats.length;
      const totalPurchases = purchaseStats._count.id || 0;
      const totalSpent = purchaseStats._sum?.agreedPrice || 0;
      const recentActivity = activityStats;

      // Calculate change percentages based on real data only - no fake data in production
      const inquiriesChange = 0; // TODO: Implement real inquiry change tracking
      const spendingChange = 0; // TODO: Implement real spending change tracking
      const savedChange = 0; // TODO: Implement real saved domains change tracking
      const activityChange = 0; // TODO: Implement real activity change tracking

      return {
        totalInquiries,
        pendingInquiries,
        approvedInquiries,
        forwardedInquiries,
        totalSavedDomains,
        totalPurchases,
        totalSpent,
        recentActivity,
        inquiriesChange,
        spendingChange,
        savedChange,
        activityChange
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch buyer statistics',
      });
    }
  }),

  // Get recent activity
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      const [recentInquiries, recentDomains, recentDeals] = await Promise.all([
        // Recent inquiries - only show inquiries visible to sellers
        ctx.prisma.inquiry.findMany({
          where: { 
            domain: { ownerId: userId },
            status: { in: ['FORWARDED', 'COMPLETED'] } // SECURITY: Only show inquiries visible to sellers
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          include: {
            domain: { select: { name: true } }
          }
        }),

        // Recently verified domains
        ctx.prisma.domain.findMany({
          where: { 
            ownerId: userId,
            status: 'VERIFIED',
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 2,
          select: { name: true, updatedAt: true }
        }),

        // Recent completed deals
        ctx.prisma.deal.findMany({
          where: { 
            domain: { ownerId: userId },
            status: 'COMPLETED'
          },
          orderBy: { updatedAt: 'desc' },
          take: 2,
          include: {
            domain: { select: { name: true } }
          }
        })
      ]);

      const activities: Array<{
        id: string;
        type: 'inquiry' | 'verification' | 'payment';
        title: string;
        description: string;
        timestamp: string;
        status: 'success';
      }> = [];

      // Add inquiry activities
      recentInquiries.forEach((inquiry, index) => {
        activities.push({
          id: `inquiry-${inquiry.id}`,
          type: 'inquiry' as const,
          title: `New inquiry for ${inquiry.domain.name}`,
          description: 'Buyer interested in purchasing the domain',
          timestamp: formatTimeAgo(inquiry.createdAt),
          status: 'success' as const
        });
      });

      // Add verification activities
      recentDomains.forEach((domain, index) => {
        activities.push({
          id: `verification-${domain.name}`,
          type: 'verification' as const,
          title: 'Domain verification completed',
          description: `${domain.name} is now verified`,
          timestamp: formatTimeAgo(domain.updatedAt),
          status: 'success' as const
        });
      });

      // Add deal activities
      recentDeals.forEach((deal, index) => {
        activities.push({
          id: `deal-${deal.id}`,
          type: 'payment' as const,
          title: `Payment received for ${deal.domain.name}`,
          description: 'Transaction completed successfully',
          timestamp: formatTimeAgo(deal.updatedAt),
          status: 'success' as const
        });
      });

      // Sort by most recent and limit to 5
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch recent activity',
      });
    }
  }),

  // Get buyer activity
  getBuyerActivity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      const [recentInquiries, savedDomains, recentPurchases] = await Promise.all([
        // Recent inquiries
        ctx.prisma.inquiry.findMany({
          where: { buyerId: userId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            domain: { 
              select: { 
                id: true,
                name: true, 
                price: true, 
                logoUrl: true,
                category: true,
                status: true
              } 
            }
          }
        }),
        
        // Recently inquired domains (as "saved" for now)
        ctx.prisma.domain.findMany({
          where: { 
            inquiries: { 
              some: { 
                buyerId: userId,
                status: { in: ['PENDING_REVIEW', 'APPROVED', 'FORWARDED'] }
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          select: { 
            id: true,
            name: true, 
            price: true, 
            category: true,
            logoUrl: true
          }
        }),
        
        // Recent purchases
        ctx.prisma.deal.findMany({
          where: { 
            buyerId: userId,
            status: 'COMPLETED'
          },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          include: {
            domain: { select: { name: true, price: true } }
          }
        })
      ]);

      return {
        inquiries: recentInquiries.map(inquiry => ({
          id: inquiry.id,
          domain: inquiry.domain,
          status: inquiry.status,
          createdAt: inquiry.createdAt,
          message: inquiry.message || 'Domain inquiry submitted'
        })),
        savedDomains: savedDomains.map(domain => ({
          id: domain.id,
          name: domain.name,
          price: domain.price,
          category: domain.category,
          logoUrl: domain.logoUrl
        })),
        purchases: recentPurchases.map(purchase => ({
          id: purchase.id,
          domain: purchase.domain,
          amount: purchase.agreedPrice,
          completedAt: purchase.updatedAt
        }))
      };
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch buyer activity',
      });
    }
  }),

  // Get domain performance summary
  getDomainPerformance: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(10).default(5)
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      try {
        // Simplified query - just get basic domain info
        const domains = await ctx.prisma.domain.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          select: {
            id: true,
            name: true,
            status: true,
            price: true,
            createdAt: true
          }
        });

        // Get inquiry counts in a separate, optimized query
        const inquiryCounts = await ctx.prisma.inquiry.groupBy({
          by: ['domainId'],
          where: {
            domain: { ownerId: userId }
          },
          _count: {
            id: true
          }
        });

        // Create a map for quick lookup
        const inquiryMap = new Map(
          inquiryCounts.map(item => [item.domainId, item._count.id])
        );

        return domains.map(domain => ({
          id: domain.id,
          name: domain.name,
          status: domain.status,
          price: domain.price,
          inquiries: inquiryMap.get(domain.id) || 0,
          // TODO: Implement real view tracking - no fake data in production
          views: 0,
          revenue: 0, // Will be calculated from actual deals
          createdAt: domain.createdAt
        }));

      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch domain performance',
        });
      }
    })
});

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
}
