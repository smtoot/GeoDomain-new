import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { cache, cacheKeys } from '@/lib/cache/redis';
import { createDatabaseError } from '@/lib/errors/api-errors';

export const dashboardRouter = createTRPCRouter({
  /**
   * Get comprehensive seller statistics with real-time change tracking
   * @description Retrieves seller dashboard statistics including domains, inquiries, revenue, and views
   * @returns Object containing total counts and percentage changes from previous period
   * @example
   * ```typescript
   * const stats = await api.dashboard.getSellerStats.query();
   * // Returns: { totalViews, totalInquiries, totalRevenue, totalDomains, viewsChange, ... }
   * ```
   */
  getSellerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      // Generate cache key
      const cacheKey = cacheKeys.user(`seller-stats:${userId}`);
      
      // Try to get from cache first (with error handling)
      let cached = null;
      try {
        cached = await cache.get(cacheKey);
        if (cached !== null) {
          // Dashboard stats served from cache
          return cached;
        }
      } catch {
        // Cache get failed, proceeding without cache
      }
      // PERFORMANCE OPTIMIZATION: Use individual queries for better error handling
      const [totalDomains, totalInquiries, totalRevenue, totalSales, totalViews] = await Promise.all([
        ctx.prisma.domain.count({
          where: { ownerId: userId }
        }),
        ctx.prisma.inquiry.count({
          where: { 
            domain: { ownerId: userId },
            status: { in: ['OPEN', 'CLOSED'] }
          }
        }),
        ctx.prisma.deal.aggregate({
          where: { 
            domain: { ownerId: userId },
            status: 'COMPLETED'
          },
          _sum: { agreedPrice: true }
        }),
        ctx.prisma.deal.count({
          where: {
            domain: { ownerId: userId },
            status: 'COMPLETED'
          }
        }),
        ctx.prisma.domainAnalytics.aggregate({
          where: {
            domain: { ownerId: userId }
          },
          _sum: { views: true }
        })
      ]);

      // Extract values from the query results
      const totalRevenueValue = totalRevenue._sum?.agreedPrice || 0;
      const totalViewsValue = totalViews._sum?.views || 0;

      // PERFORMANCE OPTIMIZATION: Get recent activity in a single query
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const recentStats = await ctx.prisma.$queryRaw<Array<{
        recent_inquiries: bigint;
        recent_domains: bigint;
        recent_views: bigint;
      }>>`
        SELECT 
          (SELECT COUNT(*) FROM "Inquiry" i 
           JOIN "Domain" d ON i."domainId" = d.id 
           WHERE d."ownerId" = ${userId} AND i.status IN ('OPEN', 'CLOSED') 
           AND i."createdAt" >= ${thirtyDaysAgo}) as recent_inquiries,
          (SELECT COUNT(*) FROM "Domain" 
           WHERE "ownerId" = ${userId} AND "createdAt" >= ${thirtyDaysAgo}) as recent_domains,
          (SELECT COALESCE(SUM(da.views), 0) FROM "DomainAnalytics" da 
           JOIN "Domain" d ON da."domainId" = d.id 
           WHERE d."ownerId" = ${userId} AND da.date >= ${thirtyDaysAgo}) as recent_views
      `;

      const recent = recentStats[0];
      const recentInquiries = Number(recent.recent_inquiries);
      const recentDomains = Number(recent.recent_domains);
      const recentViews = Number(recent.recent_views);
      
      // Calculate change percentages based on real data
      const calculateChangePercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // PERFORMANCE OPTIMIZATION: Get previous period data in a single query
      const previousPeriodStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const previousPeriodEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const previousStats = await ctx.prisma.$queryRaw<Array<{
        previous_views: bigint;
        previous_revenue: bigint;
        previous_domains: bigint;
        previous_inquiries: bigint;
      }>>`
        SELECT 
          (SELECT COALESCE(SUM(da.views), 0) FROM "DomainAnalytics" da 
           JOIN "Domain" d ON da."domainId" = d.id 
           WHERE d."ownerId" = ${userId} AND da.date >= ${previousPeriodStart} AND da.date < ${previousPeriodEnd}) as previous_views,
          (SELECT COALESCE(SUM(de."agreedPrice"), 0) FROM "Deal" de 
           JOIN "Domain" d ON de."domainId" = d.id 
           WHERE d."ownerId" = ${userId} AND de.status = 'COMPLETED' 
           AND de."createdAt" >= ${previousPeriodStart} AND de."createdAt" < ${previousPeriodEnd}) as previous_revenue,
          (SELECT COUNT(*) FROM "Domain" 
           WHERE "ownerId" = ${userId} AND "createdAt" >= ${previousPeriodStart} AND "createdAt" < ${previousPeriodEnd}) as previous_domains,
          (SELECT COUNT(*) FROM "Inquiry" i 
           JOIN "Domain" d ON i."domainId" = d.id 
           WHERE d."ownerId" = ${userId} AND i.status IN ('OPEN', 'CLOSED') 
           AND i."createdAt" >= ${previousPeriodStart} AND i."createdAt" < ${previousPeriodEnd}) as previous_inquiries
      `;

      const previous = previousStats[0];
      const previousViews = Number(previous.previous_views);
      const previousRevenue = Number(previous.previous_revenue);
      const previousDomains = Number(previous.previous_domains);
      const previousInquiries = Number(previous.previous_inquiries);

      // Calculate real change percentages
      const viewsChange = calculateChangePercentage(recentViews, previousViews);
      const inquiriesChange = calculateChangePercentage(recentInquiries, previousInquiries);
      const revenueChange = calculateChangePercentage(totalRevenueValue, previousRevenue);
      const domainsChange = calculateChangePercentage(recentDomains, previousDomains);

      const result = {
        totalViews: totalViewsValue,
        totalInquiries,
        totalRevenue: totalRevenueValue,
        totalDomains,
        totalSales, // BUSINESS LOGIC FIX: Include total sales for accurate average calculation
        viewsChange,
        inquiriesChange,
        revenueChange,
        domainsChange
      };
      
      // Cache the result for 10 minutes (with error handling)
      try {
        await cache.set(cacheKey, result, 600);
      } catch {
        // Cache set failed, continuing without caching
      }
      
      return result;
    } catch (error) {
      // Log error for debugging (production-safe)
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error in getSellerStats:', {
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
      throw createDatabaseError('Failed to fetch seller statistics', error);
    }
  }),

  /**
   * Get comprehensive buyer statistics with real-time change tracking
   * @description Retrieves buyer dashboard statistics including inquiries, saved domains, purchases, and spending
   * @returns Object containing total counts and percentage changes from previous period
   * @example
   * ```typescript
   * const stats = await api.dashboard.getBuyerStats.query();
   * // Returns: { totalInquiries, totalSavedDomains, totalPurchases, totalSpent, inquiriesChange, ... }
   * ```
   */
  getBuyerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      // Generate cache key
      const cacheKey = cacheKeys.user(`buyer-stats:${userId}`);
      
      // Try to get from cache first
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
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
            status: { in: ['PENDING_REVIEW', 'OPEN'] }
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
      const openInquiries = inquiryStats.find(s => s.status === 'OPEN')?._count.id || 0;
      const closedInquiries = inquiryStats.find(s => s.status === 'CLOSED')?._count.id || 0;
      const totalSavedDomains = savedDomainStats.length;
      const totalPurchases = purchaseStats._count.id || 0;
      const totalSpent = purchaseStats._sum?.agreedPrice || 0;
      const recentActivity = activityStats;

      // Calculate change percentages based on real data
      const calculateChangePercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // Get previous period data for comparison (30-60 days ago)
      const previousPeriodStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const previousPeriodEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        previousInquiryStats,
        previousPurchaseStats,
        previousSavedStats
      ] = await Promise.all([
        // Previous period inquiries
        ctx.prisma.inquiry.count({
          where: {
            buyerId: userId,
            createdAt: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd
            }
          }
        }),
        
        // Previous period purchases
        ctx.prisma.deal.aggregate({
          where: {
            buyerId: userId,
            status: 'COMPLETED',
            createdAt: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd
            }
          },
          _sum: { agreedPrice: true }
        }),
        
        // Previous period saved domains
        ctx.prisma.inquiry.groupBy({
          by: ['domainId'],
          where: {
            buyerId: userId,
            status: { in: ['PENDING_REVIEW', 'OPEN'] },
            createdAt: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd
            }
          },
          _count: { domainId: true }
        })
      ]);

      const previousInquiries = previousInquiryStats;
      const previousSpent = previousPurchaseStats._sum?.agreedPrice || 0;
      const previousSaved = previousSavedStats.length;

      // Calculate real change percentages
      const inquiriesChange = calculateChangePercentage(recentActivity, previousInquiries);
      const spendingChange = calculateChangePercentage(totalSpent, previousSpent);
      const savedChange = calculateChangePercentage(totalSavedDomains, previousSaved);
      const activityChange = inquiriesChange; // Activity change is same as inquiries change

      const result = {
        totalInquiries,
        pendingInquiries,
        openInquiries,
        closedInquiries,
        totalSavedDomains,
        totalPurchases,
        totalSpent,
        recentActivity,
        inquiriesChange,
        spendingChange,
        savedChange,
        activityChange
      };
      
      // Cache the result for 10 minutes
      await cache.set(cacheKey, result, 600);
      
      return result;
    } catch {
      throw createDatabaseError('Failed to fetch buyer statistics');
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
            status: { in: ['OPEN', 'CLOSED'] } // SECURITY: Only show inquiries visible to sellers
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
        actualDate: Date; // BUSINESS LOGIC FIX: Store actual date for proper sorting
        status: 'success';
      }> = [];

      // Add inquiry activities
      recentInquiries.forEach((inquiry) => {
        activities.push({
          id: `inquiry-${inquiry.id}`,
          type: 'inquiry' as const,
          title: `New inquiry for ${inquiry.domain.name}`,
          description: 'Buyer interested in purchasing the domain',
          timestamp: formatTimeAgo(inquiry.createdAt),
          actualDate: inquiry.createdAt, // BUSINESS LOGIC FIX: Store actual date for sorting
          status: 'success' as const
        });
      });

      // Add verification activities
      recentDomains.forEach((domain) => {
        activities.push({
          id: `verification-${domain.name}`,
          type: 'verification' as const,
          title: 'Domain verification completed',
          description: `${domain.name} is now verified`,
          timestamp: formatTimeAgo(domain.updatedAt),
          actualDate: domain.updatedAt, // BUSINESS LOGIC FIX: Store actual date for sorting
          status: 'success' as const
        });
      });

      // Add deal activities
      recentDeals.forEach((deal) => {
        activities.push({
          id: `deal-${deal.id}`,
          type: 'payment' as const,
          title: `Payment received for ${deal.domain.name}`,
          description: 'Transaction completed successfully',
          timestamp: formatTimeAgo(deal.updatedAt),
          actualDate: deal.updatedAt, // BUSINESS LOGIC FIX: Store actual date for sorting
          status: 'success' as const
        });
      });

      // BUSINESS LOGIC FIX: Sort by actual dates, not formatted strings
      return activities
        .sort((a, b) => b.actualDate.getTime() - a.actualDate.getTime())
        .slice(0, 5);

    } catch {
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
                status: { in: ['PENDING_REVIEW', 'OPEN'] }
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
    } catch {
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
        // CRITICAL SECURITY FIX: Only count inquiries visible to sellers
        const inquiryCounts = await ctx.prisma.inquiry.groupBy({
          by: ['domainId'],
          where: {
            domain: { ownerId: userId },
            status: { in: ['OPEN', 'CLOSED'] } // SECURITY: Only count inquiries visible to sellers
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

      } catch {
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
