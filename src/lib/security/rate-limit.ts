import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

// Initialize Redis connection with fallback
let redis: Redis | null = null;

try {
  // Only initialize Redis if environment variables are available
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
    // Prevent EventEmitter memory leak warnings
    if (redis && typeof redis.setMaxListeners === 'function') {
      redis.setMaxListeners(20);
    }
    console.log('✅ Rate limiting Redis connection initialized successfully');
  } else {
    console.warn('⚠️ Rate limiting Redis environment variables not found, rate limiting disabled');
  }
} catch (error) {
  console.warn('⚠️ Rate limiting Redis initialization failed, rate limiting disabled:', error);
  redis = null;
}

// Standard rate limiting: 100 requests per minute per user
export const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:standard",
}) : null;

// Strict rate limiting: 10 requests per minute for sensitive endpoints
export const strictRatelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:strict",
}) : null;

// Public rate limiting: 1000 requests per minute per IP
export const publicRatelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"),
  analytics: true,
  prefix: "ratelimit:public",
}) : null;

// Rate limiting middleware for tRPC procedures
export const createRateLimitedProcedure = (t: any) =>
  t.middleware(async ({ ctx, next }) => {
    // Skip rate limiting if Redis is not available
    if (!ratelimit) {
      return next();
    }
    
    const identifier = ctx.session?.user?.id || "anonymous";
    
    try {
      const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
      
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
        });
      }
    } catch (rateLimitError) {
      // If rate limiting fails (e.g., Redis unavailable), log warning and continue
      console.warn('Rate limiting failed, proceeding without rate limit:', rateLimitError);
    }
    
    return next();
  });

// Strict rate limiting middleware for sensitive operations
export const createStrictRateLimitedProcedure = (t: any) =>
  t.middleware(async ({ ctx, next }) => {
    // Skip rate limiting if Redis is not available
    if (!strictRatelimit) {
      return next();
    }
    
    const identifier = ctx.session?.user?.id || "anonymous";
    
    try {
      const { success, limit, reset, remaining } = await strictRatelimit.limit(identifier);
      
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded for sensitive operation. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
        });
      }
    } catch (rateLimitError) {
      // If rate limiting fails (e.g., Redis unavailable), log warning and continue
      console.warn('Strict rate limiting failed, proceeding without rate limit:', rateLimitError);
    }
    
    return next();
  });

// Public rate limiting middleware for unauthenticated endpoints
export const createPublicRateLimitedProcedure = (t: any) =>
  t.middleware(async ({ ctx, next }) => {
    // Skip rate limiting if Redis is not available
    if (!publicRatelimit) {
      return next();
    }
    
    const identifier = "anonymous"; // Simplified for now since we don't have IP access
    
    try {
      const { success, limit, reset, remaining } = await publicRatelimit.limit(identifier);
      
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
        });
      }
    } catch (rateLimitError) {
      // If rate limiting fails (e.g., Redis unavailable), log warning and continue
      console.warn('Public rate limiting failed, proceeding without rate limit:', rateLimitError);
    }
    
    return next();
  });

// Rate limiting for Next.js API routes
export const rateLimitMiddleware = async (req: any, res: any, next: any) => {
  const identifier = req.ip || req.connection.remoteAddress || "anonymous";
  
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  // Add rate limit headers
  res.setHeader("X-RateLimit-Limit", limit);
  res.setHeader("X-RateLimit-Remaining", remaining);
  res.setHeader("X-RateLimit-Reset", new Date(reset).toISOString());
  
  if (!success) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: `Too many requests. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    });
  }
  
  return next();
};

// Rate limiting configuration for different endpoint types
export const rateLimitConfig = {
  // Authentication endpoints
  auth: {
    login: strictRatelimit,
    register: strictRatelimit,
    passwordReset: strictRatelimit,
  },
  
  // Public endpoints
  public: {
    search: publicRatelimit,
    health: publicRatelimit,
    domains: publicRatelimit,
  },
  
  // User endpoints
  user: {
    profile: ratelimit,
    dashboard: ratelimit,
    inquiries: ratelimit,
  },
  
  // Admin endpoints
  admin: {
    users: strictRatelimit,
    domains: strictRatelimit,
    analytics: strictRatelimit,
  },
};

// Utility function to get rate limit info
export const getRateLimitInfo = async (identifier: string) => {
  const { limit, reset, remaining } = await ratelimit.limit(identifier);
  return {
    limit,
    remaining,
    reset: new Date(reset),
    resetIn: Math.ceil((reset - Date.now()) / 1000),
  };
};
