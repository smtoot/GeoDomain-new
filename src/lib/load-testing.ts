import { performanceMonitor } from './performance-monitor';

export interface LoadTestResult {
  testName: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  concurrentUsers: number;
  details: {
    endpoint: string;
    method: string;
    payload?: any;
    headers?: Record<string, string>;
  };
}

export interface LoadTestConfig {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: any;
  headers?: Record<string, string>;
  concurrentUsers: number;
  totalRequests: number;
  rampUpTime: number; // seconds
  testDuration: number; // seconds
  thinkTime: number; // milliseconds between requests
}

export class LoadTester {
  private static instance: LoadTester;
  private isRunning: boolean = false;
  private results: LoadTestResult[] = [];

  private constructor() {}

  static getInstance(): LoadTester {
    if (!LoadTester.instance) {
      LoadTester.instance = new LoadTester();
    }
    return LoadTester.instance;
  }

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    if (this.isRunning) {
      throw new Error('Load test already running');
    }

    this.isRunning = true;
    const startTime = new Date();
    const results: any[] = [];
    const errors: any[] = [];

    console.log(`🚀 Starting load test: ${config.endpoint}`);
    console.log(`📊 Config: ${config.concurrentUsers} users, ${config.totalRequests} requests`);

    try {
      // Create worker promises for concurrent users
      const workers = Array.from({ length: config.concurrentUsers }, (_, i) =>
        this.createWorker(config, i, results, errors)
      );

      // Wait for all workers to complete
      await Promise.all(workers);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Calculate statistics
      const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
      const successfulRequests = results.length;
      const failedRequests = errors.length;
      const totalRequests = successfulRequests + failedRequests;

      const result: LoadTestResult = {
        testName: `Load Test - ${config.endpoint}`,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        minResponseTime: responseTimes[0] || 0,
        maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
        p95ResponseTime: this.calculatePercentile(responseTimes, 95),
        p99ResponseTime: this.calculatePercentile(responseTimes, 99),
        requestsPerSecond: (totalRequests / duration) * 1000,
        errorRate: failedRequests / totalRequests,
        startTime,
        endTime,
        duration,
        concurrentUsers: config.concurrentUsers,
        details: {
          endpoint: config.endpoint,
          method: config.method,
          payload: config.payload,
          headers: config.headers,
        },
      };

      this.results.push(result);
      this.logResults(result);
      return result;

    } finally {
      this.isRunning = false;
    }
  }

  private async createWorker(
    config: LoadTestConfig,
    workerId: number,
    results: any[],
    errors: any[]
  ): Promise<void> {
    const requestsPerWorker = Math.ceil(config.totalRequests / config.concurrentUsers);
    const delayBetweenRequests = config.thinkTime;

    for (let i = 0; i < requestsPerWorker; i++) {
      if (!this.isRunning) break;

      try {
        const startTime = performance.now();
        const response = await this.makeRequest(config);
        const responseTime = performance.now() - startTime;

        results.push({
          workerId,
          requestId: i,
          responseTime,
          status: response.status,
          success: response.ok,
        });

        // Record performance metric
        performanceMonitor.recordMetric(
          `load_test.${config.method.toLowerCase()}.${config.endpoint.replace(/\//g, '_')}`,
          responseTime,
          {
            workerId,
            requestId: i,
            status: response.status,
            success: response.ok,
            testType: 'load_test',
          }
        );

        // Add delay between requests
        if (delayBetweenRequests > 0) {
          await this.sleep(delayBetweenRequests);
        }

      } catch (error) {
        errors.push({
          workerId,
          requestId: i,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private async makeRequest(config: LoadTestConfig): Promise<Response> {
    const url = config.endpoint.startsWith('http') 
      ? config.endpoint 
      : `http://localhost:3000${config.endpoint}`;

    const options: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    if (config.payload && config.method !== 'GET') {
      options.body = JSON.stringify(config.payload);
    }

    return fetch(url, options);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)] || 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logResults(result: LoadTestResult): void {
    console.log('\n📊 Load Test Results:');
    console.log(`✅ Test: ${result.testName}`);
    console.log(`📈 Total Requests: ${result.totalRequests}`);
    console.log(`✅ Successful: ${result.successfulRequests}`);
    console.log(`❌ Failed: ${result.failedRequests}`);
    console.log(`⚡ RPS: ${result.requestsPerSecond.toFixed(2)}`);
    console.log(`⏱️  Avg Response Time: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`📊 P95: ${result.p95ResponseTime.toFixed(2)}ms`);
    console.log(`📊 P99: ${result.p99ResponseTime.toFixed(2)}ms`);
    console.log(`🚨 Error Rate: ${(result.errorRate * 100).toFixed(2)}%`);
    console.log(`⏰ Duration: ${(result.duration / 1000).toFixed(2)}s`);
    console.log(`👥 Concurrent Users: ${result.concurrentUsers}`);
  }

  async runStressTest(config: LoadTestConfig): Promise<LoadTestResult[]> {
    console.log('🔥 Starting stress test...');
    
    const results: LoadTestResult[] = [];
    let currentUsers = 1;
    const maxUsers = config.concurrentUsers * 2; // Double the load

    while (currentUsers <= maxUsers && this.isRunning) {
      const stressConfig = { ...config, concurrentUsers: currentUsers };
      
      try {
        const result = await this.runLoadTest(stressConfig);
        results.push(result);

        // Check if we've hit breaking point
        if (result.errorRate > 0.1 || result.averageResponseTime > 5000) {
          console.log(`🚨 Breaking point reached at ${currentUsers} concurrent users`);
          break;
        }

        currentUsers = Math.min(currentUsers * 1.5, maxUsers);
        await this.sleep(2000); // Wait between stress levels

      } catch (error) {
        console.error(`❌ Stress test failed at ${currentUsers} users:`, error);
        break;
      }
    }

    return results;
  }

  async runSpikeTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log('📈 Starting spike test...');
    
    // Normal load
    const normalConfig = { ...config, concurrentUsers: Math.max(1, Math.floor(config.concurrentUsers * 0.1)) };
    await this.runLoadTest(normalConfig);
    
    // Spike load
    const spikeConfig = { ...config, concurrentUsers: config.concurrentUsers * 3 };
    const spikeResult = await this.runLoadTest(spikeConfig);
    
    // Return to normal
    await this.runLoadTest(normalConfig);
    
    return spikeResult;
  }

  async runEnduranceTest(config: LoadTestConfig): Promise<LoadTestResult[]> {
    console.log('🏃 Starting endurance test...');
    
    const results: LoadTestResult[] = [];
    const testDuration = config.testDuration || 300; // 5 minutes default
    const startTime = Date.now();
    
    while (Date.now() - startTime < testDuration * 1000 && this.isRunning) {
      const result = await this.runLoadTest(config);
      results.push(result);
      
      // Wait before next iteration
      await this.sleep(10000); // 10 seconds between iterations
    }
    
    return results;
  }

  getResults(): LoadTestResult[] {
    return [...this.results];
  }

  clearResults(): void {
    this.results = [];
  }

  stop(): void {
    this.isRunning = false;
    console.log('🛑 Load testing stopped');
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const loadTester = LoadTester.getInstance();

// Predefined test scenarios
export const loadTestScenarios = {
  // Light load - typical user behavior
  light: {
    concurrentUsers: 5,
    totalRequests: 100,
    rampUpTime: 10,
    testDuration: 60,
    thinkTime: 1000,
  },

  // Medium load - peak hours
  medium: {
    concurrentUsers: 20,
    totalRequests: 500,
    rampUpTime: 30,
    testDuration: 120,
    thinkTime: 500,
  },

  // Heavy load - stress testing
  heavy: {
    concurrentUsers: 50,
    totalRequests: 1000,
    rampUpTime: 60,
    testDuration: 300,
    thinkTime: 200,
  },

  // Spike load - sudden traffic increase
  spike: {
    concurrentUsers: 100,
    totalRequests: 2000,
    rampUpTime: 10,
    testDuration: 180,
    thinkTime: 100,
  },
};
