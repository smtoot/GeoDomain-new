import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const insights = await getInsightsData();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      insights
    });
  } catch (error) {
    console.error('Insights API error:', error);
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
