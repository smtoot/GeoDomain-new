// Database connection pool management
export interface PoolConfig {
  min: number
  max: number
  idleTimeout: number
  acquireTimeout: number
  createTimeout: number
  destroyTimeout: number
  reapInterval: number
  createRetryInterval: number
}

export const DEFAULT_POOL_CONFIG: PoolConfig = {
  min: 2,
  max: 10,
  idleTimeout: 30000,      // 30 seconds
  acquireTimeout: 60000,    // 1 minute
  createTimeout: 30000,     // 30 seconds
  destroyTimeout: 5000,     // 5 seconds
  reapInterval: 1000,       // 1 second
  createRetryInterval: 200, // 200ms
}

export interface PoolStats {
  active: number
  max: number
  available: number
  queued: number
  idle: number
  total: number
}

export class ConnectionPoolManager {
  private config: PoolConfig
  private activeConnections = 0
  private idleConnections = 0
  private queuedRequests = 0
  private maxConnections: number
  private minConnections: number
  
  constructor(config: Partial<PoolConfig> = {}) {
    this.config = { ...DEFAULT_POOL_CONFIG, ...config }
    this.maxConnections = this.config.max
    this.minConnections = this.config.min
  }
  
  // Get connection from pool
  async acquireConnection(): Promise<boolean> {
    if (this.activeConnections < this.maxConnections) {
      this.activeConnections++
      return true
    }
    
    // Wait for available connection
    this.queuedRequests++
    const startTime = Date.now()
    
    while (this.activeConnections >= this.maxConnections) {
      if (Date.now() - startTime > this.config.acquireTimeout) {
        this.queuedRequests--
        throw new Error('Connection acquisition timeout')
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.queuedRequests--
    this.activeConnections++
    return true
  }
  
  // Release connection back to pool
  releaseConnection(): void {
    if (this.activeConnections > 0) {
      this.activeConnections--
      
      // Maintain minimum connections
      if (this.idleConnections < this.minConnections) {
        this.idleConnections++
      }
    }
  }
  
  // Get current pool statistics
  getPoolStats(): PoolStats {
    return {
      active: this.activeConnections,
      max: this.maxConnections,
      available: this.maxConnections - this.activeConnections,
      queued: this.queuedRequests,
      idle: this.idleConnections,
      total: this.activeConnections + this.idleConnections,
    }
  }
  
  // Check if pool is healthy
  isHealthy(): boolean {
    const stats = this.getPoolStats()
    return stats.active <= stats.max && stats.queued === 0
  }
  
  // Get pool configuration
  getConfig(): PoolConfig {
    return { ...this.config }
  }
  
  // Update pool configuration
  updateConfig(newConfig: Partial<PoolConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.maxConnections = this.config.max
    this.minConnections = this.config.min
  }
  
  // Drain pool (for graceful shutdown)
  async drainPool(): Promise<void> {
    const startTime = Date.now()
    
    while (this.activeConnections > 0) {
      if (Date.now() - startTime > this.config.destroyTimeout) {
        break
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    this.activeConnections = 0
    this.idleConnections = 0
    this.queuedRequests = 0
  }
  
  // Get pool health status
  getHealthStatus(): 'healthy' | 'warning' | 'critical' {
    const stats = this.getPoolStats()
    const utilization = stats.active / stats.max
    
    if (utilization < 0.7) return 'healthy'
    if (utilization < 0.9) return 'warning'
    return 'critical'
  }
}
