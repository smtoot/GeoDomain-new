import { describe, it, expect, beforeEach } from '@jest/globals';
import { wholesaleConfigRouter } from '../wholesale-config';
import { WholesaleConfigService } from '@/lib/services/wholesale-config.service';

// Mock the services
jest.mock('@/lib/services/wholesale-config.service');
jest.mock('@/lib/services/wholesale-sale.service');
jest.mock('@/lib/prisma');

describe('wholesaleConfigRouter', () => {
  const mockSession = {
    user: {
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  };

  const mockContext = {
    session: mockSession,
    prisma: {} as any,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return configuration', async () => {
      const mockConfig = {
        id: 'default',
        wholesalePrice: 299,
        commissionAmount: 25,
        isActive: true,
        updatedBy: 'admin-id',
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      (WholesaleConfigService.getConfig as jest.Mock).mockResolvedValue(mockConfig);

      const caller = wholesaleConfigRouter.createCaller(mockContext);
      const result = await caller.getConfig();

      expect(result).toEqual(mockConfig);
      expect(WholesaleConfigService.getConfig).toHaveBeenCalled();
    });
  });

  describe('updateConfig', () => {
    it('should update configuration with valid inputs', async () => {
      const mockUpdatedConfig = {
        id: 'default',
        wholesalePrice: 399,
        commissionAmount: 30,
        isActive: true,
        updatedBy: 'admin-id',
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      (WholesaleConfigService.updateConfig as jest.Mock).mockResolvedValue(mockUpdatedConfig);

      const caller = wholesaleConfigRouter.createCaller(mockContext);
      const result = await caller.updateConfig({
        wholesalePrice: 399,
        commissionAmount: 30,
      });

      expect(result).toEqual(mockUpdatedConfig);
      expect(WholesaleConfigService.updateConfig).toHaveBeenCalledWith({
        wholesalePrice: 399,
        commissionAmount: 30,
        updatedBy: 'admin-id',
      });
    });

    it('should throw error for invalid inputs', async () => {
      const caller = wholesaleConfigRouter.createCaller(mockContext);

      await expect(
        caller.updateConfig({
          wholesalePrice: 49, // Too low
          commissionAmount: 25,
        })
      ).rejects.toThrow();
    });
  });
});
