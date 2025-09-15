import { createTRPCRouter } from '@/server/trpc';
import { domainsRouter } from './routers/domains';
import { usersRouter } from './routers/users';
import { inquiriesRouter } from './routers/inquiries';
import { adminRouter } from './routers/admin';
import { adminDataRouter } from './routers/admin-data';
import { searchRouter } from './routers/search';
import { verificationRouter } from './routers/verification';
import { dealsRouter } from './routers/deals';
import { paymentsRouter } from './routers/payments';
import { dashboardRouter } from './routers/dashboard';
import { supportRouter } from './routers/support';
import { wholesaleRouter } from './routers/wholesale';
import { wholesaleConfigRouter } from './routers/wholesale-config';
import { adminGlobalSearchRouter } from './routers/admin-global-search';
import { filterManagementRouter } from './routers/filter-management';

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
  adminData: adminDataRouter,
  search: searchRouter,
  verification: verificationRouter,
  deals: dealsRouter,
  payments: paymentsRouter,
  dashboard: dashboardRouter,
  support: supportRouter,
  wholesale: wholesaleRouter,
  wholesaleConfig: wholesaleConfigRouter,
  adminGlobalSearch: adminGlobalSearchRouter,
  filterManagement: filterManagementRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
