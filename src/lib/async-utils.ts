// Enhanced async utilities for better async operation management

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff?: 'fixed' | 'exponential' | 'fibonacci';
  onRetry?: (attempt: number, error: Error) => void;
  shouldRetry?: (error: Error) => boolean;
}

export interface ConcurrencyOptions {
  maxConcurrent: number;
  timeout?: number;
  onTimeout?: () => void;
}

export interface BatchOptions {
  batchSize: number;
  delayBetweenBatches?: number;
  onProgress?: (completed: number, total: number) => void;
}

export interface AsyncResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
  attempts?: number;
}

// Default configurations
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  delay: 1000,
  backoff: 'exponential',
};

export const DEFAULT_CONCURRENCY_OPTIONS: ConcurrencyOptions = {
  maxConcurrent: 5,
  timeout: 30000,
};

export const DEFAULT_BATCH_OPTIONS: BatchOptions = {
  batchSize: 10,
  delayBetweenBatches: 100,
};

// Enhanced async utilities class
export class AsyncUtils {
  /**
   * Retries an async function with configurable options
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry this error
        if (config.shouldRetry && !config.shouldRetry(lastError)) {
          throw lastError;
        }
        
        // Call retry callback
        if (config.onRetry) {
          config.onRetry(attempt, lastError);
        }
        
        // If this is the last attempt, throw the error
        if (attempt === config.maxAttempts) {
          throw lastError;
        }
        
        // Calculate delay based on backoff strategy
        const delay = this.calculateDelay(config.delay, attempt, config.backoff);
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Executes multiple async functions with concurrency control
   */
  static async withConcurrency<T>(
    tasks: Array<() => Promise<T>>,
    options: Partial<ConcurrencyOptions> = {}
  ): Promise<T[]> {
    const config = { ...DEFAULT_CONCURRENCY_OPTIONS, ...options };
    const results: T[] = new Array(tasks.length);
    const running: Promise<void>[] = [];
    let completed = 0;
    
    for (let i = 0; i < tasks.length; i++) {
      const taskIndex = i;
      const task = tasks[i];
      
      // If we've reached max concurrency, wait for one to complete
      if (running.length >= config.maxConcurrent) {
        await Promise.race(running);
      }
      
      // Start the task
      const taskPromise = this.executeWithTimeout(task, config.timeout!)
        .then(result => {
          results[taskIndex] = result;
          completed++;
        })
        .catch(error => {
          // Handle timeout or other errors
          if (config.onTimeout) {
            config.onTimeout();
          }
          throw error;
        });
      
      running.push(taskPromise);
      
      // Remove completed tasks from running array
      running.splice(running.indexOf(taskPromise), 1);
    }
    
    // Wait for all remaining tasks to complete
    await Promise.all(running);
    
    return results;
  }

  /**
   * Processes items in batches with progress tracking
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: Partial<BatchOptions> = {}
  ): Promise<R[]> {
    const config = { ...DEFAULT_BATCH_OPTIONS, ...options };
    const results: R[] = [];
    const total = items.length;
    
    for (let i = 0; i < total; i += config.batchSize) {
      const batch = items.slice(i, i + config.batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      // Report progress
      if (config.onProgress) {
        config.onProgress(Math.min(i + config.batchSize, total), total);
      }
      
      // Add delay between batches if specified
      if (config.delayBetweenBatches && i + config.batchSize < total) {
        await this.sleep(config.delayBetweenBatches);
      }
    }
    
    return results;
  }

  /**
   * Creates a debounced async function
   */
  static debounceAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    delay: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let timeoutId: NodeJS.Timeout;
    let pendingPromise: Promise<ReturnType<T>> | null = null;
    
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // Clear existing timeout
      clearTimeout(timeoutId);
      
      // If there's a pending promise, wait for it
      if (pendingPromise) {
        await pendingPromise;
      }
      
