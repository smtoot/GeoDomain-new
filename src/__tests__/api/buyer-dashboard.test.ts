import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { createMocks } from 'node-mocks-http';
import { getBuyerStats, getBuyerActivity } from '../../../server/api/routers/dashboard';

const prisma = new PrismaClient();

describe('Buyer Dashboard API Tests', () => {
  beforeAll(async () => {
    // Ensure database is clean
    await prisma.inquiry.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.domain.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('getBuyerStats', () => {
    it('should return buyer statistics for valid user', async () => {
      // Create test buyer user
      const buyer = await prisma.user.create({
        data: {
          email: 'testbuyer@test.com',
          name: 'Test Buyer',
          role: 'BUYER',
          status: 'ACTIVE',
          password: 'hashedpassword'
        }
      });

      // Create test domain
      const domain = await prisma.domain.create({
        data: {
          name: 'testdomain.com',
          price: 1000,
          priceType: 'FIXED',
          status: 'VERIFIED',
          ownerId: 'seller-id'
        }
      });

      // Create test inquiry
      await prisma.inquiry.create({
        data: {
          message: 'Test inquiry',
          buyerId: buyer.id,
          domainId: domain.id,
          status: 'PENDING'
        }
      });

      const mockCtx = {
        session: { user: { id: buyer.id } },
        prisma
      } as any;

      const result = await getBuyerStats(mockCtx);

      expect(result).toBeDefined();
      expect(result.totalInquiries).toBe(1);
      expect(result.pendingInquiries).toBe(1);
    });

    it('should handle user with no activity', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'newbuyer@test.com',
          name: 'New Buyer',
          role: 'BUYER',
          status: 'ACTIVE',
          password: 'hashedpassword'
        }
      });

      const mockCtx = {
        session: { user: { id: buyer.id } },
        prisma
      } as any;

      const result = await getBuyerStats(mockCtx);

      expect(result).toBeDefined();
      expect(result.totalInquiries).toBe(0);
      expect(result.pendingInquiries).toBe(0);
      expect(result.totalSpent).toBe(0);
    });
  });

  describe('getBuyerActivity', () => {
    it('should return buyer activity data', async () => {
      const buyer = await prisma.user.create({
        data: {
          email: 'activebuyer@test.com',
          name: 'Active Buyer',
          role: 'BUYER',
          status: 'ACTIVE',
          password: 'hashedpassword'
        }
      });

      const domain = await prisma.domain.create({
        data: {
          name: 'activedomain.com',
          price: 2000,
          priceType: 'FIXED',
          status: 'VERIFIED',
          ownerId: 'seller-id'
        }
      });

      await prisma.inquiry.create({
        data: {
          message: 'Active inquiry',
          buyerId: buyer.id,
          domainId: domain.id,
          status: 'PENDING'
        }
      });

      const mockCtx = {
        session: { user: { id: buyer.id } },
        prisma
      } as any;

      const result = await getBuyerActivity(mockCtx);

      expect(result).toBeDefined();
      expect(result.inquiries).toHaveLength(1);
      expect(result.inquiries[0].message).toBe('Active inquiry');
    });
  });
});
