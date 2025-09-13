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
  // Get wholesale configuration
  getConfig: publicProcedure.query(async ({ ctx }) => {
    return await handleAsyncError(async () => {
      let config = await ctx.prisma.wholesaleConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      // Create default config if none exists
      if (!config) {
        config = await ctx.prisma.wholesaleConfig.create({
          data: {
            price: 299.00,
            isActive: true,
            updatedBy: 'system', // This will need to be a valid user ID in production
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
          orderBy: { completedAt: 'desc' },
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
          completedAt: sale.completedAt,
        })),
      };
    }, 'get wholesale statistics');
  }),
});
