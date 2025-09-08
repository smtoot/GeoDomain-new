import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Consolidated monitoring API endpoint
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const format = url.searchParams.get('format');

    // Handle different monitoring actions
    switch (action) {
      case 'alerts':
        return await getAlerts();
      case 'trends':
        return await getTrends();
      case 'insights':
        return await getInsights();
      case 'health':
        return await getSystemHealth();
      case 'export':
        return await exportData(format || 'json');
      default:
        // Return comprehensive monitoring data by default
        return await getAllMonitoringData();
    }
  } catch (error) {
    console.error('Monitoring API error:', error);
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

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const body = await request.json();

    switch (action) {
      case 'acknowledge':
        return await acknowledgeAlert(body.alertId, body.acknowledgedBy);
      case 'resolve':
        return await resolveAlert(body.alertId);
      case 'start':
        return await startMonitoring();
      case 'stop':
        return await stopMonitoring();
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Monitoring API POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Get all monitoring data in one request
async function getAllMonitoringData() {
  const [alerts, trends, insights, systemHealth] = await Promise.all([
    getAlertsData(),
    getTrendsData(),
    getInsightsData(),
    getSystemHealthData()
  ]);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      alerts,
      trends,
      insights,
      systemHealth
    }
  });
}

// Get alerts data
async function getAlerts() {
  const alerts = await getAlertsData();
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    alerts
  });
}

async function getAlertsData() {
  // Get system metrics to generate realistic alerts
  const [userCount, domainCount, inquiryCount] = await Promise.all([
    prisma.user.count(),
    prisma.domain.count(),
    prisma.inquiry.count()
  ]);

  const alerts = [];

  // Generate alerts based on system state
  if (userCount === 0) {
    alerts.push({
      id: 'no-users',
      ruleName: 'No Users Found',
      severity: 'high',
      message: 'No users found in the system. This may indicate a data issue.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    });
  }

  if (domainCount === 0) {
    alerts.push({
      id: 'no-domains',
      ruleName: 'No Domains Found',
      severity: 'critical',
      message: 'No domains found in the system. This will prevent the marketplace from functioning.',
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    });
  }

  // Check for domains without categories
  const domainsWithoutCategories = await prisma.domain.count({
    where: { categoryId: null }
  });

  if (domainsWithoutCategories > 0) {
    alerts.push({
      id: 'domains-without-categories',
      ruleName: 'Domains Without Categories',
      severity: 'medium',
      message: `${domainsWithoutCategories} domains are missing category assignments.`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    });
  }

  // Check for domains without geographic data
  const domainsWithoutGeo = await prisma.domain.count({
    where: {
      AND: [
        { stateId: null },
        { cityId: null }
      ]
    }
  });

  if (domainsWithoutGeo > 0) {
    alerts.push({
      id: 'domains-without-geo',
      ruleName: 'Domains Without Geographic Data',
      severity: 'low',
      message: `${domainsWithoutGeo} domains are missing geographic assignments.`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false
    });
  }

  return alerts;
}

// Get trends data
async function getTrends() {
  const trends = await getTrendsData();
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    trends
  });
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

// Get insights data
async function getInsights() {
  const insights = await getInsightsData();
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    insights
  });
}

