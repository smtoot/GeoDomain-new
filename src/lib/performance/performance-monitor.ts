import { performance } from 'perf_hooks';

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata: Record<string, any>;
}

interface PerformanceTrend {
  operation: string;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  averageChange: number;
  confidence: number;
}

interface AnomalyDetection {
  operation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'trend' | 'outlier';
  description: string;
  timestamp: Date;
  baseline: number;
  current: number;
}

interface PerformancePrediction {
  operation: string;
  predictedDuration: number;
  confidence: number;
  factors: string[];
  recommendation: string;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private trends: Map<string, PerformanceTrend> = new Map();
  private anomalies: AnomalyDetection[] = [];
  private predictions: Map<string, PerformancePrediction> = new Map();
  private maxMetrics: number = 10000; // Store last 10k metrics
  private alertThresholds: Map<string, number> = new Map();

  private constructor() {
    // Set default alert thresholds
    this.alertThresholds.set('response_time', 1000); // 1 second
    this.alertThresholds.set('error_rate', 0.05); // 5%
    this.alertThresholds.set('memory_usage', 0.8); // 80%
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(operation: string, duration: number, metadata: Record<string, any> = {}) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);

    // Maintain max metrics limit
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Analyze trends and detect anomalies
    this.analyzeTrends(operation);
    this.detectAnomalies(operation, duration);
    this.updatePredictions(operation);

