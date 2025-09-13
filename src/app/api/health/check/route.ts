import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth, testDatabaseConnection } from '@/lib/prisma';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health check
    const basicHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.npm_package_version || 'unknown',
    };

    // Database health check
    const dbHealth = await checkDatabaseHealth();
    
    // Test database connection
    const connectionTest = await testDatabaseConnection();
    
    // Get database statistics
    let dbStats = null;
    try {
      const [userCount, domainCount, inquiryCount] = await Promise.all([
        prisma.user.count(),
        prisma.domain.count(),
        prisma.inquiry.count(),
      ]);
      
      dbStats = {
        users: userCount,
        domains: domainCount,
        inquiries: inquiryCount,
      };
    } catch (error) {
      dbStats = { error: 'Failed to retrieve statistics' };
    }

    // Check environment variables
    const envCheck = {
      databaseUrl: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
      nextAuthUrl: process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing',
      nodeEnv: process.env.NODE_ENV || '❌ Missing',
    };

    // Overall health status
    const overallStatus = 
      dbHealth.status === 'healthy' && 
      connectionTest && 
      envCheck.databaseUrl === '✅ Set' 
        ? 'healthy' 
        : 'degraded';

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        basic: basicHealth,
        database: {
          ...dbHealth,
          connectionTest: connectionTest ? '✅ Success' : '❌ Failed',
          statistics: dbStats,
        },
        environment: envCheck,
      },
      recommendations: getRecommendations(dbHealth, connectionTest, envCheck),
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    return NextResponse.json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {
        basic: { status: 'failed' },
        database: { status: 'failed' },
        environment: { status: 'failed' },
      },
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

function getRecommendations(
  dbHealth: any, 
  connectionTest: boolean, 
  envCheck: any
): string[] {
  const recommendations: string[] = [];

  if (dbHealth.status !== 'healthy') {
    recommendations.push('Database connection issues detected. Check database file permissions and path.');
  }

  if (!connectionTest) {
    recommendations.push('Database connection test failed. Verify database file exists and is accessible.');
  }

  if (envCheck.databaseUrl === '❌ Missing') {
    recommendations.push('DATABASE_URL environment variable is missing. Check your .env files.');
  }

  if (envCheck.nextAuthSecret === '❌ Missing') {
    recommendations.push('NEXTAUTH_SECRET environment variable is missing. Generate a secure secret.');
  }

  if (envCheck.nextAuthUrl === '❌ Missing') {
    recommendations.push('NEXTAUTH_URL environment variable is missing. Set to your application URL.');
  }

  if (dbHealth.responseTime && dbHealth.responseTime > 1000) {
    recommendations.push('Database response time is slow. Consider optimizing queries or database configuration.');
  }

  if (recommendations.length === 0) {
    recommendations.push('All systems are operating normally.');
  }

  return recommendations;
}

// Add HEAD method for health check pings
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
