import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";

// Initialize Redis connection
const redis = Redis.fromEnv();

// Standard rate limiting: 100 requests per minute per user
export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:standard",
});

// Strict rate limiting: 10 requests per minute for sensitive endpoints
export const strictRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ratelimit:strict",
});

// Public rate limiting: 1000 requests per minute per IP
export const publicRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, "1 m"),
  analytics: true,
  prefix: "ratelimit:public",
});

// Rate limiting middleware for tRPC procedures
export const createRateLimitedProcedure = (t: any) =>
  t.procedure.use(async ({ ctx, next }) => {
    const identifier = ctx.session?.user?.id || ctx.req?.ip || "anonymous";
    
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
    
    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
      });
    }
    
    return next();
  });

// Strict rate limiting middleware for sensitive operations
export const createStrictRateLimitedProcedure = (t: any) =>
  t.procedure.use(async ({ ctx, next }) => {
    const identifier = ctx.session?.user?.id || ctx.req?.ip || "anonymous";
    
    const { success, limit, reset, remaining } = await strictRatelimit.limit(identifier);
    
    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded for sensitive operation. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
      });
    }
    
    return next();
  });

// Public rate limiting middleware for unauthenticated endpoints
export const createPublicRateLimitedProcedure = (t: any) =>
  t.procedure.use(async ({ ctx, next }) => {
    const identifier = ctx.req?.ip || "anonymous";
    
    const { success, limit, reset, remaining } = await publicRatelimit.limit(identifier);
    
    if (!success) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
      });
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
