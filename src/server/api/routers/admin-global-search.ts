import { z } from 'zod';
import { createTRPCRouter, adminProcedure } from '@/server/trpc';
import { prisma } from '@/lib/prisma';

export const adminGlobalSearchRouter = createTRPCRouter({
  globalSearch: adminProcedure
    .input(z.object({
      query: z.string().min(2).max(100),
    }))
    .query(async ({ input }) => {
      const { query } = input;
      const searchTerm = `%${query.toLowerCase()}%`;

      try {
        // Search across multiple entities in parallel
        const [users, domains, inquiries, deals, messages, supportTickets] = await Promise.all([
          // Search users
          prisma.user.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
              createdAt: true,
            },
            take: 5,
          }),

          // Search domains
          prisma.domain.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { category: { name: { contains: query, mode: 'insensitive' } } },
                { state: { name: { contains: query, mode: 'insensitive' } } },
                { city: { name: { contains: query, mode: 'insensitive' } } },
              ],
            },
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              status: true,
              createdAt: true,
              category: { select: { name: true } },
              state: { select: { name: true } },
              city: { select: { name: true } },
            },
            take: 5,
          }),

          // Search inquiries
          prisma.inquiry.findMany({
            where: {
              OR: [
                { message: { contains: query, mode: 'insensitive' } },
                { domain: { name: { contains: query, mode: 'insensitive' } } },
                { buyer: { name: { contains: query, mode: 'insensitive' } } },
                { buyer: { email: { contains: query, mode: 'insensitive' } } },
              ],
            },
            select: {
              id: true,
              message: true,
              status: true,
              createdAt: true,
              domain: { select: { name: true } },
              buyer: { select: { name: true, email: true } },
            },
            take: 5,
          }),

          // Search deals
          prisma.deal.findMany({
            where: {
              OR: [
                { domain: { name: { contains: query, mode: 'insensitive' } } },
                { buyer: { name: { contains: query, mode: 'insensitive' } } },
                { buyer: { email: { contains: query, mode: 'insensitive' } } },
                { seller: { name: { contains: query, mode: 'insensitive' } } },
                { seller: { email: { contains: query, mode: 'insensitive' } } },
              ],
            },
            select: {
              id: true,
              status: true,
              agreedPrice: true,
              createdAt: true,
              domain: { select: { name: true } },
              buyer: { select: { name: true, email: true } },
              seller: { select: { name: true, email: true } },
            },
            take: 5,
          }),

          // Search messages
          prisma.message.findMany({
            where: {
              OR: [
                { content: { contains: query, mode: 'insensitive' } },
                { sender: { name: { contains: query, mode: 'insensitive' } } },
                { sender: { email: { contains: query, mode: 'insensitive' } } },
                { recipient: { name: { contains: query, mode: 'insensitive' } } },
                { recipient: { email: { contains: query, mode: 'insensitive' } } },
              ],
            },
            select: {
              id: true,
              content: true,
              status: true,
              createdAt: true,
              sender: { select: { name: true, email: true } },
              recipient: { select: { name: true, email: true } },
            },
            take: 5,
          }),

          // Search support tickets
          prisma.supportTicket.findMany({
            where: {
              OR: [
                { subject: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { user: { name: { contains: query, mode: 'insensitive' } } },
                { user: { email: { contains: query, mode: 'insensitive' } } },
              ],
            },
            select: {
              id: true,
              subject: true,
              description: true,
              status: true,
              priority: true,
              createdAt: true,
              user: { select: { name: true, email: true } },
            },
            take: 5,
          }),
        ]);

        // Transform results into unified format
        const results = [
          // Users
          ...users.map(user => ({
            id: user.id,
            type: 'user' as const,
            title: user.name || 'No name',
            subtitle: user.email,
            url: `/admin/users/${user.id}`,
            icon: 'User' as const,
            metadata: {
              status: user.status,
              date: new Date(user.createdAt).toLocaleDateString(),
            },
          })),

          // Domains
          ...domains.map(domain => ({
            id: domain.id,
            type: 'domain' as const,
            title: domain.name,
            subtitle: `${domain.category?.name || 'Uncategorized'} • ${domain.state?.name || 'Unknown'}, ${domain.city?.name || 'Unknown'}`,
            url: `/admin/domains/${domain.id}`,
            icon: 'Globe' as const,
            metadata: {
              status: domain.status,
              value: `$${domain.price}`,
              date: new Date(domain.createdAt).toLocaleDateString(),
            },
          })),

          // Inquiries
          ...inquiries.map(inquiry => ({
            id: inquiry.id,
            type: 'inquiry' as const,
            title: `Inquiry for ${inquiry.domain?.name || 'Unknown Domain'}`,
            subtitle: inquiry.message.substring(0, 100) + (inquiry.message.length > 100 ? '...' : ''),
            url: `/admin/inquiries/${inquiry.id}`,
            icon: 'MessageSquare' as const,
            metadata: {
              status: inquiry.status,
              date: new Date(inquiry.createdAt).toLocaleDateString(),
            },
          })),

          // Deals
          ...deals.map(deal => ({
            id: deal.id,
            type: 'deal' as const,
            title: `Deal for ${deal.domain?.name || 'Unknown Domain'}`,
            subtitle: `${deal.buyer?.name || deal.buyer?.email} ↔ ${deal.seller?.name || deal.seller?.email}`,
            url: `/admin/deals/${deal.id}`,
            icon: 'DollarSign' as const,
            metadata: {
              status: deal.status,
              value: `$${deal.agreedPrice}`,
              date: new Date(deal.createdAt).toLocaleDateString(),
            },
          })),

          // Messages
          ...messages.map(message => ({
            id: message.id,
            type: 'message' as const,
            title: `Message from ${message.sender?.name || message.sender?.email}`,
            subtitle: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
            url: `/admin/messages/${message.id}`,
            icon: 'FileText' as const,
            metadata: {
              status: message.status,
              date: new Date(message.createdAt).toLocaleDateString(),
            },
          })),

          // Support tickets
          ...supportTickets.map(ticket => ({
            id: ticket.id,
            type: 'support' as const,
            title: ticket.subject,
            subtitle: `${ticket.user?.name || ticket.user?.email} • ${ticket.priority}`,
            url: `/admin/support/${ticket.id}`,
            icon: 'MessageSquare' as const,
            metadata: {
              status: ticket.status,
              date: new Date(ticket.createdAt).toLocaleDateString(),
            },
          })),
        ];

        // Sort by relevance (exact matches first, then partial matches)
        const sortedResults = results.sort((a, b) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const queryLower = query.toLowerCase();

          // Exact matches first
          if (aTitle === queryLower && bTitle !== queryLower) return -1;
          if (bTitle === queryLower && aTitle !== queryLower) return 1;

          // Starts with query
          if (aTitle.startsWith(queryLower) && !bTitle.startsWith(queryLower)) return -1;
          if (bTitle.startsWith(queryLower) && !aTitle.startsWith(queryLower)) return 1;

          // Contains query
          if (aTitle.includes(queryLower) && !bTitle.includes(queryLower)) return -1;
          if (bTitle.includes(queryLower) && !aTitle.includes(queryLower)) return 1;

          return 0;
        });

        return sortedResults.slice(0, 20); // Limit to 20 results

      } catch (error) {
        console.error('Global search error:', error);
        throw new Error('Search failed. Please try again.');
      }
    }),

  // Get search suggestions
  getSuggestions: adminProcedure
    .input(z.object({
      query: z.string().min(1).max(50),
    }))
    .query(async ({ input }) => {
      const { query } = input;
      
      try {
        // Get recent searches and common terms
        const suggestions = [
          'users',
          'domains',
          'inquiries',
          'deals',
          'messages',
          'support',
          'pending',
          'active',
          'verified',
          'suspended',
        ].filter(term => term.toLowerCase().includes(query.toLowerCase()));

        return suggestions.slice(0, 5);
      } catch (error) {
        console.error('Search suggestions error:', error);
        return [];
      }
    }),
});
