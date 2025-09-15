import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '@/server/api/root';

// Generate OpenAPI document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'GeoDomainLand API',
  description: 'Comprehensive API for GeoDomainLand domain marketplace platform',
  version: '1.0.0',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  docsUrl: '/api/docs',
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Domains',
      description: 'Domain management and search operations',
    },
    {
      name: 'Users',
      description: 'User profile and analytics endpoints',
    },
    {
      name: 'Inquiries',
      description: 'Domain inquiries and messaging system',
    },
    {
      name: 'Dashboard',
      description: 'Dashboard statistics and analytics',
    },
    {
      name: 'Admin',
      description: 'Administrative functions and user management',
    },
    {
      name: 'Search',
      description: 'Search functionality across the platform',
    },
    {
      name: 'Verification',
      description: 'Domain verification and validation',
    },
    {
      name: 'Health',
      description: 'System health and monitoring endpoints',
    },
  ],
  securitySchemes: {
    BearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'JWT token for authentication',
    },
    SessionAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'next-auth.session-token',
      description: 'Session token for authentication',
    },
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://geo-domain-new.vercel.app',
      description: 'Production server',
    },
  ],
  contact: {
    name: 'GeoDomainLand API Support',
    email: 'support@geodomainland.com',
    url: 'https://geodomainland.com/support',
  },
  license: {
    name: 'MIT',
    url: 'https://opensource.org/licenses/MIT',
  },
});

// Export the OpenAPI document as JSON
export const openApiJson = JSON.stringify(openApiDocument, null, 2);