async function getInsightsData() {
  const insights = [];

  // Check domain distribution
  const totalDomains = await prisma.domain.count();
  const verifiedDomains = await prisma.domain.count({
    where: { status: 'VERIFIED' }
  });

  if (totalDomains > 0) {
    const verificationRate = (verifiedDomains / totalDomains) * 100;
    
    if (verificationRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Domain Verification Rate',
        description: `Only ${verificationRate.toFixed(1)}% of domains are verified. This may impact user trust.`,
        severity: 'medium',
        recommendation: 'Implement automated domain verification or manual review process',
        impact: 'User trust and marketplace credibility',
        effort: 'Medium - requires verification system implementation'
      });
    }
  }

  // Check category distribution
  const categoriesWithDomains = await prisma.domainCategory.findMany({
    where: {
      domains: {
        some: {}
      }
    },
    include: {
      _count: {
        select: { domains: true }
      }
    }
  });

  if (categoriesWithDomains.length > 0) {
    const maxDomains = Math.max(...categoriesWithDomains.map(c => c._count.domains));
    const minDomains = Math.min(...categoriesWithDomains.map(c => c._count.domains));
    
    if (maxDomains > minDomains * 5) {
      insights.push({
        type: 'optimization',
        title: 'Uneven Category Distribution',
        description: 'Some categories have significantly more domains than others, which may affect search balance.',
        severity: 'low',
        recommendation: 'Consider promoting underrepresented categories or rebalancing domain distribution',
        impact: 'Search result diversity and user experience',
        effort: 'Low - marketing and content strategy'
      });
    }
  }

  // Check geographic distribution
  const statesWithDomains = await prisma.uSState.findMany({
    where: {
      domains: {
        some: {}
      }
    },
    include: {
      _count: {
        select: { domains: true }
      }
    }
  });

  if (statesWithDomains.length < 10 && totalDomains > 50) {
    insights.push({
      type: 'trend',
      title: 'Limited Geographic Coverage',
      description: `Domains are concentrated in only ${statesWithDomains.length} states. Consider expanding geographic reach.`,
      severity: 'low',
      recommendation: 'Target domain acquisition in underrepresented states',
      impact: 'Market expansion and user base growth',
      effort: 'Medium - requires targeted acquisition strategy'
    });
  }

  return insights;
}

// Get system health data
async function getSystemHealth() {
  const systemHealth = await getSystemHealthData();
  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...systemHealth
  });
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

// Export data
async function exportData(format: string) {
  const data = await getAllMonitoringData();
  const exportData = await data.json();

  if (format === 'csv') {
    const csv = convertToCSV(exportData.data);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="monitoring-data-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  return NextResponse.json(exportData.data, {
    headers: {
      'Content-Disposition': `attachment; filename="monitoring-data-${new Date().toISOString().split('T')[0]}.json"`
    }
  });
}

// Alert management functions
async function acknowledgeAlert(alertId: string, acknowledgedBy: string) {
  // In a real system, you'd store this in a database
  // For now, we'll just return success
  return NextResponse.json({
    success: true,
    message: `Alert ${alertId} acknowledged by ${acknowledgedBy}`,
    timestamp: new Date().toISOString()
  });
}

async function resolveAlert(alertId: string) {
  // In a real system, you'd update the alert status in a database
  return NextResponse.json({
    success: true,
    message: `Alert ${alertId} resolved`,
    timestamp: new Date().toISOString()
  });
}

async function startMonitoring() {
  return NextResponse.json({
    success: true,
    message: 'Monitoring started',
    timestamp: new Date().toISOString()
  });
}

async function stopMonitoring() {
  return NextResponse.json({
    success: true,
    message: 'Monitoring stopped',
    timestamp: new Date().toISOString()
  });
}

// Utility functions
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  return `${days}d ${hours}h ${minutes}m`;
}

function convertToCSV(data: any): string {
  const headers = ['timestamp', 'type', 'metric', 'value'];
  const rows = [headers.join(',')];

  // Add alerts
  data.alerts.forEach((alert: any) => {
    rows.push([
      alert.timestamp,
      'alert',
      alert.ruleName,
      alert.message
    ].join(','));
  });

  // Add trends
  data.trends.forEach((trend: any) => {
    rows.push([
      new Date().toISOString(),
      'trend',
      trend.metric,
      trend.changePercent
    ].join(','));
  });

  // Add insights
  data.insights.forEach((insight: any) => {
    rows.push([
      new Date().toISOString(),
      'insight',
      insight.title,
      insight.description
    ].join(','));
  });

  return rows.join('\n');
}
