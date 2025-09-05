import { TRPCError } from '@trpc/server';
import { auditLog, AuditActionType } from './audit-logger';
import { validationSchemas } from './input-validation';

// Security middleware interface
interface SecurityContext {
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
}

// Input validation middleware - this will be used as a function that returns middleware
export const createInputValidationMiddleware = (t: any) => {
  return t.middleware(async ({ ctx, next, input, path }: any) => {
    try {
      // Get client information
      const clientInfo: SecurityContext = {
        ipAddress: 'unknown', // Will be set by Next.js middleware
        userAgent: 'unknown', // Will be set by Next.js middleware
        sessionId: ctx.session?.user?.id || 'anonymous',
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Validate input based on the API endpoint
      if (input) {
        const validationResult = await validateInput(path, input);
        if (!validationResult.valid) {
          // Log malicious input attempt
          await auditLog.securityEvent(
            AuditActionType.MALICIOUS_INPUT,
            {
              path,
              input: JSON.stringify(input),
              validationErrors: validationResult.errors,
            },
            clientInfo.ipAddress,
            clientInfo.userAgent,
            clientInfo.sessionId
          );

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid input data',
            cause: validationResult.errors,
          });
        }
      }

      // Check for suspicious patterns
      const suspiciousPatterns = detectSuspiciousPatterns(input, clientInfo);
      if (suspiciousPatterns.length > 0) {
        // Log suspicious activity
                  await auditLog.suspiciousActivity(
          AuditActionType.SUSPICIOUS_ACTIVITY,
          {
            path,
            patterns: suspiciousPatterns,
            input: JSON.stringify(input),
          },
          clientInfo.ipAddress,
          clientInfo.userAgent
        );
      }

      // Add security context to the context
      const enhancedCtx = {
        ...ctx,
        security: clientInfo,
      };

      return next({
        ctx: enhancedCtx,
      });
    } catch (error) {
      // Log security middleware errors
      await auditLog.systemError(
        error as Error,
        {
          middleware: 'security',
          path,
          input: JSON.stringify(input),
        }
      );

      throw error;
    }
  });
};

// Rate limiting middleware - this will be used as a function that returns middleware
export const createRateLimitMiddleware = (t: any) => {
  return t.middleware(async ({ ctx, next, path }: any) => {
    try {
      const ipAddress = 'unknown'; // Will be set by Next.js middleware
      const endpointType = getEndpointType(path);
      const rateLimitKey = getRateLimitKey(ipAddress, endpointType);
      
      // Check rate limit (this is a placeholder - actual rate limiting is handled by Next.js middleware)
      const rateLimitResult = await checkRateLimit(rateLimitKey, endpointType);
      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        await auditLog.rateLimitViolation(
          path,
          ipAddress,
          'tRPC',
          ctx.session?.user?.id
        );

        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded',
        });
      }

      return next();
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }

      // Log rate limiting errors
      await auditLog.systemError(
        error as Error,
        {
          middleware: 'rate_limiting',
          path,
        }
      );

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Rate limiting failed',
      });
    }
  });
};

// Authentication middleware - this will be used as a function that returns middleware
export const createAuthMiddleware = (t: any) => {
  return t.middleware(async ({ ctx, next }: any) => {
    if (!ctx.session || !ctx.session.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });
};

// Role-based access control middleware - this will be used as a function that returns middleware
export const createRoleMiddleware = (t: any, allowedRoles: string[]) => {
  return t.middleware(async ({ ctx, next }: any) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(ctx.session.user.role)) {
              // Log unauthorized access attempt
        await auditLog.suspiciousActivity(
          AuditActionType.SUSPICIOUS_ACTIVITY,
          {
            path: 'tRPC',
            userRole: ctx.session.user.role,
            allowedRoles,
            userId: ctx.session.user.id,
          },
          'unknown',
          'tRPC'
        );

      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }

    return next();
  });
};

// Admin middleware
export const createAdminMiddleware = (t: any) => {
  return createRoleMiddleware(t, ['ADMIN', 'SUPER_ADMIN']);
};

// Super admin middleware
export const createSuperAdminMiddleware = (t: any) => {
  return createRoleMiddleware(t, ['SUPER_ADMIN']);
};

