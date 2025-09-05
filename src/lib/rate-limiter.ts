import Redis from 'ioredis';

// Enhanced rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  // Default limits
  DEFAULTS: {
    WINDOW_SIZE: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
    BURST_LIMIT: 150,
    COOLDOWN_PERIOD: 5 * 60 * 1000, // 5 minutes
  },
  
  // Path-specific limits
  PATHS: {
    '/api/auth': { maxRequests: 10, windowSize: 60 * 1000 },
    '/api/search': { maxRequests: 50, windowSize: 60 * 1000 },
    '/api/domains': { maxRequests: 200, windowSize: 60 * 1000 },
    '/api/inquiries': { maxRequests: 30, windowSize: 60 * 1000 },
    '/api/dashboard': { maxRequests: 100, windowSize: 60 * 1000 },
  },
  
  // IP reputation-based limits
  REPUTATION: {
    TRUSTED: { multiplier: 2.0, burstMultiplier: 1.5 },
    NORMAL: { multiplier: 1.0, burstMultiplier: 1.0 },
    SUSPICIOUS: { multiplier: 0.5, burstMultiplier: 0.5 },
    BLOCKED: { multiplier: 0.0, burstMultiplier: 0.0 },
  },
  
  // Adaptive rate limiting
  ADAPTIVE: {
    ENABLED: true,
    LEARNING_RATE: 0.1,
    MIN_MULTIPLIER: 0.1,
    MAX_MULTIPLIER: 3.0,
    ADJUSTMENT_INTERVAL: 5 * 60 * 1000, // 5 minutes
  }
};

// Rate limit result interface
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  limit: number;
  burstLimit: number;
  reputation: 'TRUSTED' | 'NORMAL' | 'SUSPICIOUS' | 'BLOCKED';
}

// IP reputation interface
export interface IPReputation {
  score: number;
  totalRequests: number;
  failedRequests: number;
  lastSeen: number;
  reputation: 'TRUSTED' | 'NORMAL' | 'SUSPICIOUS' | 'BLOCKED';
  multiplier: number;
}

// Enhanced rate limiter class
export class EnhancedRateLimiter {
  private redis: Redis | null;
  private ipReputations: Map<string, IPReputation> = new Map();
  private lastAdjustment: number = Date.now();

  constructor(redisClient?: Redis) {
    this.redis = redisClient || null;
    
    // Start adaptive adjustment timer
    if (RATE_LIMIT_CONFIG.ADAPTIVE.ENABLED) {
      setInterval(() => this.adjustLimits(), RATE_LIMIT_CONFIG.ADAPTIVE.ADJUSTMENT_INTERVAL);
    }
  }

  /**
   * Check if a request is allowed based on rate limiting
   */
  async checkRateLimit(
    pathname: string,
    ip: string,
    userAgent?: string
  ): Promise<RateLimitResult> {
    try {
      // Get IP reputation
      const reputation = await this.getIPReputation(ip);
      
      // Get path-specific limits
      const limits = this.getPathLimits(pathname);
      
      // Apply reputation multiplier
      const adjustedLimits = this.applyReputationMultiplier(limits, reputation);
      
      // Check current usage
      const usage = await this.getCurrentUsage(pathname, ip);
      
      // Check if request is allowed
      const allowed = this.isRequestAllowed(usage, adjustedLimits, reputation);
      
      // Update usage and reputation
      await this.updateUsage(pathname, ip, allowed);
      await this.updateReputation(ip, allowed, userAgent);
      
      // Calculate remaining requests and reset time
      const remaining = Math.max(0, adjustedLimits.maxRequests - usage.count);
      const resetTime = usage.windowStart + limits.windowSize;
      
      return {
        allowed,
        remaining,
        resetTime,
        limit: adjustedLimits.maxRequests,
        burstLimit: adjustedLimits.burstLimit,
        reputation: reputation.reputation,
        ...(allowed ? {} : { retryAfter: Math.ceil((resetTime - Date.now()) / 1000) })
      };
      
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Fail open in case of errors
      return {
        allowed: true,
        remaining: 100,
        resetTime: Date.now() + 60000,
        limit: 100,
        burstLimit: 150,
        reputation: 'NORMAL'
      };
    }
  }

