import { prisma } from '@/lib/prisma';
import { PrismaClient } from '@prisma/client';

/**
 * Admin User Cache Service
 * 
 * Caches admin user information to avoid repeated database lookups
 * during message creation and other admin-related operations.
 */
class AdminCache {
  private static instance: AdminCache;
  private adminUser: { id: string; name: string; email: string } | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AdminCache {
    if (!AdminCache.instance) {
      AdminCache.instance = new AdminCache();
    }
    return AdminCache.instance;
  }

  /**
   * Get cached admin user or fetch from database
   */
  async getAdminUser(prismaClient?: PrismaClient): Promise<{ id: string; name: string; email: string }> {
    const now = Date.now();
    
    // Return cached admin user if still valid
    if (this.adminUser && (now - this.lastFetch) < this.CACHE_TTL) {
      return this.adminUser;
    }

    // Use provided client or fallback to global prisma
    const client = prismaClient || prisma;

    // Fetch fresh admin user from database
    const adminUser = await client.user.findFirst({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        status: 'ACTIVE'
      },
      select: { 
        id: true,
        name: true,
        email: true
      }
    });

    if (!adminUser) {
      throw new Error('No admin user found to process messages');
    }

    // Update cache
    this.adminUser = adminUser;
    this.lastFetch = now;
    
    return adminUser;
  }

  /**
   * Get only admin user ID (for backward compatibility)
   */
  async getAdminUserId(prismaClient?: PrismaClient): Promise<string> {
    const adminUser = await this.getAdminUser(prismaClient);
    return adminUser.id;
  }

  /**
   * Invalidate cache (call when admin user changes)
   */
  invalidate(): void {
    this.adminUser = null;
    this.lastFetch = 0;
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(): boolean {
    const now = Date.now();
    return this.adminUser !== null && (now - this.lastFetch) < this.CACHE_TTL;
  }

  /**
   * Get cache status for debugging
   */
  getCacheStatus(): { 
    hasCache: boolean; 
    age: number; 
    isValid: boolean 
  } {
    const now = Date.now();
    const age = this.lastFetch ? now - this.lastFetch : 0;
    
    return {
      hasCache: this.adminUser !== null,
      age,
      isValid: this.isCacheValid()
    };
  }
}

// Export singleton instance
export const adminCache = AdminCache.getInstance();

// Export class for testing
export { AdminCache };
