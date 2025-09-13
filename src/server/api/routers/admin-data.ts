import { z } from "zod";
import { createTRPCRouter, protectedProcedure, adminProcedure } from "@/server/trpc";

// Categories Management
export const adminDataRouter = createTRPCRouter({
  // Categories CRUD
  getCategories: adminProcedure
    .query(async ({ ctx }) => {
      try {
        return await ctx.prisma.domainCategory.findMany({
          orderBy: { sortOrder: 'asc' }
        });
      } catch (error) {
        return [];
      }
    }),

  createCategory: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      examples: z.string(), // Changed from array to string
      industries: z.string(), // Changed from array to string
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.domainCategory.create({
        data: input
      });
    }),

  updateCategory: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      examples: z.string().optional(), // Changed from array to string
      industries: z.string().optional(), // Changed from array to string
      enabled: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.domainCategory.update({
        where: { id },
        data
      });
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.domainCategory.delete({
        where: { id: input.id }
      });
    }),

  // States CRUD
  getStates: adminProcedure
    .query(async ({ ctx }) => {
      try {
        return await ctx.prisma.uSState.findMany({
          orderBy: { sortOrder: 'asc' }
        });
      } catch (error) {
        return [];
      }
    }),

  createState: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      abbreviation: z.string().min(2).max(2),
      population: z.number().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.uSState.create({
        data: input
      });
    }),

  updateState: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      abbreviation: z.string().min(2).max(2).optional(),
      population: z.number().optional(),
      enabled: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.uSState.update({
        where: { id },
        data
      });
    }),

  deleteState: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.uSState.delete({
        where: { id: input.id }
      });
    }),

  // Cities CRUD
  getCities: adminProcedure
    .input(z.object({
      stateId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.prisma.uSCity.findMany({
          where: input.stateId ? { stateId: input.stateId } : {},
          include: { state: true },
          orderBy: { sortOrder: 'asc' }
        });
      } catch (error) {
        return [];
      }
    }),

  createCity: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      stateId: z.string(),
      population: z.number().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.uSCity.create({
        data: input
      });
    }),

  updateCity: adminProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      stateId: z.string().optional(),
      population: z.number().optional(),
      enabled: z.boolean().optional(),
      sortOrder: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return await ctx.prisma.uSCity.update({
        where: { id },
        data
      });
    }),

  deleteCity: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.prisma.uSCity.delete({
        where: { id: input.id }
      });
    }),
});