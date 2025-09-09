import { performanceMonitor } from './performance-monitor';
import { cacheManager } from '../cache';
import { databaseOptimizer } from './database-optimizer';

export interface HistoricalDataPoint {
  timestamp: Date;
  metrics: {
    performance: Record<string, number>;
    cache: Record<string, number>;
    database: Record<string, number>;
    system: Record<string, number>;
  };
  alerts: number;
  loadTestResults?: any[];
}

export interface TrendAnalysis {
  metric: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  dataPoints: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  changePercent: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  volatility: number;
  seasonality?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'none';
    strength: number;
  };
  forecast?: {
    nextValue: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  };
}

export interface PerformanceInsight {
  type: 'trend' | 'anomaly' | 'optimization' | 'warning';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  baselineValue: number;
  changePercent: number;
  recommendation: string;
  impact: string;
  effort: string;
  timestamp: Date;
}

export class HistoricalAnalysis {
  private static instance: HistoricalAnalysis;
  private dataPoints: HistoricalDataPoint[] = [];
  private maxDataPoints: number = 10000; // Keep last 10k data points
  private collectionInterval: number = 60000; // 1 minute
  private collectionTimer?: NodeJS.Timeout;
  private isCollecting: boolean = false;

  private constructor() {
    this.startDataCollection();
  }

  static getInstance(): HistoricalAnalysis {
    if (!HistoricalAnalysis.instance) {
      HistoricalAnalysis.instance = new HistoricalAnalysis();
    }
    return HistoricalAnalysis.instance;
  }

  private startDataCollection(): void {
    if (this.isCollecting) return;

    this.isCollecting = true;
    this.collectDataPoint(); // Collect immediately

    this.collectionTimer = setInterval(() => {
      this.collectDataPoint();
    }, this.collectionInterval);

    console.log('📊 Historical analysis data collection started');
  }

  stopDataCollection(): void {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = undefined;
    }

