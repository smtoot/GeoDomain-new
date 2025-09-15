import { TRPCError } from '@trpc/server';
import { validateApiKey, logApiKeyUsage } from './api-keys';
import { createTRPCError, ErrorCode } from '@/lib/errors/api-errors';

export interface ApiKeyContext {
  userId: string;
  permissions: string[];
  rateLimit: number;
  apiKeyId: string;
}

/**
 * Extract API key from request headers
 */
export function extractApiKeyFromHeaders(headers: Record<string, string | string[] | undefined>): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = headers['x-api-key'];
  if (typeof apiKeyHeader === 'string') {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate API key and return context
 */
export async function validateApiKeyAuth(apiKey: string): Promise<ApiKeyContext> {
  const validation = await validateApiKey(apiKey);

  if (!validation.valid) {
    throw createTRPCError('UNAUTHORIZED', validation.error || 'Invalid API key', undefined, ErrorCode.AUTHENTICATION_ERROR);
  }

  if (!validation.userId || !validation.permissions || !validation.rateLimit) {
    throw createTRPCError('UNAUTHORIZED', 'Invalid API key configuration', undefined, ErrorCode.AUTHENTICATION_ERROR);
  }

  return {
    userId: validation.userId,
    permissions: validation.permissions,
    rateLimit: validation.rateLimit,
    apiKeyId: apiKey, // This would be the actual API key ID from the database
  };
}

/**
 * Check if API key has required permission
 */
export function checkApiKeyPermission(
  apiKeyPermissions: string[],
  requiredPermission: string
): boolean {
  return apiKeyPermissions.includes(requiredPermission) || apiKeyPermissions.includes('*');
}

/**
 * Log API key usage for monitoring
 */
export async function logApiKeyUsageForRequest(
  apiKeyId: string,
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number
): Promise<void> {
  try {
    await logApiKeyUsage(apiKeyId, endpoint, method, responseTime, statusCode);
  } catch (error) {
    // Don't throw error for logging failures
    console.error('Failed to log API key usage:', error);
  }
}

/**
 * Create API key authentication middleware
 */
export function createApiKeyAuthMiddleware() {
  return async ({ ctx, next, path, type }: any) => {
    const startTime = Date.now();
    let apiKeyContext: ApiKeyContext | null = null;

    try {
      // Extract API key from headers
      const apiKey = extractApiKeyFromHeaders(ctx.req?.headers || {});
      
      if (apiKey) {
        // Validate API key
        apiKeyContext = await validateApiKeyAuth(apiKey);
        
        // Add API key context to the request context
        ctx.apiKey = apiKeyContext;
        ctx.user = { id: apiKeyContext.userId };
      }

      // Continue to the next middleware/handler
      const result = await next();

      // Log API key usage if applicable
      if (apiKeyContext) {
        const responseTime = Date.now() - startTime;
        await logApiKeyUsageForRequest(
          apiKeyContext.apiKeyId,
          path,
          type,
          responseTime,
          200 // Success status
        );
      }

      return result;
    } catch (error) {
      // Log API key usage for errors
      if (apiKeyContext) {
        const responseTime = Date.now() - startTime;
        const statusCode = error instanceof TRPCError ? 
          (error.code === 'UNAUTHORIZED' ? 401 : 
           error.code === 'FORBIDDEN' ? 403 : 
           error.code === 'NOT_FOUND' ? 404 : 
           error.code === 'TOO_MANY_REQUESTS' ? 429 : 500) : 500;
        
        await logApiKeyUsageForRequest(
          apiKeyContext.apiKeyId,
          path,
          type,
          responseTime,
          statusCode
        );
      }

      throw error;
    }
  };
}

/**
 * Create permission-based middleware
 */
export function createPermissionMiddleware(requiredPermission: string) {
  return async ({ ctx, next }: any) => {
    if (!ctx.apiKey) {
      throw createTRPCError('UNAUTHORIZED', 'API key required', undefined, ErrorCode.AUTHENTICATION_ERROR);
    }

    if (!checkApiKeyPermission(ctx.apiKey.permissions, requiredPermission)) {
      throw createTRPCError('FORBIDDEN', `Permission '${requiredPermission}' required`, undefined, ErrorCode.AUTHORIZATION_ERROR);
    }

    return next();
  };
}

/**
 * Create rate limiting middleware for API keys
 */
export function createApiKeyRateLimitMiddleware() {
  return async ({ ctx, next }: any) => {
    if (!ctx.apiKey) {
      return next();
    }

    // This would integrate with the rate limiting system
    // For now, we'll just pass through
    // In a real implementation, you'd check against the API key's rate limit
    
    return next();
  };
}

/**
 * API key authentication procedure factory
 */
export function createApiKeyProcedure(t: any) {
  return t.procedure
    .use(createApiKeyAuthMiddleware())
    .use(createApiKeyRateLimitMiddleware());
}

/**
 * API key procedure with permission check
 */
export function createApiKeyProcedureWithPermission(t: any, permission: string) {
  return t.procedure
    .use(createApiKeyAuthMiddleware())
    .use(createPermissionMiddleware(permission))
    .use(createApiKeyRateLimitMiddleware());
}
