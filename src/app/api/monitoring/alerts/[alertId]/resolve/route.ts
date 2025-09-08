import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const { alertId } = params;

    // In a real system, you'd update the alert status in a database
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: `Alert ${alertId} resolved`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Resolve alert error:', error);
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
