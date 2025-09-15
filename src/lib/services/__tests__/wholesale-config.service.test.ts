import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { WholesaleConfigService } from '../wholesale-config.service';
import { prisma } from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    wholesaleConfig: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('WholesaleConfigService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return configuration when it exists', async () => {
      const mockConfig = {
        id: 'default',
        wholesalePrice: 299.00,
        commissionAmount: 25.00,
        isActive: true,
        updatedBy: 'admin-id',
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      (prisma.wholesaleConfig.findFirst as jest.Mock).mockResolvedValue(mockConfig);

      const result = await WholesaleConfigService.getConfig();

      expect(result).toEqual({
        id: 'default',
        wholesalePrice: 299,
        commissionAmount: 25,
        isActive: true,
        updatedBy: 'admin-id',
        updatedAt: mockConfig.updatedAt,
        createdAt: mockConfig.createdAt,
      });
    });

    it('should throw error when configuration not found', async () => {
      (prisma.wholesaleConfig.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(WholesaleConfigService.getConfig()).rejects.toThrow(
        'Wholesale configuration not found'
      );
    });
  });

  describe('updateConfig', () => {
    it('should update configuration with valid inputs', async () => {
      const mockUpdate = {
        wholesalePrice: 399,
        commissionAmount: 30,
        updatedBy: 'admin-id',
      };

      const mockUpdatedConfig = {
        id: 'default',
        wholesalePrice: 399.00,
        commissionAmount: 30.00,
        isActive: true,
        updatedBy: 'admin-id',
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      (prisma.wholesaleConfig.update as jest.Mock).mockResolvedValue(mockUpdatedConfig);

      const result = await WholesaleConfigService.updateConfig(mockUpdate);

      expect(result.wholesalePrice).toBe(399);
      expect(result.commissionAmount).toBe(30);
      expect(prisma.wholesaleConfig.update).toHaveBeenCalledWith({
        where: { id: 'default' },
        data: {
          wholesalePrice: 399,
          commissionAmount: 30,
          updatedBy: 'admin-id',
          updatedAt: expect.any(Date),
        },
      });
    });

    it('should throw error when wholesale price is too low', async () => {
      const mockUpdate = {
        wholesalePrice: 49, // Below minimum
        commissionAmount: 25,
        updatedBy: 'admin-id',
      };

      await expect(WholesaleConfigService.updateConfig(mockUpdate)).rejects.toThrow(
        'Wholesale price must be at least $50'
      );
    });

    it('should throw error when commission amount is too low', async () => {
      const mockUpdate = {
        wholesalePrice: 299,
        commissionAmount: 0, // Below minimum
        updatedBy: 'admin-id',
      };

      await expect(WholesaleConfigService.updateConfig(mockUpdate)).rejects.toThrow(
        'Commission amount must be at least $1'
      );
    });

    it('should throw error when commission amount is greater than or equal to wholesale price', async () => {
      const mockUpdate = {
        wholesalePrice: 299,
        commissionAmount: 299, // Equal to wholesale price
        updatedBy: 'admin-id',
      };

      await expect(WholesaleConfigService.updateConfig(mockUpdate)).rejects.toThrow(
        'Commission amount must be less than wholesale price'
      );
    });
  });
});