  /**
   * Get IP reputation with caching
   */
  private async getIPReputation(ip: string): Promise<IPReputation> {
    // Check memory cache first
    if (this.ipReputations.has(ip)) {
      const cached = this.ipReputations.get(ip)!;
      if (Date.now() - cached.lastSeen < 300000) { // 5 minutes
        return cached;
      }
    }

    // Get from Redis or create new
    let reputation: IPReputation;
    
    if (this.redis) {
      const cached = await this.redis.get(`reputation:${ip}`);
      if (cached) {
        reputation = JSON.parse(cached);
      } else {
        reputation = this.createDefaultReputation();
      }
    } else {
      reputation = this.createDefaultReputation();
    }

    // Update memory cache
    this.ipReputations.set(ip, reputation);
    return reputation;
  }

  /**
   * Get path-specific rate limits
   */
  private getPathLimits(pathname: string) {
    for (const [path, limits] of Object.entries(RATE_LIMIT_CONFIG.PATHS)) {
      if (pathname.startsWith(path)) {
        return {
          maxRequests: limits.maxRequests,
          windowSize: limits.windowSize,
          burstLimit: Math.floor(limits.maxRequests * 1.5)
        };
      }
    }
    
    return {
      maxRequests: RATE_LIMIT_CONFIG.DEFAULTS.MAX_REQUESTS,
      windowSize: RATE_LIMIT_CONFIG.DEFAULTS.WINDOW_SIZE,
      burstLimit: RATE_LIMIT_CONFIG.DEFAULTS.BURST_LIMIT
    };
  }

  /**
   * Apply reputation multiplier to limits
   */
  private applyReputationMultiplier(limits: any, reputation: IPReputation) {
    const config = RATE_LIMIT_CONFIG.REPUTATION[reputation.reputation];
    
    return {
      maxRequests: Math.floor(limits.maxRequests * reputation.multiplier),
      windowSize: limits.windowSize,
      burstLimit: Math.floor(limits.burstLimit * config.burstMultiplier)
    };
  }

  /**
   * Get current usage for a path/IP combination
   */
  private async getCurrentUsage(pathname: string, ip: string) {
    const key = `rate_limit:${pathname}:${ip}`;
    const now = Date.now();
    
    if (this.redis) {
      const usage = await this.redis.get(key);
      if (usage) {
        const parsed = JSON.parse(usage);
        if (now - parsed.windowStart < parsed.windowSize) {
          return parsed;
        }
      }
    }
    
    // Return new window
    return {
      count: 0,
      windowStart: now,
      windowSize: this.getPathLimits(pathname).windowSize
    };
  }

  /**
   * Check if request is allowed
   */
  private isRequestAllowed(usage: any, limits: any, reputation: IPReputation): boolean {
    // Block if reputation is blocked
    if (reputation.reputation === 'BLOCKED') {
      return false;
    }
    
    // Check normal rate limit
    if (usage.count >= limits.maxRequests) {
      return false;
    }
    
    // Check burst limit
    if (usage.count >= limits.burstLimit) {
      return false;
    }
    
    return true;
  }

  /**
   * Update usage tracking
   */
  private async updateUsage(pathname: string, ip: string, allowed: boolean) {
    const key = `rate_limit:${pathname}:${ip}`;
    const now = Date.now();
    
    if (this.redis) {
      const usage = await this.getCurrentUsage(pathname, ip);
      usage.count++;
      
      await this.redis.setex(key, Math.ceil(usage.windowSize / 1000), JSON.stringify(usage));
    }
  }

  /**
   * Update IP reputation
   */
  private async updateReputation(ip: string, allowed: boolean, userAgent?: string) {
    const reputation = await this.getIPReputation(ip);
    
    reputation.totalRequests++;
    reputation.lastSeen = Date.now();
    
    if (!allowed) {
      reputation.failedRequests++;
    }
    
    // Calculate new score
    reputation.score = this.calculateReputationScore(reputation);
    
    // Update reputation level
    reputation.reputation = this.getReputationLevel(reputation.score);
    
    // Update multiplier
    reputation.multiplier = RATE_LIMIT_CONFIG.REPUTATION[reputation.reputation].multiplier;
    
    // Save to Redis
    if (this.redis) {
      await this.redis.setex(`reputation:${ip}`, 3600, JSON.stringify(reputation));
    }
    
    // Update memory cache
    this.ipReputations.set(ip, reputation);
  }

