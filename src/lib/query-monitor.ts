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
  params?: Record<string, unknown>
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
  recordQuery(model: string, action: string, duration: number, params?: Record<string, unknown>): void {
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
      console.log(`Query: ${model}.${action} - ${duration}ms`, params)
    }
  }

  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled
  }
}
