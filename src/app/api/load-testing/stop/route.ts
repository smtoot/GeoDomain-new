import { NextRequest, NextResponse } from 'next/server';
import { loadTester } from '@/lib/performance/load-testing';

export async function POST(request: NextRequest) {
  try {
    // Stop the current load test
    loadTester.stop();
    
    return NextResponse.json({
      message: 'Load test stopped successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error stopping load test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to stop load test',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