// Helper functions
async function validateInput(path: string, input: any): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const schema = getValidationSchema(path);
    if (!schema) {
      return { valid: true, errors: [] };
    }

    await schema.parseAsync(input);
    return { valid: true, errors: [] };
  } catch (error: any) {
    if (error.errors) {
      return { valid: false, errors: error.errors.map((e: any) => e.message) };
    }
    return { valid: false, errors: [error.message] };
  }
}

function getValidationSchema(path: string) {
  // Map API paths to validation schemas
  const pathMappings: Record<string, any> = {
    'domains.create': validationSchemas.domain.createDomain,
    'domains.update': validationSchemas.domain.updateDomain,
    'inquiries.create': validationSchemas.inquiry.createInquiry,
    'deals.create': validationSchemas.deal.createDeal,
    'deals.updateStatus': validationSchemas.deal.updateDealStatus,
    'users.updateProfile': validationSchemas.user.updateProfile,
    'admin.updateUser': validationSchemas.admin.updateUser,
  };

  return pathMappings[path] || null;
}

async function performSecurityChecks(input: any, path: string): Promise<{ safe: boolean; reason?: string }> {
  try {
    // Check for SQL injection patterns
    if (containsSQLInjection(input)) {
      return { safe: false, reason: 'SQL injection pattern detected' };
    }

    // Check for XSS patterns
    if (containsXSS(input)) {
      return { safe: false, reason: 'XSS pattern detected' };
    }

    // Check for path traversal
    if (containsPathTraversal(input)) {
      return { safe: false, reason: 'Path traversal pattern detected' };
    }

    return { safe: true };
  } catch (error) {
    return { safe: false, reason: 'Security check failed' };
  }
}

function detectSuspiciousPatterns(input: any, clientInfo: SecurityContext): string[] {
  const patterns: string[] = [];

  try {
    const inputStr = JSON.stringify(input).toLowerCase();

    // Check for common attack patterns
    if (inputStr.includes('script') || inputStr.includes('javascript:')) {
      patterns.push('XSS attempt');
    }

    if (inputStr.includes('union select') || inputStr.includes('drop table')) {
      patterns.push('SQL injection attempt');
    }

    if (inputStr.includes('../') || inputStr.includes('..\\')) {
      patterns.push('Path traversal attempt');
    }

    // Check for suspicious user agents
    if (clientInfo.userAgent && (
      clientInfo.userAgent.includes('bot') ||
      clientInfo.userAgent.includes('crawler') ||
      clientInfo.userAgent.includes('scraper')
    )) {
      patterns.push('Suspicious user agent');
    }

  } catch (error) {
    patterns.push('Input parsing error');
  }

  return patterns;
}

function containsSQLInjection(input: any): boolean {
  const sqlPatterns = [
    'union select', 'drop table', 'delete from', 'insert into',
    'update set', 'alter table', 'create table', 'exec(',
    'execute(', 'eval(', 'system(', 'shell('
  ];

  const inputStr = JSON.stringify(input).toLowerCase();
  return sqlPatterns.some(pattern => inputStr.includes(pattern));
}

function containsXSS(input: any): boolean {
  const xssPatterns = [
    'script', 'javascript:', 'vbscript:', 'onload=',
    'onerror=', 'onclick=', 'onmouseover=', 'eval(',
    'document.cookie', 'window.location'
  ];

  const inputStr = JSON.stringify(input).toLowerCase();
  return xssPatterns.some(pattern => inputStr.includes(pattern));
}

function containsPathTraversal(input: any): boolean {
  const pathPatterns = [
    '../', '..\\', '..%2f', '..%5c', '%2e%2e%2f',
    '..%252f', '..%255c', '..%c0%af', '..%c1%9c'
  ];

  const inputStr = JSON.stringify(input).toLowerCase();
  return pathPatterns.some(pattern => inputStr.includes(pattern));
}

function getRateLimitKey(ipAddress: string, endpointType: string): string {
  return `${endpointType}:${ipAddress}`;
}

function getEndpointType(path: string): string {
  if (path.includes('auth')) return 'auth';
  if (path.includes('admin')) return 'admin';
  if (path.includes('upload')) return 'upload';
  if (path.includes('search')) return 'search';
  return 'api';
}

async function checkRateLimit(key: string, endpointType: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  // This is a placeholder - actual rate limiting is handled by Next.js middleware
  // In a real implementation, you would check against Redis or a similar store
  return { allowed: true };
}
