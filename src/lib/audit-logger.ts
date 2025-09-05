import { prisma } from '@/lib/prisma';

// Audit action types
export enum AuditActionType {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_PROFILE_UPDATE = 'USER_PROFILE_UPDATE',
  USER_PASSWORD_CHANGE = 'USER_PASSWORD_CHANGE',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  USER_ACCOUNT_SUSPENSION = 'USER_ACCOUNT_SUSPENSION',
  USER_ACCOUNT_ACTIVATION = 'USER_ACCOUNT_ACTIVATION',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  
  // Domain actions
  DOMAIN_CREATED = 'DOMAIN_CREATED',
  DOMAIN_UPDATED = 'DOMAIN_UPDATED',
  DOMAIN_DELETED = 'DOMAIN_DELETED',
  DOMAIN_STATUS_CHANGE = 'DOMAIN_STATUS_CHANGE',
  DOMAIN_VERIFICATION = 'DOMAIN_VERIFICATION',
  DOMAIN_PUBLISHED = 'DOMAIN_PUBLISHED',
  DOMAIN_PAUSED = 'DOMAIN_PAUSED',
  
  // Inquiry actions
  INQUIRY_CREATED = 'INQUIRY_CREATED',
  INQUIRY_UPDATED = 'INQUIRY_UPDATED',
  INQUIRY_STATUS_CHANGE = 'INQUIRY_STATUS_CHANGE',
  INQUIRY_MODERATED = 'INQUIRY_MODERATED',
  INQUIRY_REJECTED = 'INQUIRY_REJECTED',
  INQUIRY_APPROVED = 'INQUIRY_APPROVED',
  
  // Message actions
  MESSAGE_SENT = 'MESSAGE_SENT',
  MESSAGE_MODERATED = 'MESSAGE_MODERATED',
  MESSAGE_REJECTED = 'MESSAGE_REJECTED',
  MESSAGE_APPROVED = 'MESSAGE_APPROVED',
  
  // Deal actions
  DEAL_CREATED = 'DEAL_CREATED',
  DEAL_UPDATED = 'DEAL_UPDATED',
  DEAL_STATUS_CHANGE = 'DEAL_STATUS_CHANGE',
  DEAL_COMPLETED = 'DEAL_COMPLETED',
  DEAL_DISPUTED = 'DEAL_DISPUTED',
  
  // Payment actions
  PAYMENT_VERIFIED = 'PAYMENT_VERIFIED',
  PAYMENT_REJECTED = 'PAYMENT_REJECTED',
  PAYMENT_PROCESSED = 'PAYMENT_PROCESSED',
  
  // Admin actions
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_ACTION = 'ADMIN_ACTION',
  ADMIN_USER_MODERATION = 'ADMIN_USER_MODERATION',
  ADMIN_DOMAIN_MODERATION = 'ADMIN_DOMAIN_MODERATION',
  ADMIN_INQUIRY_MODERATION = 'ADMIN_INQUIRY_MODERATION',
  ADMIN_MESSAGE_MODERATION = 'ADMIN_MESSAGE_MODERATION',
  
  // Security actions
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_LOGIN_ATTEMPT = 'INVALID_LOGIN_ATTEMPT',
  SUSPICIOUS_IP = 'SUSPICIOUS_IP',
  MALICIOUS_INPUT = 'MALICIOUS_INPUT',
  
  // System actions
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  API_ERROR = 'API_ERROR',
  PERFORMANCE_ISSUE = 'PERFORMANCE_ISSUE',
}

