import { prisma } from './prisma';
import { performanceMonitor } from './performance-monitor';

export interface DatabaseMetrics {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  slowestQuery: string;
  slowestQueryTime: number;
  queryTypes: Record<string, number>;
  tableSizes: Record<string, number>;
  indexUsage: Record<string, number>;
  cacheHitRate: number;
}

export interface OptimizationRecommendation {
  type: 'index' | 'query' | 'schema' | 'cache';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: string;
  sql?: string;
}

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private metrics: DatabaseMetrics | null = null;
  private recommendations: OptimizationRecommendation[] = [];

  private constructor() {}

  static getInstance(): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer();
    }
    return DatabaseOptimizer.instance;
  }

  async analyzePerformance(): Promise<DatabaseMetrics> {
    const startTime = performance.now();
    
    try {
      // Get basic database statistics
      const tableSizes = await this.getTableSizes();
      const indexUsage = await this.getIndexUsage();
      
      // Analyze query performance from performance monitor
      const queryMetrics = this.analyzeQueryMetrics();
      
      this.metrics = {
        totalQueries: queryMetrics.totalQueries,
        slowQueries: queryMetrics.slowQueries,
        averageQueryTime: queryMetrics.averageQueryTime,
        slowestQuery: queryMetrics.slowestQuery,
        slowestQueryTime: queryMetrics.slowestQueryTime,
        queryTypes: queryMetrics.queryTypes,
        tableSizes,
        indexUsage,
        cacheHitRate: this.calculateCacheHitRate(),
      };

      // Generate optimization recommendations
      this.recommendations = this.generateRecommendations();

      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric('database.optimizer.analyze', duration, {
        tablesAnalyzed: Object.keys(tableSizes).length,
        recommendationsGenerated: this.recommendations.length,
      });

      return this.metrics;

    } catch (error) {
      console.error('Database analysis failed:', error);
      throw error;
    }
  }

  private async getTableSizes(): Promise<Record<string, number>> {
    try {
      // For SQLite, we'll get approximate table sizes
      const tables = await prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ` as any[];

      const sizes: Record<string, number> = {};
      
      for (const table of tables) {
        try {
          const countResult = await prisma.$queryRaw`
            SELECT COUNT(*) as count FROM ${table.name}
          ` as any[];
          sizes[table.name] = countResult[0]?.count || 0;
        } catch (error) {
          sizes[table.name] = 0;
        }
      }

      return sizes;
    } catch (error) {
      console.warn('Could not get table sizes:', error);
      return {};
    }
  }

  private async getIndexUsage(): Promise<Record<string, number>> {
    try {
      // For SQLite, get index information
      const indexes = await prisma.$queryRaw`
        SELECT name, tbl_name FROM sqlite_master 
        WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ` as any[];

      const usage: Record<string, number> = {};
      
      for (const index of indexes) {
        usage[index.name] = 0; // SQLite doesn't provide index usage stats
      }

      return usage;
    } catch (error) {
      console.warn('Could not get index usage:', error);
      return {};
    }
  }

  private analyzeQueryMetrics() {
    const allMetrics = performanceMonitor.getMetrics();
    const queryMetrics = allMetrics.filter(m => 
      m.operation.includes('prisma') || 
      m.operation.includes('query') ||
      m.operation.includes('database')
    );

    if (queryMetrics.length === 0) {
      return {
        totalQueries: 0,
        slowQueries: 0,
        averageQueryTime: 0,
        slowestQuery: 'N/A',
        slowestQueryTime: 0,
        queryTypes: {},
      };
    }

    const slowQueries = queryMetrics.filter(m => m.duration > 1000);
    const averageQueryTime = queryMetrics.reduce((sum, m) => sum + m.duration, 0) / queryMetrics.length;
    const slowestQuery = queryMetrics.reduce((max, m) => m.duration > max.duration ? m : max);
    
    // Categorize query types
    const queryTypes: Record<string, number> = {};
    queryMetrics.forEach(m => {
      const type = this.categorizeQuery(m.operation);
      queryTypes[type] = (queryTypes[type] || 0) + 1;
    });

    return {
      totalQueries: queryMetrics.length,
      slowQueries: slowQueries.length,
      averageQueryTime,
      slowestQuery: slowestQuery.operation,
      slowestQueryTime: slowestQuery.duration,
      queryTypes,
    };
  }

  private categorizeQuery(operation: string): string {
    if (operation.includes('findMany')) return 'SELECT_MULTIPLE';
    if (operation.includes('findUnique')) return 'SELECT_SINGLE';
    if (operation.includes('create')) return 'INSERT';
    if (operation.includes('update')) return 'UPDATE';
    if (operation.includes('delete')) return 'DELETE';
    if (operation.includes('count')) return 'COUNT';
    if (operation.includes('aggregate')) return 'AGGREGATE';
    return 'OTHER';
  }

  private calculateCacheHitRate(): number {
    // This would integrate with actual cache statistics
    // For now, return a placeholder value
    return 0.75; // 75% cache hit rate
  }

  private generateRecommendations(): OptimizationRecommendation[] {
    if (!this.metrics) return [];

    const recommendations: OptimizationRecommendation[] = [];

    // Analyze slow queries
    if (this.metrics.slowQueries > 0) {
      recommendations.push({
        type: 'query',
        priority: this.metrics.slowQueries > 5 ? 'high' : 'medium',
        title: 'Optimize Slow Queries',
        description: `${this.metrics.slowQueries} queries are taking longer than 1 second`,
        impact: 'High - Will improve response times significantly',
        effort: 'Medium - Requires query analysis and optimization',
      });
    }

    // Analyze table sizes for indexing opportunities
    const largeTables = Object.entries(this.metrics.tableSizes)
      .filter(([_, size]) => size > 1000)
      .map(([name, _]) => name);

    if (largeTables.length > 0) {
      recommendations.push({
        type: 'index',
        priority: 'medium',
        title: 'Add Indexes to Large Tables',
        description: `Tables with ${largeTables.length > 1 ? 'more than 1000' : 'over 1000'} records: ${largeTables.join(', ')}`,
        impact: 'Medium - Will improve query performance on large datasets',
        effort: 'Low - Simple index creation',
      });
    }

    // Analyze query patterns
    if (this.metrics.queryTypes.SELECT_MULTIPLE > this.metrics.totalQueries * 0.5) {
      recommendations.push({
        type: 'query',
        priority: 'medium',
        title: 'Optimize SELECT Queries',
        description: 'More than 50% of queries are SELECT operations',
        impact: 'Medium - Will improve read performance',
        effort: 'Medium - Requires query optimization and indexing',
      });
    }

    // Cache optimization
    if (this.metrics.cacheHitRate < 0.8) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        title: 'Improve Cache Hit Rate',
        description: `Current cache hit rate is ${(this.metrics.cacheHitRate * 100).toFixed(1)}%`,
        impact: 'High - Will reduce database load significantly',
        effort: 'Low - Adjust cache policies and keys',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  getRecommendations(): OptimizationRecommendation[] {
    return [...this.recommendations];
  }

  async createIndex(table: string, columns: string[]): Promise<boolean> {
    try {
      const indexName = `idx_${table}_${columns.join('_')}`;
      const columnsList = columns.join(', ');
      
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (${columnsList})`;
      
      performanceMonitor.recordMetric('database.optimizer.create_index', 0, {
        table,
        columns: columns.join(','),
        indexName,
      });

      return true;
    } catch (error) {
      console.error('Failed to create index:', error);
      return false;
    }
  }

  async analyzeQuery(query: string): Promise<any> {
    try {
      // For SQLite, we can use EXPLAIN QUERY PLAN
      const explainResult = await prisma.$queryRaw`EXPLAIN QUERY PLAN ${query}`;
      
      performanceMonitor.recordMetric('database.optimizer.analyze_query', 0, {
        query: query.substring(0, 100),
        hasExplain: true,
      });

      return explainResult;
    } catch (error) {
      console.error('Query analysis failed:', error);
      return null;
    }
  }

  getMetrics(): DatabaseMetrics | null {
    return this.metrics;
  }

  clearMetrics(): void {
    this.metrics = null;
    this.recommendations = [];
  }
}

// Export singleton instance
export const databaseOptimizer = DatabaseOptimizer.getInstance();
