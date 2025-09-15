import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import { AppRouter } from '@/server/api/root';

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class GeoDomainApiClient {
  private client: ReturnType<typeof createTRPCProxyClient<AppRouter>>;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    this.client = createTRPCProxyClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${this.config.baseUrl}/api/trpc`,
          headers: this.config.apiKey ? {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-API-Key': this.config.apiKey,
          } : {},
          fetch: (url, options) => {
            return fetch(url, {
              ...options,
              signal: AbortSignal.timeout(this.config.timeout!),
            });
          },
        }),
      ],
    });
  }

  /**
   * Domain operations
   */
  get domains() {
    return {
      /**
       * Search domains
       */
      search: async (params: {
        query: string;
        filters?: {
          category?: string;
          geographicScope?: string;
          minPrice?: number;
          maxPrice?: number;
        };
        limit?: number;
        offset?: number;
      }) => {
        try {
          const result = await this.client.domains.search.query(params);
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get domain by ID
       */
      getById: async (id: string) => {
        try {
          const result = await this.client.domains.getById.query({ id });
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Test domain endpoint
       */
      test: async () => {
        try {
          const result = await this.client.domains.test.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },
    };
  }

  /**
   * Dashboard operations
   */
  get dashboard() {
    return {
      /**
       * Get seller statistics
       */
      getSellerStats: async () => {
        try {
          const result = await this.client.dashboard.getSellerStats.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get buyer statistics
       */
      getBuyerStats: async () => {
        try {
          const result = await this.client.dashboard.getBuyerStats.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get seller activity
       */
      getSellerActivity: async () => {
        try {
          const result = await this.client.dashboard.getSellerActivity.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get buyer activity
       */
      getBuyerActivity: async () => {
        try {
          const result = await this.client.dashboard.getBuyerActivity.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },
    };
  }

  /**
   * API Key management
   */
  get apiKeys() {
    return {
      /**
       * Create new API key
       */
      create: async (params: {
        name: string;
        permissions: string[];
        rateLimit?: number;
        expiresAt?: Date;
      }) => {
        try {
          const result = await this.client.apiKeys.create.mutate(params);
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * List API keys
       */
      list: async () => {
        try {
          const result = await this.client.apiKeys.list.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Update API key
       */
      update: async (params: {
        id: string;
        name?: string;
        permissions?: string[];
        rateLimit?: number;
        expiresAt?: Date;
      }) => {
        try {
          const result = await this.client.apiKeys.update.mutate(params);
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Delete API key
       */
      delete: async (id: string) => {
        try {
          const result = await this.client.apiKeys.delete.mutate({ id });
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get API key usage
       */
      usage: async (id: string) => {
        try {
          const result = await this.client.apiKeys.usage.query({ id });
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get API key analytics
       */
      analytics: async () => {
        try {
          const result = await this.client.apiKeys.analytics.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get available permissions
       */
      permissions: async () => {
        try {
          const result = await this.client.apiKeys.permissions.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },
    };
  }

  /**
   * Performance monitoring
   */
  get performance() {
    return {
      /**
       * Get performance summary
       */
      summary: async () => {
        try {
          const result = await this.client.performance.summary.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },

      /**
       * Get system health
       */
      health: async () => {
        try {
          const result = await this.client.performance.health.query();
          return result;
        } catch (error) {
          throw this.handleError(error);
        }
      },
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/health/check`, {
        method: 'GET',
        headers: this.config.apiKey ? {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
        } : {},
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          status: data.data?.status || 'unknown',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get API documentation
   */
  async getDocumentation(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/docs`, {
        method: 'GET',
        headers: this.config.apiKey ? {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
        } : {},
        signal: AbortSignal.timeout(this.config.timeout!),
      });

      if (!response.ok) {
        throw new Error(`Failed to get documentation: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (error instanceof Error) {
      return error;
    }

    if (error?.data?.message) {
      return new Error(error.data.message);
    }

    if (error?.message) {
      return new Error(error.message);
    }

    return new Error('An unknown error occurred');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ApiClientConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiClientConfig {
    return { ...this.config };
  }
}

/**
 * Create a new API client instance
 */
export function createApiClient(config: ApiClientConfig): GeoDomainApiClient {
  return new GeoDomainApiClient(config);
}

/**
 * Default API client instance
 */
export const defaultApiClient = new GeoDomainApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

/**
 * Utility functions for common operations
 */
export const apiUtils = {
  /**
   * Retry a function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (i === maxRetries - 1) {
          throw lastError;
        }

        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  /**
   * Batch multiple API calls
   */
  async batch<T>(
    calls: Array<() => Promise<T>>,
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < calls.length; i += concurrency) {
      const batch = calls.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(call => call()));
      results.push(...batchResults);
    }

    return results;
  },

  /**
   * Validate API response
   */
  validateResponse<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error || 'API request failed');
    }

    if (response.data === undefined) {
      throw new Error('No data returned from API');
    }

    return response.data;
  },
};
