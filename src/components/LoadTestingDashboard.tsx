'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import { 
  Play, 
  Square, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Users, 
  Zap,
  Activity,
  Target,
  Gauge,
  LineChart,
  Loader2
} from 'lucide-react';
import { loadTestScenarios, LoadTestConfig, LoadTestResult } from '@/lib/load-testing';

export default function LoadTestingDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<LoadTestResult[]>([]);
  const [config, setConfig] = useState<LoadTestConfig>({
    endpoint: '/api/trpc/domains.getAll',
    method: 'GET',
    concurrentUsers: 10,
    totalRequests: 100,
    rampUpTime: 30,
    testDuration: 120,
    thinkTime: 500,
  });

  const [customConfig, setCustomConfig] = useState<LoadTestConfig>({
    endpoint: '/api/trpc/domains.getAll',
    method: 'GET',
    concurrentUsers: 5,
    totalRequests: 50,
    rampUpTime: 10,
    testDuration: 60,
    thinkTime: 1000,
  });

  const runLoadTest = async (testConfig: LoadTestConfig) => {
    setIsRunning(true);
    setCurrentTest('Load Test');
    setProgress(0);

    try {
      const response = await fetch('/api/load-testing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testConfig),
      });

      if (!response.ok) {
        throw new Error('Failed to start load test');
      }

      // Simulate progress updates
      const interval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 10, 90));
      }, 1000);

      // Wait for test completion
      const result = await response.json();
      clearInterval(interval);
      setProgress(100);

      // Add result to list
      setResults(prev => [result, ...prev]);

    } catch (error) {
      console.error('Load test failed:', error);
    } finally {
      setIsRunning(false);
      setCurrentTest('');
      setProgress(0);
    }
  };

  const runScenario = (scenario: keyof typeof loadTestScenarios) => {
    const scenarioConfig = loadTestScenarios[scenario];
    const testConfig = { ...scenarioConfig, endpoint: config.endpoint, method: config.method };
    runLoadTest(testConfig);
  };

  const stopTest = async () => {
    try {
      await fetch('/api/load-testing/stop', { method: 'POST' });
      setIsRunning(false);
      setCurrentTest('');
      setProgress(0);
    } catch (error) {
      console.error('Failed to stop test:', error);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusColor = (result: LoadTestResult) => {
    if (result.errorRate > 0.1) return 'bg-red-100 text-red-800 border-red-200';
    if (result.errorRate > 0.05) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (result.averageResponseTime > 1000) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getPerformanceScore = (result: LoadTestResult) => {
    let score = 100;
    
    // Deduct points for errors
    score -= result.errorRate * 50;
    
    // Deduct points for slow response times
    if (result.averageResponseTime > 1000) score -= 20;
    if (result.averageResponseTime > 2000) score -= 30;
    
    // Deduct points for high P95
    if (result.p95ResponseTime > 2000) score -= 15;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Load Testing Dashboard</h2>
          <p className="text-muted-foreground">
            Test system performance under various load conditions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Test Running
            </Badge>
          )}
          <Button onClick={clearResults} variant="outline" size="sm">
            Clear Results
          </Button>
        </div>
      </div>

      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={config.endpoint}
                onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                placeholder="/api/trpc/domains.getAll"
              />
            </div>
            <div>
              <Label htmlFor="method">HTTP Method</Label>
              <Select
                value={config.method}
                onValueChange={(value: 'GET' | 'POST' | 'PUT' | 'DELETE') => 
                  setConfig(prev => ({ ...prev, method: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="concurrentUsers">Concurrent Users</Label>
              <Input
                id="concurrentUsers"
                type="number"
                value={config.concurrentUsers}
                onChange={(e) => setConfig(prev => ({ ...prev, concurrentUsers: parseInt(e.target.value) || 1 }))}
                min="1"
                max="1000"
              />
            </div>
            <div>
              <Label htmlFor="totalRequests">Total Requests</Label>
              <Input
                id="totalRequests"
                type="number"
                value={config.totalRequests}
                onChange={(e) => setConfig(prev => ({ ...prev, totalRequests: parseInt(e.target.value) || 1 }))}
                min="1"
                max="10000"
              />
            </div>
            <div>
              <Label htmlFor="thinkTime">Think Time (ms)</Label>
              <Input
                id="thinkTime"
                type="number"
                value={config.thinkTime}
                onChange={(e) => setConfig(prev => ({ ...prev, thinkTime: parseInt(e.target.value) || 0 }))}
                min="0"
                max="10000"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              onClick={() => runLoadTest(config)} 
              disabled={isRunning}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Custom Test
            </Button>
            {isRunning && (
              <Button onClick={stopTest} variant="destructive">
                <Square className="h-4 w-4 mr-2" />
                Stop Test
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Predefined Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Predefined Test Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <Button
                onClick={() => runScenario('light')}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                <Activity className="h-4 w-4 mr-2" />
                Light Load
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                5 users, 100 requests
              </p>
            </div>
            <div className="text-center">
              <Button
                onClick={() => runScenario('medium')}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Medium Load
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                20 users, 500 requests
              </p>
            </div>
            <div className="text-center">
              <Button
                onClick={() => runScenario('heavy')}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Heavy Load
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                50 users, 1000 requests
              </p>
            </div>
            <div className="text-center">
              <Button
                onClick={() => runScenario('spike')}
                disabled={isRunning}
                variant="outline"
                className="w-full"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Spike Load
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                100 users, 2000 requests
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Progress */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {currentTest} in Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Test Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No test results yet. Run a load test to see results here.
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getStatusColor(result)}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{result.testName}</h4>
                      <Badge variant="outline">
                        Score: {getPerformanceScore(result)}/100
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(result.startTime).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">Requests</div>
                      <div className="text-lg font-bold">{result.totalRequests}</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Success Rate</div>
                      <div className="text-lg font-bold">
                        {((1 - result.errorRate) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Avg Response</div>
                      <div className="text-lg font-bold">{result.averageResponseTime.toFixed(1)}ms</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">RPS</div>
                      <div className="text-lg font-bold">{result.requestsPerSecond.toFixed(1)}</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-muted-foreground">P95</div>
                      <div>{result.p95ResponseTime.toFixed(1)}ms</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">P99</div>
                      <div>{result.p99ResponseTime.toFixed(1)}ms</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Duration</div>
                      <div>{(result.duration / 1000).toFixed(1)}s</div>
                    </div>
                    <div>
                      <div className="font-medium text-muted-foreground">Users</div>
                      <div>{result.concurrentUsers}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
