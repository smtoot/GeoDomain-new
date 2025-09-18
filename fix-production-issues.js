#!/usr/bin/env node

/**
 * Production Issues Fix Script
 * 
 * This script addresses two critical production issues:
 * 1. No domains showing on the public site
 * 2. Demo users not working for authentication
 * 
 * Root causes:
 * - Production database is not seeded
 * - Environment variables may be missing
 * - Database connection issues
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkProductionIssues() {
  console.log('🔍 Checking production database status...\n');

  try {
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Check user count
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);

    // Check domain count
    const domainCount = await prisma.domain.count();
    console.log(`🌐 Total domains in database: ${domainCount}`);

    // Check demo users specifically
    const demoUsers = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'seller1@test.com',
            'buyer1@test.com',
            'admin@geodomainland.com'
          ]
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true
      }
    });

    console.log(`\n👥 Demo users found: ${demoUsers.length}`);
    demoUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - Status: ${user.status}`);
    });

    // Check domains with public visibility
    const publicDomains = await prisma.domain.findMany({
      where: {
        status: 'VERIFIED'
      },
      select: {
        id: true,
        name: true,
        price: true,
        status: true,
        isFeatured: true
      }
    });

    console.log(`\n🌍 Public domains found: ${publicDomains.length}`);
    if (publicDomains.length > 0) {
      publicDomains.slice(0, 5).forEach(domain => {
        console.log(`  - ${domain.name} - $${domain.price} - ${domain.status}`);
      });
      if (publicDomains.length > 5) {
        console.log(`  ... and ${publicDomains.length - 5} more`);
      }
    }

    // Check environment variables
    console.log('\n🔧 Environment Variables Check:');
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL'
    ];

    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`  ✅ ${envVar}: ${value.substring(0, 20)}...`);
      } else {
        console.log(`  ❌ ${envVar}: NOT SET`);
      }
    });

    return {
      userCount,
      domainCount,
      demoUsersCount: demoUsers.length,
      publicDomainsCount: publicDomains.length,
      hasRequiredEnvVars: requiredEnvVars.every(envVar => process.env[envVar])
    };

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function fixProductionIssues() {
  console.log('🔧 Fixing production issues...\n');

  try {
    await prisma.$connect();

    // 1. Ensure demo users exist and are properly configured
    console.log('👥 Creating/updating demo users...');
    
    const demoUsers = [
      {
        email: 'seller1@test.com',
        name: 'Demo Seller 1',
        role: 'SELLER',
        password: 'seller123'
      },
      {
        email: 'buyer1@test.com',
        name: 'Demo Buyer 1',
        role: 'BUYER',
        password: 'buyer123'
      },
      {
        email: 'admin@geodomainland.com',
        name: 'Demo Admin',
        role: 'ADMIN',
        password: 'admin123'
      }
    ];

    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          status: 'VERIFIED',
          emailVerified: new Date()
        },
        create: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          status: 'VERIFIED',
          emailVerified: new Date()
        }
      });
      
      console.log(`  ✅ ${userData.email} (${userData.role})`);
    }

    // 2. Ensure domains exist and are public
    console.log('\n🌐 Creating/updating demo domains...');
    
    const demoDomains = [
      {
        name: 'usahotels.com',
        price: 2500,
        category: 'HOSPITALITY',
        state: 'California',
        city: 'Los Angeles',
        description: 'Premium domain for US hotel business'
      },
      {
        name: 'texasrestaurants.com',
        price: 1800,
        category: 'FOOD_AND_BEVERAGE',
        state: 'Texas',
        city: 'Houston',
        description: 'Great domain for Texas restaurant chain'
      },
      {
        name: 'floridarealestate.com',
        price: 3200,
        category: 'REAL_ESTATE',
        state: 'Florida',
        city: 'Miami',
        description: 'Perfect for Florida real estate business'
      },
      {
        name: 'newyorklawyers.com',
        price: 2800,
        category: 'LEGAL_SERVICES',
        state: 'New York',
        city: 'New York',
        description: 'Ideal for New York law firm'
      },
      {
        name: 'californiatech.com',
        price: 4500,
        category: 'TECHNOLOGY',
        state: 'California',
        city: 'San Francisco',
        description: 'Premium tech domain for California startups'
      }
    ];

    // Get the first seller to assign domains to
    const seller = await prisma.user.findFirst({
      where: { role: 'SELLER' }
    });

    if (!seller) {
      throw new Error('No seller found to assign domains to');
    }

    for (const domainData of demoDomains) {
      await prisma.domain.upsert({
        where: { name: domainData.name },
        update: {
          price: domainData.price,
          category: domainData.category,
          state: domainData.state,
          city: domainData.city,
          description: domainData.description,
          status: 'VERIFIED'
        },
        create: {
          name: domainData.name,
          price: domainData.price,
          category: domainData.category,
          state: domainData.state,
          city: domainData.city,
          description: domainData.description,
          status: 'VERIFIED',
          ownerId: seller.id
        }
      });
      
      console.log(`  ✅ ${domainData.name} - $${domainData.price}`);
    }

    console.log('\n🎉 Production issues fixed!');
    console.log('\n📋 Demo Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Admin Account:');
    console.log('  Email: admin@geodomainland.com | Password: admin123');
    console.log('\n🏪 Seller Account:');
    console.log('  Email: seller1@test.com | Password: seller123');
    console.log('\n🛒 Buyer Account:');
    console.log('  Email: buyer1@test.com | Password: buyer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Fix failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Production Issues Diagnostic & Fix Tool\n');
  
  // Check current status
  const status = await checkProductionIssues();
  
  if (!status) {
    console.log('❌ Cannot proceed - database connection failed');
    process.exit(1);
  }

  console.log('\n📊 Current Status Summary:');
  console.log(`  Users: ${status.userCount}`);
  console.log(`  Domains: ${status.domainCount}`);
  console.log(`  Demo Users: ${status.demoUsersCount}`);
  console.log(`  Public Domains: ${status.publicDomainsCount}`);
  console.log(`  Environment Variables: ${status.hasRequiredEnvVars ? '✅' : '❌'}`);

  // Determine if fixes are needed
  const needsFixes = status.demoUsersCount < 3 || status.publicDomainsCount < 5;

  if (needsFixes) {
    console.log('\n🔧 Issues detected - applying fixes...');
    await fixProductionIssues();
  } else {
    console.log('\n✅ No issues detected - production is healthy!');
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Deploy this fix to production');
  console.log('2. Test demo user login');
  console.log('3. Verify domains appear on public site');
  console.log('4. Check that inquiries and deals work properly');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkProductionIssues, fixProductionIssues };
