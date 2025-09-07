import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Create the new tables using raw SQL
    const createTablesSQL = `
      -- Create DomainCategory table
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
      );

      -- Create USState table
      CREATE TABLE IF NOT EXISTS "us_states" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL UNIQUE,
        "abbreviation" TEXT NOT NULL UNIQUE,
        "population" INTEGER,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );

      -- Create USCity table
      CREATE TABLE IF NOT EXISTS "us_cities" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "stateId" TEXT NOT NULL,
        "population" INTEGER,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        FOREIGN KEY ("stateId") REFERENCES "us_states"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS "domain_categories_name_idx" ON "domain_categories"("name");
      CREATE INDEX IF NOT EXISTS "domain_categories_enabled_idx" ON "domain_categories"("enabled");
      CREATE INDEX IF NOT EXISTS "us_states_name_idx" ON "us_states"("name");
      CREATE INDEX IF NOT EXISTS "us_states_abbreviation_idx" ON "us_states"("abbreviation");
      CREATE INDEX IF NOT EXISTS "us_states_enabled_idx" ON "us_states"("enabled");
      CREATE INDEX IF NOT EXISTS "us_cities_name_idx" ON "us_cities"("name");
      CREATE INDEX IF NOT EXISTS "us_cities_stateId_idx" ON "us_cities"("stateId");
      CREATE INDEX IF NOT EXISTS "us_cities_enabled_idx" ON "us_cities"("enabled");

      -- Create unique constraint for cities
      CREATE UNIQUE INDEX IF NOT EXISTS "us_cities_name_stateId_key" ON "us_cities"("name", "stateId");
    `;

    // Execute the SQL
    await prisma.$executeRawUnsafe(createTablesSQL);

    console.log('✅ Database schema migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Database schema migration completed successfully',
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
