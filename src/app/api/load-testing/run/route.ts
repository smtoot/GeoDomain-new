import { NextRequest, NextResponse } from 'next/server';
import { loadTester } from '@/lib/load-testing';

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();
    
    // Validate configuration
    if (!config.endpoint || !config.method || !config.concurrentUsers || !config.totalRequests) {
      return NextResponse.json(
        { error: 'Invalid configuration. Missing required fields.' },
        { status: 400 }
      );
    }

    // Check if test is already running
    if (loadTester.isTestRunning()) {
      return NextResponse.json(
        { error: 'Load test already running. Please wait for completion or stop the current test.' },
        { status: 409 }
      );
    }

    // Run the load test
    const result = await loadTester.runLoadTest(config);
    
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Load testing error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run load test',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const results = loadTester.getResults();
    const isRunning = loadTester.isTestRunning();
    
    return NextResponse.json({
      isRunning,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching load test status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch load test status',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
