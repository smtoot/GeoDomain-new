import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type Session } from 'next-auth';
import { getServerAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { performanceMonitor } from '@/lib/performance-monitor';
import { cacheManager, CACHE_TTL } from '@/lib/cache';

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
  transformer: superjson,
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
 * Performance monitoring middleware
 */
const performanceMiddleware = t.middleware(async ({ path, type, next }) => {
  const startTime = performance.now();
  console.log(`🚀 [PERF] Starting ${type}.${path}`);
  
  try {
    const result = await next();
    const duration = performance.now() - startTime;
    
    console.log(`✅ [PERF] ${type}.${path} completed in ${duration.toFixed(2)}ms`);
    
    // Record performance metric
    performanceMonitor.recordMetric(`${type}.${path}`, duration, {
      path,
      type,
      success: true,
    });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    console.log(`❌ [PERF] ${type}.${path} failed in ${duration.toFixed(2)}ms`);
    
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
export const publicProcedure = t.procedure.use(performanceMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(performanceMiddleware)
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
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
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
export const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
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
export const rateLimitProcedure = t.procedure
  .use(performanceMiddleware)
  .use(async ({ ctx, next }) => {
    // Simple rate limiting - in production, use a proper rate limiting library
    const _userId = ctx.session?.user?.id || 'anonymous';
    
    // For now, we'll just pass through - implement proper rate limiting later
    return next();
  });

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
