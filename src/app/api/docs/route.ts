import { NextRequest, NextResponse } from 'next/server';
import { openApiDocument } from '@/lib/openapi';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(openApiDocument);
  } catch (error) {
    console.error('Error generating OpenAPI document:', error);
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    );
  }
}
