/**
 * Wholesale Domain Selling tRPC Router
 * Handles wholesale domain marketplace functionality
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, adminProcedure, publicProcedure } from '@/server/trpc';
import { validateInput, validationSchemas } from '@/lib/utils/validation';
import { createError, createTRPCError, handleAsyncError } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';

export const wholesaleRouter = createTRPCRouter({
  // Advanced Analytics (admin only)
  getAdvancedAnalytics: adminProcedure
    .input(
      z.object({
        timeRange: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
        metricType: z.enum(['overview', 'sales', 'revenue', 'performance']).default('overview'),
      })
    )
    .query(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { timeRange, metricType } = input;
        
        // Calculate date range
        const now = new Date();
        const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

        // Get basic statistics
        const [
          totalDomains,
          activeDomains,
          pendingDomains,
          soldDomains,
          totalSales,
          totalRevenue,
          recentSales,
          topCategories,
          topStates,
          sellerPerformance
        ] = await Promise.all([
          // Total domains
          ctx.prisma.wholesaleDomain.count(),
          
          // Active domains
          ctx.prisma.wholesaleDomain.count({
            where: { status: 'ACTIVE' }
          }),
          
          // Pending domains
          ctx.prisma.wholesaleDomain.count({
            where: { status: 'PENDING_APPROVAL' }
          }),
          
          // Sold domains
          ctx.prisma.wholesaleDomain.count({
            where: { status: 'SOLD' }
          }),
          
          // Total sales in time range
          ctx.prisma.wholesaleSale.count({
            where: {
              status: 'PAID',
              paidAt: { gte: startDate }
            }
          }),
          
          // Total revenue in time range
          ctx.prisma.wholesaleSale.aggregate({
            where: {
              status: 'PAID',
              paidAt: { gte: startDate }
            },
            _sum: { price: true }
          }),
          
          // Recent sales
          ctx.prisma.wholesaleSale.findMany({
            where: {
              status: 'PAID',
              paidAt: { gte: startDate }
            },
            include: {
              buyer: { select: { name: true, email: true } },
              seller: { select: { name: true, email: true } },
              wholesaleDomain: {
                include: {
                  domain: { select: { name: true } }
                }
              }
            },
            orderBy: { paidAt: 'desc' },
            take: 20
          }),
          
          // Top selling categories
          ctx.prisma.wholesaleDomain.groupBy({
            by: ['domainId'],
            where: {
              status: 'SOLD',
              soldAt: { gte: startDate }
            },
            _count: { id: true }
          }).then(async (results) => {
            const categoryData = await Promise.all(
              results.map(async (result) => {
                const domain = await ctx.prisma.domain.findUnique({
                  where: { id: result.domainId },
                  select: { category: true }
                });
                return {
                  name: domain?.category || 'Uncategorized',
                  sales: result._count.id
                };
              })
            );
            
            // Group by category and sum sales
            const categoryMap = new Map();
            categoryData.forEach(item => {
              const existing = categoryMap.get(item.name) || 0;
              categoryMap.set(item.name, existing + item.sales);
            });
            
            return Array.from(categoryMap.entries())
              .map(([name, sales]) => ({ name, sales }))
              .sort((a, b) => b.sales - a.sales)
              .slice(0, 10);
          }),
          
          // Top selling states
          ctx.prisma.wholesaleDomain.groupBy({
            by: ['domainId'],
            where: {
              status: 'SOLD',
              soldAt: { gte: startDate }
            },
            _count: { id: true }
          }).then(async (results) => {
            const stateData = await Promise.all(
              results.map(async (result) => {
                const domain = await ctx.prisma.domain.findUnique({
                  where: { id: result.domainId },
                  select: { state: true }
                });
                return {
                  name: domain?.state || 'National',
                  sales: result._count.id
                };
              })
            );
            
            // Group by state and sum sales
            const stateMap = new Map();
            stateData.forEach(item => {
              const existing = stateMap.get(item.name) || 0;
              stateMap.set(item.name, existing + item.sales);
            });
            
            return Array.from(stateMap.entries())
              .map(([name, sales]) => ({ name, sales }))
              .sort((a, b) => b.sales - a.sales)
              .slice(0, 10);
          }),
          
          // Seller performance
          ctx.prisma.wholesaleSale.groupBy({
            by: ['sellerId'],
            where: {
              status: 'PAID',
              paidAt: { gte: startDate }
            },
            _count: { id: true },
            _sum: { price: true },
            _avg: { price: true }
          }).then(async (results) => {
            const sellerData = await Promise.all(
              results.map(async (result) => {
                const seller = await ctx.prisma.user.findUnique({
                  where: { id: result.sellerId },
                  select: { name: true, email: true }
                });
                return {
                  sellerId: result.sellerId,
                  sellerName: seller?.name,
                  sellerEmail: seller?.email,
                  sales: result._count.id,
                  revenue: result._sum.price || 0,
                  averagePrice: result._avg.price || 0
                };
              })
            );
            
            return sellerData.sort((a, b) => b.revenue - a.revenue).slice(0, 20);
          })
        ]);

        // Calculate derived metrics
        const averageSalePrice = totalSales > 0 ? (totalRevenue._sum.price || 0) / totalSales : 0;
        const conversionRate = totalDomains > 0 ? (soldDomains / totalDomains) * 100 : 0;

        // Format recent sales
        const formattedRecentSales = recentSales.map(sale => ({
          id: sale.id,
          domainName: sale.wholesaleDomain.domain.name,
          price: sale.price,
          buyerName: sale.buyer.name,
          buyerEmail: sale.buyer.email,
          sellerName: sale.seller.name,
          sellerEmail: sale.seller.email,
          completedAt: sale.paidAt
        }));

        return {
          totalDomains,
          activeDomains,
          pendingDomains,
          soldDomains,
          totalSales,
          totalRevenue: totalRevenue._sum.price || 0,
          averageSalePrice,
          conversionRate,
          topSellingCategories: topCategories,
          topSellingStates: topStates,
          sellerPerformance,
          recentSales: formattedRecentSales,
          // Placeholder for trend data (would need more complex queries)
          salesTrend: [],
          revenueTrend: []
        };
      }, 'get advanced analytics');
    }),
  // Get wholesale configuration
  getConfig: publicProcedure.query(async ({ ctx }) => {
    return await handleAsyncError(async () => {
      let config = await ctx.prisma.wholesaleConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      // Create default config if none exists
      if (!config) {
        // Get the first admin user or any user to use as the system user
        const systemUser = await ctx.prisma.user.findFirst({
          where: {
            OR: [
              { role: 'ADMIN' },
              { role: 'SUPER_ADMIN' }
            ]
          },
          select: { id: true }
        });

        // If no admin user exists, use the first user
        const fallbackUser = systemUser || await ctx.prisma.user.findFirst({
          select: { id: true }
        });

        if (!fallbackUser) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'No users found in database. Cannot create wholesale configuration.',
          });
        }

        config = await ctx.prisma.wholesaleConfig.create({
          data: {
            price: 299.00,
            isActive: true,
            updatedBy: fallbackUser.id,
          },
        });
      }

      return {
        price: Number(config.price),
        isActive: config.isActive,
        updatedAt: config.updatedAt,
      };
    }, 'get wholesale configuration');
  }),

  // Update wholesale configuration (admin only)
  updateConfig: adminProcedure
    .input(
      z.object({
        price: z.number().min(1).max(10000),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { price, isActive } = input;

        const config = await ctx.prisma.wholesaleConfig.create({
          data: {
            price,
            isActive,
            updatedBy: ctx.session.user.id,
          },
        });

        logger.info('Wholesale configuration updated', {
          price,
          isActive,
          updatedBy: ctx.session.user.id,
        });

        return {
          id: config.id,
          price: Number(config.price),
          isActive: config.isActive,
          updatedAt: config.updatedAt,
        };
      }, 'update wholesale configuration');
    }),

  // Get wholesale domains (public)
  getDomains: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        state: z.string().optional(),
        city: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { search, category, state, city, page, limit } = input;
        const offset = (page - 1) * limit;

        // Build where clause
        const where: any = {
          status: 'ACTIVE',
          domain: {
            status: 'VERIFIED',
          },
        };

        if (search) {
          where.domain = {
            ...where.domain,
            name: {
              contains: search,
              mode: 'insensitive',
            },
          };
        }

        if (category) {
          where.domain = {
            ...where.domain,
            category: {
              equals: category,
              mode: 'insensitive',
            },
          };
        }

        if (state) {
          where.domain = {
            ...where.domain,
            state: {
              equals: state,
              mode: 'insensitive',
            },
          };
        }

        if (city) {
          where.domain = {
            ...where.domain,
            city: {
              equals: city,
              mode: 'insensitive',
            },
          };
        }

        const [domains, total] = await Promise.all([
          ctx.prisma.wholesaleDomain.findMany({
            where,
            include: {
              domain: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  state: true,
                  city: true,
                  geographicScope: true,
                  createdAt: true,
                  owner: {
                    select: {
                      id: true,
                      name: true,
                      company: true,
                    },
                  },
                },
              },
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                  company: true,
                },
              },
            },
            orderBy: { addedAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          ctx.prisma.wholesaleDomain.count({ where }),
        ]);

        return {
          domains: domains.map((wd) => ({
            id: wd.id,
            domain: wd.domain,
            seller: wd.addedByUser,
            addedAt: wd.addedAt,
            status: wd.status,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }, 'get wholesale domains');
    }),

  // Add domain to wholesale (seller)
  addDomain: protectedProcedure
    .input(
      z.object({
        domainId: z.string().cuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { domainId } = input;
        const userId = ctx.session.user.id;

        // Check if domain exists and belongs to user
        const domain = await ctx.prisma.domain.findFirst({
          where: {
            id: domainId,
            ownerId: userId,
            status: 'VERIFIED',
          },
        });

        if (!domain) {
          throw createTRPCError('NOT_FOUND', 'Domain not found or not eligible for wholesale');
        }

        // Check if domain is already in wholesale
        const existingWholesale = await ctx.prisma.wholesaleDomain.findFirst({
          where: {
            domainId,
            status: {
              in: ['PENDING_APPROVAL', 'ACTIVE'],
            },
          },
        });

        if (existingWholesale) {
          throw createTRPCError('CONFLICT', 'Domain is already in wholesale marketplace');
        }

        // Add domain to wholesale
        const wholesaleDomain = await ctx.prisma.wholesaleDomain.create({
          data: {
            domainId,
            addedBy: userId,
            status: 'PENDING_APPROVAL',
          },
          include: {
            domain: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                state: true,
                city: true,
              },
            },
          },
        });

        logger.info('Domain added to wholesale', {
          domainId,
          domainName: domain.name,
          addedBy: userId,
        });

        return {
          id: wholesaleDomain.id,
          domain: wholesaleDomain.domain,
          status: wholesaleDomain.status,
          addedAt: wholesaleDomain.addedAt,
        };
      }, 'add domain to wholesale');
    }),

  // Remove domain from wholesale (seller)
  removeDomain: protectedProcedure
    .input(
      z.object({
        wholesaleDomainId: z.string().cuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { wholesaleDomainId } = input;
        const userId = ctx.session.user.id;

        // Check if wholesale domain exists and belongs to user
        const wholesaleDomain = await ctx.prisma.wholesaleDomain.findFirst({
          where: {
            id: wholesaleDomainId,
            addedBy: userId,
            status: {
              in: ['PENDING_APPROVAL', 'ACTIVE'],
            },
          },
          include: {
            domain: {
              select: {
                name: true,
              },
            },
          },
        });

        if (!wholesaleDomain) {
          throw createTRPCError('NOT_FOUND', 'Wholesale domain not found or cannot be removed');
        }

        // Update status to REMOVED
        const updated = await ctx.prisma.wholesaleDomain.update({
          where: { id: wholesaleDomainId },
          data: { status: 'REMOVED' },
        });

        logger.info('Domain removed from wholesale', {
          wholesaleDomainId,
          domainName: wholesaleDomain.domain.name,
          removedBy: userId,
        });

        return {
          id: updated.id,
          status: updated.status,
        };
      }, 'remove domain from wholesale');
    }),

  // Get seller's wholesale domains
  getMyWholesaleDomains: protectedProcedure
    .input(
      z.object({
        status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SOLD', 'REMOVED']).optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { status, page, limit } = input;
        const userId = ctx.session.user.id;
        const offset = (page - 1) * limit;

        const where: any = {
          addedBy: userId,
        };

        if (status) {
          where.status = status;
        }

        const [domains, total] = await Promise.all([
          ctx.prisma.wholesaleDomain.findMany({
            where,
            include: {
              domain: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  state: true,
                  city: true,
                  geographicScope: true,
                  createdAt: true,
                },
              },
              soldToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { addedAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          ctx.prisma.wholesaleDomain.count({ where }),
        ]);

        return {
          domains: domains.map((wd) => ({
            id: wd.id,
            domain: wd.domain,
            status: wd.status,
            addedAt: wd.addedAt,
            soldAt: wd.soldAt,
            soldTo: wd.soldToUser,
            notes: wd.notes,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }, 'get seller wholesale domains');
    }),

  // Purchase wholesale domain (buyer)
  purchaseDomain: protectedProcedure
    .input(
      z.object({
        wholesaleDomainId: z.string().cuid(),
        paymentMethod: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { wholesaleDomainId, paymentMethod } = input;
        const buyerId = ctx.session.user.id;

        // Get wholesale domain and verify it's available
        const wholesaleDomain = await ctx.prisma.wholesaleDomain.findFirst({
          where: {
            id: wholesaleDomainId,
            status: 'ACTIVE',
          },
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

        if (!wholesaleDomain) {
          throw createTRPCError('NOT_FOUND', 'Domain not available for purchase');
        }

        // Prevent self-purchase
        if (wholesaleDomain.domain.ownerId === buyerId) {
          throw createTRPCError('FORBIDDEN', 'You cannot purchase your own domain');
        }

        // Get current wholesale price
        const config = await ctx.prisma.wholesaleConfig.findFirst({
          orderBy: { updatedAt: 'desc' },
        });

        if (!config || !config.isActive) {
          throw createTRPCError('SERVICE_UNAVAILABLE', 'Wholesale marketplace is currently unavailable');
        }

        // Create wholesale sale record
        const sale = await ctx.prisma.wholesaleSale.create({
          data: {
            wholesaleDomainId,
            buyerId,
            sellerId: wholesaleDomain.domain.ownerId,
            price: config.price,
            paymentMethod,
            status: 'PENDING',
          },
        });

        // Update wholesale domain status
        await ctx.prisma.wholesaleDomain.update({
          where: { id: wholesaleDomainId },
          data: {
            status: 'SOLD',
            soldAt: new Date(),
            soldTo: buyerId,
          },
        });

        logger.info('Wholesale domain purchase initiated', {
          saleId: sale.id,
          domainName: wholesaleDomain.domain.name,
          buyerId,
          sellerId: wholesaleDomain.domain.ownerId,
          price: Number(config.price),
        });

        return {
          saleId: sale.id,
          domainName: wholesaleDomain.domain.name,
          price: Number(config.price),
          status: sale.status,
          createdAt: sale.createdAt,
        };
      }, 'purchase wholesale domain');
    }),

  // Admin: Get all wholesale domains for management
  getAdminWholesaleDomains: adminProcedure
    .input(
      z.object({
        status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SOLD', 'REMOVED']).optional(),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { status, search, page, limit } = input;
        const offset = (page - 1) * limit;

        const where: any = {};

        if (status) {
          where.status = status;
        }

        if (search) {
          where.domain = {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          };
        }

        const [domains, total] = await Promise.all([
          ctx.prisma.wholesaleDomain.findMany({
            where,
            include: {
              domain: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: true,
                  state: true,
                  city: true,
                  geographicScope: true,
                  createdAt: true,
                },
              },
              addedByUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  company: true,
                },
              },
              soldToUser: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: { addedAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          ctx.prisma.wholesaleDomain.count({ where }),
        ]);

        return {
          domains: domains.map((wd) => ({
            id: wd.id,
            domain: wd.domain,
            seller: wd.addedByUser,
            buyer: wd.soldToUser,
            status: wd.status,
            addedAt: wd.addedAt,
            soldAt: wd.soldAt,
            notes: wd.notes,
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }, 'get admin wholesale domains');
    }),

  // Admin: Update wholesale domain status
  updateDomainStatus: adminProcedure
    .input(
      z.object({
        wholesaleDomainId: z.string().cuid(),
        status: z.enum(['PENDING_APPROVAL', 'ACTIVE', 'SOLD', 'REMOVED']),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await handleAsyncError(async () => {
        const { wholesaleDomainId, status, notes } = input;

        const updated = await ctx.prisma.wholesaleDomain.update({
          where: { id: wholesaleDomainId },
          data: {
            status,
            notes,
          },
          include: {
            domain: {
              select: {
                name: true,
              },
            },
          },
        });

        logger.info('Wholesale domain status updated', {
          wholesaleDomainId,
          domainName: updated.domain.name,
          status,
          updatedBy: ctx.session.user.id,
        });

        return {
          id: updated.id,
          status: updated.status,
          notes: updated.notes,
        };
      }, 'update wholesale domain status');
    }),

  // Get wholesale sales statistics
  getStats: adminProcedure.query(async ({ ctx }) => {
    return await handleAsyncError(async () => {
      const [
        totalDomains,
        activeDomains,
        pendingDomains,
        soldDomains,
        totalSales,
        totalRevenue,
        recentSales,
      ] = await Promise.all([
        ctx.prisma.wholesaleDomain.count(),
        ctx.prisma.wholesaleDomain.count({ where: { status: 'ACTIVE' } }),
        ctx.prisma.wholesaleDomain.count({ where: { status: 'PENDING_APPROVAL' } }),
        ctx.prisma.wholesaleDomain.count({ where: { status: 'SOLD' } }),
        ctx.prisma.wholesaleSale.count({ where: { status: 'COMPLETED' } }),
        ctx.prisma.wholesaleSale.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { price: true },
        }),
        ctx.prisma.wholesaleSale.findMany({
          where: { status: 'COMPLETED' },
          include: {
            wholesaleDomain: {
              include: {
                domain: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            buyer: {
              select: {
                name: true,
                email: true,
              },
            },
            seller: {
              select: {
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        totalDomains,
        activeDomains,
        pendingDomains,
        soldDomains,
        totalSales,
        totalRevenue: Number(totalRevenue._sum.price || 0),
        recentSales: recentSales.map((sale) => ({
          id: sale.id,
          domainName: sale.wholesaleDomain.domain.name,
          buyer: sale.buyer,
          seller: sale.seller,
          price: Number(sale.price),
          completedAt: sale.completedAt || sale.createdAt,
        })),
      };
    }, 'get wholesale statistics');
  }),
});
