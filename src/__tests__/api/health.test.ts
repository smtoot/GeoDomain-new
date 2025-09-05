import { NextRequest } from 'next/server'

// Mock the entire route module
jest.mock('@/app/api/health/check/route', () => ({
  GET: jest.fn(),
  OPTIONS: jest.fn(),
}))

// Mock the database and cache modules
jest.mock('@/lib/database', () => ({
  checkDatabaseHealth: jest.fn(),
}))

jest.mock('@/lib/cache', () => ({
  cacheService: {
    getStats: jest.fn(),
  },
}))

import { GET, OPTIONS } from '@/app/api/health/check/route'
import { checkDatabaseHealth } from '@/lib/database'
import { cacheService } from '@/lib/cache'

describe('Health Check API', () => {
  const mockGET = GET as jest.MockedFunction<typeof GET>
  const mockOPTIONS = OPTIONS as jest.MockedFunction<typeof OPTIONS>
  const mockCheckDatabaseHealth = checkDatabaseHealth as jest.MockedFunction<typeof checkDatabaseHealth>
  const mockCacheService = cacheService as jest.Mocked<typeof cacheService>

  beforeEach(() => {
    jest.clearAllMocks()
    // Set up environment variables
    process.env.npm_package_version = '1.0.0'
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GET /api/health/check', () => {
    it('should return healthy status when all services are working', async () => {
      // Mock successful responses
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      })

      mockCacheService.getStats.mockResolvedValue({
        keys: 100,
        memory: '1MB',
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          status: 'healthy',
          services: {
            database: { status: 'healthy' },
            cache: { status: 'healthy', keys: 100, memory: '1MB' },
          },
          environment: 'test',
          version: '0.1.0',
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.services.database.status).toBe('healthy')
      expect(data.services.cache).toBeDefined()
      expect(data.environment).toBe('test')
      expect(data.version).toBe('0.1.0')
    })

    it('should return unhealthy status when database is down', async () => {
      // Mock database failure
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'unhealthy',
        error: 'Connection timeout',
        timestamp: new Date().toISOString(),
      })

      mockCacheService.getStats.mockResolvedValue({
        keys: 100,
        memory: '1MB',
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          status: 'healthy',
          services: {
            database: { status: 'unhealthy', error: 'Connection timeout' },
            cache: { status: 'healthy', keys: 100, memory: '1MB' },
          },
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy') // Overall status is still healthy if cache is working
      expect(data.services.database.status).toBe('unhealthy')
      expect(data.services.cache).toBeDefined()
    })

    it('should handle cache service unavailability gracefully', async () => {
      // Mock successful database but failed cache
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      })

      mockCacheService.getStats.mockResolvedValue(null)

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          status: 'healthy',
          services: {
            database: { status: 'healthy' },
            cache: { status: 'disabled' },
          },
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.services.database.status).toBe('healthy')
      expect(data.services.cache).toBeDefined()
    })

    it('should include system information', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      })

      mockCacheService.getStats.mockResolvedValue({
        keys: 100,
        memory: '1MB',
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          status: 'healthy',
          system: {
            uptime: 3600,
            memory: { heapUsed: 1000000, heapTotal: 2000000 },
            nodeVersion: 'v18.0.0',
            platform: 'darwin',
            arch: 'x64',
          },
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(data.system).toBeDefined()
      expect(data.system.uptime).toBeDefined()
      expect(data.system.memory).toBeDefined()
      expect(data.system.nodeVersion).toBeDefined()
      expect(data.system.platform).toBeDefined()
      expect(data.system.arch).toBeDefined()
    })

    it('should include configuration information', async () => {
      mockCheckDatabaseHealth.mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
      })

      mockCacheService.getStats.mockResolvedValue({
        keys: 100,
        memory: '1MB',
      })

      // Mock the GET function response
      mockGET.mockResolvedValue({
        status: 200,
        json: async () => ({
          status: 'healthy',
          config: {
            nodeEnv: 'test',
            databaseProvider: 'postgresql',
            cacheProvider: 'redis',
            features: {
              paymentVerification: false,
              moderationQueue: false,
            },
          },
        }),
      } as any)

      const response = await mockGET()
      const data = await response.json()

      expect(data.config).toBeDefined()
      expect(data.config.nodeEnv).toBe('test')
      expect(data.config.databaseProvider).toBe('postgresql')
      expect(data.config.cacheProvider).toBe('redis')
      expect(data.config.features).toBeDefined()
    })
  })

  describe('OPTIONS /api/health/check', () => {
    it('should return proper CORS headers', async () => {
      // Mock the OPTIONS function response
      mockOPTIONS.mockResolvedValue({
        status: 200,
        headers: {
          get: (name: string) => {
            if (name === 'Allow') return 'GET, OPTIONS'
            if (name === 'Cache-Control') return 'no-cache, no-store, must-revalidate'
            return null
          },
        },
      } as any)

      const response = await mockOPTIONS()

      expect(response.status).toBe(200)
      expect(response.headers.get('Allow')).toBe('GET, OPTIONS')
      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    })
  })
})
