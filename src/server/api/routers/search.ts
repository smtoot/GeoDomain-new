import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/server/trpc';

export const searchRouter = createTRPCRouter({
  // Advanced search
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        industry: z.array(z.string()).optional(),
        state: z.array(z.string()).optional(),
        city: z.string().optional(),
        priceMin: z.number().optional(),
        priceMax: z.number().optional(),
        priceType: z.enum(['FIXED', 'NEGOTIABLE', 'MAKE_OFFER']).optional(),
        status: z.enum(['VERIFIED', 'PUBLISHED']).optional(),
        sortBy: z.enum(['price', 'date', 'popularity']).default('date'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const {
        query,
        industry,
        state,
        city,
        priceMin,
        priceMax,
        priceType,
        status,
        sortBy,
        sortOrder,
        limit,
        cursor,
      } = input;

      const where: any = {
        status: status || 'PUBLISHED',
      };

      if (query && query.trim()) {
        const searchQuery = query.trim().toLowerCase();
        where.OR = [
          // Exact match for domain name
          { name: { contains: searchQuery } },
          // Partial match for domain name (more flexible)
          { name: { contains: searchQuery.split('').join('%') } },
          // Description search
          { description: { contains: searchQuery } },
          // Tags search
          { tags: { contains: searchQuery } },
          // Industry search
          { industry: { contains: searchQuery } },
          // State search
          { state: { contains: searchQuery } },
          // City search
          { city: { contains: searchQuery } },
        ];
      }

      if (industry && industry.length > 0) {
        where.industry = { in: industry };
      }

      if (state && state.length > 0) {
        where.state = { in: state };
      }

      if (city && city.trim()) {
        where.city = { contains: city.trim() };
      }

      if (priceMin !== undefined && priceMin !== null) {
        where.price = { ...where.price, gte: priceMin };
      }

      if (priceMax !== undefined && priceMax !== null) {
        where.price = { ...where.price, lte: priceMax };
      }

      if (priceType) {
        where.priceType = priceType;
      }

      const orderBy = {
        ...(sortBy === 'price' && { price: sortOrder }),
        ...(sortBy === 'date' && { createdAt: sortOrder }),
        ...(sortBy === 'popularity' && { views: sortOrder }),
      };

      try {
        const items = await ctx.prisma.domain.findMany({
          take: limit + 1,
          where,
          cursor: cursor ? { id: cursor } : undefined,
          orderBy,
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            analytics: {
              select: {
                views: true,
                inquiries: true,
              },
            },
          },
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (items.length > limit) {
          const nextItem = items.pop();
          nextCursor = nextItem!.id;
        }

        const totalCount = await ctx.prisma.domain.count({ where });

        return {
          items,
          nextCursor,
          totalCount,
        };
      } catch (error) {
        console.error('Error in search query:', error);
        return {
          items: [],
          nextCursor: undefined,
          totalCount: 0,
        };
      }
    }),

  // Search suggestions
  getSuggestions: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { query, limit } = input;

      try {
        const searchQuery = query.trim().toLowerCase();
        
        // Get suggestions with better matching logic
        const suggestions = await ctx.prisma.domain.findMany({
          where: {
            status: 'PUBLISHED',
            OR: [
              // Exact domain name match (highest priority)
              { name: { contains: searchQuery } },
              // Domain name starts with query (high priority)
              { name: { startsWith: searchQuery } },
              // Description contains query
              { description: { contains: searchQuery } },
              // Industry contains query
              { industry: { contains: searchQuery } },
              // State contains query
              { state: { contains: searchQuery } },
              // City contains query
              { city: { contains: searchQuery } },
            ],
          },
          take: limit,
          orderBy: [
            // Prioritize exact matches first
            { name: 'asc' },
            // Then by creation date
            { createdAt: 'desc' },
          ],
          select: {
            id: true,
            name: true,
            price: true,
            industry: true,
            state: true,
            city: true,
            description: true,
          },
        });

        // If we don't have enough suggestions, get popular domains
        if (suggestions.length < limit) {
          const popularDomains = await ctx.prisma.domain.findMany({
            where: {
              status: 'PUBLISHED',
              id: { notIn: suggestions.map(s => s.id) },
            },
            take: limit - suggestions.length,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              name: true,
              price: true,
              industry: true,
              state: true,
              city: true,
              description: true,
            },
          });
          
          return [...suggestions, ...popularDomains];
        }

        return suggestions;
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        return [];
      }
    }),

  // Get search filters
  getFilters: publicProcedure.query(async ({ ctx }) => {
    const [industries, states, priceRanges] = await Promise.all([
      // Get unique industries
      ctx.prisma.domain.groupBy({
        by: ['industry'],
        where: { status: 'PUBLISHED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // Get unique states
      ctx.prisma.domain.groupBy({
        by: ['state'],
        where: { status: 'PUBLISHED' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // Get price ranges
      ctx.prisma.domain.aggregate({
        where: { status: 'PUBLISHED' },
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),
    ]);

    return {
      industries: industries.map(i => ({ value: i.industry, count: i._count.id })),
      states: states.map(s => ({ value: s.state, count: s._count.id })),
      priceRanges: {
        min: priceRanges._min.price || 0,
        max: priceRanges._max.price || 0,
        average: priceRanges._avg.price || 0,
      },
    };
  }),

  // Get popular searches and trending domains
  getPopularSearches: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { limit } = input;

      try {
        // Get trending domains (most recent and popular)
        const trendingDomains = await ctx.prisma.domain.findMany({
          where: { status: 'PUBLISHED' },
          take: limit,
          orderBy: [
            { createdAt: 'desc' },
          ],
          select: {
            id: true,
            name: true,
            price: true,
            industry: true,
            state: true,
            city: true,
            description: true,
            createdAt: true,
          },
        });

        // Get popular industries for search suggestions
        const popularIndustries = await ctx.prisma.domain.groupBy({
          by: ['industry'],
          where: { status: 'PUBLISHED' },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 5,
        });

        return {
          trendingDomains,
          popularIndustries: popularIndustries.map(i => ({
            industry: i.industry,
            count: i._count.id,
          })),
        };
      } catch (error) {
        console.error('Error fetching popular searches:', error);
        return {
          trendingDomains: [],
          popularIndustries: [],
        };
      }
    }),
});
