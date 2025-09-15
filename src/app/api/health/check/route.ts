import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cache } from '@/lib/cache/redis';
import { createSuccessResponse, createInternalServerError } from '@/lib/errors/api-errors';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Test database connection
    const dbStart = Date.now();
    const userCount = await prisma.user.count();
    const domainCount = await prisma.domain.count();
    const inquiryCount = await prisma.inquiry.count();
    const dbTime = Date.now() - dbStart;
    
    // Test Redis connection
    const redisStart = Date.now();
    await cache.set('health-check', 'ok', 10);
    const redisTest = await cache.get('health-check');
    await cache.del('health-check');
    const redisTime = Date.now() - redisStart;
    
    const totalTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        status: 'connected',
        responseTime: dbTime,
        statistics: {
          users: userCount,
          domains: domainCount,
          inquiries: inquiryCount,
        },
      },
      cache: {
        status: redisTest === 'ok' ? 'connected' : 'disconnected',
        responseTime: redisTime,
      },
      performance: {
        totalResponseTime: totalTime,
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
        },
      },
    };
    
    return NextResponse.json(createSuccessResponse(healthData, 'Health check successful'));
  } catch (error) {
    console.error('Health check failed:', error);
    
    const errorResponse = createInternalServerError('Health check failed');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}