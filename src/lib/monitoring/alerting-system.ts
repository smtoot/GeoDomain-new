import { performanceMonitor } from './performance-monitor';
import { cacheManager } from '../cache';
import { databaseOptimizer } from './database-optimizer';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'error' | 'cache' | 'database' | 'system';
  condition: 'threshold' | 'trend' | 'anomaly' | 'composite';
  metric: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';
  value: number;
  duration: number; // seconds to maintain condition before alerting
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  enabled: boolean;
  cooldown: number; // seconds between alerts
  lastTriggered?: Date;
}

export interface AlertChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'console';
  config: Record<string, any>;
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export interface AlertNotification {
  channel: AlertChannel;
  alert: Alert;
  message: string;
  timestamp: Date;
}

export class AlertingSystem {
  private static instance: AlertingSystem;
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, AlertChannel> = new Map();
  private alerts: Alert[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }

  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }

  private initializeDefaultRules(): void {
    // Performance alerts
    this.addRule({
      id: 'perf-response-time',
      name: 'High Response Time',
      description: 'Alert when average response time exceeds threshold',
      type: 'performance',
      condition: 'threshold',
      metric: 'averageResponseTime',
      operator: 'gt',
      value: 1000, // 1 second
      duration: 60, // 1 minute
      severity: 'medium',
      channels: ['console'],
      enabled: true,
      cooldown: 300, // 5 minutes
    });

    this.addRule({
      id: 'perf-error-rate',
      name: 'High Error Rate',
      description: 'Alert when error rate exceeds threshold',
      type: 'performance',
      condition: 'threshold',
      metric: 'errorRate',
      operator: 'gt',
      value: 0.05, // 5%
      duration: 120, // 2 minutes
      severity: 'high',
      channels: ['console'],
      enabled: true,
      cooldown: 180, // 3 minutes
    });

    // Cache alerts
    this.addRule({
      id: 'cache-hit-rate',
      name: 'Low Cache Hit Rate',
      description: 'Alert when cache hit rate drops below threshold',
      type: 'cache',
      condition: 'threshold',
      metric: 'cacheHitRate',
      operator: 'lt',
      value: 0.7, // 70%
      duration: 300, // 5 minutes
      severity: 'medium',
      channels: ['console'],
      enabled: true,
      cooldown: 600, // 10 minutes
    });

    // Database alerts
    this.addRule({
      id: 'db-slow-queries',
      name: 'Slow Database Queries',
      description: 'Alert when slow query count increases',
      type: 'database',
      condition: 'trend',
      metric: 'slowQueries',
      operator: 'gt',
      value: 5,
      duration: 180, // 3 minutes
      severity: 'medium',
      channels: ['console'],
      enabled: true,
      cooldown: 300, // 5 minutes
    });

    // System alerts
    this.addRule({
      id: 'sys-memory-usage',
      name: 'High Memory Usage',
      description: 'Alert when memory usage exceeds threshold',
      type: 'system',
      condition: 'threshold',
      metric: 'memoryUsage',
      operator: 'gt',
      value: 0.8, // 80%
      duration: 60, // 1 minute
      severity: 'high',
      channels: ['console'],
      enabled: true,
      cooldown: 180, // 3 minutes
    });
  }

  private initializeDefaultChannels(): void {
    this.addChannel({
      id: 'console',
      name: 'Console Logging',
      type: 'console',
      config: {},
      enabled: true,
    });

    this.addChannel({
      id: 'email',
      name: 'Email Notifications',
      type: 'email',
      config: {
        smtp: {
          host: process.env.SMTP_HOST || 'localhost',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        },
        recipients: process.env.ALERT_EMAILS?.split(',') || [],
      },
      enabled: false,
    });

    this.addChannel({
      id: 'webhook',
      name: 'Webhook Notifications',
      type: 'webhook',
      config: {
        url: process.env.ALERT_WEBHOOK_URL || '',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      enabled: false,
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    this.rules.set(ruleId, { ...rule, ...updates });
    return true;
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  addChannel(channel: AlertChannel): void {
    this.channels.set(channel.id, channel);
  }

  updateChannel(channelId: string, updates: Partial<AlertChannel>): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    this.channels.set(channelId, { ...channel, ...updates });
    return true;
  }

  removeChannel(channelId: string): boolean {
    return this.channels.delete(channelId);
  }

  getChannels(): AlertChannel[] {
    return Array.from(this.channels.values());
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.checkRules();
    }, 10000); // Check every 10 seconds

    console.log('🚨 Alerting system monitoring started');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('🛑 Alerting system monitoring stopped');
  }

  private async checkRules(): Promise<void> {
    const performanceInsights = performanceMonitor.getPerformanceInsights();
    const cacheStats = cacheManager.getStats();
    const dbMetrics = databaseOptimizer.getMetrics();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.lastTriggered && 
          Date.now() - rule.lastTriggered.getTime() < rule.cooldown * 1000) {
        continue;
      }

      const shouldAlert = await this.evaluateRule(rule, {
        performance: performanceInsights,
        cache: cacheStats,
        database: dbMetrics,
      });

      if (shouldAlert) {
        await this.triggerAlert(rule, {
          performance: performanceInsights,
          cache: cacheStats,
          database: dbMetrics,
        });
      }
    }
  }

  private async evaluateRule(rule: AlertRule, context: any): Promise<boolean> {
    try {
      let metricValue: number;
      let currentValue: number;

      switch (rule.type) {
        case 'performance':
          metricValue = context.performance[rule.metric] || 0;
          break;
        case 'cache':
          metricValue = context.cache[rule.metric] || 0;
          break;
        case 'database':
          metricValue = context.database[rule.metric] || 0;
          break;
        case 'system':
          metricValue = this.getSystemMetric(rule.metric);
          break;
        default:
          return false;
      }

      // Evaluate condition
      const conditionMet = this.evaluateCondition(metricValue, rule.operator, rule.value);
      
      if (conditionMet) {
        // Check if condition has been maintained for the required duration
        // For now, we'll trigger immediately. In production, you'd want to track state over time
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      return false;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  private getSystemMetric(metric: string): number {
    switch (metric) {
      case 'memoryUsage':
        const memUsage = process.memoryUsage();
        return memUsage.heapUsed / memUsage.heapTotal;
      case 'cpuUsage':
        // This would require more sophisticated CPU monitoring
        return 0.5; // Placeholder
      default:
        return 0;
    }
  }

  private async triggerAlert(rule: AlertRule, context: any): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, context),
      details: context,
      timestamp: new Date(),
      acknowledged: false,
      resolved: false,
    };

    this.alerts.push(alert);
    rule.lastTriggered = new Date();

    // Send notifications
    await this.sendNotifications(alert, rule);

    console.log(`🚨 Alert triggered: ${rule.name} - ${alert.message}`);
  }

  private generateAlertMessage(rule: AlertRule, context: any): string {
    const timestamp = new Date().toLocaleString();
    
    switch (rule.type) {
      case 'performance':
        return `Performance alert: ${rule.metric} = ${context.performance[rule.metric]} (${rule.operator} ${rule.value}) at ${timestamp}`;
      case 'cache':
        return `Cache alert: ${rule.metric} = ${context.cache[rule.metric]} (${rule.operator} ${rule.value}) at ${timestamp}`;
      case 'database':
        return `Database alert: ${rule.metric} = ${context.database[rule.metric]} (${rule.operator} ${rule.value}) at ${timestamp}`;
      case 'system':
        return `System alert: ${rule.metric} = ${this.getSystemMetric(rule.metric)} (${rule.operator} ${rule.value}) at ${timestamp}`;
      default:
        return `Alert: ${rule.name} at ${timestamp}`;
    }
  }

  private async sendNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const channelId of rule.channels) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        console.error(`Failed to send notification via ${channel.type}:`, error);
      }
    }
  }

  private async sendNotification(channel: AlertChannel, alert: Alert): Promise<void> {
    const notification: AlertNotification = {
      channel,
      alert,
      message: alert.message,
      timestamp: new Date(),
    };

    switch (channel.type) {
      case 'console':
        this.logToConsole(notification);
        break;
      case 'email':
        await this.sendEmail(notification);
        break;
      case 'webhook':
        await this.sendWebhook(notification);
        break;
      case 'slack':
        await this.sendSlack(notification);
        break;
      default:
        console.warn(`Unknown notification channel type: ${channel.type}`);
    }
  }

  private logToConsole(notification: AlertNotification): void {
    const { alert, message } = notification;
    const emoji = this.getSeverityEmoji(alert.severity);
    
    console.log(`\n${emoji} ALERT: ${alert.ruleName}`);
    console.log(`📊 Severity: ${alert.severity.toUpperCase()}`);
    console.log(`📝 Message: ${message}`);
    console.log(`⏰ Time: ${alert.timestamp.toLocaleString()}`);
    console.log(`🆔 ID: ${alert.id}\n`);
  }

  private async sendEmail(notification: AlertNotification): Promise<void> {
    // This would integrate with a real email service
    console.log(`📧 Email notification would be sent: ${notification.message}`);
  }

  private async sendWebhook(notification: AlertNotification): Promise<void> {
    const { channel, alert } = notification;
    
    try {
      const response = await fetch(channel.config.url, {
        method: channel.config.method || 'POST',
        headers: channel.config.headers || {},
        body: JSON.stringify({
          alert: {
            id: alert.id,
            ruleName: alert.ruleName,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp.toISOString(),
          },
          context: alert.details,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook notification failed:', error);
      throw error;
    }
  }

  private async sendSlack(notification: AlertNotification): Promise<void> {
    // This would integrate with Slack API
    console.log(`💬 Slack notification would be sent: ${notification.message}`);
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      case 'low': return 'ℹ️';
      default: return '❓';
    }
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();
    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();
    return true;
  }

  getAlerts(filters?: {
    severity?: string;
    acknowledged?: boolean;
    resolved?: boolean;
    type?: string;
  }): Alert[] {
    let filtered = this.alerts;

    if (filters?.severity) {
      filtered = filtered.filter(a => a.severity === filters.severity);
    }
    if (filters?.acknowledged !== undefined) {
      filtered = filtered.filter(a => a.acknowledged === filters.acknowledged);
    }
    if (filters?.resolved !== undefined) {
      filtered = filtered.filter(a => a.resolved === filters.resolved);
    }
    if (filters?.type) {
      const rule = this.rules.get(filters.type);
      if (rule) {
        filtered = filtered.filter(a => a.ruleId === filters.type);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getAlertStats(): {
    total: number;
    acknowledged: number;
    resolved: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  } {
    const stats = {
      total: this.alerts.length,
      acknowledged: this.alerts.filter(a => a.acknowledged).length,
      resolved: this.alerts.filter(a => a.resolved).length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
    };

    // Count by severity
    this.alerts.forEach(alert => {
      stats.bySeverity[alert.severity] = (stats.bySeverity[alert.severity] || 0) + 1;
    });

    // Count by type
    this.alerts.forEach(alert => {
      const rule = this.rules.get(alert.ruleId);
      if (rule) {
        stats.byType[rule.type] = (stats.byType[rule.type] || 0) + 1;
      }
    });

    return stats;
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  isMonitoringActive(): boolean {
    return this.isMonitoring;
  }
}

// Export singleton instance
export const alertingSystem = AlertingSystem.getInstance();
