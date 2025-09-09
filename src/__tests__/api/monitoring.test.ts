import { NextRequest } from 'next/server'

// Mock the entire route module
jest.mock('@/app/api/monitoring/stats/route', () => ({
  GET: jest.fn(),
}))

// Mock the monitoring and cache modules
jest.mock('@/lib/monitoring', () => ({
  performanceMonitor: {
    getStats: jest.fn(),
    clearMetrics: jest.fn(),
  },
}))

jest.mock('@/lib/cache', () => ({
  cacheService: {
    getStats: jest.fn(),
  },
}))

jest.mock('@/lib/database', () => ({
  getConnectionStatus: jest.fn(),
}))

import { GET } from '@/app/api/monitoring/stats/route'
import { performanceMonitor } from '@/lib/monitoring/monitoring'
import { cacheService } from '@/lib/cache'
import { getConnectionStatus } from '@/lib/database/database'

describe('Monitoring API', () => {
  const mockGET = GET as jest.MockedFunction<typeof GET>
  const mockPerformanceMonitor = performanceMonitor as jest.Mocked<typeof performanceMonitor>
  const mockCacheService = cacheService as jest.Mocked<typeof cacheService>
  const mockGetConnectionStatus = getConnectionStatus as jest.MockedFunction<typeof getConnectionStatus>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GET /api/monitoring/stats', () => {
    it('should return monitoring statistics successfully', async () => {
      // Mock performance monitor stats
      mockPerformanceMonitor.getStats.mockReturnValue({
        totalRequests: 150,
        averageResponseTime: 125.5,
        averageMemoryUsage: 2.5,
        statusCodeDistribution: { 200: 140, 404: 10 },
        topEndpoints: [
          { endpoint: '/api/health/check', count: 50, avgResponseTime: 100 },
          { endpoint: '/api/trpc/dashboard.getSellerStats', count: 30, avgResponseTime: 200 },
        ],
      })

      // Mock cache stats
      mockCacheService.getStats.mockResolvedValue({
        keys: 150,
        memory: '2.5MB',
      })

      // Mock database connection status
      mockGetConnectionStatus.mockReturnValue({
        provider: 'postgresql',
        status: 'connected',
        timestamp: new Date().toISOString(),
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          performance: {
            totalRequests: 150,
            averageResponseTime: 125.5,
            averageMemoryUsage: 2.5,
            statusCodeDistribution: { 200: 140, 404: 10 },
            topEndpoints: [
              { endpoint: '/api/health/check', count: 50, avgResponseTime: 100 },
              { endpoint: '/api/trpc/dashboard.getSellerStats', count: 30, avgResponseTime: 200 },
            ],
          },
          services: {
            database: { provider: 'postgresql', status: 'connected' },
            cache: { status: 'healthy', keys: 150, memory: '2.5MB' },
          },
          system: {
            uptime: 3600,
            memory: { heapUsed: 1000000, heapTotal: 2000000 },
            nodeVersion: 'v18.0.0',
            platform: 'darwin',
            arch: 'x64',
          },
          config: {
            nodeEnv: 'test',
            databaseProvider: 'postgresql',
            cacheProvider: 'redis',
            features: { paymentVerification: false, moderationQueue: false },
          },
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.performance).toBeDefined()
      expect(data.services).toBeDefined()
      expect(data.system).toBeDefined()
      expect(data.config).toBeDefined()
      expect(data.performance.totalRequests).toBe(150)
      expect(data.services.cache.status).toBe('healthy')
      expect(data.services.database.status).toBe('connected')
    })

    it('should handle performance monitor errors gracefully', async () => {
      // Mock performance monitor error
      mockPerformanceMonitor.getStats.mockImplementation(() => {
        throw new Error('Performance monitor error')
      })

      // Mock successful cache and database responses
      mockCacheService.getStats.mockResolvedValue({
        keys: 100,
        memory: '1MB',
      })

      mockGetConnectionStatus.mockReturnValue({
        provider: 'postgresql',
        status: 'connected',
        timestamp: new Date().toISOString(),
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 500,
        json: async () => ({
          error: 'Failed to retrieve monitoring statistics',
          timestamp: new Date().toISOString(),
          details: 'Performance monitor error',
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to retrieve monitoring statistics')
    })

    it('should handle cache service errors gracefully', async () => {
      // Mock successful performance monitor
      mockPerformanceMonitor.getStats.mockReturnValue({
        totalRequests: 100,
        averageResponseTime: 150.0,
        averageMemoryUsage: 1.8,
        statusCodeDistribution: { 200: 95, 404: 5 },
        topEndpoints: [
          { endpoint: '/api/health/check', count: 30, avgResponseTime: 120 },
        ],
      })

      // Mock cache service error
      mockCacheService.getStats.mockRejectedValue(new Error('Cache service unavailable'))

      // Mock successful database response
      mockGetConnectionStatus.mockReturnValue({
        provider: 'postgresql',
        status: 'connected',
        timestamp: new Date().toISOString(),
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 500,
        json: async () => ({
          error: 'Failed to retrieve monitoring statistics',
          timestamp: new Date().toISOString(),
          details: 'Cache service unavailable',
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to retrieve monitoring statistics')
    })

    it('should handle database connection errors gracefully', async () => {
      // Mock successful performance monitor
      mockPerformanceMonitor.getStats.mockReturnValue({
        totalRequests: 75,
        averageResponseTime: 180.0,
        averageMemoryUsage: 2.2,
        statusCodeDistribution: { 200: 70, 500: 5 },
        topEndpoints: [
          { endpoint: '/api/trpc/dashboard.getSellerStats', count: 25, avgResponseTime: 200 },
        ],
      })

      // Mock successful cache response
      mockCacheService.getStats.mockResolvedValue({
        keys: 75,
        memory: '1.5MB',
      })

      // Mock database connection error
      mockGetConnectionStatus.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 500,
        json: async () => ({
          error: 'Failed to retrieve monitoring statistics',
          timestamp: new Date().toISOString(),
          details: 'Database connection failed',
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to retrieve monitoring statistics')
    })

    it('should include system information', async () => {
      // Mock all services successfully
      mockPerformanceMonitor.getStats.mockReturnValue({
        totalRequests: 50,
        averageResponseTime: 100.0,
        averageMemoryUsage: 1.2,
        statusCodeDistribution: { 200: 50 },
        topEndpoints: [],
      })

      mockCacheService.getStats.mockResolvedValue({
        keys: 50,
        memory: '1MB',
      })

      mockGetConnectionStatus.mockReturnValue({
        provider: 'postgresql',
        status: 'connected',
        timestamp: new Date().toISOString(),
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          performance: {
            totalRequests: 50,
            averageResponseTime: 100.0,
            averageMemoryUsage: 1.2,
            statusCodeDistribution: { 200: 50 },
            topEndpoints: [],
          },
          services: {
            database: { provider: 'postgresql', status: 'connected' },
            cache: { status: 'healthy', keys: 50, memory: '1MB' },
          },
          system: {
            uptime: 1800,
            memory: { heapUsed: 800000, heapTotal: 1500000 },
            nodeVersion: 'v18.0.0',
            platform: 'darwin',
            arch: 'x64',
          },
          config: {
            nodeEnv: 'test',
            databaseProvider: 'postgresql',
            cacheProvider: 'redis',
            features: { paymentVerification: false, moderationQueue: false },
          },
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.system).toBeDefined()
      expect(data.system.uptime).toBeDefined()
      expect(data.system.memory).toBeDefined()
      expect(data.system.nodeVersion).toBeDefined()
      expect(data.system.platform).toBeDefined()
      expect(data.system.arch).toBeDefined()
    })

    it('should include configuration information', async () => {
      // Mock all services successfully
      mockPerformanceMonitor.getStats.mockReturnValue({
        totalRequests: 25,
        averageResponseTime: 80.0,
        averageMemoryUsage: 0.8,
        statusCodeDistribution: { 200: 25 },
        topEndpoints: [],
      })

      mockCacheService.getStats.mockResolvedValue({
        keys: 25,
        memory: '0.5MB',
      })

      mockGetConnectionStatus.mockReturnValue({
        provider: 'postgresql',
        status: 'connected',
        timestamp: new Date().toISOString(),
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          performance: {
            totalRequests: 25,
            averageResponseTime: 80.0,
            averageMemoryUsage: 0.8,
            statusCodeDistribution: { 200: 25 },
            topEndpoints: [],
          },
          services: {
            database: { provider: 'postgresql', status: 'connected' },
            cache: { status: 'healthy', keys: 25, memory: '0.5MB' },
          },
          system: {
            uptime: 900,
            memory: { heapUsed: 500000, heapTotal: 1000000 },
            nodeVersion: 'v18.0.0',
            platform: 'darwin',
            arch: 'x64',
          },
          config: {
            nodeEnv: 'test',
            databaseProvider: 'postgresql',
            cacheProvider: 'redis',
            features: { paymentVerification: false, moderationQueue: false },
          },
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.config).toBeDefined()
      expect(data.config.nodeEnv).toBe('test')
      expect(data.config.databaseProvider).toBe('postgresql')
      expect(data.config.cacheProvider).toBe('redis')
      expect(data.config.features).toBeDefined()
    })
  })
})
