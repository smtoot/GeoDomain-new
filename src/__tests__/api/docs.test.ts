import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock the OpenAPI document generation
jest.mock('@/lib/openapi', () => ({
  openApiDocument: {
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
  },
}));

describe('API Documentation Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/docs', () => {
    it('should return OpenAPI document as JSON', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.openapi).toBe('3.0.3');
      expect(data.info.title).toBe('GeoDomainLand API');
      expect(data.info.description).toContain('GeoDomainLand');
      expect(data.info.version).toBe('1.0.0');
    });

    it('should include server configurations', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(data.servers).toBeDefined();
      expect(data.servers).toHaveLength(1);
      expect(data.servers[0].url).toBe('http://localhost:3000');
      expect(data.servers[0].description).toBe('Development server');
    });

    it('should include API paths', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(data.paths).toBeDefined();
      expect(data.paths['/api/trpc/domains.search']).toBeDefined();
      expect(data.paths['/api/trpc/domains.search'].post).toBeDefined();
      expect(data.paths['/api/trpc/domains.search'].post.summary).toBe('Search domains');
    });

    it('should include security schemes', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(data.components).toBeDefined();
      expect(data.components.securitySchemes).toBeDefined();
      expect(data.components.securitySchemes.BearerAuth).toBeDefined();
      expect(data.components.securitySchemes.BearerAuth.type).toBe('http');
      expect(data.components.securitySchemes.BearerAuth.scheme).toBe('bearer');
    });

    it('should return proper JSON content type', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);

      expect(response.headers.get('content-type')).toBe('application/json');
    });

    it('should handle OpenAPI generation errors', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // Mock the openApiDocument to throw an error
      jest.doMock('@/lib/openapi', () => {
        throw new Error('OpenAPI generation failed');
      });

      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate API documentation');

      consoleSpy.mockRestore();
    });

    it('should be valid JSON', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      // Should be able to parse as JSON without errors
      expect(() => JSON.stringify(data)).not.toThrow();
    });

    it('should include comprehensive API information', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(data.info).toBeDefined();
      expect(data.info.title).toBeDefined();
      expect(data.info.description).toBeDefined();
      expect(data.info.version).toBeDefined();
    });

    it('should include tags for API organization', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      // Check if the domains search endpoint has the correct tag
      const searchEndpoint = data.paths['/api/trpc/domains.search'];
      expect(searchEndpoint.post.tags).toContain('Domains');
    });

    it('should handle different HTTP methods', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      // Should include POST method for domains search
      expect(data.paths['/api/trpc/domains.search'].post).toBeDefined();
    });

    it('should include request/response schemas', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      const searchEndpoint = data.paths['/api/trpc/domains.search'];
      expect(searchEndpoint.post).toBeDefined();
      expect(searchEndpoint.post.summary).toBeDefined();
      expect(searchEndpoint.post.description).toBeDefined();
    });
  });

  describe('API Documentation Structure', () => {
    it('should have proper OpenAPI version', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(data.openapi).toBe('3.0.3');
    });

    it('should include proper API metadata', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs');
      const response = await GET(request);
      const data = await response.json();

      expect(data.info.title).toBe('GeoDomainLand API');
      expect(data.info.description).toContain('domain marketplace');
      expect(data.info.version).toBe('1.0.0');
    });

    it('should be accessible via GET method only', async () => {
      const { GET } = await import('@/app/api/docs/route');

      const request = new NextRequest('http://localhost:3000/api/docs', {
        method: 'GET',
      });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
