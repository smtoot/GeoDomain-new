import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const alerts = await getAlertsData();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      alerts
    });
  } catch (error) {
    console.error('Alerts API error:', error);
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
