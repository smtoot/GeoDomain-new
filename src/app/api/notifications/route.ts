import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // This would typically fetch notifications from the database
    // For now, we'll return a placeholder response
    return NextResponse.json({
      success: true,
      notifications: [],
      message: 'Notifications endpoint working',
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { type, title, message, category, priority, options } = await request.json();

    // Validate required fields
    if (!type || !title || !message || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message, category' },
        { status: 400 }
      );
    }

    // Create notification
    createNotification(
      type,
      title,
      message,
      category,
      priority || 'medium',
      options
    );

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
    });
  } catch (error) {
    console.error('Notifications POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
