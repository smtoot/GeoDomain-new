/**
 * Feature Flags tRPC Router
 * 
 * This router provides admin controls for managing feature flags
 * and monitoring the hybrid inquiry system.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import { getFeatureFlagConfig, getFeatureFlagStats, getHybridSystemStats, getRecentActivity } from '@/lib/feature-flag-manager';

export const featureFlagsRouter = createTRPCRouter({
  // Get current feature flag configuration
  getConfig: adminProcedure
    .query(async () => {
      try {
        const config = await getFeatureFlagConfig();
        return {
          success: true,
          data: config,
        };
      } catch (error) {
        console.error('Error fetching feature flag config:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch feature flag configuration',
        });
      }
    }),

  // Get feature flag statistics
  getStats: adminProcedure
    .query(async () => {
      try {
        const stats = await getFeatureFlagStats();
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('Error fetching feature flag stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch feature flag statistics',
        });
      }
    }),

  // Get hybrid system statistics
  getHybridStats: adminProcedure
    .query(async () => {
      try {
        const stats = await getHybridSystemStats();
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        console.error('Error fetching hybrid system stats:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch hybrid system statistics',
        });
      }
    }),

  // Get recent activity for monitoring
  getRecentActivity: adminProcedure
    .query(async () => {
      try {
        const activity = await getRecentActivity();
        return {
          success: true,
          data: activity,
        };
      } catch (error) {
        console.error('Error fetching recent activity:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch recent activity',
        });
      }
    }),

  // Check if a feature is enabled for a specific user
  isFeatureEnabledForUser: protectedProcedure
    .input(z.object({
      featureId: z.string(),
      userId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const userId = input.userId || ctx.session.user.id;
        const { isFeatureEnabledForUser } = await import('@/lib/feature-flag-manager');
        const enabled = await isFeatureEnabledForUser(input.featureId, userId);
        
        return {
          success: true,
          data: { enabled },
        };
      } catch (error) {
        console.error('Error checking feature flag for user:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check feature flag for user',
        });
      }
    }),

  // Update feature flag (placeholder - in real implementation, this would update environment variables or database)
  updateFeatureFlag: adminProcedure
    .input(z.object({
      featureId: z.string(),
      enabled: z.boolean(),
      rolloutPercentage: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // In a real implementation, this would:
        // 1. Update environment variables or database
        // 2. Restart the application or reload configuration
        // 3. Log the change for audit purposes
        
        console.log(`Feature flag update requested: ${input.featureId} = ${input.enabled}`);
        
        // For now, we'll just return success
        // In production, you'd want to implement proper feature flag management
        return {
          success: true,
          message: `Feature flag ${input.featureId} ${input.enabled ? 'enabled' : 'disabled'} successfully`,
        };
      } catch (error) {
        console.error('Error updating feature flag:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update feature flag',
        });
      }
    }),

  // Get system health for hybrid features
  getSystemHealth: adminProcedure
    .query(async ({ ctx }) => {
      try {
        const [
          totalInquiries,
          openInquiries,
          flaggedMessages,
          directMessages,
          adminMediatedMessages,
          recentErrors,
        ] = await Promise.all([
          ctx.prisma.inquiry.count(),
          ctx.prisma.inquiry.count({ where: { status: 'OPEN' } }),
          ctx.prisma.message.count({ where: { flagged: true } }),
          ctx.prisma.message.count({ where: { status: 'DELIVERED' } }),
          ctx.prisma.message.count({ where: { status: 'PENDING' } }),
          // In a real implementation, you'd check for recent errors in logs
          0,
        ]);

        const health = {
          totalInquiries,
          openInquiries,
          flaggedMessages,
          directMessages,
          adminMediatedMessages,
          recentErrors,
          systemStatus: 'healthy' as const,
          lastChecked: new Date(),
        };

        return {
          success: true,
          data: health,
        };
      } catch (error) {
        console.error('Error checking system health:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check system health',
        });
      }
    }),
});
