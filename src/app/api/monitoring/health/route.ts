import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const systemHealth = await getSystemHealthData();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...systemHealth
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function getSystemHealthData() {
  // Get system metrics
  const [userCount, domainCount, inquiryCount] = await Promise.all([
    prisma.user.count(),
    prisma.domain.count(),
    prisma.inquiry.count()
  ]);

  // Calculate health score based on various factors
  let healthScore = 100;
  
  if (domainCount === 0) healthScore -= 50;
  if (userCount === 0) healthScore -= 30;
  if (inquiryCount === 0 && userCount > 0) healthScore -= 10;

  // Get memory usage (simplified)
  const memUsage = process.memoryUsage();
  const memoryUsage = memUsage.heapUsed / memUsage.heapTotal;

  return {
    status: healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical',
    score: Math.max(0, healthScore),
    uptime: formatUptime(process.uptime()),
    memoryUsage: memoryUsage,
    cpuUsage: 0.23, // Placeholder - would need actual CPU monitoring
    activeConnections: 12, // Placeholder - would need actual connection monitoring
    metrics: {
      users: userCount,
      domains: domainCount,
      inquiries: inquiryCount,
      verificationRate: domainCount > 0 ? (await prisma.domain.count({ where: { status: 'VERIFIED' } })) / domainCount : 0
    }
  };
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
}
