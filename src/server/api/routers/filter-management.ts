import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { FilterManagementService } from '@/lib/services/filter-management.service';

export const filterManagementRouter = createTRPCRouter({
  // Get saved filters for a specific entity type
  getSavedFilters: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
    }))
    .query(async ({ input, ctx }) => {
      const { entityType } = input;
      const userId = ctx.session.user.id;

      return await FilterManagementService.getSavedFilters(userId, entityType);
    }),

  // Create a new saved filter
  createSavedFilter: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      filters: z.array(z.object({
        key: z.string(),
        value: z.any(),
        label: z.string(),
        type: z.string(),
      })),
      entityType: z.string().min(1),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      return await FilterManagementService.createSavedFilter({
        ...input,
        userId,
      });
    }),

  // Update an existing saved filter
  updateSavedFilter: protectedProcedure
    .input(z.object({
      filterId: z.string(),
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      filters: z.array(z.object({
        key: z.string(),
        value: z.any(),
        label: z.string(),
        type: z.string(),
      })).optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { filterId, ...updateData } = input;
      const userId = ctx.session.user.id;

      return await FilterManagementService.updateSavedFilter(filterId, userId, updateData);
    }),

  // Delete a saved filter
  deleteSavedFilter: protectedProcedure
    .input(z.object({
      filterId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { filterId } = input;
      const userId = ctx.session.user.id;

      await FilterManagementService.deleteSavedFilter(filterId, userId);
      return { success: true };
    }),

  // Get default filter for an entity type
  getDefaultFilter: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
    }))
    .query(async ({ input, ctx }) => {
      const { entityType } = input;
      const userId = ctx.session.user.id;

      return await FilterManagementService.getDefaultFilter(userId, entityType);
    }),

  // Set a filter as default
  setDefaultFilter: protectedProcedure
    .input(z.object({
      filterId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { filterId } = input;
      const userId = ctx.session.user.id;

      return await FilterManagementService.setDefaultFilter(filterId, userId);
    }),

  // Get filter statistics
  getFilterStats: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id;
      return await FilterManagementService.getFilterStats(userId);
    }),

  // Increment filter usage (for analytics)
  incrementFilterUsage: protectedProcedure
    .input(z.object({
      filterId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { filterId } = input;
      const userId = ctx.session.user.id;

      await FilterManagementService.incrementFilterUsage(filterId, userId);
      return { success: true };
    }),

  // Get common filter presets for different entity types
  getFilterPresets: protectedProcedure
    .input(z.object({
      entityType: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const { entityType } = input;

      // Define common presets for different entity types
      const presets = {
        domains: [
          {
            name: 'pending_review',
            label: 'Pending Review',
            description: 'Domains awaiting admin review',
            filters: [
              { key: 'status', value: 'PENDING_VERIFICATION', label: 'Status', type: 'select' }
            ]
          },
          {
            name: 'high_value',
            label: 'High Value Domains',
            description: 'Domains with price above $10,000',
            filters: [
              { key: 'price', value: { min: 10000 }, label: 'Price', type: 'numberrange' }
            ]
          },
          {
            name: 'recent_listings',
            label: 'Recent Listings',
            description: 'Domains listed in the last 7 days',
            filters: [
              { 
                key: 'createdAt', 
                value: { 
                  from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                }, 
                label: 'Created Date', 
                type: 'daterange' 
              }
            ]
          },
          {
            name: 'featured_domains',
            label: 'Featured Domains',
            description: 'Domains marked as featured',
            filters: [
              { key: 'featured', value: true, label: 'Featured', type: 'boolean' }
            ]
          }
        ],
        users: [
          {
            name: 'active_users',
            label: 'Active Users',
            description: 'Users with active status',
            filters: [
              { key: 'status', value: 'ACTIVE', label: 'Status', type: 'select' }
            ]
          },
          {
            name: 'new_users',
            label: 'New Users',
            description: 'Users registered in the last 30 days',
            filters: [
              { 
                key: 'createdAt', 
                value: { 
                  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                }, 
                label: 'Created Date', 
                type: 'daterange' 
              }
            ]
          },
          {
            name: 'premium_users',
            label: 'Premium Users',
            description: 'Users with premium roles',
            filters: [
              { key: 'role', value: ['PREMIUM', 'ADMIN', 'SUPER_ADMIN'], label: 'Role', type: 'multiselect' }
            ]
          }
        ],
        inquiries: [
          {
            name: 'pending_inquiries',
            label: 'Pending Inquiries',
            description: 'Inquiries awaiting response',
            filters: [
              { key: 'status', value: 'PENDING', label: 'Status', type: 'select' }
            ]
          },
          {
            name: 'recent_inquiries',
            label: 'Recent Inquiries',
            description: 'Inquiries from the last 24 hours',
            filters: [
              { 
                key: 'createdAt', 
                value: { 
                  from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0] 
                }, 
                label: 'Created Date', 
                type: 'daterange' 
              }
            ]
          }
        ],
        deals: [
          {
            name: 'active_deals',
            label: 'Active Deals',
            description: 'Deals currently in progress',
            filters: [
              { key: 'status', value: 'IN_PROGRESS', label: 'Status', type: 'select' }
            ]
          },
          {
            name: 'high_value_deals',
            label: 'High Value Deals',
            description: 'Deals above $50,000',
            filters: [
              { key: 'agreedPrice', value: { min: 50000 }, label: 'Agreed Price', type: 'numberrange' }
            ]
          }
        ]
      };

      return presets[entityType as keyof typeof presets] || [];
    }),
});
