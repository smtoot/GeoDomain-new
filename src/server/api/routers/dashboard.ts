import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

export const dashboardRouter = createTRPCRouter({
  // Get seller statistics
  getSellerStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      const [
        totalDomains,
        totalViews,
        totalInquiries,
        totalRevenue,
        recentDomains,
        recentInquiries
      ] = await Promise.all([
        // Total domains count
        ctx.prisma.domain.count({ 
          where: { ownerId: userId } 
        }),
        
        // Total views (we'll use a simple count for now, can be enhanced later)
        ctx.prisma.domain.count({ 
          where: { 
            ownerId: userId,
            status: { in: ['PUBLISHED', 'VERIFIED'] }
          } 
        }) * 50, // Mock multiplier for views since we don't have view tracking yet
        
        // Total inquiries
        ctx.prisma.inquiry.count({ 
          where: { 
            domain: { ownerId: userId } 
          } 
        }),
        
        // Total revenue from completed deals
        ctx.prisma.deal.aggregate({
          where: { 
            domain: { ownerId: userId },
            status: 'COMPLETED'
          },
          _sum: { finalPrice: true }
        }),

        // Recent domains for change calculation
        ctx.prisma.domain.count({
          where: {
            ownerId: userId,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }),

        // Recent inquiries for change calculation  
        ctx.prisma.inquiry.count({
          where: {
            domain: { ownerId: userId },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      // Calculate change percentages (simplified)
      const viewsChange = totalViews > 0 ? 15.3 : 0; // Mock for now
      const inquiriesChange = recentInquiries > 0 ? (recentInquiries / Math.max(totalInquiries - recentInquiries, 1)) * 100 : 0;
      const revenueChange = totalRevenue._sum.finalPrice ? 8.7 : 0; // Mock for now
      const domainsChange = recentDomains > 0 ? (recentDomains / Math.max(totalDomains - recentDomains, 1)) * 100 : 0;

      return {
        totalViews,
        totalInquiries,
        totalRevenue: totalRevenue._sum.finalPrice || 0,
        totalDomains,
        viewsChange,
        inquiriesChange,
        revenueChange,
        domainsChange
      };
    } catch (error) {
      console.error('Error fetching seller stats:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch seller statistics',
      });
    }
  }),

  // Get recent activity
  getRecentActivity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    try {
      const [recentInquiries, recentDomains, recentDeals] = await Promise.all([
        // Recent inquiries
        ctx.prisma.inquiry.findMany({
          where: { domain: { ownerId: userId } },
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

      const activities = [];

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
      console.error('Error fetching recent activity:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch recent activity',
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
        const domains = await ctx.prisma.domain.findMany({
          where: { ownerId: userId },
          orderBy: { createdAt: 'desc' },
          take: input.limit,
          include: {
            _count: {
              select: {
                inquiries: true
              }
            }
          }
        });

        return domains.map(domain => ({
          id: domain.id,
          name: domain.name,
          status: domain.status,
          price: domain.price,
          inquiries: domain._count.inquiries,
          // Mock views for now - can be enhanced with real view tracking
          views: domain._count.inquiries * 20 + Math.floor(Math.random() * 100),
          createdAt: domain.createdAt
        }));

      } catch (error) {
        console.error('Error fetching domain performance:', error);
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
