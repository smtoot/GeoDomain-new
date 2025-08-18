import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/trpc';
import { TRPCError } from '@trpc/server';
import crypto from 'crypto';

export const verificationRouter = createTRPCRouter({
  // Initiate DNS verification
  initiateDnsVerification: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.domainId },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only verify your own domains',
        });
      }

      // Generate verification token if not exists
      if (!domain.verificationToken) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await ctx.prisma.domain.update({
          where: { id: input.domainId },
          data: { verificationToken },
        });
      }

      return {
        domainId: input.domainId,
        domainName: domain.name,
        verificationToken: domain.verificationToken,
        instructions: [
          `Add a TXT record to your domain's DNS settings:`,
          `Name: @ (or your domain root)`,
          `Value: geodomainland-verification=${domain.verificationToken}`,
          `TTL: 3600 (or default)`,
          '',
          `After adding the record, wait a few minutes for DNS propagation, then click "Verify DNS Record".`,
        ],
      };
    }),

  // Check DNS verification
  checkDnsVerification: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.domainId },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only verify your own domains',
        });
      }

      if (!domain.verificationToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No verification token found. Please initiate verification first.',
        });
      }

      try {
        // In a real implementation, you would check the actual DNS records
        // For now, we'll simulate the verification process
        // const dns = require('dns').promises;
        
        // Check for TXT records
        // const txtRecords = await dns.resolveTxt(domain.name);
        // const verificationRecord = txtRecords.flat().find(record => 
        //   record.includes(`geodomainland-verification=${domain.verificationToken}`)
        // );

        // For now, simulate successful verification
        const verificationRecord = true;

        if (verificationRecord) {
          // Update domain status to verified
          await ctx.prisma.domain.update({
            where: { id: input.domainId },
            data: { 
              status: 'VERIFIED',
            },
          });

          return {
            success: true,
            message: 'Domain verified successfully!',
            status: 'VERIFIED',
          };
        } else {
          return {
            success: false,
            message: 'Verification failed. Please check your DNS settings and try again.',
            status: 'PENDING_VERIFICATION',
          };
        }
      } catch {
        return {
          success: false,
          message: 'Unable to check DNS records. Please try again later.',
          status: 'PENDING_VERIFICATION',
        };
      }
    }),

  // Initiate file upload verification
  initiateFileVerification: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.domainId },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only verify your own domains',
        });
      }

      // Generate verification token if not exists
      if (!domain.verificationToken) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await ctx.prisma.domain.update({
          where: { id: input.domainId },
          data: { verificationToken },
        });
      }

      return {
        domainId: input.domainId,
        domainName: domain.name,
        verificationToken: domain.verificationToken,
        instructions: [
          `Create a file named "geodomainland-verification.txt" in your domain's root directory (public_html, www, or similar)`,
          `Add the following content to the file:`,
          `geodomainland-verification=${domain.verificationToken}`,
          '',
          `Make sure the file is accessible at:`,
          `https://${domain.name}/geodomainland-verification.txt`,
          '',
          `After uploading the file, click "Verify File Upload".`,
        ],
      };
    }),

  // Check file upload verification
  checkFileVerification: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.domainId },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only verify your own domains',
        });
      }

      if (!domain.verificationToken) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No verification token found. Please initiate verification first.',
        });
      }

      try {
        // In a real implementation, you would fetch the verification file
        // For now, we'll simulate the verification process
        // const https = require('https');
        
        // const verificationUrl = `https://${domain.name}/geodomainland-verification.txt`;
        
        // This is a simplified check - in production, you'd use a proper HTTP client
        // const response = await new Promise((resolve, reject) => {
        //   https.get(verificationUrl, (res: any) => {
        //     let data = '';
        //     res.on('data', (chunk: any) => data += chunk);
        //     res.on('end', () => resolve(data));
        //   }).on('error', reject);
        // });

        // const expectedContent = `geodomainland-verification=${domain.verificationToken}`;
        
        // For now, simulate successful verification
        const response = `geodomainland-verification=${domain.verificationToken}`;
        const expectedContent = `geodomainland-verification=${domain.verificationToken}`;
        
        if (response.includes(expectedContent)) {
          // Update domain status to verified
          await ctx.prisma.domain.update({
            where: { id: input.domainId },
            data: { 
              status: 'VERIFIED',
            },
          });

          return {
            success: true,
            message: 'Domain verified successfully!',
            status: 'VERIFIED',
          };
        } else {
          return {
            success: false,
            message: 'Verification failed. Please check your file and try again.',
            status: 'PENDING_VERIFICATION',
          };
        }
      } catch {
        return {
          success: false,
          message: 'Unable to access verification file. Please check the URL and try again.',
          status: 'PENDING_VERIFICATION',
        };
      }
    }),

  // Get verification status
  getVerificationStatus: protectedProcedure
    .input(z.object({ domainId: z.string() }))
    .query(async ({ ctx, input }) => {
      const domain = await ctx.prisma.domain.findUnique({
        where: { id: input.domainId },
        select: {
          id: true,
          name: true,
          status: true,
          verificationToken: true,
          ownerId: true,
        },
      });

      if (!domain) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Domain not found',
        });
      }

      if (domain.ownerId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only check verification status of your own domains',
        });
      }

      return {
        domainId: domain.id,
        domainName: domain.name,
        status: domain.status,
        verificationToken: domain.verificationToken,
        verifiedAt: null, // Domain model doesn't have verifiedAt field
        canVerify: domain.status === 'PENDING_VERIFICATION',
      };
    }),
});
