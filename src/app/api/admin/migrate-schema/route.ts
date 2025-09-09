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

    console.log('🔧 Starting database schema migration...');

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

    // Create DomainCategory table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "domain_categories" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "description" TEXT NOT NULL,
          "examples" TEXT NOT NULL,
          "industries" TEXT NOT NULL,
          "enabled" BOOLEAN NOT NULL DEFAULT true,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      results.push('domain_categories table created');
      console.log('✅ Created domain_categories table');
    } catch (error) {
      console.error('❌ Error creating domain_categories table:', error);
      results.push(`domain_categories table error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create USState table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "us_states" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "abbreviation" TEXT NOT NULL UNIQUE,
          "population" INTEGER,
          "enabled" BOOLEAN NOT NULL DEFAULT true,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      results.push('us_states table created');
      console.log('✅ Created us_states table');
    } catch (error) {
      console.error('❌ Error creating us_states table:', error);
      results.push(`us_states table error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create USCity table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "us_cities" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "stateId" TEXT NOT NULL,
          "population" INTEGER,
          "enabled" BOOLEAN NOT NULL DEFAULT true,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL
        )
      `;
      results.push('us_cities table created');
      console.log('✅ Created us_cities table');
    } catch (error) {
      console.error('❌ Error creating us_cities table:', error);
      results.push(`us_cities table error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create indexes (these might fail if they already exist, which is fine)
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "domain_categories_name_idx" ON "domain_categories"("name")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "domain_categories_enabled_idx" ON "domain_categories"("enabled")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "us_states_name_idx" ON "us_states"("name")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "us_states_abbreviation_idx" ON "us_states"("abbreviation")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "us_states_enabled_idx" ON "us_states"("enabled")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "us_cities_name_idx" ON "us_cities"("name")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "us_cities_stateId_idx" ON "us_cities"("stateId")`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "us_cities_enabled_idx" ON "us_cities"("enabled")`;
      results.push('indexes created');
      console.log('✅ Created indexes');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      results.push(`indexes error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Create unique constraint for cities
    try {
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "us_cities_name_stateId_key" ON "us_cities"("name", "stateId")`;
      results.push('unique constraint created');
      console.log('✅ Created unique constraint');
    } catch (error) {
      console.error('❌ Error creating unique constraint:', error);
      results.push(`unique constraint error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Add foreign key constraint (this might fail if us_states doesn't exist yet)
    try {
      await prisma.$executeRaw`ALTER TABLE "us_cities" ADD CONSTRAINT "us_cities_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "us_states"("id") ON DELETE CASCADE ON UPDATE CASCADE`;
      results.push('foreign key constraint created');
      console.log('✅ Created foreign key constraint');
    } catch (error) {
      console.error('❌ Error creating foreign key constraint:', error);
      results.push(`foreign key constraint error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    console.log('✅ Database schema migration completed');

    return NextResponse.json({
      success: true,
      message: 'Database schema migration completed',
      results: results,
      tables: ['domain_categories', 'us_states', 'us_cities']
    });

  } catch (error) {
    console.error('❌ Error during database schema migration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to migrate database schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}