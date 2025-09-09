import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { cacheManager } from '@/lib/cache';
import { databaseManager } from '@/lib/database/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    const period = searchParams.get('period') || '60'; // Default to 60 minutes

    // Get enhanced performance insights
    const performanceInsights = performanceMonitor.getPerformanceInsights();
    
    // Get cache statistics
    const cacheStats = cacheManager.getStats();
    
    // Get database connection status
    const dbConnection = await databaseManager.checkConnection();
    
    // Get recent trends
    const recentTrends = performanceMonitor.getRecentTrends(parseInt(period));
    
    // Get enhanced analytics data
    const trends = performanceMonitor.getPerformanceTrends();
    const anomalies = performanceMonitor.getAnomalies();
    const predictions = performanceMonitor.getPredictions();

    const response = {
      timestamp: new Date().toISOString(),
      performance: {
        overall: performanceInsights,
        recent: recentTrends,
        trends,
        anomalies,
        predictions,
      },
      cache: {
        ...cacheStats,
        hitRate: cacheStats.size > 0 ? Math.round((cacheStats.size / cacheStats.max) * 100) : 0,
      },
      database: dbConnection,
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch performance statistics',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    switch (action) {
      case 'reset':
        performanceMonitor.reset();
        return NextResponse.json({ 
          message: 'Performance monitor reset successfully',
          timestamp: new Date().toISOString(),
        });
        
      case 'clear-cache':
        cacheManager.clear();
        return NextResponse.json({ 
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString(),
        });
        
      case 'warmup-cache':
        await databaseManager.warmupCache();
        return NextResponse.json({ 
          message: 'Cache warmup completed',
          timestamp: new Date().toISOString(),
        });
        
      case 'optimize-db':
        await databaseManager.optimize();
        return NextResponse.json({ 
          message: 'Database optimization completed',
          timestamp: new Date().toISOString(),
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error performing performance action:', error);
    return NextResponse.json(
      { 
        error: 'Failed to perform performance action',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
