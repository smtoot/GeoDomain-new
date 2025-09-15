import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { cache, cacheKeys, cacheUtils } from '@/lib/cache/redis';
import { sanitization } from '@/lib/security/sanitization';
import { createNotFoundError, createDatabaseError } from '@/lib/errors/api-errors';

export const dashboardRouter = createTRPCRouter({
  // Get seller statistics with enhanced caching and performance
  getSellerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      // Generate cache key
      const cacheKey = cacheKeys.user(`seller-stats:${userId}`);
      
      // Try to get from cache first
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
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
        
        // Inquiry statistics - only count inquiries visible to sellers (OPEN/CLOSED)
        ctx.prisma.inquiry.groupBy({
          by: ['status'],
          where: { 
            domain: { ownerId: userId },
            status: { in: ['OPEN', 'CLOSED'] } // SECURITY: Only count inquiries visible to sellers
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
          status: { in: ['OPEN', 'CLOSED'] }, // SECURITY: Only count inquiries visible to sellers
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
      
      // Calculate change percentages based on real data
      const calculateChangePercentage = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // Get previous period data for comparison (30-60 days ago)
      const previousPeriodStart = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      const previousPeriodEnd = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        previousViewsStats,
        previousRevenueStats,
        previousDomainsStats
      ] = await Promise.all([
        // Previous period views
        ctx.prisma.domainAnalytics.aggregate({
          where: {
            domain: { ownerId: userId },
            date: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd
            }
          },
          _sum: { views: true }
        }),
        
        // Previous period revenue
        ctx.prisma.deal.aggregate({
          where: {
            domain: { ownerId: userId },
            status: 'COMPLETED',
            createdAt: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd
            }
          },
          _sum: { agreedPrice: true }
        }),
        
        // Previous period domains
        ctx.prisma.domain.count({
          where: {
            ownerId: userId,
            createdAt: {
              gte: previousPeriodStart,
              lt: previousPeriodEnd
            }
          }
        })
      ]);

      const previousViews = previousViewsStats._sum?.views || 0;
      const previousRevenue = previousRevenueStats._sum?.agreedPrice || 0;
      const previousDomains = previousDomainsStats;

      // Calculate real change percentages
      const viewsChange = calculateChangePercentage(recentViews, previousViews);
      const inquiriesChange = calculateChangePercentage(recentInquiries, previousInquiries);
      const revenueChange = calculateChangePercentage(totalRevenue, previousRevenue);
      const domainsChange = calculateChangePercentage(recentDomains, previousDomains);

      const result = {
        totalViews,
        totalInquiries,
        totalRevenue: totalRevenue,
        totalDomains,
        viewsChange,
        inquiriesChange,
        revenueChange,
        domainsChange
      };
      
      // Cache the result for 10 minutes
      await cache.set(cacheKey, result, 600);
      
      return result;
    } catch (error) {
      throw createDatabaseError('Failed to fetch seller statistics');
    }
  }),

  // Get buyer statistics with enhanced caching and performance
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
    } catch (error) {
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
