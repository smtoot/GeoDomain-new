import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import {
  createApiKey,
  getUserApiKeys,
  updateApiKey,
  deleteApiKey,
  getApiKeyUsage,
  getApiKeyAnalytics,
  CreateApiKeyInput,
  UpdateApiKeyInput,
} from '@/lib/security/api-keys';
import { createTRPCError, ErrorCode } from '@/lib/errors/api-errors';

// Validation schemas
const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  permissions: z.array(z.string()).min(1, 'At least one permission is required'),
  rateLimit: z.number().min(1).max(10000).optional(),
  expiresAt: z.date().optional(),
});

const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string()).optional(),
  rateLimit: z.number().min(1).max(10000).optional(),
  expiresAt: z.date().optional(),
});

const apiKeyIdSchema = z.object({
  id: z.string().cuid(),
});

/**
 * API Key Management Router
 * Provides endpoints for creating, managing, and monitoring API keys
 */
export const apiKeysRouter = createTRPCRouter({
  /**
   * Create a new API key for the authenticated user
   * @description Creates a new API key with specified permissions and rate limits
   * @param input.createApiKeySchema - API key creation parameters
   * @returns Object containing the new API key and metadata
   * @example
   * ```typescript
   * const result = await api.apiKeys.create.mutate({
   *   name: "My API Key",
   *   permissions: ["domains:read", "domains:write"],
   *   rateLimit: 1000
   * });
   * ```
   */
  create: protectedProcedure
    .input(createApiKeySchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const result = await createApiKey(userId, input as CreateApiKeyInput);

        return {
          success: true,
          data: {
            key: result.key, // Only returned once during creation
            apiKey: result.apiKey,
          },
          message: 'API key created successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to create API key', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get all API keys for the authenticated user
   * @description Retrieves a list of all API keys belonging to the user
   * @returns Array of API key metadata (keys are hidden for security)
   * @example
   * ```typescript
   * const apiKeys = await api.apiKeys.list.query();
   * ```
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const apiKeys = await getUserApiKeys(userId);

        return {
          success: true,
          data: apiKeys,
          message: 'API keys retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to fetch API keys', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Update an existing API key
   * @description Updates the metadata of an existing API key
   * @param input.updateApiKeySchema - API key update parameters
   * @returns Updated API key metadata
   * @example
   * ```typescript
   * const result = await api.apiKeys.update.mutate({
   *   id: "api_key_id",
   *   name: "Updated Name",
   *   permissions: ["domains:read"]
   * });
   * ```
   */
  update: protectedProcedure
    .input(apiKeyIdSchema.merge(updateApiKeySchema))
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const { id, ...updateData } = input;
        
        const updatedApiKey = await updateApiKey(id, userId, updateData as UpdateApiKeyInput);

        return {
          success: true,
          data: updatedApiKey,
          message: 'API key updated successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to update API key', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Delete an API key
   * @description Permanently deletes an API key
   * @param input.apiKeyIdSchema - API key ID to delete
   * @returns Success confirmation
   * @example
   * ```typescript
   * const result = await api.apiKeys.delete.mutate({ id: "api_key_id" });
   * ```
   */
  delete: protectedProcedure
    .input(apiKeyIdSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const deleted = await deleteApiKey(input.id, userId);

        if (!deleted) {
          throw createTRPCError('NOT_FOUND', 'API key not found', undefined, ErrorCode.NOT_FOUND_ERROR);
        }

        return {
          success: true,
          message: 'API key deleted successfully',
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          throw createTRPCError('NOT_FOUND', 'API key not found', error, ErrorCode.NOT_FOUND_ERROR);
        }
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to delete API key', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get usage statistics for a specific API key
   * @description Retrieves usage statistics and analytics for an API key
   * @param input.apiKeyIdSchema - API key ID to get usage for
   * @returns Usage statistics and analytics
   * @example
   * ```typescript
   * const usage = await api.apiKeys.usage.query({ id: "api_key_id" });
   * ```
   */
  usage: protectedProcedure
    .input(apiKeyIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const usage = await getApiKeyUsage(input.id, userId);

        return {
          success: true,
          data: usage,
          message: 'API key usage retrieved successfully',
        };
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          throw createTRPCError('NOT_FOUND', 'API key not found', error, ErrorCode.NOT_FOUND_ERROR);
        }
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get API key usage', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get analytics for all API keys belonging to the user
   * @description Retrieves aggregated analytics for all user's API keys
   * @returns Aggregated analytics and statistics
   * @example
   * ```typescript
   * const analytics = await api.apiKeys.analytics.query();
   * ```
   */
  analytics: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.session.user.id;
        const analytics = await getApiKeyAnalytics(userId);

        return {
          success: true,
          data: analytics,
          message: 'API key analytics retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get API key analytics', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get available permissions for API keys
   * @description Returns a list of available permissions that can be assigned to API keys
   * @returns Array of available permissions with descriptions
   * @example
   * ```typescript
   * const permissions = await api.apiKeys.permissions.query();
   * ```
   */
  permissions: protectedProcedure
    .query(async () => {
      const permissions = [
        {
          key: 'domains:read',
          name: 'Read Domains',
          description: 'View and search domains',
        },
        {
          key: 'domains:write',
          name: 'Write Domains',
          description: 'Create, update, and delete domains',
        },
        {
          key: 'inquiries:read',
          name: 'Read Inquiries',
          description: 'View inquiries and messages',
        },
        {
          key: 'inquiries:write',
          name: 'Write Inquiries',
          description: 'Create and respond to inquiries',
        },
        {
          key: 'users:read',
          name: 'Read Users',
          description: 'View user profiles and information',
        },
        {
          key: 'analytics:read',
          name: 'Read Analytics',
          description: 'View analytics and statistics',
        },
        {
          key: 'admin:read',
          name: 'Admin Read',
          description: 'Read administrative data',
        },
        {
          key: 'admin:write',
          name: 'Admin Write',
          description: 'Perform administrative actions',
        },
        {
          key: '*',
          name: 'All Permissions',
          description: 'Full access to all API endpoints',
        },
      ];

      return {
        success: true,
        data: permissions,
        message: 'Available permissions retrieved successfully',
      };
    }),
});
