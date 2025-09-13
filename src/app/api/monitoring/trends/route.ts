import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const trends = await getTrendsData();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      trends
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

async function getTrendsData() {
  // Get recent domain creation trends
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [domainsThisWeek, domainsThisMonth, totalDomains] = await Promise.all([
    prisma.domain.count({
      where: { createdAt: { gte: lastWeek } }
    }),
    prisma.domain.count({
      where: { createdAt: { gte: lastMonth } }
    }),
    prisma.domain.count()
  ]);

  const [usersThisWeek, usersThisMonth, totalUsers] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: lastWeek } }
    }),
    prisma.user.count({
      where: { createdAt: { gte: lastMonth } }
    }),
    prisma.user.count()
  ]);

  const [inquiriesThisWeek, inquiriesThisMonth, totalInquiries] = await Promise.all([
    prisma.inquiry.count({
      where: { createdAt: { gte: lastWeek } }
    }),
    prisma.inquiry.count({
      where: { createdAt: { gte: lastMonth } }
    }),
    prisma.inquiry.count()
  ]);

  const trends = [];

  // Domain creation trend
  if (domainsThisWeek > 0) {
    const weeklyGrowth = ((domainsThisWeek / Math.max(domainsThisMonth - domainsThisWeek, 1)) - 1) * 100;
    trends.push({
      metric: 'domains.created',
      trend: weeklyGrowth > 10 ? 'increasing' : weeklyGrowth < -10 ? 'decreasing' : 'stable',
      changePercent: weeklyGrowth,
      averageValue: domainsThisWeek / 7, // daily average
      forecast: {
        nextValue: domainsThisWeek * 1.1,
        confidence: 0.85,
        trend: weeklyGrowth > 0 ? 'up' : 'down'
      }
    });
  }

  // User registration trend
  if (usersThisWeek > 0) {
    const weeklyGrowth = ((usersThisWeek / Math.max(usersThisMonth - usersThisWeek, 1)) - 1) * 100;
    trends.push({
      metric: 'users.registered',
      trend: weeklyGrowth > 10 ? 'increasing' : weeklyGrowth < -10 ? 'decreasing' : 'stable',
      changePercent: weeklyGrowth,
      averageValue: usersThisWeek / 7,
      forecast: {
        nextValue: usersThisWeek * 1.05,
        confidence: 0.75,
        trend: weeklyGrowth > 0 ? 'up' : 'down'
      }
    });
  }

  // Inquiry trend
  if (inquiriesThisWeek > 0) {
    const weeklyGrowth = ((inquiriesThisWeek / Math.max(inquiriesThisMonth - inquiriesThisWeek, 1)) - 1) * 100;
    trends.push({
      metric: 'inquiries.created',
      trend: weeklyGrowth > 10 ? 'increasing' : weeklyGrowth < -10 ? 'decreasing' : 'stable',
      changePercent: weeklyGrowth,
      averageValue: inquiriesThisWeek / 7,
      forecast: {
        nextValue: inquiriesThisWeek * 1.2,
        confidence: 0.65,
        trend: weeklyGrowth > 0 ? 'up' : 'down'
      }
    });
  }

  return trends;
}
