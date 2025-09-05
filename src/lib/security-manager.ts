import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, isDevelopmentMode } from './security-utils';

// Enhanced security configuration
export const ENHANCED_SECURITY_CONFIG = {
  // IP reputation settings
  IP_REPUTATION: {
    MAX_FAILED_ATTEMPTS: 5,
    BLOCK_DURATION: 15 * 60 * 1000, // 15 minutes
    WHITELIST_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    SUSPICIOUS_PATTERNS: [
      /bot|spider|crawler/i,
      /scanner|probe|attack/i,
      /anonymous|tor|vpn/i
    ]
  },
  
  // Request fingerprinting
  FINGERPRINTING: {
    ENABLED: true,
    MIN_HEADERS: 5,
    SUSPICIOUS_HEADERS: [
      'x-forwarded-for',
      'x-real-ip',
      'x-client-ip',
      'cf-connecting-ip'
    ]
  },
  
  // Adaptive security
  ADAPTIVE: {
    ENABLED: true,
    THREAT_LEVELS: {
      LOW: { rateLimit: 100, securityChecks: false },
      MEDIUM: { rateLimit: 50, securityChecks: true },
      HIGH: { rateLimit: 10, securityChecks: true, blockDuration: 300000 }
    }
  }
};

// Enhanced security strategy interface
export interface EnhancedSecurityStrategy {
  getThreatLevel(request: NextRequest, ip: string): 'LOW' | 'MEDIUM' | 'HIGH';
  shouldBlockRequest(request: NextRequest, ip: string): boolean;
  getRateLimit(request: NextRequest, ip: string): number;
  getSecurityHeaders(request: NextRequest, threatLevel: string): Record<string, string>;
}

// Development security strategy
export class DevelopmentSecurityStrategy implements EnhancedSecurityStrategy {
  getThreatLevel(request: NextRequest, ip: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    return 'LOW';
  }

  shouldBlockRequest(request: NextRequest, ip: string): boolean {
    return false;
  }

  getRateLimit(request: NextRequest, ip: string): number {
    return 1000; // High limit for development
  }

  getSecurityHeaders(request: NextRequest, threatLevel: string): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Development-Mode': 'true'
    };
  }
}

// Production security strategy with enhanced features
export class ProductionSecurityStrategy implements EnhancedSecurityStrategy {
  private ipReputation = new Map<string, { 
    failedAttempts: number; 
    lastAttempt: number; 
    blockedUntil?: number;
    whitelistedUntil?: number;
  }>();

