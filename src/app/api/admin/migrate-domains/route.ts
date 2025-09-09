import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/security/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication and super admin role
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 401 }
      );
    }

    console.log('🔧 Starting domains table migration...');

    // Test database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return NextResponse.json(
        { error: 'Database connection failed', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

    const results = [];

    // Add new columns to domains table
    try {
      // Add stateId column
      await prisma.$executeRaw`
        ALTER TABLE "domains" 
        ADD COLUMN IF NOT EXISTS "stateId" TEXT
      `;
      results.push('Added stateId column to domains table');
      console.log('✅ Added stateId column');

      // Add cityId column
      await prisma.$executeRaw`
        ALTER TABLE "domains" 
        ADD COLUMN IF NOT EXISTS "cityId" TEXT
      `;
      results.push('Added cityId column to domains table');
      console.log('✅ Added cityId column');

      // Add categoryId column
      await prisma.$executeRaw`
        ALTER TABLE "domains" 
        ADD COLUMN IF NOT EXISTS "categoryId" TEXT
      `;
      results.push('Added categoryId column to domains table');
      console.log('✅ Added categoryId column');

    } catch (error) {
      console.error('❌ Error adding columns to domains table:', error);
      results.push(`Error adding columns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create indexes for the new columns
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "domains_stateId_idx" ON "domains"("stateId")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "domains_cityId_idx" ON "domains"("cityId")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "domains_categoryId_idx" ON "domains"("categoryId")`;
      results.push('Created indexes for new columns');
      console.log('✅ Created indexes');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      results.push(`Error creating indexes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Add foreign key constraints (only if the referenced tables exist)
    try {
      // Check if domain_categories table exists
      const categoryTableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'domain_categories'
        ) as exists
      `;

      if (categoryTableExists[0]?.exists) {
        await prisma.$executeRaw`
          ALTER TABLE "domains" 
          ADD CONSTRAINT IF NOT EXISTS "domains_categoryId_fkey" 
          FOREIGN KEY ("categoryId") REFERENCES "domain_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `;
        results.push('Added foreign key constraint for categoryId');
        console.log('✅ Added categoryId foreign key constraint');
      } else {
        results.push('Skipped categoryId foreign key - domain_categories table does not exist');
        console.log('⚠️ Skipped categoryId foreign key - domain_categories table does not exist');
      }

      // Check if us_states table exists
      const stateTableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'us_states'
        ) as exists
      `;

      if (stateTableExists[0]?.exists) {
        await prisma.$executeRaw`
          ALTER TABLE "domains" 
          ADD CONSTRAINT IF NOT EXISTS "domains_stateId_fkey" 
          FOREIGN KEY ("stateId") REFERENCES "us_states"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `;
        results.push('Added foreign key constraint for stateId');
        console.log('✅ Added stateId foreign key constraint');
      } else {
        results.push('Skipped stateId foreign key - us_states table does not exist');
        console.log('⚠️ Skipped stateId foreign key - us_states table does not exist');
      }

      // Check if us_cities table exists
      const cityTableExists = await prisma.$queryRaw<Array<{ exists: boolean }>>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'us_cities'
        ) as exists
      `;

      if (cityTableExists[0]?.exists) {
        await prisma.$executeRaw`
          ALTER TABLE "domains" 
          ADD CONSTRAINT IF NOT EXISTS "domains_cityId_fkey" 
          FOREIGN KEY ("cityId") REFERENCES "us_cities"("id") ON DELETE SET NULL ON UPDATE CASCADE
        `;
        results.push('Added foreign key constraint for cityId');
        console.log('✅ Added cityId foreign key constraint');
      } else {
        results.push('Skipped cityId foreign key - us_cities table does not exist');
        console.log('⚠️ Skipped cityId foreign key - us_cities table does not exist');
      }

    } catch (error) {
      console.error('❌ Error adding foreign key constraints:', error);
      results.push(`Error adding foreign keys: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('✅ Domains table migration completed');

    return NextResponse.json({
      success: true,
      message: 'Domains table migration completed successfully',
      results: results
    });

  } catch (error) {
    console.error('❌ Error during domains table migration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to migrate domains table',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
