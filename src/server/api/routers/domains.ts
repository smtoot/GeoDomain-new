import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const domainsRouter = createTRPCRouter({
  getMyDomains: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;
        const { limit, cursor } = input;

        const domains = await ctx.prisma.domain.findMany({
          take: limit + 1,
          where: { ownerId: userId },
          cursor: cursor ? { id: cursor } : undefined,
          orderBy: { createdAt: 'desc' },
          include: {
          _count: {
              select: {
                inquiries: true,
                deals: true,
              },
            },
          },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (domains.length > limit) {
          const nextItem = domains.pop();
          nextCursor = nextItem!.id;
        }

        return {
          items: domains,
          nextCursor,
        };
      } catch (error) {
        console.error("Error in getMyDomains:", error);
        return { items: [], nextCursor: undefined };
      }
    }),

  createDomain: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        price: z.number().min(0),
        category: z.string().min(1),
        state: z.string().optional(),
        city: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session.user.id;

        const domain = await ctx.prisma.domain.create({
          data: {
            name: input.name,
            price: input.price,
            category: input.category,
            state: input.state,
            city: input.city,
            description: input.description,
            ownerId: userId,
            status: 'PENDING',
          },
        });

        return { success: true, domain };
      } catch (error) {
        console.error("Error in createDomain:", error);
        throw new Error("Failed to create domain");
      }
    }),
});