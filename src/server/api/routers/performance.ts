import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../../trpc';
import {
  getPerformanceMetrics,
  generatePerformanceReport,
  checkPerformanceAlerts,
  getRealtimeDashboard,
  cleanupOldMetrics,
  PerformanceMetrics,
} from '@/lib/performance/advanced-monitoring';
import { createTRPCError, ErrorCode } from '@/lib/errors/api-errors';

// Validation schemas
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const endpointFilterSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  endpoint: z.string().optional(),
});

const cleanupSchema = z.object({
  daysToKeep: z.number().min(1).max(365).default(30),
});

/**
 * Performance Monitoring Router
 * Provides endpoints for monitoring API performance, generating reports, and managing alerts
 */
export const performanceRouter = createTRPCRouter({
  /**
   * Get performance metrics for a specific time period
   * @description Retrieves detailed performance metrics for monitoring and analysis
   * @param input.dateRangeSchema - Time period for metrics retrieval
   * @returns Array of performance metrics
   * @example
   * ```typescript
   * const metrics = await api.performance.metrics.query({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31')
   * });
   * ```
   */
  metrics: adminProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      try {
        const metrics = await getPerformanceMetrics(input.startDate, input.endDate);

        return {
          success: true,
          data: metrics,
          message: 'Performance metrics retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get performance metrics', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get performance metrics for a specific endpoint
   * @description Retrieves performance metrics filtered by endpoint
   * @param input.endpointFilterSchema - Time period and optional endpoint filter
   * @returns Array of filtered performance metrics
   * @example
   * ```typescript
   * const metrics = await api.performance.endpointMetrics.query({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31'),
   *   endpoint: '/api/domains/search'
   * });
   * ```
   */
  endpointMetrics: adminProcedure
    .input(endpointFilterSchema)
    .query(async ({ input }) => {
      try {
        const metrics = await getPerformanceMetrics(input.startDate, input.endDate, input.endpoint);

        return {
          success: true,
          data: metrics,
          message: 'Endpoint performance metrics retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get endpoint metrics', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Generate comprehensive performance report
   * @description Creates a detailed performance report with analytics and insights
   * @param input.dateRangeSchema - Time period for report generation
   * @returns Comprehensive performance report
   * @example
   * ```typescript
   * const report = await api.performance.report.query({
   *   startDate: new Date('2024-01-01'),
   *   endDate: new Date('2024-01-31')
   * });
   * ```
   */
  report: adminProcedure
    .input(dateRangeSchema)
    .query(async ({ input }) => {
      try {
        const report = await generatePerformanceReport(input.startDate, input.endDate);

        return {
          success: true,
          data: report,
          message: 'Performance report generated successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to generate performance report', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get real-time performance dashboard data
   * @description Retrieves current performance metrics for dashboard display
   * @returns Real-time performance data and system status
   * @example
   * ```typescript
   * const dashboard = await api.performance.dashboard.query();
   * ```
   */
  dashboard: adminProcedure
    .query(async () => {
      try {
        const dashboard = await getRealtimeDashboard();

        return {
          success: true,
          data: dashboard,
          message: 'Real-time dashboard data retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get dashboard data', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Check for performance alerts
   * @description Identifies performance issues and generates alerts
   * @returns Array of active performance alerts
   * @example
   * ```typescript
   * const alerts = await api.performance.alerts.query();
   * ```
   */
  alerts: adminProcedure
    .query(async () => {
      try {
        const alerts = await checkPerformanceAlerts();

        return {
          success: true,
          data: alerts,
          message: 'Performance alerts retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to check performance alerts', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Clean up old performance metrics
   * @description Removes old performance data to maintain database performance
   * @param input.cleanupSchema - Number of days to keep metrics
   * @returns Number of records cleaned up
   * @example
   * ```typescript
   * const result = await api.performance.cleanup.mutate({ daysToKeep: 30 });
   * ```
   */
  cleanup: adminProcedure
    .input(cleanupSchema)
    .mutation(async ({ input }) => {
      try {
        const deletedCount = await cleanupOldMetrics(input.daysToKeep);

        return {
          success: true,
          data: { deletedCount },
          message: `Cleaned up ${deletedCount} old performance metrics`,
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to cleanup old metrics', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get performance summary for regular users
   * @description Provides basic performance information for non-admin users
   * @returns Basic performance summary
   * @example
   * ```typescript
   * const summary = await api.performance.summary.query();
   * ```
   */
  summary: protectedProcedure
    .query(async () => {
      try {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const report = await generatePerformanceReport(oneDayAgo, now);

        // Return only basic information for regular users
        const summary = {
          totalRequests: report.totalRequests,
          averageResponseTime: report.averageResponseTime,
          errorRate: report.errorRate,
          uptime: '99.9%', // This would be calculated from actual uptime data
        };

        return {
          success: true,
          data: summary,
          message: 'Performance summary retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get performance summary', error, ErrorCode.DATABASE_ERROR);
      }
    }),

  /**
   * Get system health status
   * @description Provides overall system health information
   * @returns System health status and metrics
   * @example
   * ```typescript
   * const health = await api.performance.health.query();
   * ```
   */
  health: protectedProcedure
    .query(async () => {
      try {
        const dashboard = await getRealtimeDashboard();
        const alerts = await checkPerformanceAlerts();

        // Determine overall health status
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (alerts.some(alert => alert.severity === 'critical')) {
          status = 'critical';
        } else if (alerts.some(alert => alert.severity === 'high' || alert.severity === 'medium')) {
          status = 'warning';
        }

        const health = {
          status,
          uptime: dashboard.systemResources.uptime,
          memoryUsage: dashboard.systemResources.memory,
          cpuUsage: dashboard.systemResources.cpu,
          activeAlerts: alerts.length,
          criticalAlerts: alerts.filter(alert => alert.severity === 'critical').length,
          averageResponseTime: dashboard.averageResponseTime,
          errorRate: dashboard.errorRate,
        };

        return {
          success: true,
          data: health,
          message: 'System health status retrieved successfully',
        };
      } catch (error) {
        throw createTRPCError('INTERNAL_SERVER_ERROR', 'Failed to get system health', error, ErrorCode.DATABASE_ERROR);
      }
    }),
});
