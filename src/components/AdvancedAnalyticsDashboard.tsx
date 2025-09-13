'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Brain, 
  Activity, 
  BarChart3, 
  Clock, 
  Target,
  Gauge,
  LineChart,
  RefreshCw
} from 'lucide-react';

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

interface AdvancedAnalytics {
  trends: PerformanceTrend[];
  anomalies: AnomalyDetection[];
  predictions: PerformancePrediction[];
  insights: {
    totalOperations: number;
    successfulOperations: number;
    errorRate: number;
    averageDuration: number;
    slowOperations: number;
    verySlowOperations: number;
    performanceScore: number;
  };
}

export default function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/performance/stats');
      const data = await response.json();

      // Transform the API response to match our expected structure
      const transformedData: AdvancedAnalytics = {
        trends: data.performance?.trends || [],
        anomalies: data.performance?.anomalies || [],
        predictions: data.performance?.predictions || [],
        insights: {
          totalOperations: data.performance?.overall?.totalOperations || 0,
          successfulOperations: data.performance?.overall?.totalOperations || 0,
          errorRate: data.performance?.overall?.errorRate || 0,
          averageDuration: data.performance?.overall?.averageDuration || 0,
          slowOperations: data.performance?.overall?.slowOperations || 0,
          verySlowOperations: data.performance?.overall?.verySlowOperations || 0,
          performanceScore: data.performance?.overall?.performanceScore || 100,
        },
      };

      setAnalytics(transformedData);
    } catch (error) {
      } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Safety check to ensure all required properties exist
  if (!analytics.insights || !analytics.trends || !analytics.anomalies || !analytics.predictions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">Data structure error</div>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'degrading':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600';
      case 'degrading':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Performance trends, anomaly detection, and predictive insights
          </p>
        </div>
        <Button onClick={fetchAnalytics} disabled={loading} variant="outline" size="sm">
          <BarChart3 className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {analytics.insights.totalOperations === 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-blue-600 font-medium mb-2">Getting Started with Performance Monitoring</div>
                  <div className="text-sm text-blue-600 mb-4">
                    The system is ready to monitor performance. Start using the application to generate performance data.
                  </div>
                  <Button onClick={fetchAnalytics} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check for Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Performance Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Performance Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                {analytics.insights.totalOperations === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl font-bold text-muted-foreground mb-2">No Data</div>
                    <div className="text-sm text-muted-foreground mb-4">
                      Start using the system to generate performance data
                    </div>
                    <Button onClick={fetchAnalytics} variant="outline" size="sm">
                      Refresh
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className={`text-6xl font-bold ${
                      analytics.insights.performanceScore >= 90 ? 'text-green-600' :
                      analytics.insights.performanceScore >= 70 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {analytics.insights.performanceScore}
                    </div>
                    <div className="text-2xl text-muted-foreground">/ 100</div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      {analytics.insights.performanceScore >= 90 ? 'Excellent Performance' :
                       analytics.insights.performanceScore >= 70 ? 'Good Performance' :
                       'Performance Issues Detected'}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.insights.totalOperations}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.insights.totalOperations === 0 ? 'No operations yet' : 'API calls tracked'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.insights.totalOperations > 0 
                    ? ((analytics.insights.successfulOperations / analytics.insights.totalOperations) * 100).toFixed(1)
                    : '0'
                  }%
                </div>
                <p className="text-xs text-muted-foreground">
                  Successful operations
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.insights.totalOperations === 0 ? 'N/A' : formatDuration(analytics.insights.averageDuration)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.insights.totalOperations === 0 ? 'No operations yet' : 'Per operation'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Slow Operations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.insights.slowOperations}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.insights.totalOperations === 0 ? 'No operations yet' : '&gt; 1 second'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Active Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.trends.length}</div>
                <p className="text-sm text-muted-foreground">
                  {analytics.insights.totalOperations === 0 ? 'No data available' : 'Performance trends detected'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Anomalies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{analytics.anomalies.length}</div>
                <p className="text-sm text-muted-foreground">
                  {analytics.insights.totalOperations === 0 ? 'No data available' : 'Issues detected'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.predictions.length}</div>
                <p className="text-sm text-muted-foreground">
                  {analytics.insights.totalOperations === 0 ? 'No data available' : 'AI insights available'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.insights.totalOperations === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">No Performance Data Available</div>
                  <div className="text-sm mb-4">Start using the application to generate performance data and trends.</div>
                  <Button onClick={fetchAnalytics} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check for Updates
                  </Button>
                </div>
              ) : analytics.trends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No trends detected yet. Continue using the system to generate trend data.
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(trend.trend)}
                        <div>
                          <div className="font-medium">{trend.operation}</div>
                          <div className="text-sm text-muted-foreground">
                            {trend.trend === 'improving' ? 'Performance improving' :
                             trend.trend === 'degrading' ? 'Performance degrading' :
                             'Performance stable'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getTrendColor(trend.trend)}`}>
                          {trend.changePercent > 0 ? '+' : ''}{trend.changePercent.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Confidence: {trend.confidence.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.insights.totalOperations === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">No Performance Data Available</div>
                  <div className="text-sm mb-4">Start using the application to generate performance data and anomaly detection.</div>
                  <Button onClick={fetchAnalytics} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check for Updates
                  </Button>
                </div>
              ) : analytics.anomalies.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No anomalies detected. System is performing normally.
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.anomalies.slice(0, 10).map((anomaly, index) => (
                    <div key={index} className={`p-4 border rounded-lg ${getSeverityColor(anomaly.severity)}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {anomaly.severity}
                          </Badge>
                          <div>
                            <div className="font-medium">{anomaly.operation}</div>
                            <div className="text-sm">{anomaly.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            {new Date(anomaly.timestamp).toLocaleTimeString()}
                          </div>
                          <div className="text-xs">
                            {formatDuration(anomaly.current)} vs {formatDuration(anomaly.baseline)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Performance Predictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.insights.totalOperations === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-lg font-medium mb-2">No Performance Data Available</div>
                  <div className="text-sm mb-4">Start using the application to generate performance data and predictive insights.</div>
                  <Button onClick={fetchAnalytics} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check for Updates
                  </Button>
                </div>
              ) : analytics.predictions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No predictions available yet. Continue using the system to generate predictive insights.
                </div>
              ) : (
                <div className="space-y-4">
                  {analytics.predictions.map((prediction, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium">{prediction.operation}</div>
                        <Badge variant="outline" className={getConfidenceColor(prediction.confidence)}>
                          {prediction.confidence.toFixed(0)}% confidence
                        </Badge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Predicted Duration</div>
                          <div className="text-lg font-bold">{formatDuration(prediction.predictedDuration)}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground">Recommendation</div>
                          <div className="text-sm">{prediction.recommendation}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium text-muted-foreground">Factors Considered</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {prediction.factors.map((factor, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
