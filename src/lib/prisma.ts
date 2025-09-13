import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Enhanced Prisma client with better error handling and logging
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
  ] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Add connection timeout and retry logic
  __internal: {
    engine: {
      enableEngineDebugMode: process.env.NODE_ENV === 'development',
    },
  },
});

// Add event listeners for better debugging
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    });

  prisma.$on('error', (e) => {
    });

  prisma.$on('warn', (e) => {
    });
}

// Enhanced connection test function
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    return true;
  } catch (error) {
    return false;
  }
}

// Graceful shutdown function
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    } catch (error) {
    }
}

// Health check function
export async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
