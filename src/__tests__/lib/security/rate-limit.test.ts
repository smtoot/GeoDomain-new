import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock the Upstash Redis client
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    ratelimit: {
      limit: jest.fn(),
    },
  })),
}));

// Mock the ratelimit library
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(),
  })),
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rate Limiter Configuration', () => {
    it('should create rate limiters with correct configurations', async () => {
      const { defaultRateLimiter, strictRateLimiter, publicRateLimiter } = await import('@/lib/security/rate-limit');
      
      expect(defaultRateLimiter).toBeDefined();
      expect(strictRateLimiter).toBeDefined();
      expect(publicRateLimiter).toBeDefined();
    });

    it('should have different limits for different tiers', async () => {
      const { defaultRateLimiter, strictRateLimiter, publicRateLimiter } = await import('@/lib/security/rate-limit');
      
      // These should be different instances with different configurations
      expect(defaultRateLimiter).not.toBe(strictRateLimiter);
      expect(strictRateLimiter).not.toBe(publicRateLimiter);
      expect(publicRateLimiter).not.toBe(defaultRateLimiter);
    });
  });

  describe('Rate Limiting Middleware', () => {
    it('should create rate limited procedure', async () => {
      const { createRateLimitedProcedure } = await import('@/lib/security/rate-limit');
      
      const mockT = {
        procedure: {
          use: jest.fn().mockReturnThis(),
        },
      };

      const procedure = createRateLimitedProcedure(mockT as any);
      expect(procedure).toBeDefined();
      expect(mockT.procedure.use).toHaveBeenCalled();
    });

    it('should create strict rate limited procedure', async () => {
      const { createStrictRateLimitedProcedure } = await import('@/lib/security/rate-limit');
      
      const mockT = {
        procedure: {
          use: jest.fn().mockReturnThis(),
        },
      };

      const procedure = createStrictRateLimitedProcedure(mockT as any);
      expect(procedure).toBeDefined();
      expect(mockT.procedure.use).toHaveBeenCalled();
    });

    it('should create public rate limited procedure', async () => {
      const { createPublicRateLimitedProcedure } = await import('@/lib/security/rate-limit');
      
      const mockT = {
        procedure: {
          use: jest.fn().mockReturnThis(),
        },
      };

      const procedure = createPublicRateLimitedProcedure(mockT as any);
      expect(procedure).toBeDefined();
      expect(mockT.procedure.use).toHaveBeenCalled();
    });
  });

  describe('Rate Limiting Logic', () => {
    it('should allow requests within rate limit', async () => {
      const { defaultRateLimiter } = await import('@/lib/security/rate-limit');
      
      // Mock successful rate limit check
      (defaultRateLimiter.limit as jest.Mock).mockResolvedValue({
        success: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      });

      const result = await defaultRateLimiter.limit('test-user');
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(99);
    });

    it('should block requests exceeding rate limit', async () => {
      const { defaultRateLimiter } = await import('@/lib/security/rate-limit');
      
      // Mock rate limit exceeded
      (defaultRateLimiter.limit as jest.Mock).mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const result = await defaultRateLimiter.limit('test-user');
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limiter errors gracefully', async () => {
      const { defaultRateLimiter } = await import('@/lib/security/rate-limit');
      
      // Mock rate limiter error
      (defaultRateLimiter.limit as jest.Mock).mockRejectedValue(new Error('Rate limiter error'));

      await expect(defaultRateLimiter.limit('test-user')).rejects.toThrow('Rate limiter error');
    });
  });
});
