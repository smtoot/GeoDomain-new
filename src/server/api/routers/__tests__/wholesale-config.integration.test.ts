import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { wholesaleConfigRouter } from '../wholesale-config';
import { WholesaleConfigService } from '@/lib/services/wholesale-config.service';
import { WholesaleSaleService } from '@/lib/services/wholesale-sale.service';

// Mock the services
jest.mock('@/lib/services/wholesale-config.service');
jest.mock('@/lib/services/wholesale-sale.service');
jest.mock('@/lib/prisma');

describe('wholesaleConfigRouter Integration Tests', () => {
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
    it('should return configuration when it exists', async () => {
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

    it('should initialize default config when none exists', async () => {
      const mockAdminUser = { id: 'admin-id', role: 'ADMIN' };
      const mockConfig = {
        id: 'default',
        wholesalePrice: 299,
        commissionAmount: 25,
        isActive: true,
        updatedBy: 'admin-id',
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      (WholesaleConfigService.getConfig as jest.Mock).mockRejectedValue(new Error('Configuration not found'));
      (WholesaleConfigService.initializeDefaultConfig as jest.Mock).mockResolvedValue(mockConfig);

      // Mock prisma to return admin user
      const { prisma } = require('@/lib/prisma');
      prisma.user.findFirst = jest.fn().mockResolvedValue(mockAdminUser);

      const caller = wholesaleConfigRouter.createCaller(mockContext);
      const result = await caller.getConfig();

      expect(result).toEqual(mockConfig);
      expect(WholesaleConfigService.initializeDefaultConfig).toHaveBeenCalledWith('admin-id');
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
      ).rejects.toThrow('Wholesale price must be at least $50');
    });
  });

  describe('getPricingSummary', () => {
    it('should return pricing summary', async () => {
      const mockSummary = {
        totalDomains: 10,
        wholesalePrice: 299,
        commissionAmount: 25,
        sellerPayout: 274,
        totalRevenue: 250,
        lastUpdated: new Date(),
      };

      (WholesaleSaleService.getPricingSummary as jest.Mock).mockResolvedValue(mockSummary);

      const caller = wholesaleConfigRouter.createCaller(mockContext);
      const result = await caller.getPricingSummary();

      expect(result).toEqual(mockSummary);
      expect(WholesaleSaleService.getPricingSummary).toHaveBeenCalled();
    });
  });

  describe('createSale', () => {
    it('should create a new wholesale sale', async () => {
      const mockSaleId = 'sale-123';
      (WholesaleSaleService.createWholesaleSale as jest.Mock).mockResolvedValue(mockSaleId);

      const caller = wholesaleConfigRouter.createCaller(mockContext);
      const result = await caller.createSale({
        wholesaleDomainId: 'domain-123',
        paymentMethod: 'stripe',
      });

      expect(result).toEqual({ saleId: mockSaleId });
      expect(WholesaleSaleService.createWholesaleSale).toHaveBeenCalledWith(
        'domain-123',
        'admin-id',
        'stripe'
      );
    });
  });
});
