import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type Session } from 'next-auth';
import { getServerAuthSession } from '@/lib/security/auth';
import { prisma } from '@/lib/prisma';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { 
  createRateLimitedProcedure, 
  createStrictRateLimitedProcedure, 
  createPublicRateLimitedProcedure 
} from '@/lib/security/rate-limit';
import { 
  createTRPCError, 
  logError, 
  ErrorCode 
} from '@/lib/errors/api-errors';

// For fetch adapter
interface FetchContextOptions {
  req: Request;
  res: Response;
}

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

interface CreateContextOptions {
  session: Session | null;
}

/**
 * This helper generates the "internals" for a tRPC context. If you need to use it, you can export
 * it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-serverapitrpcts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (_opts: CreateNextContextOptions | FetchContextOptions) => {
  // Get the session from the server using the getServerAuthSession function
  const session = await getServerAuthSession();

  return createInnerTRPCContext({
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<typeof createTRPCContext>().create({
  // transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Enhanced error handling middleware
 */
const errorHandlingMiddleware = t.middleware(async ({ path, type, next }) => {
  try {
    return await next();
  } catch (error) {
    // Log the error with context
    logError(error as Error, { path, type });
    
    // Handle different types of errors
    if (error instanceof TRPCError) {
      // tRPC errors are already properly formatted
      throw error;
    }
    
    if (error instanceof ZodError) {
      // Validation errors
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Validation failed',
        cause: error,
      });
    }
    
    if (error instanceof Error) {
      // Generic errors - sanitize for production
      const message = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred';
        
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message,
        cause: error,
      });
    }
    
    // Unknown error type
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unknown error occurred',
    });
  }
});

/**
 * Performance monitoring middleware
 */
const performanceMiddleware = t.middleware(async ({ path, type, next }) => {
  const startTime = performance.now();
  try {
    const result = await next();
    const duration = performance.now() - startTime;
    
    // Record performance metric
    performanceMonitor.recordMetric(`${type}.${path}`, duration, {
      path,
      type,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    // Record performance metric for failed operations
    performanceMonitor.recordMetric(`${type}.${path}`, duration, {
      path,
      type,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure
  .use(errorHandlingMiddleware)
  // .use(performanceMiddleware) // Temporarily disabled for debugging
  .use(createPublicRateLimitedProcedure(t));

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(errorHandlingMiddleware)
  // .use(performanceMiddleware) // Temporarily disabled for debugging
  .use(createRateLimitedProcedure(t))
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        // infers the `session` as non-nullable
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Admin procedure
 *
 * This procedure requires the user to have ADMIN or SUPER_ADMIN role.
 */
export const adminProcedure = protectedProcedure
  .use(createStrictRateLimitedProcedure(t))
  .use(({ ctx, next }) => {
    if (ctx.session.user.role !== 'ADMIN' && ctx.session.user.role !== 'SUPER_ADMIN') {
      throw new TRPCError({ 
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Super Admin procedure
 *
 * This procedure requires the user to have SUPER_ADMIN role.
 */
export const superAdminProcedure = protectedProcedure
  .use(createStrictRateLimitedProcedure(t))
  .use(({ ctx, next }) => {
    if (ctx.session.user.role !== 'SUPER_ADMIN') {
      throw new TRPCError({ 
        code: 'FORBIDDEN',
        message: 'Super admin access required'
      });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

/**
 * Rate limiting middleware
 */
export const rateLimitProcedure = createRateLimitedProcedure(t);

/**
 * Strict rate limiting middleware for sensitive operations
 */
export const strictRateLimitProcedure = createStrictRateLimitedProcedure(t);

/**
 * Public rate limiting middleware for unauthenticated endpoints
 */
export const publicRateLimitProcedure = createPublicRateLimitedProcedure(t);

/**
 * Content moderation middleware
 */
export const moderationProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  // This middleware can be used for content that needs moderation
  // For now, we'll just pass through - implement moderation logic later
  return next({
    ctx: {
      ...ctx,
      requiresModeration: true,
    },
  });
});
