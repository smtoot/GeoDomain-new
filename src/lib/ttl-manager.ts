// TTL (Time To Live) management for cache operations
export interface TTLConfig {
  short: number    // 5 minutes
  medium: number   // 1 hour
  long: number     // 24 hours
  permanent: number // No expiration
}

export const DEFAULT_TTL: TTLConfig = {
  short: 300,      // 5 minutes
  medium: 3600,    // 1 hour
  long: 86400,     // 24 hours
  permanent: 0,    // No expiration
}

export class TTLManager {
  private config: TTLConfig
  
  constructor(config: TTLConfig = DEFAULT_TTL) {
    this.config = config
  }
  
  // Get TTL value by type
  getTTL(type: keyof TTLConfig): number {
    return this.config[type]
  }
  
  // Get TTL value by data type
  getTTLByDataType(dataType: string): number {
    switch (dataType.toLowerCase()) {
      case 'session':
      case 'auth':
        return this.config.short
      case 'user':
      case 'profile':
        return this.config.medium
      case 'domain':
      case 'search':
        return this.config.long
      case 'config':
      case 'static':
        return this.config.permanent
      default:
        return this.config.medium
    }
  }
  
  // Check if TTL is expired
  isExpired(timestamp: number, ttl: number): boolean {
    if (ttl === 0) return false // Permanent
    return Date.now() > timestamp + (ttl * 1000)
  }
  
  // Calculate remaining time
  getRemainingTime(timestamp: number, ttl: number): number {
    if (ttl === 0) return Infinity // Permanent
    const remaining = (timestamp + (ttl * 1000)) - Date.now()
    return Math.max(0, Math.ceil(remaining / 1000))
  }
  
  // Get TTL for specific cache keys
  getTTLForKey(key: string): number {
    if (key.startsWith('session:')) return this.config.short
    if (key.startsWith('user:')) return this.config.medium
    if (key.startsWith('domain:')) return this.config.long
    if (key.startsWith('config:')) return this.config.permanent
    if (key.startsWith('search:')) return this.config.long
    if (key.startsWith('analytics:')) return this.config.medium
    
    return this.config.medium
  }
  
  // Validate TTL value
  validateTTL(ttl: number): boolean {
    return ttl >= 0 && ttl <= this.config.long * 10 // Allow up to 10x long TTL
  }
  
  // Get TTL configuration
  getConfig(): TTLConfig {
    return { ...this.config }
  }
  
  // Update TTL configuration
  updateConfig(newConfig: Partial<TTLConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}