    // Check alert thresholds
    this.checkAlertThresholds(operation, duration, metadata);
  }

  private analyzeTrends(operation: string) {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length < 10) return; // Need minimum data points

    const recent = operationMetrics.slice(-10);
    const previous = operationMetrics.slice(-20, -10);

    if (previous.length < 10) return;

    const recentAvg = recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    const previousAvg = previous.reduce((sum, m) => sum + m.duration, 0) / previous.length;

    const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
    const averageChange = changePercent / 10;

    let trend: 'improving' | 'stable' | 'degrading';
    if (changePercent < -5) trend = 'improving';
    else if (changePercent > 5) trend = 'degrading';
    else trend = 'stable';

    const confidence = Math.min(100, Math.max(0, 100 - Math.abs(changePercent)));

    this.trends.set(operation, {
      operation,
      trend,
      changePercent,
      averageChange,
      confidence,
    });
  }

  private detectAnomalies(operation: string, duration: number) {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length < 5) return;

    const durations = operationMetrics.map(m => m.duration);
    const mean = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    // Detect spikes (3 standard deviations from mean)
    if (duration > mean + (3 * stdDev)) {
      const anomaly: AnomalyDetection = {
        operation,
        severity: duration > mean + (5 * stdDev) ? 'critical' : 'high',
        type: 'spike',
        description: `Response time spike detected: ${duration.toFixed(2)}ms (baseline: ${mean.toFixed(2)}ms)`,
        timestamp: new Date(),
        baseline: mean,
        current: duration,
      };
      this.anomalies.push(anomaly);
    }

    // Detect drops (unusually fast responses)
    if (duration < mean - (3 * stdDev) && duration > 0) {
      const anomaly: AnomalyDetection = {
        operation,
        severity: 'low',
        type: 'drop',
        description: `Unusually fast response: ${duration.toFixed(2)}ms (baseline: ${mean.toFixed(2)}ms)`,
        timestamp: new Date(),
        baseline: mean,
        current: duration,
      };
      this.anomalies.push(anomaly);
    }

    // Maintain anomaly history (last 100)
    if (this.anomalies.length > 100) {
      this.anomalies = this.anomalies.slice(-100);
    }
  }

  private updatePredictions(operation: string) {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length < 20) return;

    const recent = operationMetrics.slice(-20);
    const durations = recent.map(m => m.duration);
    
    // Simple linear regression for prediction
    const n = durations.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = durations;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const predictedDuration = slope * n + intercept;
    const confidence = Math.max(0, Math.min(100, 100 - Math.abs(slope) * 10));

    let recommendation = 'Performance is stable';
    if (slope > 0.1) recommendation = 'Consider optimizing this operation';
    else if (slope < -0.1) recommendation = 'Performance is improving';
    else if (predictedDuration > 1000) recommendation = 'Monitor for performance degradation';

    this.predictions.set(operation, {
      operation,
      predictedDuration: Math.max(0, predictedDuration),
      confidence,
      factors: ['historical_trend', 'response_pattern', 'load_pattern'],
      recommendation,
    });
  }

  private checkAlertThresholds(operation: string, duration: number, metadata: Record<string, any>) {
    const responseTimeThreshold = this.alertThresholds.get('response_time') || 1000;
    
    if (duration > responseTimeThreshold) {
      console.warn(`🚨 [ALERT] ${operation} exceeded response time threshold: ${duration.toFixed(2)}ms > ${responseTimeThreshold}ms`);
      
      // Could integrate with external alerting system here
      this.sendAlert({
        type: 'response_time_exceeded',
        operation,
        current: duration,
        threshold: responseTimeThreshold,
        timestamp: new Date(),
        metadata,
      });
    }

    if (metadata.success === false) {
      const errorRate = this.calculateErrorRate(operation);
      const errorThreshold = this.alertThresholds.get('error_rate') || 0.05;
      
      if (errorRate > errorThreshold) {
        console.warn(`🚨 [ALERT] ${operation} error rate exceeded threshold: ${(errorRate * 100).toFixed(2)}% > ${(errorThreshold * 100).toFixed(2)}%`);
      }
    }
  }

  private calculateErrorRate(operation: string): number {
    const operationMetrics = this.metrics.filter(m => m.operation === operation);
    if (operationMetrics.length === 0) return 0;

    const errors = operationMetrics.filter(m => m.metadata.success === false).length;
    return errors / operationMetrics.length;
  }

  private sendAlert(alert: any) {
    // TODO: Integrate with external alerting systems (Slack, email, etc.)
    console.log('📧 [ALERT] Sending alert:', alert);
  }

  // Enhanced analytics methods
  getPerformanceTrends(): PerformanceTrend[] {
    return Array.from(this.trends.values());
  }

  getAnomalies(operation?: string): AnomalyDetection[] {
    if (operation) {
      return this.anomalies.filter(a => a.operation === operation);
    }
    return this.anomalies;
  }

  getPredictions(operation?: string): PerformancePrediction[] {
    if (operation) {
      const prediction = this.predictions.get(operation);
      return prediction ? [prediction] : [];
    }
    return Array.from(this.predictions.values());
  }

  getPerformanceInsights(): any {
    const totalOperations = this.metrics.length;
    const successfulOperations = this.metrics.filter(m => m.metadata.success !== false).length;
    const errorRate = totalOperations > 0 ? (totalOperations - successfulOperations) / totalOperations : 0;
    
    const recentMetrics = this.metrics.slice(-100);
    const averageDuration = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length 
      : 0;

    const slowOperations = recentMetrics.filter(m => m.duration > 1000).length;
    const verySlowOperations = recentMetrics.filter(m => m.duration > 5000).length;

    // Calculate performance score
    let performanceScore = 100;
    if (errorRate > 0.1) performanceScore -= 30;
    if (errorRate > 0.05) performanceScore -= 15;
    if (slowOperations > 10) performanceScore -= 20;
    if (verySlowOperations > 5) performanceScore -= 25;
    if (averageDuration > 1000) performanceScore -= 10;

    performanceScore = Math.max(0, Math.min(100, performanceScore));

    return {
      totalOperations,
      successfulOperations,
      errorRate,
      averageDuration,
      slowOperations,
      verySlowOperations,
      performanceScore,
      trends: this.getPerformanceTrends(),
      anomalies: this.getAnomalies(),
      predictions: this.getPredictions(),
      lastOperation: this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : undefined,
    };
  }

  // Existing methods
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getRecentMetrics(operation?: string, limit: number = 100): PerformanceMetric[] {
    let filtered = this.metrics;
    if (operation) {
      filtered = filtered.filter(m => m.operation === operation);
    }
    return filtered.slice(-limit);
  }

  getRecentTrends(period: number = 24): any {
    const cutoff = new Date(Date.now() - period * 60 * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    
    const operations = [...new Set(recentMetrics.map(m => m.operation))];
    const trends = operations.map(op => {
      const opMetrics = recentMetrics.filter(m => m.operation === op);
      const avgDuration = opMetrics.reduce((sum, m) => sum + m.duration, 0) / opMetrics.length;
      const count = opMetrics.length;
      
      return {
        operation: op,
        averageDuration: avgDuration,
        count,
        lastExecuted: opMetrics[opMetrics.length - 1]?.timestamp,
      };
    });

    return trends.sort((a, b) => b.count - a.count);
  }

  exportMetrics(): any {
    return {
      metrics: this.metrics,
      trends: this.getPerformanceTrends(),
      anomalies: this.getAnomalies(),
      predictions: this.getPredictions(),
      insights: this.getPerformanceInsights(),
    };
  }

  reset(): void {
    this.metrics = [];
    this.trends.clear();
    this.anomalies = [];
    this.predictions.clear();
  }

  setAlertThreshold(type: string, value: number): void {
    this.alertThresholds.set(type, value);
  }

  getAlertThresholds(): Map<string, number> {
    return new Map(this.alertThresholds);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
