import { NextRequest } from 'next/server'

// Security configuration
export const SECURITY_CONFIG = {
  // Development mode detection
  DEVELOPMENT: {
    LOCALHOST_IPS: ['::1', '127.0.0.1', 'localhost'],
    PRIVATE_NETWORKS: ['192.168.', '10.'],
    LOCALHOST_PATTERNS: ['localhost', '127.0.0.1'],
  },
  // Rate limiting configuration
  RATE_LIMITS: {
    auth: { max: 100, windowMs: 15 * 60 * 1000 }, // 15 minutes
    api: { max: 1000, windowMs: 15 * 60 * 1000 },
    search: { max: 300, windowMs: 60 * 1000 },
    upload: { max: 100, windowMs: 15 * 60 * 1000 },
    inquiry: { max: 100, windowMs: 60 * 60 * 1000 },
    domain: { max: 50, windowMs: 60 * 60 * 1000 },
  },
  // Production rate limits (stricter)
  PRODUCTION_RATE_LIMITS: {
    auth: { max: 5, windowMs: 15 * 60 * 1000 },
    api: { max: 100, windowMs: 15 * 60 * 1000 },
    search: { max: 30, windowMs: 60 * 1000 },
    upload: { max: 10, windowMs: 15 * 60 * 1000 },
    inquiry: { max: 10, windowMs: 60 * 60 * 1000 },
    domain: { max: 5, windowMs: 60 * 60 * 1000 },
  },
}

// Client IP detection
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  if (realIP) {
    return realIP
  }
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return request.ip || 'unknown'
}

// Development mode detection
export function isDevelopmentMode(ip: string, userAgent: string): boolean {
  const { NODE_ENV } = process.env
  
  // Check environment variable
  if (NODE_ENV === 'development' || NODE_ENV === undefined) {
    return true
  }
  
  // Check IP patterns
  if (SECURITY_CONFIG.DEVELOPMENT.LOCALHOST_IPS.includes(ip)) {
    return true
  }
  
  if (SECURITY_CONFIG.DEVELOPMENT.PRIVATE_NETWORKS.some(network => ip.startsWith(network))) {
    return true
  }
  
  // Check user agent patterns
  if (SECURITY_CONFIG.DEVELOPMENT.LOCALHOST_PATTERNS.some(pattern => userAgent.includes(pattern))) {
    return true
  }
  
  return false
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit checking
export function checkRateLimit(pathname: string, ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now()
  const key = `${ip}:${pathname}`
  
  // Determine rate limit based on path
  let rateLimit = SECURITY_CONFIG.RATE_LIMITS.api // default
  
  if (pathname.startsWith('/api/auth')) {
    rateLimit = SECURITY_CONFIG.RATE_LIMITS.auth
  } else if (pathname.startsWith('/api/search')) {
    rateLimit = SECURITY_CONFIG.RATE_LIMITS.search
  } else if (pathname.startsWith('/api/upload')) {
    rateLimit = SECURITY_CONFIG.RATE_LIMITS.upload
  } else if (pathname.startsWith('/api/inquiries')) {
    rateLimit = SECURITY_CONFIG.RATE_LIMITS.inquiry
  } else if (pathname.startsWith('/api/domains')) {
    rateLimit = SECURITY_CONFIG.RATE_LIMITS.domain
  }
  
  const record = rateLimitStore.get(key)
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + rateLimit.windowMs,
    })
    return { allowed: true, retryAfter: 0 }
  }
  
  if (record.count >= rateLimit.max) {
    return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) }
  }
  
  // Increment count
  record.count++
  rateLimitStore.set(key, record)
  
  return { allowed: true, retryAfter: 0 }
}

// Security checks for production mode
export function performSecurityChecks(request: NextRequest, ip: string, userAgent: string): { safe: boolean; reason?: string } {
  // Check for suspicious user agents
  if (isSuspiciousUserAgent(userAgent)) {
    return { safe: false, reason: 'Suspicious user agent detected' }
  }
  
  // Check for suspicious IP patterns
  if (isSuspiciousIP(ip)) {
    return { safe: false, reason: 'Suspicious IP detected' }
  }
  
  // Check for suspicious headers
  if (isSuspiciousHeaders(request)) {
    return { safe: false, reason: 'Suspicious headers detected' }
  }
  
  return { safe: true }
}

// Suspicious user agent detection
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /php/i,
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

// Suspicious IP detection
function isSuspiciousIP(ip: string): boolean {
  // Add your suspicious IP detection logic here
  // For now, return false (no suspicious IPs)
  return false
}

// Suspicious headers detection
function isSuspiciousHeaders(request: NextRequest): boolean {
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'x-forwarded-proto',
    'x-forwarded-host',
  ]
  
  // Check if any suspicious headers are present
  return suspiciousHeaders.some(header => request.headers.has(header))
}

// Request ID generation
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Clean up old rate limit records
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up rate limit store every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
