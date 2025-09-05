// Database query performance monitoring
export interface QueryMetrics {
  count: number
  totalTime: number
  avgTime: number
  minTime: number
  maxTime: number
  lastExecuted: Date
}

export interface SlowQuery {
  query: string
  duration: number
  timestamp: Date
  model?: string
  action?: string
  params?: any
}

export interface QueryMonitorConfig {
  enabled: boolean
  logSlowQueries: boolean
  slowQueryThreshold: number
  maxSlowQueries: number
  logAllQueries: boolean
  metricsRetention: number
}

export const DEFAULT_QUERY_MONITOR_CONFIG: QueryMonitorConfig = {
  enabled: true,
  logSlowQueries: true,
  slowQueryThreshold: 1000, // 1 second
  maxSlowQueries: 100,
  logAllQueries: false,
  metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
}

export class QueryMonitor {
  private config: QueryMonitorConfig
  private queryMetrics: Map<string, QueryMetrics> = new Map()
  private slowQueries: SlowQuery[] = []
  private startTime: number = Date.now()
  
  constructor(config: Partial<QueryMonitorConfig> = {}) {
    this.config = { ...DEFAULT_QUERY_MONITOR_CONFIG, ...config }
  }
  
  // Record query execution
  recordQuery(model: string, action: string, duration: number, params?: any): void {
    if (!this.config.enabled) return
    
    const key = `${model}.${action}`
    const existing = this.queryMetrics.get(key) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: duration,
      maxTime: duration,
      lastExecuted: new Date(),
    }
    
    // Update metrics
    existing.count++
    existing.totalTime += duration
    existing.avgTime = existing.totalTime / existing.count
    existing.minTime = Math.min(existing.minTime, duration)
    existing.maxTime = Math.max(existing.maxTime, duration)
    existing.lastExecuted = new Date()
    
    this.queryMetrics.set(key, existing)
    
    // Log slow queries
    if (this.config.logSlowQueries && duration > this.config.slowQueryThreshold) {
      this.recordSlowQuery(key, duration, model, action, params)
    }
    
    // Log all queries in development
    if (this.config.logAllQueries) {
      console.log(`📊 Query: ${key} (${duration}ms)`)
    }
  }
  
  // Record slow query
  private recordSlowQuery(query: string, duration: number, model?: string, action?: string, params?: any): void {
    const slowQuery: SlowQuery = {
      query,
      duration,
      timestamp: new Date(),
      model,
      action,
      params,
    }
    
    this.slowQueries.push(slowQuery)
    
    // Keep only the latest slow queries
    if (this.slowQueries.length > this.config.maxSlowQueries) {
      this.slowQueries = this.slowQueries.slice(-this.config.maxSlowQueries)
    }
    
    // Log slow query warning
    console.warn(`🐌 Slow query detected: ${query} took ${duration}ms`)
  }
  
  // Get query metrics
  getQueryMetrics(): Record<string, QueryMetrics> {
    return Object.fromEntries(this.queryMetrics)
  }
  
  // Get slow queries
  getSlowQueries(): SlowQuery[] {
    return [...this.slowQueries]
  }
  
  // Get overall performance statistics
  getPerformanceStats(): {
    totalQueries: number
    averageQueryTime: number
    slowQueryCount: number
    uptime: number
    queriesPerSecond: number
  } {
    const totalQueries = Array.from(this.queryMetrics.values()).reduce((sum, metrics) => sum + metrics.count, 0)
    const totalTime = Array.from(this.queryMetrics.values()).reduce((sum, metrics) => sum + metrics.totalTime, 0)
    const uptime = Date.now() - this.startTime
    
    return {
      totalQueries,
      averageQueryTime: totalQueries > 0 ? totalTime / totalQueries : 0,
      slowQueryCount: this.slowQueries.length,
      uptime,
      queriesPerSecond: uptime > 0 ? (totalQueries / uptime) * 1000 : 0,
    }
  }
  
  // Get metrics for specific model/action
  getMetricsForQuery(model: string, action: string): QueryMetrics | null {
    const key = `${model}.${action}`
    return this.queryMetrics.get(key) || null
  }
  
  // Reset metrics
  resetMetrics(): void {
    this.queryMetrics.clear()
    this.slowQueries = []
    this.startTime = Date.now()
  }
  
  // Clean up old metrics
  cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.metricsRetention
    
    // Clean up slow queries older than retention period
    this.slowQueries = this.slowQueries.filter(
      query => query.timestamp.getTime() > cutoff
    )
    
    // Clean up query metrics older than retention period
    for (const [key, metrics] of this.queryMetrics.entries()) {
      if (metrics.lastExecuted.getTime() < cutoff) {
        this.queryMetrics.delete(key)
      }
    }
  }
  
  // Get monitor configuration
  getConfig(): QueryMonitorConfig {
    return { ...this.config }
  }
  
  // Update monitor configuration
  updateConfig(newConfig: Partial<QueryMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
  
  // Check if monitoring is enabled
  isEnabled(): boolean {
    return this.config.enabled
  }
  
  // Enable/disable monitoring
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }
}
