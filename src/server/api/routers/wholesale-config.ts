import { z } from 'zod';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '@/server/trpc';
import { WholesaleConfigService } from '@/lib/services/wholesale-config.service';
import { WholesaleSaleService } from '@/lib/services/wholesale-sale.service';
import { prisma } from '@/lib/prisma';

export const wholesaleConfigRouter = createTRPCRouter({
  // Get current configuration
  getConfig: protectedProcedure.query(async () => {
    try {
      return await WholesaleConfigService.getConfig();
    } catch (error) {
      // If config doesn't exist, try to initialize with a default admin
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
      
      if (adminUser) {
        return await WholesaleConfigService.initializeDefaultConfig(adminUser.id);
      }
      
      throw new Error('No admin user found to initialize configuration');
    }
  }),

  // Update configuration (admin only)
  updateConfig: adminProcedure
    .input(
      z.object({
        wholesalePrice: z.number().min(50, 'Wholesale price must be at least $50'),
        commissionAmount: z.number().min(1, 'Commission amount must be at least $1'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await WholesaleConfigService.updateConfig({
        wholesalePrice: input.wholesalePrice,
        commissionAmount: input.commissionAmount,
        updatedBy: ctx.session.user.id,
      });
    }),

  // Get configuration history (admin only)
  getConfigHistory: adminProcedure.query(async () => {
    return await WholesaleConfigService.getConfigHistory();
  }),

  // Get pricing summary
  getPricingSummary: protectedProcedure.query(async () => {
    return await WholesaleSaleService.getPricingSummary();
  }),

  // Get wholesale analytics (admin only)
  getAnalytics: adminProcedure.query(async () => {
    return await WholesaleSaleService.getWholesaleAnalytics();
  }),

  // Process wholesale sale (admin only)
  processSale: adminProcedure
    .input(z.object({ wholesaleSaleId: z.string() }))
    .mutation(async ({ input }) => {
      await WholesaleSaleService.processSale(input.wholesaleSaleId);
      return { success: true };
    }),

  // Create wholesale sale
  createSale: protectedProcedure
    .input(
      z.object({
        wholesaleDomainId: z.string(),
        paymentMethod: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const saleId = await WholesaleSaleService.createWholesaleSale(
        input.wholesaleDomainId,
        ctx.session.user.id,
        input.paymentMethod
      );
      return { saleId };
    }),

  // Complete wholesale sale (admin only)
  completeSale: adminProcedure
    .input(z.object({ wholesaleSaleId: z.string() }))
    .mutation(async ({ input }) => {
      await WholesaleSaleService.completeWholesaleSale(input.wholesaleSaleId);
      return { success: true };
    }),

  // Initialize default configuration (admin only)
  initializeConfig: adminProcedure.mutation(async ({ ctx }) => {
    return await WholesaleConfigService.initializeDefaultConfig(ctx.session.user.id);
  }),
});
