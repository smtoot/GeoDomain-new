import { describe, it, expect, beforeEach, vi } from 'vitest';
import { inquiriesRouter } from '../inquiries';

// Mock Prisma client
const mockPrisma = {
  inquiry: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  domain: {
    findUnique: vi.fn(),
  },
  message: {
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
  },
  inquiryModeration: {
    create: vi.fn(),
    createMany: vi.fn(),
  },
  messageModeration: {
    createMany: vi.fn(),
  },
  deal: {
    count: vi.fn(),
  },
  $transaction: vi.fn(),
} as unknown as {
  inquiry: {
    findUnique: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  domain: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  message: {
    findMany: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  inquiryModeration: {
    create: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  messageModeration: {
    createMany: ReturnType<typeof vi.fn>;
  };
  deal: {
    count: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

describe('Inquiries Router Security Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getById - PII Security', () => {
    it('should redact buyer PII from messages when accessed by seller', async () => {
      const mockInquiry = {
        id: 'inquiry-1',
        domainId: 'domain-1',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
        domain: {
          id: 'domain-1',
          name: 'example.com',
          price: 5000,
          logoUrl: null,
          owner: {
            id: 'seller-1',
            name: 'John Seller',
            email: 'seller@example.com',
          },
        },
        messages: [
          {
            id: 'msg-1',
            content: 'Hello, I am interested in this domain',
            sentDate: new Date(),
            status: 'DELIVERED',
            senderType: 'BUYER',
            sender: {
              id: 'buyer-1',
              name: 'Jane Buyer',
              email: 'buyer@example.com',
            },
          },
          {
            id: 'msg-2',
            content: 'Thank you for your interest',
            sentDate: new Date(),
            status: 'DELIVERED',
            senderType: 'SELLER',
            sender: {
              id: 'seller-1',
              name: 'John Seller',
              email: 'seller@example.com',
            },
          },
        ],
        anonymousBuyerId: 'anon-123',
        budgetRange: '$1000-$5000',
        intendedUse: 'Business website',
        timeline: 'ASAP',
      };

      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiry);

      const sellerSession = {
        user: {
          id: 'seller-1',
          role: 'SELLER',
        },
      };

      const ctx = {
        prisma: mockPrisma,
        session: sellerSession,
      };

      const result = await inquiriesRouter
        .createCaller(ctx)
        .getById({ id: 'inquiry-1' });

      // Verify that buyer PII is redacted
      expect(result.messages).toHaveLength(2);
      
      const buyerMessage = result.messages.find((msg: { senderType: string }) => msg.senderType === 'BUYER');
      expect(buyerMessage.sender).toEqual({
        id: 'anonymous',
        name: 'Anonymous Buyer',
        email: 'hidden@example.com',
      });

      // Verify that seller PII is preserved
      const sellerMessage = result.messages.find((msg: { senderType: string }) => msg.senderType === 'SELLER');
      expect(sellerMessage.sender).toEqual({
        id: 'seller-1',
        name: 'John Seller',
        email: 'seller@example.com',
      });

      // Verify that buyer contact info is not exposed in buyerInfo
      expect(result.buyerInfo).toEqual({
        anonymousBuyerId: 'anon-123',
        budgetRange: '$1000-$5000',
        intendedUse: 'Business website',
        timeline: 'ASAP',
      });
    });

    it('should preserve full PII when accessed by admin', async () => {
      const mockInquiry = {
        id: 'inquiry-1',
        domainId: 'domain-1',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
        domain: {
          id: 'domain-1',
          name: 'example.com',
          price: 5000,
          logoUrl: null,
          owner: {
            id: 'seller-1',
            name: 'John Seller',
            email: 'seller@example.com',
          },
        },
        messages: [
          {
            id: 'msg-1',
            content: 'Hello, I am interested in this domain',
            sentDate: new Date(),
            status: 'DELIVERED',
            senderType: 'BUYER',
            sender: {
              id: 'buyer-1',
              name: 'Jane Buyer',
              email: 'buyer@example.com',
            },
          },
        ],
        buyerName: 'Jane Buyer',
        buyerEmail: 'buyer@example.com',
        buyerPhone: '+1234567890',
        buyerCompany: 'Buyer Corp',
      };

      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiry);

      const adminSession = {
        user: {
          id: 'admin-1',
          role: 'ADMIN',
        },
      };

      const ctx = {
        prisma: mockPrisma,
        session: adminSession,
      };

      const result = await inquiriesRouter
        .createCaller(ctx)
        .getById({ id: 'inquiry-1' });

      // Admin should see full PII
      expect(result.messages[0].sender).toEqual({
        id: 'buyer-1',
        name: 'Jane Buyer',
        email: 'buyer@example.com',
      });

      expect(result.buyerName).toBe('Jane Buyer');
      expect(result.buyerEmail).toBe('buyer@example.com');
    });

    it('should preserve full PII when accessed by buyer', async () => {
      const mockInquiry = {
        id: 'inquiry-1',
        domainId: 'domain-1',
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
        domain: {
          id: 'domain-1',
          name: 'example.com',
          price: 5000,
          logoUrl: null,
          owner: {
            id: 'seller-1',
            name: 'John Seller',
            email: 'seller@example.com',
          },
        },
        messages: [
          {
            id: 'msg-1',
            content: 'Hello, I am interested in this domain',
            sentDate: new Date(),
            status: 'DELIVERED',
            senderType: 'BUYER',
            sender: {
              id: 'buyer-1',
              name: 'Jane Buyer',
              email: 'buyer@example.com',
            },
          },
        ],
        buyerName: 'Jane Buyer',
        buyerEmail: 'buyer@example.com',
        buyerPhone: '+1234567890',
        buyerCompany: 'Buyer Corp',
      };

      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiry);

      const buyerSession = {
        user: {
          id: 'buyer-1',
          role: 'BUYER',
        },
      };

      const ctx = {
        prisma: mockPrisma,
        session: buyerSession,
      };

      const result = await inquiriesRouter
        .createCaller(ctx)
        .getById({ id: 'inquiry-1' });

      // Buyer should see their own full PII
      expect(result.messages[0].sender).toEqual({
        id: 'buyer-1',
        name: 'Jane Buyer',
        email: 'buyer@example.com',
      });

      expect(result.buyerName).toBe('Jane Buyer');
      expect(result.buyerEmail).toBe('buyer@example.com');
    });
  });

  describe('getMessages - PII Security', () => {
    it('should redact buyer PII from messages when accessed by seller', async () => {
      const mockInquiry = {
        id: 'inquiry-1',
        buyerId: 'buyer-1',
        sellerId: 'seller-1',
      };

      const mockMessages = [
        {
          id: 'msg-1',
          content: 'Hello, I am interested',
          sentDate: new Date(),
          status: 'DELIVERED',
          senderType: 'BUYER',
          sender: {
            id: 'buyer-1',
            name: 'Jane Buyer',
            email: 'buyer@example.com',
          },
        },
        {
          id: 'msg-2',
          content: 'Thank you for your interest',
          sentDate: new Date(),
          status: 'DELIVERED',
          senderType: 'SELLER',
          sender: {
            id: 'seller-1',
            name: 'John Seller',
            email: 'seller@example.com',
          },
        },
      ];

      mockPrisma.inquiry.findUnique.mockResolvedValue(mockInquiry);
      mockPrisma.message.findMany.mockResolvedValue(mockMessages);
      mockPrisma.message.count.mockResolvedValue(2);

      const sellerSession = {
        user: {
          id: 'seller-1',
          role: 'SELLER',
        },
      };

      const ctx = {
        prisma: mockPrisma,
        session: sellerSession,
      };

      const result = await inquiriesRouter
        .createCaller(ctx)
        .getMessages({ inquiryId: 'inquiry-1', page: 1, limit: 20 });

      // Verify that buyer PII is redacted
      const buyerMessage = result.messages.find((msg: { senderType: string }) => msg.senderType === 'BUYER');
      expect(buyerMessage.sender).toEqual({
        id: 'anonymous',
        name: 'Anonymous Buyer',
        email: 'hidden@example.com',
      });

      // Verify that seller PII is preserved
      const sellerMessage = result.messages.find((msg: { senderType: string }) => msg.senderType === 'SELLER');
      expect(sellerMessage.sender).toEqual({
        id: 'seller-1',
        name: 'John Seller',
        email: 'seller@example.com',
      });
    });
  });

  describe('getDomainInquiries - Status Filter Security', () => {
    it('should only return inquiries with OPEN or CLOSED status by default', async () => {
      const mockInquiries = [
        {
          id: 'inquiry-1',
          status: 'OPEN',
          createdAt: new Date(),
          updatedAt: new Date(),
          anonymousBuyerId: 'anon-123',
          budgetRange: '$1000-$5000',
          intendedUse: 'Business website',
          timeline: 'ASAP',
          domain: {
            id: 'domain-1',
            name: 'example.com',
            price: 5000,
          },
          messages: [],
        },
      ];

      mockPrisma.inquiry.findMany.mockResolvedValue(mockInquiries);

      const sellerSession = {
        user: {
          id: 'seller-1',
          role: 'SELLER',
        },
      };

      const ctx = {
        prisma: mockPrisma,
        session: sellerSession,
      };

      await inquiriesRouter
        .createCaller(ctx)
        .getDomainInquiries({ limit: 20 });

      // Verify that the query includes the correct status filter
      expect(mockPrisma.inquiry.findMany).toHaveBeenCalledWith({
        take: 21,
        where: {
          sellerId: 'seller-1',
          status: { in: ['OPEN', 'CLOSED'] },
        },
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });
});
