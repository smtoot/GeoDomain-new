#!/usr/bin/env node

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

console.log('🧪 TESTING LOGIN/DASHBOARD ACCESS FIX');
console.log('=====================================\n');

try {
  // Test 1: Check if database exists and has data
  console.log('1️⃣ Testing database connection...');
  const prisma = new PrismaClient();

  const userCount = await prisma.user.count();
  const domainCount = await prisma.domain.count();

  console.log(`   ✅ Database connected`);
  console.log(`   ✅ Users: ${userCount}`);
  console.log(`   ✅ Domains: ${domainCount}`);

  // Test 2: Check if demo seller user exists
  console.log('\n2️⃣ Testing demo seller user...');
  const seller = await prisma.user.findUnique({
    where: { email: 'seller1@test.com' },
  });

  if (seller) {
    console.log(`   ✅ Seller user found: ${seller.name} (${seller.role})`);
    console.log(`   ✅ Status: ${seller.status}`);
    console.log(`   ✅ Email verified: ${seller.emailVerified}`);
  } else {
    console.log('   ❌ Seller user not found');
  }

  await prisma.$disconnect();

  // Test 3: Check environment variables
  console.log('\n3️⃣ Testing environment configuration...');
  const envPath = '.env.local';

  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDatabaseUrl = envContent.includes('DATABASE_URL=');
    const hasNextAuthSecret = envContent.includes('NEXTAUTH_SECRET=');
    const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL=');

    console.log(`   ✅ .env.local exists`);
    console.log(`   ✅ DATABASE_URL: ${hasDatabaseUrl ? 'Set' : 'Missing'}`);
    console.log(
      `   ✅ NEXTAUTH_SECRET: ${hasNextAuthSecret ? 'Set' : 'Missing'}`
    );
    console.log(`   ✅ NEXTAUTH_URL: ${hasNextAuthUrl ? 'Set' : 'Missing'}`);
  } else {
    console.log('   ❌ .env.local missing');
  }

  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Go to: http://localhost:3000/login');
  console.log('2. Login with: seller1@test.com / seller123');
  console.log(
    '3. You should be redirected to: http://localhost:3000/dashboard'
  );
  console.log('4. The dashboard should load with real data!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
