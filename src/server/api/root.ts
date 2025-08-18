import { createTRPCRouter } from '@/server/trpc';
import { domainsRouter } from './routers/domains';
import { usersRouter } from './routers/users';
import { inquiriesRouter } from './routers/inquiries';
import { adminRouter } from './routers/admin';
import { searchRouter } from './routers/search';
import { verificationRouter } from './routers/verification';
import { dealsRouter } from './routers/deals';
import { paymentsRouter } from './routers/payments';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  domains: domainsRouter,
  users: usersRouter,
  inquiries: inquiriesRouter,
  admin: adminRouter,
  search: searchRouter,
  verification: verificationRouter,
  deals: dealsRouter,
  payments: paymentsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