  getThreatLevel(request: NextRequest, ip: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const reputation = this.ipReputation.get(ip);
    
    if (reputation?.blockedUntil && Date.now() < reputation.blockedUntil) {
      return 'HIGH';
    }
    
    if (reputation?.failedAttempts && reputation.failedAttempts >= ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS) {
      return 'HIGH';
    }
    
    if (this.isSuspiciousRequest(request, ip)) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  shouldBlockRequest(request: NextRequest, ip: string): boolean {
    const reputation = this.ipReputation.get(ip);
    
    if (reputation?.blockedUntil && Date.now() < reputation.blockedUntil) {
      return true;
    }
    
    if (reputation?.failedAttempts && reputation.failedAttempts >= ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS) {
      return true;
    }
    
    if (this.isSuspiciousRequest(request, ip)) {
      this.recordFailedAttempt(ip);
      // Check again after recording the attempt
      const updatedReputation = this.ipReputation.get(ip);
      if (updatedReputation?.failedAttempts && updatedReputation.failedAttempts >= ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS) {
        return true;
      }
    }
    
    return false;
  }

  getRateLimit(request: NextRequest, ip: string): number {
    const threatLevel = this.getThreatLevel(request, ip);
    return ENHANCED_SECURITY_CONFIG.ADAPTIVE.THREAT_LEVELS[threatLevel].rateLimit;
  }

  getSecurityHeaders(request: NextRequest, threatLevel: string): Record<string, string> {
    const baseHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };

    if (threatLevel === 'HIGH') {
      return {
        ...baseHeaders,
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      };
    }

    if (threatLevel === 'MEDIUM') {
      return {
        ...baseHeaders,
        'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      };
    }

    return baseHeaders;
  }

  private isSuspiciousRequest(request: NextRequest, ip: string): boolean {
    // Check for suspicious patterns
    const userAgent = request.headers.get('user-agent') || '';
    const isSuspiciousPattern = ENHANCED_SECURITY_CONFIG.IP_REPUTATION.SUSPICIOUS_PATTERNS
      .some(pattern => pattern.test(userAgent));

    // Check for suspicious headers
    const headerCount = Array.from(request.headers.keys()).length;
    const hasSuspiciousHeaders = ENHANCED_SECURITY_CONFIG.FINGERPRINTING.SUSPICIOUS_HEADERS
      .some(header => request.headers.has(header));

    // Check for unusual request patterns
    const pathname = request.nextUrl.pathname;
    const isUnusualPath = pathname.includes('..') || pathname.includes('//') || pathname.length > 200;

    return isSuspiciousPattern || hasSuspiciousHeaders || isUnusualPath;
  }

  private recordFailedAttempt(ip: string): void {
    const reputation = this.ipReputation.get(ip) || { failedAttempts: 0, lastAttempt: 0 };
    
    reputation.failedAttempts++;
    reputation.lastAttempt = Date.now();
    
    if (reputation.failedAttempts >= ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS) {
      reputation.blockedUntil = Date.now() + ENHANCED_SECURITY_CONFIG.IP_REPUTATION.BLOCK_DURATION;
    }
    
    this.ipReputation.set(ip, reputation);
  }

  // Clean up old entries
  cleanup(): void {
    const now = Date.now();
    for (const [ip, reputation] of this.ipReputation.entries()) {
      if (reputation.blockedUntil && now > reputation.blockedUntil) {
        reputation.blockedUntil = undefined;
        reputation.failedAttempts = 0;
      }
      
      if (now - reputation.lastAttempt > ENHANCED_SECURITY_CONFIG.IP_REPUTATION.WHITELIST_DURATION) {
        this.ipReputation.delete(ip);
      }
    }
  }
}

// Enhanced security manager
export class EnhancedSecurityManager {
  private strategy: EnhancedSecurityStrategy;
  private cleanupInterval: NodeJS.Timeout;

  constructor(strategy: EnhancedSecurityStrategy) {
    this.strategy = strategy;
    
    // Clean up old entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      if (strategy instanceof ProductionSecurityStrategy) {
        strategy.cleanup();
      }
    }, 5 * 60 * 1000);
  }

  applySecurity(request: NextRequest, pathname: string): NextResponse {
    const ip = getClientIP(request);
    const threatLevel = this.strategy.getThreatLevel(request, ip);
    
    // Check if request should be blocked
    if (this.strategy.shouldBlockRequest(request, ip)) {
      return createSecurityViolationResponse('Request blocked due to suspicious activity');
    }

    // Get appropriate rate limit
    const rateLimit = this.strategy.getRateLimit(request, ip);
    
    // Get security headers based on threat level
    const securityHeaders = this.strategy.getSecurityHeaders(request, threatLevel);
    
    // Create response with security headers
    const response = NextResponse.next();
    
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  checkRateLimit(pathname: string, ip: string): { allowed: boolean; retryAfter?: number } {
    // Enhanced rate limiting logic would go here
    // For now, return basic rate limiting
    return { allowed: true };
  }

  performSecurityChecks(request: NextRequest, ip: string, userAgent: string): { safe: boolean; reason?: string } {
    if (this.strategy.shouldBlockRequest(request, ip)) {
      return { safe: false, reason: 'Request blocked by security policy' };
    }

    return { safe: true };
  }

  isDevelopment(): boolean {
    return isDevelopmentMode();
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Factory function for enhanced security manager
export function createEnhancedSecurityManager(request: NextRequest): EnhancedSecurityManager {
  if (isDevelopmentMode()) {
    return new EnhancedSecurityManager(new DevelopmentSecurityStrategy());
  }
  return new EnhancedSecurityManager(new ProductionSecurityStrategy());
}

// Keep existing factory functions for backward compatibility
export function createSecurityManager(request: NextRequest) {
  return createEnhancedSecurityManager(request);
}

export function createRateLimitResponse(retryAfter: number): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter,
      message: 'Too many requests. Please try again later.'
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-RetryAfter': retryAfter.toString()
      }
    }
  );
}

export function createSecurityViolationResponse(reason: string): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Security violation',
      reason,
      message: 'Your request was blocked for security reasons.'
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Security-Violation': reason
      }
    }
  );
}
