import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/security/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes((session.user as any).role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔍 Testing database connection and schema...');

    const results = {
      connection: false,
      existingTables: [] as string[],
      errors: [] as string[]
    };

    // Test database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      results.connection = true;
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      results.errors.push(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return NextResponse.json({ success: false, results });
    }

    // Check existing tables
    try {
      const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      `;
      results.existingTables = tables.map(t => t.tablename);
      console.log('✅ Found existing tables:', results.existingTables);
    } catch (error) {
      console.error('❌ Error checking existing tables:', error);
      results.errors.push(`Table check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test if our target tables exist
    const targetTables = ['domain_categories', 'us_states', 'us_cities'];
    const missingTables = targetTables.filter(table => !results.existingTables.includes(table));

    return NextResponse.json({
      success: true,
      results,
      targetTables,
      missingTables,
      needsMigration: missingTables.length > 0
    });

  } catch (error) {
    console.error('❌ Error during database test:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
