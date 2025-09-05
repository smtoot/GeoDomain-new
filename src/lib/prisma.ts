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
    console.log('🔍 Prisma Query:', e.query);
    console.log('⏱️  Duration:', e.duration + 'ms');
  });

  prisma.$on('error', (e) => {
    console.error('❌ Prisma Error:', e.message);
    console.error('🔍 Target:', e.target);
    console.error('📝 Timestamp:', e.timestamp);
  });

  prisma.$on('warn', (e) => {
    console.warn('⚠️  Prisma Warning:', e.message);
  });
}

// Enhanced connection test function
export async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database query test successful:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown function
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
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