      // Create new promise
      pendingPromise = new Promise<ReturnType<T>>((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await fn(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
          }
        }, delay);
      });
      
      return pendingPromise;
    };
  }

  /**
   * Creates a throttled async function
   */
  static throttleAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    limit: number
  ): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    let inThrottle = false;
    let lastResult: ReturnType<T> | null = null;
    
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!inThrottle) {
        inThrottle = true;
        lastResult = await fn(...args);
        
        setTimeout(() => {
          inThrottle = false;
        }, limit);
        
        return lastResult;
      } else {
        // Return last result if throttled
        if (lastResult !== null) {
          return lastResult;
        }
        
        // Wait for throttle to end and execute
        await this.sleep(limit);
        return this.throttleAsync(fn, limit)(...args);
      }
    };
  }

  /**
   * Executes a function with a timeout
   */
  static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timed out')), timeout);
    });
    
    return Promise.race([fn(), timeoutPromise]);
  }

  /**
   * Creates a promise that resolves after a delay
   */
  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calculates delay based on backoff strategy
   */
  private static calculateDelay(
    baseDelay: number,
    attempt: number,
    strategy: 'fixed' | 'exponential' | 'fibonacci' = 'fixed'
  ): number {
    switch (strategy) {
      case 'fixed':
        return baseDelay;
      
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      
      case 'fibonacci':
        return baseDelay * this.fibonacci(attempt);
      
      default:
        return baseDelay;
    }
  }

  /**
   * Calculates Fibonacci number
   */
  private static fibonacci(n: number): number {
    if (n <= 1) return 1;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }

  /**
   * Creates a pool of async workers
   */
  static createWorkerPool<T, R>(
    worker: (item: T) => Promise<R>,
    poolSize: number = 5
  ) {
    const queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: Error) => void }> = [];
    const workers: Promise<void>[] = [];
    
    // Start workers
    for (let i = 0; i < poolSize; i++) {
      workers.push(this.workerLoop());
    }
    
    async function workerLoop(): Promise<void> {
      while (true) {
        const task = queue.shift();
        if (!task) {
          await AsyncUtils.sleep(100); // Wait for work
          continue;
        }
        
        try {
          const result = await worker(task.item);
          task.resolve(result);
        } catch (error) {
          task.reject(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
    
    return {
      async process(item: T): Promise<R> {
        return new Promise<R>((resolve, reject) => {
          queue.push({ item, resolve, reject });
        });
      },
      
      async shutdown(): Promise<void> {
        // Wait for all workers to finish
        await Promise.all(workers);
      }
    };
  }

  /**
   * Retries with exponential backoff and jitter
   */
  static async retryWithJitter<T>(
    fn: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: Error;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === config.maxAttempts) {
          throw lastError;
        }
        
        // Calculate delay with jitter
        const baseDelay = config.delay * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 0.1 * baseDelay; // 10% jitter
        const delay = baseDelay + jitter;
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }

  /**
   * Creates a circuit breaker pattern
   */
  static createCircuitBreaker<T>(
    fn: (...args: any[]) => Promise<T>,
    options: {
      failureThreshold: number;
      resetTimeout: number;
      monitorInterval: number;
    } = {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitorInterval: 10000,
    }
  ) {
    let failures = 0;
    let lastFailureTime = 0;
    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    
    const reset = () => {
      failures = 0;
      state = 'CLOSED';
    };
    
    const open = () => {
      state = 'OPEN';
      lastFailureTime = Date.now();
    };
    
    const halfOpen = () => {
      state = 'HALF_OPEN';
    };
    
    // Monitor circuit state
    setInterval(() => {
      if (state === 'OPEN' && Date.now() - lastFailureTime > options.resetTimeout) {
        halfOpen();
      }
    }, options.monitorInterval);
    
    return async (...args: any[]): Promise<T> => {
      if (state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN');
      }
      
      try {
        const result = await fn(...args);
        
        if (state === 'HALF_OPEN') {
          reset();
        }
        
        return result;
      } catch (error) {
        failures++;
        
        if (failures >= options.failureThreshold) {
          open();
        }
        
        throw error;
      }
    };
  }
}

// Utility functions for common async patterns
export const asyncUtils = {
  /**
   * Waits for a condition to be true
   */
  async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 10000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await AsyncUtils.sleep(interval);
    }
    
    throw new Error('Condition timeout exceeded');
  },

  /**
   * Creates a promise that can be resolved/rejected externally
   */
  createDeferred<T>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  } {
    let resolve: (value: T) => void;
    let reject: (error: Error) => void;
    
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    return { promise, resolve: resolve!, reject: reject! };
  },

  /**
   * Executes functions in sequence
   */
  async sequence<T>(
    functions: Array<() => Promise<T>>
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (const fn of functions) {
      results.push(await fn());
    }
    
    return results;
  },

  /**
   * Executes functions in parallel with error handling
   */
  async parallelWithErrors<T>(
    functions: Array<() => Promise<T>>
  ): Promise<Array<{ success: boolean; data?: T; error?: Error }>> {
    const results = await Promise.allSettled(
      functions.map(fn => fn())
    );
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return { success: true, data: result.value };
      } else {
        return { success: false, error: result.reason };
      }
    });
  },
};

// Export the main class and utilities
export default AsyncUtils;
