import { cacheService, withCache, cacheInvalidation, CACHE_CONFIG } from '@/lib/cache'
import { DEFAULT_TTL } from '@/lib/ttl-manager'

// Mock Redis client
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  setex: jest.fn(),
  mget: jest.fn(),
  pipeline: jest.fn(),
  keys: jest.fn(),
  del: jest.fn(),
  flushdb: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  dbsize: jest.fn(),
}

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRedis),
}))

describe('Enhanced Cache Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset cache service state
    Object.defineProperty(cacheService, 'client', {
      value: mockRedis,
      writable: true,
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Cache Configuration', () => {
    it('should have proper TTL values', () => {
      expect(DEFAULT_TTL.short).toBe(300)      // 5 minutes
      expect(DEFAULT_TTL.medium).toBe(3600)    // 1 hour
      expect(DEFAULT_TTL.long).toBe(86400)     // 24 hours
      expect(DEFAULT_TTL.permanent).toBe(0)    // No expiration
    })

    it('should have cache prefixes', () => {
      expect(CACHE_CONFIG.PREFIXES.DOMAINS).toBe('domains:')
      expect(CACHE_CONFIG.PREFIXES.USERS).toBe('users:')
      expect(CACHE_CONFIG.PREFIXES.INQUIRIES).toBe('inquiries:')
      expect(CACHE_CONFIG.PREFIXES.DASHBOARD).toBe('dashboard:')
      expect(CACHE_CONFIG.PREFIXES.SEARCH).toBe('search:')
      expect(CACHE_CONFIG.PREFIXES.ANALYTICS).toBe('analytics:')
    })

    it('should have warming configuration', () => {
      expect(CACHE_CONFIG.WARMING.ENABLED).toBe(true)
      expect(CACHE_CONFIG.WARMING.CONCURRENT_LIMIT).toBe(5)
    })
  })

  describe('Enhanced Cache Operations', () => {
    it('should set cache with TTL', async () => {
      const testData = { id: 1, name: 'test' }
      mockRedis.setex.mockResolvedValue('OK')

      const result = await cacheService.set('test-key', testData, 3600)

      expect(result).toBe(true)
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(testData))
    })

    it('should set cache without TTL (permanent)', async () => {
      const testData = 'permanent-data'
      mockRedis.set.mockResolvedValue('OK')

      const result = await cacheService.set('permanent-key', testData, 0)

      expect(result).toBe(true)
      expect(mockRedis.set).toHaveBeenCalledWith('permanent-key', testData)
    })

    it('should get cache with automatic deserialization', async () => {
      const testData = { id: 1, name: 'test' }
      mockRedis.get.mockResolvedValue(JSON.stringify(testData))

      const result = await cacheService.get('test-key')

      expect(result).toEqual(testData)
      expect(mockRedis.get).toHaveBeenCalledWith('test-key')
    })

    it('should handle string values without deserialization', async () => {
      const testData = 'string-data'
      mockRedis.get.mockResolvedValue(testData)

      const result = await cacheService.get('test-key')

      expect(result).toBe(testData)
    })

    it('should return null for non-existent keys', async () => {
      mockRedis.get.mockResolvedValue(null)

      const result = await cacheService.get('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('Batch Operations', () => {
    it('should perform batch get operations', async () => {
      const keys = ['key1', 'key2', 'key3']
      const values = [
        JSON.stringify({ id: 1 }),
        JSON.stringify({ id: 2 }),
        null,
      ]
      mockRedis.mget.mockResolvedValue(values)

      const result = await cacheService.mget(keys)

      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: 1 })
      expect(result[1]).toEqual({ id: 2 })
      expect(result[2]).toBeNull()
      expect(mockRedis.mget).toHaveBeenCalledWith(...keys)
    })

    it('should perform batch set operations', async () => {
      const entries = [
        { key: 'key1', value: { id: 1 }, ttl: 3600 },
        { key: 'key2', value: { id: 2 }, ttl: 7200 },
        { key: 'key3', value: 'string-value', ttl: 0 },
      ]

      const mockPipeline = {
        setex: jest.fn(),
        set: jest.fn(),
        exec: jest.fn().mockResolvedValue([['OK'], ['OK'], ['OK']]),
      }
      mockRedis.pipeline.mockReturnValue(mockPipeline)

      const result = await cacheService.mset(entries as any)

      expect(result).toBe(true)
      expect(mockPipeline.setex).toHaveBeenCalledWith('key1', 3600, JSON.stringify({ id: 1 }))
      expect(mockPipeline.setex).toHaveBeenCalledWith('key2', 7200, JSON.stringify({ id: 2 }))
      expect(mockPipeline.set).toHaveBeenCalledWith('key3', 'string-value')
      expect(mockPipeline.exec).toHaveBeenCalled()
    })

    it('should handle empty batch operations', async () => {
      const result = await cacheService.mget([])
      expect(result).toEqual([])

      const setResult = await cacheService.mset([])
      expect(setResult).toBe(false)
    })
  })

  describe('Pattern-based Deletion', () => {
    it('should delete keys by pattern', async () => {
      const pattern = 'domains:*'
      const keys = ['domains:1', 'domains:2', 'domains:3']
      mockRedis.keys.mockResolvedValue(keys)
      mockRedis.del.mockResolvedValue(3)

      const result = await cacheService.deletePattern(pattern)

      expect(result).toBe(3)
      expect(mockRedis.keys).toHaveBeenCalledWith(pattern)
      expect(mockRedis.del).toHaveBeenCalledWith(...keys)
    })

    it('should handle pattern with no matches', async () => {
      const pattern = 'nonexistent:*'
      mockRedis.keys.mockResolvedValue([])

      const result = await cacheService.deletePattern(pattern)

      expect(result).toBe(0)
      expect(mockRedis.keys).toHaveBeenCalledWith(pattern)
      expect(mockRedis.del).not.toHaveBeenCalled()
    })

    it('should delete keys in batches', async () => {
      const pattern = 'large-pattern:*'
      const keys = Array.from({ length: 250 }, (_, i) => `large-pattern:${i}`)
      mockRedis.keys.mockResolvedValue(keys)
      mockRedis.del.mockResolvedValue(100)

      const result = await cacheService.deletePattern(pattern)

      expect(result).toBe(300) // Total of all batch results (100 + 100 + 100)
      // Should be called 3 times (250 keys / 100 batch size = 3 batches)
      expect(mockRedis.del).toHaveBeenCalledTimes(3)
    })
  })

  describe('Cache Warming', () => {
    it('should warm cache with multiple keys', async () => {
      const keys = ['key1', 'key2', 'key3']
      const fetchFunction = jest.fn().mockImplementation((key) => 
        Promise.resolve({ id: key, data: `data-for-${key}` })
      )

      mockRedis.setex.mockResolvedValue('OK')

      await cacheService.warmCache(keys, fetchFunction, 3600)

      expect(fetchFunction).toHaveBeenCalledTimes(3)
      expect(fetchFunction).toHaveBeenCalledWith('key1')
      expect(fetchFunction).toHaveBeenCalledWith('key2')
      expect(fetchFunction).toHaveBeenCalledWith('key3')
      expect(mockRedis.setex).toHaveBeenCalledTimes(3)
    })

    it('should handle cache warming errors gracefully', async () => {
      const keys = ['key1', 'key2']
      const fetchFunction = jest.fn()
        .mockResolvedValueOnce({ id: 'key1', data: 'data1' })
        .mockRejectedValueOnce(new Error('Fetch failed'))

      mockRedis.setex.mockResolvedValue('OK')

      // Should not throw error
      await expect(cacheService.warmCache(keys, fetchFunction, 3600)).resolves.toBeUndefined()

      expect(fetchFunction).toHaveBeenCalledTimes(2)
      expect(mockRedis.setex).toHaveBeenCalledTimes(1) // Only successful fetch gets cached
    })
  })

  describe('Cache Statistics', () => {
    it('should get cache statistics', async () => {
      const mockInfo = 'used_memory_human:1.2M\nused_memory_peak_human:1.5M'
      mockRedis.info.mockResolvedValue(mockInfo)
      mockRedis.dbsize.mockResolvedValue(150)

      const stats = await cacheService.getStats()

      expect(stats.keys).toBe(150)
      expect(stats.memory).toBe('1.2M')
      expect(stats.hitRate).toBe(0)
      expect(stats.operations).toBe(0)
    })

    it('should handle Redis connection errors in stats', async () => {
      mockRedis.info.mockRejectedValue(new Error('Connection failed'))

      const stats = await cacheService.getStats()

      expect(stats.keys).toBe(0)
      expect(stats.memory).toBe('0B')
      expect(stats.hitRate).toBe(0)
      expect(stats.operations).toBe(0)
    })
  })

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      mockRedis.ping.mockResolvedValue('PONG')

      const result = await cacheService.healthCheck()

      expect(result).toBe(true)
      expect(mockRedis.ping).toHaveBeenCalled()
    })

    it('should handle health check failure', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'))

      const result = await cacheService.healthCheck()

      expect(result).toBe(false)
    })
  })

  describe('Enhanced withCache Middleware', () => {
    it('should use cache when available', async () => {
      const cachedData = { id: 1, name: 'cached' }
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData))

      const fetchFunction = jest.fn()
      const result = await withCache('test-key', fetchFunction, 3600)

      expect(result).toEqual(cachedData)
      expect(fetchFunction).not.toHaveBeenCalled()
    })

    it('should fetch and cache when cache miss', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockRedis.setex.mockResolvedValue('OK')

      const freshData = { id: 1, name: 'fresh' }
      const fetchFunction = jest.fn().mockResolvedValue(freshData)

      const result = await withCache('test-key', fetchFunction, 3600)

      expect(result).toEqual(freshData)
      expect(fetchFunction).toHaveBeenCalled()
      expect(mockRedis.setex).toHaveBeenCalledWith('test-key', 3600, JSON.stringify(freshData))
    })

    it('should force refresh when requested', async () => {
      const cachedData = { id: 1, name: 'cached' }
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData))
      mockRedis.setex.mockResolvedValue('OK')

      const freshData = { id: 1, name: 'fresh' }
      const fetchFunction = jest.fn().mockResolvedValue(freshData)

      const result = await withCache('test-key', fetchFunction, 3600, { forceRefresh: true })

      expect(result).toEqual(freshData)
      expect(fetchFunction).toHaveBeenCalled()
      expect(mockRedis.setex).toHaveBeenCalled()
    })

    it('should enable cache warming when requested', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockRedis.setex.mockResolvedValue('OK')

      const fetchFunction = jest.fn().mockResolvedValue({ id: 1 })

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      await withCache('test-key', fetchFunction, 3600, { warmCache: true })

      expect(consoleSpy).toHaveBeenCalledWith('Cache warming enabled for key: test-key')
      consoleSpy.mockRestore()
    })
  })

  describe('Cache Invalidation', () => {
    it('should invalidate domain cache', async () => {
      const domainId = 'domain123'
      const pattern = `${CACHE_CONFIG.PREFIXES.DOMAINS}${domainId}:*`
      mockRedis.keys.mockResolvedValue(['domains:domain123:info', 'domains:domain123:stats'])
      mockRedis.del.mockResolvedValue(2)

      await cacheInvalidation.invalidateDomains(domainId)

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern)
      expect(mockRedis.del).toHaveBeenCalledWith('domains:domain123:info', 'domains:domain123:stats')
    })

    it('should invalidate all domain cache', async () => {
      const pattern = `${CACHE_CONFIG.PREFIXES.DOMAINS}*`
      mockRedis.keys.mockResolvedValue(['domains:list', 'domains:stats'])
      mockRedis.del.mockResolvedValue(2)

      await cacheInvalidation.invalidateDomains()

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern)
    })

    it('should invalidate user cache', async () => {
      const userId = 'user123'
      mockRedis.keys.mockResolvedValue(['users:user123:profile', 'dashboard:user123:stats'])
      mockRedis.del.mockResolvedValue(2)

      await cacheInvalidation.invalidateUser(userId)

      expect(mockRedis.keys).toHaveBeenCalledWith('users:user123:*')
      expect(mockRedis.keys).toHaveBeenCalledWith('dashboard:user123:*')
    })

    it('should invalidate search cache', async () => {
      const query = 'example'
      const pattern = `${CACHE_CONFIG.PREFIXES.SEARCH}*${query}*`
      mockRedis.keys.mockResolvedValue(['search:example:results', 'search:example:suggestions'])
      mockRedis.del.mockResolvedValue(2)

      await cacheInvalidation.invalidateSearch(query)

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern)
    })

    it('should invalidate analytics cache', async () => {
      const pattern = `${CACHE_CONFIG.PREFIXES.ANALYTICS}*`
      mockRedis.keys.mockResolvedValue(['analytics:dashboard', 'analytics:reports'])
      mockRedis.del.mockResolvedValue(2)

      await cacheInvalidation.invalidateAnalytics()

      expect(mockRedis.keys).toHaveBeenCalledWith(pattern)
    })
  })

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      mockRedis.set.mockRejectedValue(new Error('Connection failed'))

      const result = await cacheService.set('test-key', 'value', 0)

      expect(result).toBe(false)
    })

    it('should handle JSON parsing errors', async () => {
      const invalidJson = 'invalid-json'
      mockRedis.get.mockResolvedValue(invalidJson)

      const result = await cacheService.get('test-key')

      expect(result).toBe(invalidJson)
    })

    it('should handle batch operation errors', async () => {
      mockRedis.pipeline.mockReturnValue({
        setex: jest.fn(),
        exec: jest.fn().mockRejectedValue(new Error('Pipeline failed')),
      })

      const result = await cacheService.mset([
        { key: 'key1', value: 'value1', ttl: 3600 }
      ])

      expect(result).toBe(false)
    })
  })
})
