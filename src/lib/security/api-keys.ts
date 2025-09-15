import { prisma } from '@/lib/prisma';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import { createTRPCError, ErrorCode } from '@/lib/errors/api-errors';

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  userId: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyInput {
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

export interface UpdateApiKeyInput {
  name?: string;
  permissions?: string[];
  rateLimit?: number;
  expiresAt?: Date;
}

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  const prefix = 'gdl_'; // GeoDomainLand prefix
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return `${prefix}${randomBytes}`;
}

/**
 * Hash an API key for secure storage
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  userId: string,
  input: CreateApiKeyInput
): Promise<{ key: string; apiKey: Omit<ApiKey, 'key'> }> {
  try {
    const key = generateApiKey();
    const hashedKey = hashApiKey(key);

    const apiKey = await prisma.apiKey.create({
      data: {
        name: input.name,
        key: hashedKey,
        userId,
        permissions: input.permissions,
        rateLimit: input.rateLimit || 1000, // Default 1000 requests per hour
        expiresAt: input.expiresAt,
      },
    });

    return {
      key,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: '[HIDDEN]',
        userId: apiKey.userId,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
      },
    };
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to create API key', error, ErrorCode.DATABASE_ERROR);
  }
}

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(userId: string): Promise<Omit<ApiKey, 'key'>[]> {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        userId: true,
        permissions: true,
        rateLimit: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return apiKeys.map(key => ({
      ...key,
      key: '[HIDDEN]',
    }));
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to fetch API keys', error, ErrorCode.DATABASE_ERROR);
  }
}

/**
 * Update an API key
 */
export async function updateApiKey(
  keyId: string,
  userId: string,
  input: UpdateApiKeyInput
): Promise<Omit<ApiKey, 'key'>> {
  try {
    const apiKey = await prisma.apiKey.update({
      where: {
        id: keyId,
        userId, // Ensure user can only update their own keys
      },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.permissions && { permissions: input.permissions }),
        ...(input.rateLimit && { rateLimit: input.rateLimit }),
        ...(input.expiresAt && { expiresAt: input.expiresAt }),
        updatedAt: new Date(),
      },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: '[HIDDEN]',
      userId: apiKey.userId,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    };
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to update API key', error, ErrorCode.DATABASE_ERROR);
  }
}

/**
 * Delete an API key
 */
export async function deleteApiKey(keyId: string, userId: string): Promise<boolean> {
  try {
    await prisma.apiKey.delete({
      where: {
        id: keyId,
        userId, // Ensure user can only delete their own keys
      },
    });

    return true;
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to delete API key', error, ErrorCode.DATABASE_ERROR);
  }
}

/**
 * Validate an API key and return user information
 */
export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  userId?: string;
  permissions?: string[];
  rateLimit?: number;
  error?: string;
}> {
  try {
    const hashedKey = hashApiKey(key);
    
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashedKey },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!apiKey) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if key is expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Check if user is active
    if (apiKey.user.status !== 'ACTIVE') {
      return { valid: false, error: 'User account is not active' };
    }

    // Update last used timestamp
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      valid: true,
      userId: apiKey.userId,
      permissions: apiKey.permissions,
      rateLimit: apiKey.rateLimit,
    };
  } catch (error) {
    return { valid: false, error: 'Failed to validate API key' };
  }
}

/**
 * Check if API key has required permission
 */
export function hasPermission(apiKeyPermissions: string[], requiredPermission: string): boolean {
  return apiKeyPermissions.includes(requiredPermission) || apiKeyPermissions.includes('*');
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyUsage(keyId: string, userId: string): Promise<{
  totalRequests: number;
  requestsToday: number;
  requestsThisMonth: number;
  lastUsedAt?: Date;
}> {
  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        id: keyId,
        userId,
      },
    });

    if (!apiKey) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'API key not found' });
    }

    // Get usage statistics from API key usage logs
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRequests, requestsToday, requestsThisMonth] = await Promise.all([
      prisma.apiKeyUsage.count({
        where: { apiKeyId: keyId },
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKeyId: keyId,
          createdAt: { gte: today },
        },
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKeyId: keyId,
          createdAt: { gte: thisMonth },
        },
      }),
    ]);

    return {
      totalRequests,
      requestsToday,
      requestsThisMonth,
      lastUsedAt: apiKey.lastUsedAt,
    };
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get API key usage', error, ErrorCode.DATABASE_ERROR);
  }
}

/**
 * Log API key usage
 */
export async function logApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  responseTime: number,
  statusCode: number
): Promise<void> {
  try {
    await prisma.apiKeyUsage.create({
      data: {
        apiKeyId,
        endpoint,
        method,
        responseTime,
        statusCode,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Don't throw error for logging failures
    console.error('Failed to log API key usage:', error);
  }
}

/**
 * Clean up expired API keys
 */
export async function cleanupExpiredApiKeys(): Promise<number> {
  try {
    const result = await prisma.apiKey.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error('Failed to cleanup expired API keys:', error);
    return 0;
  }
}

/**
 * Get API key analytics
 */
export async function getApiKeyAnalytics(userId: string): Promise<{
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
  totalRequests: number;
  requestsToday: number;
}> {
  try {
    const [totalKeys, activeKeys, expiredKeys, totalRequests, requestsToday] = await Promise.all([
      prisma.apiKey.count({ where: { userId } }),
      prisma.apiKey.count({
        where: {
          userId,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      }),
      prisma.apiKey.count({
        where: {
          userId,
          expiresAt: { lt: new Date() },
        },
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKey: { userId },
        },
      }),
      prisma.apiKeyUsage.count({
        where: {
          apiKey: { userId },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return {
      totalKeys,
      activeKeys,
      expiredKeys,
      totalRequests,
      requestsToday,
    };
  } catch (error) {
    throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get API key analytics', error, ErrorCode.DATABASE_ERROR);
  }
}
