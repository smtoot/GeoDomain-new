import { fetchRequestHandler } from '@trpc/server/adapters/fetch';

import { createTRPCContext } from '@/server/trpc';
import { appRouter } from '@/server/api/root';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ req, res: new Response() }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            }
        : undefined,
  });

export { handler as GET, handler as POST };
