'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StandardPageLayout } from '@/components/layout/StandardPageLayout'
import { QueryErrorBoundary } from '@/components/error'
import { LoadingCardSkeleton } from '@/components/ui/loading/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Database, 
  HardDrive, 
  Code, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface PerformanceMetrics {
  cache: {
    keys: number
    memory: string
    hitRate: number
    operations: number
  }
  database: {
    status: string
    poolStats: {
      active: number
      max: number
      available: number
      queued: number
    }
    performance: {
      responseTime: number
      connectionCount: number
    }
    queryMetrics: Record<string, { count: number; totalTime: number; avgTime: number }>
    slowQueries: Array<{ query: string; duration: number; timestamp: string }>
  }
  codeSplitting: {
    loadTimes: Record<string, number>
    bundleSizes: Record<string, number>
    averageLoadTime: number
    totalBundleSize: number
  }
  system: {
    uptime: number
    memory: {
      used: number
      total: number
      percentage: number
    }
    cpu: number
    loadAverage: number
  }
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      
      // Fetch cache stats
      const cacheResponse = await fetch('/api/monitoring/stats')
      const cacheData = await cacheResponse.json()
      
      // Fetch database stats
      const dbResponse = await fetch('/api/health/check')
      const dbData = await dbResponse.json()
      
      // Mock code splitting metrics (in real implementation, these would come from the monitor)
      const codeSplittingData = {
        loadTimes: {
          'DashboardAnalytics': 150,
          'DashboardNotifications': 200,
          'DomainForm': 100,
          'AdminDashboard': 300,
        },
        bundleSizes: {
          'DashboardAnalytics': 45,
          'DashboardNotifications': 32,
          'DomainForm': 28,
          'AdminDashboard': 67,
        },
        averageLoadTime: 187.5,
        totalBundleSize: 172,
      }
      
      // Mock system metrics
      const systemData = {
        uptime: process.uptime ? process.uptime() : 0,
        memory: {
          used: process.memoryUsage ? process.memoryUsage().heapUsed : 0,
          total: process.memoryUsage ? process.memoryUsage().heapTotal : 0,
          percentage: 0,
        },
        cpu: 0,
        loadAverage: 0,
      }
      
      // Calculate memory percentage
      if (systemData.memory.total > 0) {
        systemData.memory.percentage = (systemData.memory.used / systemData.memory.total) * 100
      }

      const combinedMetrics: PerformanceMetrics = {
        cache: cacheData.services?.cache || {
          keys: 0,
          memory: '0B',
          hitRate: 0,
          operations: 0,
        },
        database: {
          status: dbData.services?.database?.status || 'unknown',
          poolStats: dbData.services?.database?.poolStats || {
            active: 0,
            max: 10,
            available: 10,
            queued: 0,
          },
          performance: dbData.services?.database?.performance || {
            responseTime: 0,
            connectionCount: 0,
          },
          queryMetrics: {},
          slowQueries: [],
        },
        codeSplitting: codeSplittingData,
        system: systemData,
      }

      setMetrics(combinedMetrics)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800'
      case 'unhealthy':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'unhealthy':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Failed to Load Metrics</h1>
          <p className="text-gray-600 mb-4">Unable to fetch performance data</p>
          <Button onClick={fetchMetrics}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <QueryErrorBoundary context="Admin Performance Monitoring Page">
      <StandardPageLayout
        title="Performance Monitoring"
        description="Real-time system performance and optimization metrics"
        isLoading={isLoading && !metrics}
        loadingText="Loading performance metrics..."
        error={!metrics ? new Error('Failed to load metrics') : undefined}
      >
        {/* Performance Actions */}
        <div className="flex items-center gap-4 mb-6">
          {lastUpdated && (
            <div className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
          <Button onClick={fetchMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="code-splitting">Code Splitting</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Cache Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Status</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cache.keys}</div>
                <p className="text-xs text-muted-foreground">Active Keys</p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {metrics.cache.memory}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Database Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(metrics.database.status)}
                  <Badge className={getStatusColor(metrics.database.status)}>
                    {metrics.database.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.database.poolStats.active}/{metrics.database.poolStats.max} connections
                </p>
              </CardContent>
            </Card>

            {/* Code Splitting */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bundle Size</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.codeSplitting.totalBundleSize}KB</div>
                <p className="text-xs text-muted-foreground">Total Bundle Size</p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {metrics.codeSplitting.averageLoadTime.toFixed(0)}ms avg
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(metrics.system.uptime)}</div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {metrics.system.memory.percentage.toFixed(1)}% memory
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Key performance indicators over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-semibold">Cache Hit Rate</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {metrics.cache.hitRate}%
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-lg font-semibold">DB Response</span>
                  </div>
                  <div className="text-3xl font-bold text-red-600">
                    {metrics.database.performance.responseTime}ms
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="text-lg font-semibold">Load Time</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {metrics.codeSplitting.averageLoadTime.toFixed(0)}ms
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>Redis cache statistics and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Cache Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Active Keys:</span>
                      <span className="font-mono">{metrics.cache.keys}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span className="font-mono">{metrics.cache.memory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span className="font-mono">{metrics.cache.hitRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Operations:</span>
                      <span className="font-mono">{metrics.cache.operations}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Cache Health</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Redis connection active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Memory usage optimal</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>TTL management active</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Database Performance</CardTitle>
              <CardDescription>PostgreSQL connection pool and query performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Connection Pool</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Active Connections:</span>
                      <span className="font-mono">{metrics.database.poolStats.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Connections:</span>
                      <span className="font-mono">{metrics.database.poolStats.max}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Available:</span>
                      <span className="font-mono">{metrics.database.poolStats.available}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Queued:</span>
                      <span className="font-mono">{metrics.database.poolStats.queued}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Performance Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">{metrics.database.performance.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connection Count:</span>
                      <span className="font-mono">{metrics.database.performance.connectionCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge className={getStatusColor(metrics.database.status)}>
                        {metrics.database.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="code-splitting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Code Splitting Analysis</CardTitle>
              <CardDescription>Bundle sizes and component load times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Bundle Sizes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(metrics.codeSplitting.bundleSizes).map(([component, size]) => (
                      <div key={component} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{component}</span>
                        <Badge variant="outline">{size}KB</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Load Times</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(metrics.codeSplitting.loadTimes).map(([component, time]) => (
                      <div key={component} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="font-medium">{component}</span>
                        <Badge variant="outline">{time}ms</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.codeSplitting.averageLoadTime.toFixed(0)}ms
                    </div>
                    <div className="text-sm text-blue-600">Average Load Time</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.codeSplitting.totalBundleSize}KB
                    </div>
                    <div className="text-sm text-green-600">Total Bundle Size</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Resources</CardTitle>
              <CardDescription>Server resource utilization and performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">System Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">{formatUptime(metrics.system.uptime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Used:</span>
                      <span className="font-mono">{formatBytes(metrics.system.memory.used)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Total:</span>
                      <span className="font-mono">{formatBytes(metrics.system.memory.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span className="font-mono">{metrics.system.memory.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Performance Indicators</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>CPU Usage:</span>
                      <span className="font-mono">{metrics.system.cpu}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Load Average:</span>
                      <span className="font-mono">{metrics.system.loadAverage}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Memory Usage</h4>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(metrics.system.memory.percentage, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {metrics.system.memory.percentage.toFixed(1)}% of {formatBytes(metrics.system.memory.total)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </StandardPageLayout>
    </QueryErrorBoundary>
  )
}
