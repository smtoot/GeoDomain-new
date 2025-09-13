'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Activity, Database, Zap, Clock, BarChart3 } from 'lucide-react';

interface PerformanceStats {
  performance: {
    overall: {
      totalOperations: number;
      averageDuration: number;
      slowOperations: number;
      verySlowOperations: number;
      performanceScore: number;
      lastOperation?: {
        operation: string;
        duration: number;
        timestamp: string;
        metadata: {
          path: string;
          type: string;
          success: boolean;
        };
      };
    };
    recentOperations: Array<{
      operation: string;
      duration: number;
      timestamp: string;
      metadata: {
        path: string;
        type: string;
        success: boolean;
      };
    }>;
  };
  cache: {
    size: number;
    max: number;
    ttl: number;
    noDisposeOnSet: boolean;
    hitRate: number;
  };
  database: {
    status: string;
    responseTime: number;
    timestamp: string;
  };
  system: {
    uptime: number;
    memoryUsage: number;
    nodeVersion: string;
    platform: string;
  };
}

export default function PerformanceDashboard() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/performance/stats');
      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  const resetPerformance = async () => {
    try {
      await fetch('/api/performance/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      await fetchStats();
    } catch (error) {
      }
  };

  const clearCache = async () => {
    try {
      await fetch('/api/performance/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearCache' }),
      });
      await fetchStats();
    } catch (error) {
      }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCacheHitRateColor = (rate: number) => {
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time system performance metrics and cache statistics
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStats} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={resetPerformance} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Reset Metrics
          </Button>
          <Button onClick={clearCache} variant="outline" size="sm">
            <Zap className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      )}

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.performance.overall.totalOperations}</div>
            <p className="text-xs text-muted-foreground">
              API calls tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.performance.overall.averageDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Per operation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceColor(stats.performance.overall.performanceScore)}`}>
              {stats.performance.overall.performanceScore}/100
            </div>
            <p className="text-xs text-muted-foreground">
              System health
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCacheHitRateColor(stats.cache.hitRate)}`}>
              {(stats.cache.hitRate * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cache efficiency
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Cache Size</div>
              <div className="text-2xl font-bold">{stats.cache.size}</div>
              <div className="text-xs text-muted-foreground">of {stats.cache.max} entries</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">TTL</div>
              <div className="text-2xl font-bold">{Math.round(stats.cache.ttl / 1000)}s</div>
              <div className="text-xs text-muted-foreground">Time to live</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Hit Rate</div>
              <div className={`text-2xl font-bold ${getCacheHitRateColor(stats.cache.hitRate)}`}>
                {(stats.cache.hitRate * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Cache efficiency</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge variant={stats.cache.size > 0 ? "default" : "secondary"}>
                {stats.cache.size > 0 ? "Active" : "Empty"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <Badge variant={stats.database.status === 'healthy' ? "default" : "destructive"}>
                {stats.database.status}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Response Time</div>
              <div className="text-xl font-bold">{formatDuration(stats.database.responseTime)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Check</div>
              <div className="text-sm">{new Date(stats.database.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Operations */}
      {stats.performance.recentOperations && stats.performance.recentOperations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.performance.recentOperations.slice(0, 10).map((op, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant={op.metadata.success ? "default" : "destructive"}>
                      {op.metadata.type}
                    </Badge>
                    <span className="font-mono text-sm">{op.metadata.path}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {new Date(op.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant={op.duration > 1000 ? "destructive" : op.duration > 100 ? "secondary" : "default"}>
                      {formatDuration(op.duration)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Uptime</div>
              <div className="text-xl font-bold">{Math.round(stats.system.uptime / 3600)}h</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Memory Usage</div>
              <div className="text-xl font-bold">{formatBytes(stats.system.memoryUsage)}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Node Version</div>
              <div className="text-sm font-mono">{stats.system.nodeVersion}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Platform</div>
              <div className="text-sm">{stats.system.platform}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
