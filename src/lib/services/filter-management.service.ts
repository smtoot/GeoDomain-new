import { prisma } from '@/lib/prisma';

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filters: Array<{
    key: string;
    value: any;
    label: string;
    type: string;
  }>;
  userId: string;
  entityType: string; // 'domains', 'users', 'inquiries', etc.
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSavedFilterData {
  name: string;
  description?: string;
  filters: Array<{
    key: string;
    value: any;
    label: string;
    type: string;
  }>;
  userId: string;
  entityType: string;
  isDefault?: boolean;
}

export class FilterManagementService {
  /**
   * Get all saved filters for a user and entity type
   */
  static async getSavedFilters(userId: string, entityType: string): Promise<SavedFilter[]> {
    try {
      const filters = await prisma.savedFilter.findMany({
        where: {
          userId,
          entityType,
        },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return filters.map(filter => ({
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        filters: filter.filters as any,
        userId: filter.userId,
        entityType: filter.entityType,
        isDefault: filter.isDefault,
        createdAt: filter.createdAt,
        updatedAt: filter.updatedAt,
      }));
    } catch (error) {
      console.error('Error fetching saved filters:', error);
      throw new Error('Failed to fetch saved filters');
    }
  }

  /**
   * Create a new saved filter
   */
  static async createSavedFilter(data: CreateSavedFilterData): Promise<SavedFilter> {
    try {
      // If this is set as default, unset other defaults for this entity type
      if (data.isDefault) {
        await prisma.savedFilter.updateMany({
          where: {
            userId: data.userId,
            entityType: data.entityType,
            isDefault: true,
          },
          data: {
            isDefault: false,
          },
        });
      }

      const filter = await prisma.savedFilter.create({
        data: {
          name: data.name,
          description: data.description,
          filters: data.filters,
          userId: data.userId,
          entityType: data.entityType,
          isDefault: data.isDefault || false,
        },
      });

      return {
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        filters: filter.filters as any,
        userId: filter.userId,
        entityType: filter.entityType,
        isDefault: filter.isDefault,
        createdAt: filter.createdAt,
        updatedAt: filter.updatedAt,
      };
    } catch (error) {
      console.error('Error creating saved filter:', error);
      throw new Error('Failed to create saved filter');
    }
  }

  /**
   * Update an existing saved filter
   */
  static async updateSavedFilter(
    filterId: string,
    userId: string,
    data: Partial<CreateSavedFilterData>
  ): Promise<SavedFilter> {
    try {
      // If this is set as default, unset other defaults for this entity type
      if (data.isDefault) {
        await prisma.savedFilter.updateMany({
          where: {
            userId,
            entityType: data.entityType,
            isDefault: true,
            id: { not: filterId },
          },
          data: {
            isDefault: false,
          },
        });
      }

      const filter = await prisma.savedFilter.update({
        where: {
          id: filterId,
          userId, // Ensure user can only update their own filters
        },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.filters && { filters: data.filters }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });

      return {
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        filters: filter.filters as any,
        userId: filter.userId,
        entityType: filter.entityType,
        isDefault: filter.isDefault,
        createdAt: filter.createdAt,
        updatedAt: filter.updatedAt,
      };
    } catch (error) {
      console.error('Error updating saved filter:', error);
      throw new Error('Failed to update saved filter');
    }
  }

  /**
   * Delete a saved filter
   */
  static async deleteSavedFilter(filterId: string, userId: string): Promise<void> {
    try {
      await prisma.savedFilter.delete({
        where: {
          id: filterId,
          userId, // Ensure user can only delete their own filters
        },
      });
    } catch (error) {
      console.error('Error deleting saved filter:', error);
      throw new Error('Failed to delete saved filter');
    }
  }

  /**
   * Get default filter for an entity type
   */
  static async getDefaultFilter(userId: string, entityType: string): Promise<SavedFilter | null> {
    try {
      const filter = await prisma.savedFilter.findFirst({
        where: {
          userId,
          entityType,
          isDefault: true,
        },
      });

      if (!filter) return null;

      return {
        id: filter.id,
        name: filter.name,
        description: filter.description || undefined,
        filters: filter.filters as any,
        userId: filter.userId,
        entityType: filter.entityType,
        isDefault: filter.isDefault,
        createdAt: filter.createdAt,
        updatedAt: filter.updatedAt,
      };
    } catch (error) {
      console.error('Error fetching default filter:', error);
      throw new Error('Failed to fetch default filter');
    }
  }

  /**
   * Set a filter as default
   */
  static async setDefaultFilter(filterId: string, userId: string): Promise<SavedFilter> {
    try {
      // First get the filter to get entity type
      const filter = await prisma.savedFilter.findFirst({
        where: {
          id: filterId,
          userId,
        },
      });

      if (!filter) {
        throw new Error('Filter not found');
      }

      // Unset other defaults for this entity type
      await prisma.savedFilter.updateMany({
        where: {
          userId,
          entityType: filter.entityType,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

      // Set this filter as default
      const updatedFilter = await prisma.savedFilter.update({
        where: {
          id: filterId,
        },
        data: {
          isDefault: true,
        },
      });

      return {
        id: updatedFilter.id,
        name: updatedFilter.name,
        description: updatedFilter.description || undefined,
        filters: updatedFilter.filters as any,
        userId: updatedFilter.userId,
        entityType: updatedFilter.entityType,
        isDefault: updatedFilter.isDefault,
        createdAt: updatedFilter.createdAt,
        updatedAt: updatedFilter.updatedAt,
      };
    } catch (error) {
      console.error('Error setting default filter:', error);
      throw new Error('Failed to set default filter');
    }
  }

  /**
   * Get filter statistics for analytics
   */
  static async getFilterStats(userId: string): Promise<{
    totalFilters: number;
    filtersByEntity: Record<string, number>;
    mostUsedFilters: Array<{
      name: string;
      entityType: string;
      usageCount: number;
    }>;
  }> {
    try {
      const filters = await prisma.savedFilter.findMany({
        where: { userId },
        select: {
          name: true,
          entityType: true,
          usageCount: true,
        },
      });

      const totalFilters = filters.length;
      const filtersByEntity = filters.reduce((acc, filter) => {
        acc[filter.entityType] = (acc[filter.entityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostUsedFilters = filters
        .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
        .slice(0, 5)
        .map(filter => ({
          name: filter.name,
          entityType: filter.entityType,
          usageCount: filter.usageCount || 0,
        }));

      return {
        totalFilters,
        filtersByEntity,
        mostUsedFilters,
      };
    } catch (error) {
      console.error('Error fetching filter stats:', error);
      throw new Error('Failed to fetch filter statistics');
    }
  }

  /**
   * Increment usage count for a filter
   */
  static async incrementFilterUsage(filterId: string, userId: string): Promise<void> {
    try {
      await prisma.savedFilter.update({
        where: {
          id: filterId,
          userId,
        },
        data: {
          usageCount: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      console.error('Error incrementing filter usage:', error);
      // Don't throw error for usage tracking failures
    }
  }
}
