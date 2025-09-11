import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure, publicProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';

export const supportRouter = createTRPCRouter({
  // User Procedures - Create and view their own tickets
  
  createTicket: protectedProcedure
    .input(
      z.object({
        title: z.string().min(5).max(200),
        description: z.string().min(10).max(2000),
        category: z.enum(['DOMAIN_INQUIRY', 'TRANSACTION_ISSUE', 'TECHNICAL_SUPPORT', 'ACCOUNT_ISSUE', 'PAYMENT_ISSUE', 'GENERAL_QUESTION']),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
        domainId: z.string().optional(),
        transactionId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { title, description, category, priority, domainId, transactionId } = input;

      // Validate domain ownership if domainId is provided
      if (domainId) {
        const domain = await ctx.prisma.domain.findFirst({
          where: {
            id: domainId,
            OR: [
              { ownerId: ctx.session.user.id },
              { 
                transactions: {
                  some: {
                    buyerId: ctx.session.user.id
                  }
                }
              }
            ]
          },
        });

        if (!domain) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only create support tickets for domains you own or have transacted with',
          });
        }
      }

      // Validate transaction ownership if transactionId is provided
      if (transactionId) {
        const transaction = await ctx.prisma.transaction.findFirst({
          where: {
            id: transactionId,
            buyerId: ctx.session.user.id,
          },
        });

        if (!transaction) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You can only create support tickets for your own transactions',
          });
        }
      }

      const ticket = await ctx.prisma.supportTicket.create({
        data: {
          title,
          description,
          category,
          priority,
          userId: ctx.session.user.id,
          domainId,
          transactionId,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          domain: {
            select: { id: true, name: true },
          },
          transaction: {
            select: { id: true, amount: true, status: true },
          },
        },
      });

      console.log(`🎫 [SUPPORT] New ticket created:`, {
        ticketId: ticket.id,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        userId: ctx.session.user.id,
        domainId,
        transactionId,
      });

      return {
        success: true,
        message: 'Support ticket created successfully',
        ticket,
      };
    }),

  getUserTickets: protectedProcedure
    .input(
      z.object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']).optional(),
        category: z.enum(['DOMAIN_INQUIRY', 'TRANSACTION_ISSUE', 'TECHNICAL_SUPPORT', 'ACCOUNT_ISSUE', 'PAYMENT_ISSUE', 'GENERAL_QUESTION']).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, category, limit, offset } = input;

      const where = {
        userId: ctx.session.user.id,
        ...(status && { status }),
        ...(category && { category }),
      };

      const [tickets, total] = await Promise.all([
        ctx.prisma.supportTicket.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            assignedAdmin: {
              select: { id: true, name: true, email: true },
            },
            domain: {
              select: { id: true, name: true },
            },
            transaction: {
              select: { id: true, amount: true, status: true },
            },
            _count: {
              select: { messages: true },
            },
          },
        }),
        ctx.prisma.supportTicket.count({ where }),
      ]);

      return {
        success: true,
        tickets,
        total,
        hasMore: offset + limit < total,
      };
    }),

  // Get user's domains for support ticket creation
  getUserDomains: protectedProcedure
    .query(async ({ ctx }) => {
      const domains = await ctx.prisma.domain.findMany({
        where: {
          OR: [
            { ownerId: ctx.session.user.id },
            { 
              transactions: {
                some: {
                  buyerId: ctx.session.user.id
                }
              }
            }
          ],
          status: { not: 'DELETED' }
        },
        select: {
          id: true,
          name: true,
          price: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        success: true,
        domains,
      };
    }),

  // Get user's transactions for support ticket creation
  getUserTransactions: protectedProcedure
    .query(async ({ ctx }) => {
      const transactions = await ctx.prisma.transaction.findMany({
        where: {
          buyerId: ctx.session.user.id,
        },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          domain: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return {
        success: true,
        transactions,
      };
    }),

  getTicketDetails: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ ctx, input }) => {
      const ticket = await ctx.prisma.supportTicket.findFirst({
        where: {
          id: input.ticketId,
          userId: ctx.session.user.id,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assignedAdmin: {
            select: { id: true, name: true, email: true },
          },
          domain: {
            select: { id: true, name: true, price: true },
          },
          transaction: {
            select: { id: true, amount: true, status: true, createdAt: true },
          },
          messages: {
            orderBy: { createdAt: 'asc' },
            include: {
              sender: {
                select: { id: true, name: true, email: true, role: true },
              },
            },
          },
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Support ticket not found',
        });
      }

      return {
        success: true,
        ticket,
      };
    }),

  addMessage: protectedProcedure
    .input(
      z.object({
        ticketId: z.string(),
        content: z.string().min(1).max(2000),
        attachments: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { ticketId, content, attachments } = input;

      // Verify ticket ownership
      const ticket = await ctx.prisma.supportTicket.findFirst({
        where: {
          id: ticketId,
          userId: ctx.session.user.id,
        },
      });

      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Support ticket not found',
        });
      }

      // Don't allow messages on closed tickets
      if (ticket.status === 'CLOSED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot add messages to closed tickets',
        });
      }

      const message = await ctx.prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: ctx.session.user.id,
          content,
          attachments: attachments ? JSON.stringify(attachments) : null,
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Update ticket status to waiting for admin if user sent a message
      await ctx.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { 
          status: 'WAITING_FOR_USER',
          updatedAt: new Date(),
        },
      });

      console.log(`💬 [SUPPORT] Message added to ticket:`, {
        ticketId,
        messageId: message.id,
        senderId: ctx.session.user.id,
        contentLength: content.length,
      });

      return {
        success: true,
        message: 'Message added successfully',
        data: message,
      };
    }),

  // Admin Procedures - Manage all tickets

  getAllTickets: adminProcedure
    .input(
      z.object({
        status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']).optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
        category: z.enum(['DOMAIN_INQUIRY', 'TRANSACTION_ISSUE', 'TECHNICAL_SUPPORT', 'ACCOUNT_ISSUE', 'PAYMENT_ISSUE', 'GENERAL_QUESTION']).optional(),
        assignedAdminId: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { status, priority, category, assignedAdminId, search, limit, offset } = input;

      const where = {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(assignedAdminId && { assignedAdminId }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
          ],
        }),
      };

      const [tickets, total] = await Promise.all([
        ctx.prisma.supportTicket.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
            assignedAdmin: {
              select: { id: true, name: true, email: true },
            },
            domain: {
              select: { id: true, name: true },
            },
            transaction: {
              select: { id: true, amount: true, status: true },
            },
            _count: {
              select: { messages: true },
            },
          },
        }),
        ctx.prisma.supportTicket.count({ where }),
      ]);

      return {
        success: true,
        tickets,
        total,
        hasMore: offset + limit < total,
      };
    }),

  updateTicketStatus: adminProcedure
    .input(
      z.object({
        ticketId: z.string(),
        status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED']),
        assignedAdminId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { ticketId, status, assignedAdminId } = input;

      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (assignedAdminId) {
        updateData.assignedAdminId = assignedAdminId;
      }

      if (status === 'RESOLVED') {
        updateData.resolvedAt = new Date();
      }

      if (status === 'CLOSED') {
        updateData.closedAt = new Date();
      }

      const ticket = await ctx.prisma.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          assignedAdmin: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      console.log(`🎫 [ADMIN] Ticket status updated:`, {
        ticketId,
        status,
        assignedAdminId,
        adminId: ctx.session.user.id,
      });

      return {
        success: true,
        message: `Ticket ${status.toLowerCase()} successfully`,
        ticket,
      };
    }),

  addAdminMessage: adminProcedure
    .input(
      z.object({
        ticketId: z.string(),
        content: z.string().min(1).max(2000),
        isInternal: z.boolean().default(false),
        attachments: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { ticketId, content, isInternal, attachments } = input;

      const message = await ctx.prisma.supportMessage.create({
        data: {
          ticketId,
          senderId: ctx.session.user.id,
          content,
          isInternal,
          attachments: attachments ? JSON.stringify(attachments) : null,
        },
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Update ticket status to waiting for user if admin sent a public message
      if (!isInternal) {
        await ctx.prisma.supportTicket.update({
          where: { id: ticketId },
          data: { 
            status: 'WAITING_FOR_USER',
            updatedAt: new Date(),
          },
        });
      }

      console.log(`💬 [ADMIN] Admin message added to ticket:`, {
        ticketId,
        messageId: message.id,
        adminId: ctx.session.user.id,
        isInternal,
        contentLength: content.length,
      });

      return {
        success: true,
        message: 'Message added successfully',
        data: message,
      };
    }),

  getSupportStats: adminProcedure
    .query(async ({ ctx }) => {
      const [
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        ticketsByCategory,
        ticketsByPriority,
      ] = await Promise.all([
        ctx.prisma.supportTicket.count(),
        ctx.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
        ctx.prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
        ctx.prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
        ctx.prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
        ctx.prisma.supportTicket.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        ctx.prisma.supportTicket.groupBy({
          by: ['priority'],
          _count: { priority: true },
        }),
      ]);

      return {
        success: true,
        stats: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
          byCategory: ticketsByCategory,
          byPriority: ticketsByPriority,
        },
      };
    }),
});
