import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params;
    const body = await request.json();
    const { acknowledgedBy = 'admin' } = body;

    // In a real system, you'd update the alert status in a database
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} acknowledged by ${acknowledgedBy}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
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
