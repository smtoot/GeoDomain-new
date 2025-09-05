import {
  ProductionSecurityStrategy,
  DevelopmentSecurityStrategy,
  ENHANCED_SECURITY_CONFIG
} from '@/lib/security-manager';

// Mock request object for testing
const createMockRequest = (pathname: string, headers: Record<string, string> = {}) => {
  return {
    nextUrl: { pathname },
    headers: {
      get: (name: string) => headers[name] || null,
      has: (name: string) => name in headers,
      keys: () => Object.keys(headers),
    }
  };
};

describe('Enhanced Security Manager', () => {
  describe('Production Security Strategy', () => {
    let strategy: ProductionSecurityStrategy;

    beforeEach(() => {
      strategy = new ProductionSecurityStrategy();
    });

    describe('Threat Level Detection', () => {
      it('should detect LOW threat level for normal requests', () => {
        const request = createMockRequest('/api/health');
        const threatLevel = strategy.getThreatLevel(request as any, '127.0.0.1');
        expect(threatLevel).toBe('LOW');
      });

      it('should detect MEDIUM threat level for suspicious requests', () => {
        const request = createMockRequest('/api/health', {
          'user-agent': 'bot scanner probe'
        });
        const threatLevel = strategy.getThreatLevel(request as any, '127.0.0.1');
        expect(threatLevel).toBe('MEDIUM');
      });

      it('should detect HIGH threat level for blocked IPs', () => {
        const request = createMockRequest('/api/health', {
          'user-agent': 'scanner probe'
        });
        
        // Simulate multiple failed attempts
        for (let i = 0; i < ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS; i++) {
          strategy.shouldBlockRequest(request as any, '127.0.0.1');
        }
        
        const threatLevel = strategy.getThreatLevel(request as any, '127.0.0.1');
        expect(threatLevel).toBe('HIGH');
      });
    });

    describe('Request Blocking', () => {
      it('should not block normal requests initially', () => {
        const request = createMockRequest('/api/health');
        const blocked = strategy.shouldBlockRequest(request as any, '127.0.0.1');
        expect(blocked).toBe(false);
      });

      it('should block requests after multiple suspicious activities', () => {
        const request = createMockRequest('/api/health', {
          'user-agent': 'scanner probe'
        });
        
        // Simulate suspicious requests
        for (let i = 0; i < ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS; i++) {
          strategy.shouldBlockRequest(request as any, '127.0.0.1');
        }
        
        const blocked = strategy.shouldBlockRequest(request as any, '127.0.0.1');
        expect(blocked).toBe(true);
      });
    });

    describe('Rate Limiting', () => {
      it('should return appropriate rate limits based on threat level', () => {
        const request = createMockRequest('/api/health');
        
        // Normal request
        let rateLimit = strategy.getRateLimit(request as any, '127.0.0.1');
        expect(rateLimit).toBe(ENHANCED_SECURITY_CONFIG.ADAPTIVE.THREAT_LEVELS.LOW.rateLimit);
        
        // Suspicious request
        const suspiciousRequest = createMockRequest('/api/health', {
          'user-agent': 'scanner'
        });
        strategy.shouldBlockRequest(suspiciousRequest as any, '127.0.0.1');
        rateLimit = strategy.getRateLimit(suspiciousRequest as any, '127.0.0.1');
        expect(rateLimit).toBe(ENHANCED_SECURITY_CONFIG.ADAPTIVE.THREAT_LEVELS.MEDIUM.rateLimit);
      });
    });

    describe('Security Headers', () => {
      it('should return appropriate headers for LOW threat level', () => {
        const request = createMockRequest('/api/health');
        const headers = strategy.getSecurityHeaders(request as any, 'LOW');
        
        expect(headers['X-Content-Type-Options']).toBe('nosniff');
        expect(headers['X-Frame-Options']).toBe('DENY');
        expect(headers['X-XSS-Protection']).toBe('1; mode=block');
        expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
        expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()');
      });

      it('should return enhanced headers for MEDIUM threat level', () => {
        const request = createMockRequest('/api/health');
        const headers = strategy.getSecurityHeaders(request as any, 'MEDIUM');
        
        expect(headers['Content-Security-Policy']).toBe("default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';");
        expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains');
      });

      it('should return strict headers for HIGH threat level', () => {
        const request = createMockRequest('/api/health');
        const headers = strategy.getSecurityHeaders(request as any, 'HIGH');
        
        expect(headers['Content-Security-Policy']).toBe("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';");
        expect(headers['Strict-Transport-Security']).toBe('max-age=31536000; includeSubDomains; preload');
      });
    });

    describe('IP Reputation Management', () => {
      it('should track failed attempts and block IPs', () => {
        const request = createMockRequest('/api/health', {
          'user-agent': 'scanner'
        });
        
        // First few attempts should not be blocked
        for (let i = 0; i < ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS - 1; i++) {
          const blocked = strategy.shouldBlockRequest(request as any, '127.0.0.1');
          expect(blocked).toBe(false);
        }
        
        // After max attempts, should be blocked
        const blocked = strategy.shouldBlockRequest(request as any, '127.0.0.1');
        expect(blocked).toBe(true);
      });

      it('should cleanup old reputation data', () => {
        const request = createMockRequest('/api/health', {
          'user-agent': 'scanner'
        });
        
        // Create some reputation data by making suspicious requests
        for (let i = 0; i < ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS; i++) {
          strategy.shouldBlockRequest(request as any, '127.0.0.1');
        }
        
        // Should be blocked now
        let blocked = strategy.shouldBlockRequest(request as any, '127.0.0.1');
        expect(blocked).toBe(true);
        
        // Call cleanup (this should not affect recent reputation data)
        strategy.cleanup();
        
        // Should still be blocked (not old enough)
        blocked = strategy.shouldBlockRequest(request as any, '127.0.0.1');
        expect(blocked).toBe(true);
      });
    });
  });

  describe('Development Security Strategy', () => {
    let strategy: DevelopmentSecurityStrategy;

    beforeEach(() => {
      strategy = new DevelopmentSecurityStrategy();
    });

    it('should always return LOW threat level', () => {
      const threatLevel = strategy.getThreatLevel();
      expect(threatLevel).toBe('LOW');
    });

    it('should never block requests', () => {
      const blocked = strategy.shouldBlockRequest();
      expect(blocked).toBe(false);
    });

    it('should return high rate limits', () => {
      const rateLimit = strategy.getRateLimit();
      expect(rateLimit).toBe(1000);
    });

    it('should return development-specific headers', () => {
      const headers = strategy.getSecurityHeaders();
      
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
      expect(headers['X-Development-Mode']).toBe('true');
    });
  });

  describe('Configuration', () => {
    it('should have valid IP reputation configuration', () => {
      expect(ENHANCED_SECURITY_CONFIG.IP_REPUTATION.MAX_FAILED_ATTEMPTS).toBeGreaterThan(0);
      expect(ENHANCED_SECURITY_CONFIG.IP_REPUTATION.BLOCK_DURATION).toBeGreaterThan(0);
      expect(ENHANCED_SECURITY_CONFIG.IP_REPUTATION.SUSPICIOUS_PATTERNS).toHaveLength(3);
    });

    it('should have valid fingerprinting configuration', () => {
      expect(ENHANCED_SECURITY_CONFIG.FINGERPRINTING.ENABLED).toBeDefined();
      expect(ENHANCED_SECURITY_CONFIG.FINGERPRINTING.MIN_HEADERS).toBeGreaterThan(0);
      expect(ENHANCED_SECURITY_CONFIG.FINGERPRINTING.SUSPICIOUS_HEADERS).toHaveLength(4);
    });

    it('should have valid adaptive security configuration', () => {
      expect(ENHANCED_SECURITY_CONFIG.ADAPTIVE.ENABLED).toBeDefined();
      expect(ENHANCED_SECURITY_CONFIG.ADAPTIVE.THREAT_LEVELS).toBeDefined();
      expect(ENHANCED_SECURITY_CONFIG.ADAPTIVE.THREAT_LEVELS.LOW).toBeDefined();
      expect(ENHANCED_SECURITY_CONFIG.ADAPTIVE.THREAT_LEVELS.MEDIUM).toBeDefined();
      expect(ENHANCED_SECURITY_CONFIG.ADAPTIVE.THREAT_LEVELS.HIGH).toBeDefined();
    });
  });
});
