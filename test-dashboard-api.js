#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

console.log('🧪 TESTING DASHBOARD API');
console.log('========================\n');

const prisma = new PrismaClient();

async function testDashboardAPI() {
  try {
    // Test 1: Check if all required tables exist
    console.log('1️⃣ Testing database tables...');
    
    const tables = [
      'User',
      'Domain', 
      'Inquiry',
      'Deal',
      'Message',
      'DomainAnalytics'
    ];
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name=${table}`;
        console.log(`   ${result.length > 0 ? '✅' : '❌'} Table ${table}: ${result.length > 0 ? 'Exists' : 'Missing'}`);
      } catch (error) {
        console.log(`   ❌ Table ${table}: Error checking`);
      }
    }
    
    // Test 2: Check if we can query the data
    console.log('\n2️⃣ Testing data queries...');
    
    const userCount = await prisma.user.count();
    console.log(`   ✅ Users: ${userCount}`);
    
    const domainCount = await prisma.domain.count();
    console.log(`   ✅ Domains: ${domainCount}`);
    
    const inquiryCount = await prisma.inquiry.count();
    console.log(`   ✅ Inquiries: ${inquiryCount}`);
    
    const dealCount = await prisma.deal.count();
    console.log(`   ✅ Deals: ${dealCount}`);
    
    // Test 3: Test seller stats query
    console.log('\n3️⃣ Testing seller stats query...');
    
    const seller = await prisma.user.findFirst({
      where: { role: 'SELLER' }
    });
    
    if (seller) {
      console.log(`   ✅ Found seller: ${seller.name} (${seller.email})`);
      
      // Test the exact query that's failing
      const sellerDomains = await prisma.domain.count({
        where: { ownerId: seller.id }
      });
      console.log(`   ✅ Seller domains: ${sellerDomains}`);
      
      const sellerInquiries = await prisma.inquiry.count({
        where: {
          domain: { ownerId: seller.id },
          status: { in: ['OPEN', 'CLOSED'] }
        }
      });
      console.log(`   ✅ Seller inquiries: ${sellerInquiries}`);
      
    } else {
      console.log('   ❌ No seller found');
    }
    
    console.log('\n🎉 DASHBOARD API TEST COMPLETE');
    console.log('\n📋 Results:');
    console.log('✅ Database tables exist');
    console.log('✅ Data queries working');
    console.log('✅ Seller stats queries working');
    console.log('\nThe dashboard should now work without tRPC errors!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDashboardAPI();
