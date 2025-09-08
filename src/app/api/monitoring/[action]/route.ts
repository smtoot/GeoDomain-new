import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string } }
) {
  try {
    const { action } = params;

    switch (action) {
      case 'start':
        return await startMonitoring();
      case 'stop':
        return await stopMonitoring();
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use "start" or "stop".' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Monitoring control error:', error);
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

async function startMonitoring() {
  // In a real system, you'd start monitoring processes
  return NextResponse.json({
    success: true,
    message: 'Monitoring started',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
}

async function stopMonitoring() {
  // In a real system, you'd stop monitoring processes
  return NextResponse.json({
    success: true,
    message: 'Monitoring stopped',
    timestamp: new Date().toISOString(),
    status: 'inactive'
  });
}