    console.log('🛑 Historical analysis data collection stopped');
  }

  private collectDataPoint(): void {
    try {
      const performanceInsights = performanceMonitor.getPerformanceInsights();
      const cacheStats = cacheManager.getStats();
      const dbMetrics = databaseOptimizer.getMetrics();

      const dataPoint: HistoricalDataPoint = {
        timestamp: new Date(),
        metrics: {
          performance: {
            totalOperations: performanceInsights.totalOperations || 0,
            averageDuration: performanceInsights.averageDuration || 0,
            errorRate: performanceInsights.errorRate || 0,
            performanceScore: performanceInsights.performanceScore || 100,
            slowOperations: performanceInsights.slowOperations || 0,
            verySlowOperations: performanceInsights.verySlowOperations || 0,
          },
          cache: {
            size: cacheStats.size || 0,
            max: cacheStats.max || 0,
            hitRate: cacheStats.hitRate || 0,
            missRate: cacheStats.missRate || 0,
          },
          database: {
            totalQueries: dbMetrics?.totalQueries || 0,
            slowQueries: dbMetrics?.slowQueries || 0,
            averageQueryTime: dbMetrics?.averageQueryTime || 0,
          },
          system: {
            memoryUsage: this.getSystemMemoryUsage(),
            uptime: process.uptime(),
            nodeVersion: parseFloat(process.version.slice(1)),
          },
        },
        alerts: 0, // This would come from the alerting system
      };

      this.dataPoints.push(dataPoint);

      // Maintain max data points
      if (this.dataPoints.length > this.maxDataPoints) {
        this.dataPoints = this.dataPoints.slice(-this.maxDataPoints);
      }

    } catch (error) {
      console.error('Error collecting historical data point:', error);
    }
  }

  private getSystemMemoryUsage(): number {
    try {
      const memUsage = process.memoryUsage();
      return memUsage.heapUsed / memUsage.heapTotal;
    } catch {
      return 0;
    }
  }

  getDataPoints(
    startTime?: Date,
    endTime?: Date,
    metrics?: string[]
  ): HistoricalDataPoint[] {
    let filtered = this.dataPoints;

    if (startTime) {
      filtered = filtered.filter(dp => dp.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter(dp => dp.timestamp <= endTime);
    }

    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  analyzeTrends(
    metric: string,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
    hours: number = 24
  ): TrendAnalysis | null {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    
    const dataPoints = this.getDataPoints(startTime, endTime);
    if (dataPoints.length < 2) return null;

    const values = this.extractMetricValues(dataPoints, metric);
    if (values.length === 0) return null;

    const analysis: TrendAnalysis = {
      metric,
      period,
      dataPoints: values.length,
      trend: this.calculateTrend(values),
      changePercent: this.calculateChangePercent(values),
      averageValue: this.calculateAverage(values),
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      volatility: this.calculateVolatility(values),
      seasonality: this.detectSeasonality(values, period),
      forecast: this.generateForecast(values),
    };

    return analysis;
  }

  private extractMetricValues(dataPoints: HistoricalDataPoint[], metric: string): number[] {
    const values: number[] = [];

    for (const dp of dataPoints) {
      let value: number | undefined;

      // Navigate the nested metrics structure
      if (metric.includes('.')) {
        const [category, subMetric] = metric.split('.');
        value = dp.metrics[category as keyof typeof dp.metrics]?.[subMetric];
      } else {
        // Try to find in any category
        for (const category of Object.values(dp.metrics)) {
          if (typeof category === 'object' && category[metric] !== undefined) {
            value = category[metric];
            break;
          }
        }
      }

      if (value !== undefined && !isNaN(value)) {
        values.push(value);
      }
    }

    return values;
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 5) return 'stable';
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'fluctuating';
  }

  private calculateChangePercent(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];

    return ((last - first) / first) * 100;
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = this.calculateAverage(squaredDiffs);

    return Math.sqrt(variance);
  }

  private detectSeasonality(
    values: number[],
    period: string
  ): { pattern: 'daily' | 'weekly' | 'monthly' | 'none'; strength: number } | undefined {
    if (values.length < 24) return undefined; // Need at least 24 data points

    // Simple seasonality detection based on period
    let pattern: 'daily' | 'weekly' | 'monthly' | 'none' = 'none';
    let strength = 0;

    switch (period) {
      case 'hourly':
        if (values.length >= 24) {
          // Check for daily patterns (24-hour cycles)
          strength = this.calculateSeasonalityStrength(values, 24);
          pattern = strength > 0.3 ? 'daily' : 'none';
        }
        break;
      case 'daily':
        if (values.length >= 7) {
          // Check for weekly patterns (7-day cycles)
          strength = this.calculateSeasonalityStrength(values, 7);
          pattern = strength > 0.3 ? 'weekly' : 'none';
        }
        break;
      case 'weekly':
        if (values.length >= 4) {
          // Check for monthly patterns (4-week cycles)
          strength = this.calculateSeasonalityStrength(values, 4);
          pattern = strength > 0.3 ? 'monthly' : 'none';
        }
        break;
    }

    return { pattern, strength };
  }

  private calculateSeasonalityStrength(values: number[], cycleLength: number): number {
    if (values.length < cycleLength * 2) return 0;

    let strength = 0;
    const cycles = Math.floor(values.length / cycleLength);

    for (let i = 0; i < cycleLength; i++) {
      const cycleValues: number[] = [];
      
      for (let j = 0; j < cycles; j++) {
        const index = j * cycleLength + i;
        if (index < values.length) {
          cycleValues.push(values[index]);
        }
      }

      if (cycleValues.length > 1) {
        const variance = this.calculateVariance(cycleValues);
        const totalVariance = this.calculateVariance(values);
        
        if (totalVariance > 0) {
          strength += (1 - variance / totalVariance) / cycleLength;
        }
      }
    }

    return strength;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = this.calculateAverage(values);
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    
    return this.calculateAverage(squaredDiffs);
  }

  private generateForecast(values: number[]): { nextValue: number; confidence: number; trend: 'up' | 'down' | 'stable' } | undefined {
    if (values.length < 3) return undefined;

    try {
      // Simple linear regression for forecasting
      const n = values.length;
      const x = Array.from({ length: n }, (_, i) => i);
      
      const sumX = x.reduce((sum, val) => sum + val, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
      const sumXX = x.reduce((sum, val) => sum + val * val, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      const nextValue = slope * n + intercept;
      const trend: 'up' | 'down' | 'stable' = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'up' : 'down';

      // Calculate confidence based on R-squared
      const yMean = sumY / n;
      const ssRes = values.reduce((sum, val, i) => sum + Math.pow(val - (slope * x[i] + intercept), 2), 0);
      const ssTot = values.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0);
      const confidence = ssTot > 0 ? Math.max(0, Math.min(1, 1 - (ssRes / ssTot))) : 0;

      return {
        nextValue: Math.max(0, nextValue), // Ensure non-negative
        confidence: Math.round(confidence * 100) / 100,
        trend,
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      return undefined;
    }
  }

  generateInsights(hours: number = 24): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    
    const dataPoints = this.getDataPoints(startTime, endTime);
    if (dataPoints.length < 2) return insights;

    // Performance insights
    const perfTrend = this.analyzeTrends('performance.averageDuration', 'hourly', hours);
    if (perfTrend && perfTrend.trend === 'increasing' && perfTrend.changePercent > 20) {
      insights.push({
        type: 'warning',
        title: 'Response Time Degradation',
        description: `Average response time has increased by ${perfTrend.changePercent.toFixed(1)}% over the last ${hours} hours`,
        severity: 'medium',
        metric: 'performance.averageDuration',
        currentValue: perfTrend.maxValue,
        baselineValue: perfTrend.minValue,
        changePercent: perfTrend.changePercent,
        recommendation: 'Investigate recent deployments or database changes that may be causing performance degradation',
        impact: 'High - User experience will be negatively affected',
        effort: 'Medium - Requires performance investigation and optimization',
        timestamp: new Date(),
      });
    }

    // Cache insights
    const cacheTrend = this.analyzeTrends('cache.hitRate', 'hourly', hours);
    if (cacheTrend && cacheTrend.trend === 'decreasing' && cacheTrend.changePercent < -10) {
      insights.push({
        type: 'optimization',
        title: 'Cache Hit Rate Decline',
        description: `Cache hit rate has decreased by ${Math.abs(cacheTrend.changePercent).toFixed(1)}% over the last ${hours} hours`,
        severity: 'medium',
        metric: 'cache.hitRate',
        currentValue: cacheTrend.minValue,
        baselineValue: cacheTrend.maxValue,
        changePercent: cacheTrend.changePercent,
        recommendation: 'Review cache invalidation strategies and consider increasing cache size or TTL',
        impact: 'Medium - Increased database load and slower response times',
        effort: 'Low - Cache configuration adjustments',
        timestamp: new Date(),
      });
    }

    // System insights
    const memoryTrend = this.analyzeTrends('system.memoryUsage', 'hourly', hours);
    if (memoryTrend && memoryTrend.maxValue > 0.8) {
      insights.push({
        type: 'warning',
        title: 'High Memory Usage',
        description: `Memory usage has reached ${(memoryTrend.maxValue * 100).toFixed(1)}% over the last ${hours} hours`,
        severity: 'high',
        metric: 'system.memoryUsage',
        currentValue: memoryTrend.maxValue,
        baselineValue: memoryTrend.averageValue,
        changePercent: ((memoryTrend.maxValue - memoryTrend.averageValue) / memoryTrend.averageValue) * 100,
        recommendation: 'Investigate memory leaks, optimize memory usage, or consider scaling up resources',
        impact: 'High - Potential for application crashes and poor performance',
        effort: 'High - Requires memory profiling and optimization',
        timestamp: new Date(),
      });
    }

    return insights;
  }

  getSummary(hours: number = 24): {
    totalDataPoints: number;
    timeRange: { start: Date; end: Date };
    metrics: Record<string, { current: number; average: number; min: number; max: number }>;
    trends: Record<string, string>;
    insights: PerformanceInsight[];
  } {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
    
    const dataPoints = this.getDataPoints(startTime, endTime);
    const insights = this.generateInsights(hours);

    const summary = {
      totalDataPoints: dataPoints.length,
      timeRange: { start: startTime, end: endTime },
      metrics: {} as Record<string, { current: number; average: number; min: number; max: number }>,
      trends: {} as Record<string, string>,
      insights,
    };

    // Calculate metrics summary
    const keyMetrics = [
      'performance.averageDuration',
      'performance.errorRate',
      'performance.performanceScore',
      'cache.hitRate',
      'system.memoryUsage',
    ];

    for (const metric of keyMetrics) {
      const trend = this.analyzeTrends(metric, 'hourly', hours);
      if (trend) {
        summary.metrics[metric] = {
          current: trend.maxValue,
          average: trend.averageValue,
          min: trend.minValue,
          max: trend.maxValue,
        };
        summary.trends[metric] = trend.trend;
      }
    }

    return summary;
  }

  exportData(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportToCSV();
    }
    
    return JSON.stringify({
      dataPoints: this.dataPoints,
      summary: this.getSummary(),
      insights: this.generateInsights(),
    }, null, 2);
  }

  private exportToCSV(): string {
    if (this.dataPoints.length === 0) return '';

    const headers = ['timestamp', 'metric', 'value'];
    const rows: string[] = [headers.join(',')];

    for (const dp of this.dataPoints) {
      const timestamp = dp.timestamp.toISOString();
      
      // Flatten nested metrics
      for (const [category, metrics] of Object.entries(dp.metrics)) {
        if (typeof metrics === 'object') {
          for (const [metric, value] of Object.entries(metrics)) {
            rows.push(`${timestamp},${category}.${metric},${value}`);
          }
        } else {
          rows.push(`${timestamp},${category},${metrics}`);
        }
      }
    }

    return rows.join('\n');
  }

  clearData(): void {
    this.dataPoints = [];
    console.log('🗑️ Historical data cleared');
  }

  isCollecting(): boolean {
    return this.isCollecting;
  }

  getDataPointCount(): number {
    return this.dataPoints.length;
  }
}

// Export singleton instance
export const historicalAnalysis = HistoricalAnalysis.getInstance();
