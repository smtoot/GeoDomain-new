import { prisma } from '@/lib/prisma';

export interface WholesaleConfig {
  id: string;
  wholesalePrice: number;
  commissionAmount: number;
  isActive: boolean;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface WholesaleConfigUpdate {
  wholesalePrice: number;
  commissionAmount: number;
  updatedBy: string;
}

export interface WholesalePricingSummary {
  totalDomains: number;
  wholesalePrice: number;
  commissionAmount: number;
  sellerPayout: number;
  totalRevenue: number;
  lastUpdated: Date;
}

export class WholesaleConfigService {
  /**
   * Get current active wholesale configuration
   */
  static async getConfig(): Promise<WholesaleConfig> {
    const config = await prisma.wholesaleConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      throw new Error('Wholesale configuration not found');
    }

    return {
      id: config.id,
      wholesalePrice: Number(config.wholesalePrice),
      commissionAmount: Number(config.commissionAmount),
      isActive: config.isActive,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
      createdAt: config.createdAt,
    };
  }

  /**
   * Update wholesale configuration
   */
  static async updateConfig(update: WholesaleConfigUpdate): Promise<WholesaleConfig> {
    // Validate inputs
    if (update.wholesalePrice < 50) {
      throw new Error('Wholesale price must be at least $50');
    }
    if (update.commissionAmount < 1) {
      throw new Error('Commission amount must be at least $1');
    }
    if (update.commissionAmount >= update.wholesalePrice) {
      throw new Error('Commission amount must be less than wholesale price');
    }

    // Update configuration
    const config = await prisma.wholesaleConfig.update({
      where: { id: 'default' },
      data: {
        wholesalePrice: update.wholesalePrice,
        commissionAmount: update.commissionAmount,
        updatedBy: update.updatedBy,
        updatedAt: new Date(),
      },
    });

    return {
      id: config.id,
      wholesalePrice: Number(config.wholesalePrice),
      commissionAmount: Number(config.commissionAmount),
      isActive: config.isActive,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
      createdAt: config.createdAt,
    };
  }

  /**
   * Get configuration history (optional)
   */
  static async getConfigHistory(): Promise<WholesaleConfig[]> {
    const configs = await prisma.wholesaleConfig.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return configs.map(config => ({
      id: config.id,
      wholesalePrice: Number(config.wholesalePrice),
      commissionAmount: Number(config.commissionAmount),
      isActive: config.isActive,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
      createdAt: config.createdAt,
    }));
  }

  /**
   * Initialize default configuration if it doesn't exist
   */
  static async initializeDefaultConfig(adminId: string): Promise<WholesaleConfig> {
    const existingConfig = await prisma.wholesaleConfig.findUnique({
      where: { id: 'default' },
    });

    if (existingConfig) {
      return {
        id: existingConfig.id,
        wholesalePrice: Number(existingConfig.wholesalePrice),
        commissionAmount: Number(existingConfig.commissionAmount),
        isActive: existingConfig.isActive,
        updatedBy: existingConfig.updatedBy,
        updatedAt: existingConfig.updatedAt,
        createdAt: existingConfig.createdAt,
      };
    }

    // Create default configuration
    const config = await prisma.wholesaleConfig.create({
      data: {
        id: 'default',
        wholesalePrice: 299.00,
        commissionAmount: 25.00,
        isActive: true,
        updatedBy: adminId,
      },
    });

    return {
      id: config.id,
      wholesalePrice: Number(config.wholesalePrice),
      commissionAmount: Number(config.commissionAmount),
      isActive: config.isActive,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
      createdAt: config.createdAt,
    };
  }
}
