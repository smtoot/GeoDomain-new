#!/usr/bin/env node

/**
 * Production Database Migration Script
 * This script migrates the production database to include wholesale tables
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Production Database Migration...');

// Check if we're in production environment
if (process.env.NODE_ENV !== 'production') {
  console.log('⚠️  This script should only be run in production environment');
  console.log('   Set NODE_ENV=production and DATABASE_URL to production database');
  process.exit(1);
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('   Please set DATABASE_URL to your production PostgreSQL connection string');
  process.exit(1);
}

console.log('✅ Environment check passed');
console.log('📊 Database URL:', process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@'));

try {
  // Step 1: Generate Prisma client
  console.log('\n📦 Step 1: Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Step 2: Push schema to production database
  console.log('\n🗄️  Step 2: Pushing schema to production database...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Schema pushed to production database');

  // Step 3: Seed production database with default data
  console.log('\n🌱 Step 3: Seeding production database...');
  execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' });
  console.log('✅ Production database seeded');

  // Step 4: Verify wholesale tables exist
  console.log('\n🔍 Step 4: Verifying wholesale tables...');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const userCount = await prisma.user.count();
    console.log(`✅ Users table: ${userCount} records`);

    const wholesaleConfigCount = await prisma.wholesaleConfig.count();
    console.log(`✅ WholesaleConfig table: ${wholesaleConfigCount} records`);

    const wholesaleDomainCount = await prisma.wholesaleDomain.count();
    console.log(`✅ WholesaleDomain table: ${wholesaleDomainCount} records`);

    const wholesaleSaleCount = await prisma.wholesaleSale.count();
    console.log(`✅ WholesaleSale table: ${wholesaleSaleCount} records`);

    await prisma.$disconnect();
    console.log('\n🎉 Production database migration completed successfully!');
    console.log('   All wholesale tables are now available in production.');
    
  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Ensure DATABASE_URL is correct');
  console.log('   2. Check database connection');
  console.log('   3. Verify Prisma schema is up to date');
  console.log('   4. Check database permissions');
  process.exit(1);
}
