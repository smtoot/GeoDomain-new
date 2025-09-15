import { describe, it, expect, jest } from '@jest/globals';

// Mock the tRPC OpenAPI generation
jest.mock('trpc-openapi', () => ({
  generateOpenApiDocument: jest.fn().mockReturnValue({
    openapi: '3.0.3',
    info: {
      title: 'GeoDomainLand API',
      description: 'Comprehensive API for GeoDomainLand domain marketplace platform',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {
      '/api/trpc/domains.search': {
        post: {
          summary: 'Search domains',
          description: 'Search for domains with filtering options',
          tags: ['Domains'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    filters: { type: 'object' },
                    limit: { type: 'number' },
                    offset: { type: 'number' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array' },
                      pagination: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  }),
}));

// Mock the app router
jest.mock('@/server/api/root', () => ({
  appRouter: {
    domains: {
      search: {
        _def: {
          meta: {
            openapi: {
              method: 'POST',
              path: '/domains/search',
              tags: ['Domains'],
              summary: 'Search domains',
            },
          },
        },
      },
    },
  },
}));

describe('OpenAPI Documentation', () => {
  describe('OpenAPI Document Generation', () => {
    it('should generate OpenAPI document', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument).toBeDefined();
      expect(openApiDocument.openapi).toBe('3.0.3');
      expect(openApiDocument.info.title).toBe('GeoDomainLand API');
      expect(openApiDocument.info.description).toContain('GeoDomainLand');
      expect(openApiDocument.info.version).toBe('1.0.0');
    });

    it('should include server configurations', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.servers).toBeDefined();
      expect(openApiDocument.servers).toHaveLength(2);
      expect(openApiDocument.servers[0].url).toBe('http://localhost:3000');
      expect(openApiDocument.servers[1].url).toBe('https://geo-domain-new.vercel.app');
    });

    it('should include security schemes', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.components?.securitySchemes).toBeDefined();
      expect(openApiDocument.components?.securitySchemes?.BearerAuth).toBeDefined();
      expect(openApiDocument.components?.securitySchemes?.SessionAuth).toBeDefined();
    });

    it('should include API tags', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.tags).toBeDefined();
      expect(openApiDocument.tags).toHaveLength(9);
      
      const tagNames = openApiDocument.tags?.map(tag => tag.name);
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Domains');
      expect(tagNames).toContain('Users');
      expect(tagNames).toContain('Inquiries');
      expect(tagNames).toContain('Dashboard');
      expect(tagNames).toContain('Admin');
      expect(tagNames).toContain('Search');
      expect(tagNames).toContain('Verification');
      expect(tagNames).toContain('Health');
    });

    it('should include contact information', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.info.contact).toBeDefined();
      expect(openApiDocument.info.contact?.name).toBe('GeoDomainLand API Support');
      expect(openApiDocument.info.contact?.email).toBe('support@geodomainland.com');
      expect(openApiDocument.info.contact?.url).toBe('https://geodomainland.com/support');
    });

    it('should include license information', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.info.license).toBeDefined();
      expect(openApiDocument.info.license?.name).toBe('MIT');
      expect(openApiDocument.info.license?.url).toBe('https://opensource.org/licenses/MIT');
    });
  });

  describe('OpenAPI JSON Export', () => {
    it('should export OpenAPI document as JSON', async () => {
      const { openApiJson } = await import('@/lib/openapi');
      
      expect(openApiJson).toBeDefined();
      expect(typeof openApiJson).toBe('string');
      
      const parsed = JSON.parse(openApiJson);
      expect(parsed.openapi).toBe('3.0.3');
      expect(parsed.info.title).toBe('GeoDomainLand API');
    });

    it('should be valid JSON', async () => {
      const { openApiJson } = await import('@/lib/openapi');
      
      expect(() => JSON.parse(openApiJson)).not.toThrow();
    });

    it('should be properly formatted', async () => {
      const { openApiJson } = await import('@/lib/openapi');
      
      // Should be formatted with 2-space indentation
      expect(openApiJson).toContain('\n  ');
      expect(openApiJson).toContain('\n    ');
    });
  });

  describe('Environment Configuration', () => {
    it('should use environment variables for configuration', async () => {
      const originalEnv = process.env.NEXTAUTH_URL;
      
      process.env.NEXTAUTH_URL = 'https://test.example.com';
      
      // Re-import to get fresh configuration
      jest.resetModules();
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.servers[0].url).toBe('https://test.example.com');
      
      // Restore original environment
      process.env.NEXTAUTH_URL = originalEnv;
    });

    it('should fallback to localhost when NEXTAUTH_URL is not set', async () => {
      const originalEnv = process.env.NEXTAUTH_URL;
      delete process.env.NEXTAUTH_URL;
      
      // Re-import to get fresh configuration
      jest.resetModules();
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.servers[0].url).toBe('http://localhost:3000');
      
      // Restore original environment
      process.env.NEXTAUTH_URL = originalEnv;
    });
  });

  describe('API Paths', () => {
    it('should include domain search endpoint', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.paths).toBeDefined();
      expect(openApiDocument.paths['/api/trpc/domains.search']).toBeDefined();
      
      const searchEndpoint = openApiDocument.paths['/api/trpc/domains.search'];
      expect(searchEndpoint.post).toBeDefined();
      expect(searchEndpoint.post?.summary).toBe('Search domains');
      expect(searchEndpoint.post?.tags).toContain('Domains');
    });

    it('should include request body schema', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      const searchEndpoint = openApiDocument.paths['/api/trpc/domains.search'];
      const requestBody = searchEndpoint.post?.requestBody;
      
      expect(requestBody).toBeDefined();
      expect(requestBody?.required).toBe(true);
      expect(requestBody?.content?.['application/json']).toBeDefined();
    });

    it('should include response schemas', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      const searchEndpoint = openApiDocument.paths['/api/trpc/domains.search'];
      const responses = searchEndpoint.post?.responses;
      
      expect(responses).toBeDefined();
      expect(responses?.['200']).toBeDefined();
      expect(responses?.['200']?.description).toBe('Successful response');
    });
  });

  describe('Documentation Metadata', () => {
    it('should include comprehensive API description', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.info.description).toContain('Comprehensive API');
      expect(openApiDocument.info.description).toContain('domain marketplace');
    });

    it('should include proper versioning', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.info.version).toBe('1.0.0');
    });

    it('should include docs URL', async () => {
      const { openApiDocument } = await import('@/lib/openapi');
      
      expect(openApiDocument.info.docsUrl).toBe('/api/docs');
    });
  });
});