  /**
   * Calculate reputation score
   */
  private calculateReputationScore(reputation: IPReputation): number {
    const successRate = (reputation.totalRequests - reputation.failedRequests) / reputation.totalRequests;
    const timeFactor = Math.min(1, (Date.now() - reputation.lastSeen) / (24 * 60 * 60 * 1000));
    
    return (successRate * 0.7) + (timeFactor * 0.3);
  }

  /**
   * Get reputation level from score
   */
  private getReputationLevel(score: number): 'TRUSTED' | 'NORMAL' | 'SUSPICIOUS' | 'BLOCKED' {
    if (score >= 0.9) return 'TRUSTED';
    if (score >= 0.7) return 'NORMAL';
    if (score >= 0.4) return 'SUSPICIOUS';
    return 'BLOCKED';
  }

  /**
   * Create default reputation
   */
  private createDefaultReputation(): IPReputation {
    return {
      score: 0.5,
      totalRequests: 0,
      failedRequests: 0,
      lastSeen: Date.now(),
      reputation: 'NORMAL',
      multiplier: 1.0
    };
  }

  /**
   * Adjust rate limits based on system performance
   */
  private async adjustLimits(): Promise<void> {
    if (!RATE_LIMIT_CONFIG.ADAPTIVE.ENABLED) return;
    
    try {
      // Get system metrics (CPU, memory, response times)
      const metrics = await this.getSystemMetrics();
      
      // Adjust limits based on metrics
      const adjustment = this.calculateAdjustment(metrics);
      
      // Apply adjustment to all IPs
      for (const [ip, reputation] of this.ipReputations.entries()) {
        const newMultiplier = Math.max(
          RATE_LIMIT_CONFIG.ADAPTIVE.MIN_MULTIPLIER,
          Math.min(
            RATE_LIMIT_CONFIG.ADAPTIVE.MAX_MULTIPLIER,
            reputation.multiplier + adjustment
          )
        );
        
        reputation.multiplier = newMultiplier;
        reputation.reputation = this.getReputationLevel(reputation.score);
        
        if (this.redis) {
          await this.redis.setex(`reputation:${ip}`, 3600, JSON.stringify(reputation));
        }
      }
      
      this.lastAdjustment = Date.now();
      
    } catch (error) {
      console.error('Rate limit adjustment error:', error);
    }
  }

  /**
   * Get system metrics for adaptive rate limiting
   */
  private async getSystemMetrics(): Promise<any> {
    // In a real implementation, this would get actual system metrics
    // For now, return mock data
    return {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      responseTime: Math.random() * 1000,
      errorRate: Math.random() * 0.1
    };
  }

  /**
   * Calculate adjustment based on system metrics
   */
  private calculateAdjustment(metrics: any): number {
    let adjustment = 0;
    
    // Adjust based on CPU usage
    if (metrics.cpuUsage > 80) {
      adjustment -= RATE_LIMIT_CONFIG.ADAPTIVE.LEARNING_RATE;
    } else if (metrics.cpuUsage < 20) {
      adjustment += RATE_LIMIT_CONFIG.ADAPTIVE.LEARNING_RATE;
    }
    
    // Adjust based on error rate
    if (metrics.errorRate > 0.05) {
      adjustment -= RATE_LIMIT_CONFIG.ADAPTIVE.LEARNING_RATE;
    }
    
    return adjustment;
  }

  /**
   * Clean up old reputation data
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const cutoff = now - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [ip, reputation] of this.ipReputations.entries()) {
      if (reputation.lastSeen < cutoff) {
        this.ipReputations.delete(ip);
        
        if (this.redis) {
          await this.redis.del(`reputation:${ip}`);
        }
      }
    }
  }

  /**
   * Get rate limit statistics
   */
  async getStats(): Promise<any> {
    const totalIPs = this.ipReputations.size;
    const reputationCounts = {
      TRUSTED: 0,
      NORMAL: 0,
      SUSPICIOUS: 0,
      BLOCKED: 0
    };
    
    for (const reputation of this.ipReputations.values()) {
      reputationCounts[reputation.reputation]++;
    }
    
    return {
      totalIPs,
      reputationCounts,
      lastAdjustment: this.lastAdjustment,
      adaptiveEnabled: RATE_LIMIT_CONFIG.ADAPTIVE.ENABLED
    };
  }
}

// Factory function to create rate limiter
export function createRateLimiter(redisClient?: Redis): EnhancedRateLimiter {
  return new EnhancedRateLimiter(redisClient);
}