// Audit log severity levels (not stored in database)
export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Audit log interface
export interface AuditLogData {
  userId?: string;
  action: AuditActionType;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// Audit logger class
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
          await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: JSON.stringify(data.details),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Fallback to console logging if database fails
      console.log('AUDIT LOG:', {
        timestamp: new Date().toISOString(),
        ...data,
      });
    }
  }

  /**
   * Log user authentication events
   */
  static async logUserAuth(
    userId: string,
    action: AuditActionType.USER_LOGIN | AuditActionType.USER_LOGOUT | AuditActionType.USER_REGISTER,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'USER',
      resourceId: userId,
      details: { action: action.toLowerCase() },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(
    action: AuditActionType,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      action,
      resource: 'SECURITY',
      details,
      ipAddress,
      userAgent,

    });
  }

  /**
   * Log rate limit violations
   */
  static async logRateLimitViolation(
    endpoint: string,
    ipAddress: string,
    userAgent?: string,
    userId?: string
  ): Promise<void> {
    await this.log({
      userId,
      action: AuditActionType.RATE_LIMIT_EXCEEDED,
      resource: 'API',
      details: { endpoint, violation: 'rate_limit_exceeded' },
      ipAddress,
      userAgent,

    });
  }

  /**
   * Log invalid login attempts
   */
  static async logInvalidLoginAttempt(
    email: string,
    ipAddress: string,
    userAgent?: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      action: AuditActionType.INVALID_LOGIN_ATTEMPT,
      resource: 'AUTH',
      details: { email, reason: reason || 'invalid_credentials' },
      ipAddress,
      userAgent,

    });
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(
    adminId: string,
    action: AuditActionType,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId: adminId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,

    });
  }

  /**
   * Log domain actions
   */
  static async logDomainAction(
    userId: string,
    action: AuditActionType,
    domainId: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'DOMAIN',
      resourceId: domainId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log inquiry actions
   */
  static async logInquiryAction(
    userId: string,
    action: AuditActionType,
    inquiryId: string,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'INQUIRY',
      resourceId: inquiryId,
      details,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log security events
   */
  static async logSecurityEvent(
    action: AuditActionType,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    userId?: string
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: 'SECURITY',
      details,
      ipAddress,
      userAgent,

    });
  }

  /**
   * Log system errors
   */
  static async logSystemError(
    error: Error,
    context: Record<string, any>
  ): Promise<void> {
    await this.log({
      action: AuditActionType.SYSTEM_ERROR,
      resource: 'SYSTEM',
      details: {
        error: error.message,
        stack: error.stack,
        ...context,
      },

    });
  }

  /**
   * Get audit logs with filtering
   */
  static async getAuditLogs(filters: {
    userId?: string;
    action?: AuditActionType;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { userId, action, resource, startDate, endDate, page = 1, limit = 50 } = filters;
    
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (resource) where.resource = resource;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Clean old audit logs (for compliance)
   */
  static async cleanOldLogs(retentionDays: number = 365): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  /**
   * Export audit logs for compliance
   */
  static async exportAuditLogs(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const logs = await prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Convert audit logs to CSV format
   */
  private static convertToCSV(logs: any[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'Timestamp',
      'User ID',
      'User Email',
      'User Name',
      'User Role',
      'Action',
      'Resource',
      'Resource ID',
      'Details',
      'IP Address',
      'User Agent',


    ];

    const csvRows = [headers.join(',')];

    for (const log of logs) {
      const row = [
        log.createdAt,
        log.userId || '',
        log.user?.email || '',
        log.user?.name || '',
        log.user?.role || '',
        log.action,
        log.resource,
        log.resourceId || '',
        `"${log.details?.replace(/"/g, '""') || ''}"`,
        log.ipAddress || '',
        `"${log.userAgent?.replace(/"/g, '""') || ''}"`,


      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }
}

// Export convenience functions
export const auditLog = {
  log: AuditLogger.log,
  userAuth: AuditLogger.logUserAuth,
  suspiciousActivity: AuditLogger.logSuspiciousActivity,
  rateLimitViolation: AuditLogger.logRateLimitViolation,
  invalidLoginAttempt: AuditLogger.logInvalidLoginAttempt,
  adminAction: AuditLogger.logAdminAction,
  domainAction: AuditLogger.logDomainAction,
  inquiryAction: AuditLogger.logInquiryAction,
  securityEvent: AuditLogger.logSecurityEvent,
  systemError: AuditLogger.logSystemError,
  getLogs: AuditLogger.getAuditLogs,
  cleanOldLogs: AuditLogger.cleanOldLogs,
  exportLogs: AuditLogger.exportAuditLogs,
};
