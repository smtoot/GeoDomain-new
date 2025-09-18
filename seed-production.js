#!/usr/bin/env node

/**
 * Production Database Seeding Script
 * 
 * This script seeds the production database with:
 * 1. Demo users (admin, seller, buyer accounts)
 * 2. Sample domains for public display
 * 3. Test inquiries and deals
 * 
 * Usage: node seed-production.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedProduction() {
  console.log('🌱 Seeding production database...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to production database');

    // 1. Create demo users
    console.log('\n👥 Creating demo users...');
    
    const demoUsers = [
      {
        email: 'admin@geodomainland.com',
        name: 'Demo Admin',
        role: 'ADMIN',
        password: 'admin123'
      },
      {
        email: 'seller1@test.com',
        name: 'Demo Seller 1',
        role: 'SELLER',
        password: 'seller123'
      },
      {
        email: 'seller2@test.com',
        name: 'Demo Seller 2',
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
        email: 'buyer2@test.com',
        name: 'Demo Buyer 2',
        role: 'BUYER',
        password: 'buyer123'
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
          status: 'ACTIVE',
          emailVerified: new Date()
        },
        create: {
          email: userData.email,
          name: userData.name,
          role: userData.role,
          password: hashedPassword,
          status: 'ACTIVE',
          emailVerified: new Date()
        }
      });
      
      console.log(`  ✅ ${userData.email} (${userData.role})`);
    }

    // 2. Get sellers for domain assignment
    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      take: 2
    });

    if (sellers.length === 0) {
      throw new Error('No sellers found to assign domains to');
    }

    // 3. Create demo domains
    console.log('\n🌐 Creating demo domains...');
    
    const demoDomains = [
      {
        name: 'usahotels.com',
        price: 2500,
        category: 'HOSPITALITY',
        state: 'California',
        city: 'Los Angeles',
        description: 'Premium domain for US hotel business - perfect for hotel chains and hospitality companies.',
        owner: sellers[0]
      },
      {
        name: 'texasrestaurants.com',
        price: 1800,
        category: 'FOOD_AND_BEVERAGE',
        state: 'Texas',
        city: 'Houston',
        description: 'Great domain for Texas restaurant chain - ideal for food service businesses.',
        owner: sellers[0]
      },
      {
        name: 'floridarealestate.com',
        price: 3200,
        category: 'REAL_ESTATE',
        state: 'Florida',
        city: 'Miami',
        description: 'Perfect for Florida real estate business - premium location-based domain.',
        owner: sellers[0]
      },
      {
        name: 'newyorklawyers.com',
        price: 2800,
        category: 'LEGAL_SERVICES',
        state: 'New York',
        city: 'New York',
        description: 'Ideal for New York law firm - professional legal services domain.',
        owner: sellers[0]
      },
      {
        name: 'californiatech.com',
        price: 4500,
        category: 'TECHNOLOGY',
        state: 'California',
        city: 'San Francisco',
        description: 'Premium tech domain for California startups - perfect for Silicon Valley companies.',
        owner: sellers[0]
      },
      {
        name: 'chicagobusiness.com',
        price: 2200,
        category: 'BUSINESS_SERVICES',
        state: 'Illinois',
        city: 'Chicago',
        description: 'Great for Chicago business services - professional and memorable.',
        owner: sellers[1] || sellers[0]
      },
      {
        name: 'atlantafitness.com',
        price: 1500,
        category: 'HEALTH_AND_FITNESS',
        state: 'Georgia',
        city: 'Atlanta',
        description: 'Perfect for Atlanta fitness centers and health clubs.',
        owner: sellers[1] || sellers[0]
      },
      {
        name: 'seattlehealthcare.com',
        price: 3800,
        category: 'HEALTHCARE',
        state: 'Washington',
        city: 'Seattle',
        description: 'Ideal for Seattle healthcare providers and medical practices.',
        owner: sellers[1] || sellers[0]
      }
    ];

    for (const domainData of demoDomains) {
      await prisma.domain.upsert({
        where: { name: domainData.name },
        update: {
          price: domainData.price,
          category: domainData.category,
          state: domainData.state,
          city: domainData.city,
          description: domainData.description,
          status: 'VERIFIED',
          isFeatured: Math.random() > 0.7 // Randomly feature some domains
        },
        create: {
          name: domainData.name,
          price: domainData.price,
          category: domainData.category,
          state: domainData.state,
          city: domainData.city,
          description: domainData.description,
          status: 'VERIFIED',
          isFeatured: Math.random() > 0.7,
          ownerId: domainData.owner.id
        }
      });
      
      console.log(`  ✅ ${domainData.name} - $${domainData.price}`);
    }

    // 4. Create some test inquiries
    console.log('\n💬 Creating test inquiries...');
    
    const buyers = await prisma.user.findMany({
      where: { role: 'BUYER' },
      take: 2
    });

    const domains = await prisma.domain.findMany({
      where: { status: 'VERIFIED' },
      take: 3
    });

    if (buyers.length > 0 && domains.length > 0) {
      for (let i = 0; i < Math.min(3, domains.length); i++) {
        const domain = domains[i];
        const buyer = buyers[i % buyers.length];
        
        await prisma.inquiry.create({
          data: {
            domainId: domain.id,
            buyerId: buyer.id,
            sellerId: domain.ownerId,
            message: `Hi, I'm interested in purchasing ${domain.name}. Could you provide more details about the domain and its current status?`,
            status: 'OPEN'
          }
        });
        
        console.log(`  ✅ Inquiry for ${domain.name} by ${buyer.email}`);
      }
    }

    // 5. Create domain analytics
    console.log('\n📊 Creating domain analytics...');
    
    for (const domain of domains) {
      // Create analytics for the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        await prisma.domainAnalytics.upsert({
          where: {
            domainId_date: {
              domainId: domain.id,
              date: date
            }
          },
          update: {
            views: Math.floor(Math.random() * 50) + 10,
            inquiries: Math.floor(Math.random() * 5)
          },
          create: {
            domainId: domain.id,
            date: date,
            views: Math.floor(Math.random() * 50) + 10,
            inquiries: Math.floor(Math.random() * 5)
          }
        });
      }
    }

    console.log('\n🎉 Production database seeded successfully!');
    
    console.log('\n📋 Demo Account Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 Admin Account:');
    console.log('  Email: admin@geodomainland.com | Password: admin123');
    console.log('\n🏪 Seller Accounts:');
    console.log('  Email: seller1@test.com | Password: seller123');
    console.log('  Email: seller2@test.com | Password: seller123');
    console.log('\n🛒 Buyer Accounts:');
    console.log('  Email: buyer1@test.com | Password: buyer123');
    console.log('  Email: buyer2@test.com | Password: buyer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📊 Production Data Summary:');
    const userCount = await prisma.user.count();
    const domainCount = await prisma.domain.count();
    const inquiryCount = await prisma.inquiry.count();
    const analyticsCount = await prisma.domainAnalytics.count();
    
    console.log(`  • ${userCount} users`);
    console.log(`  • ${domainCount} domains`);
    console.log(`  • ${inquiryCount} inquiries`);
    console.log(`  • ${analyticsCount} analytics records`);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedProduction().catch(console.error);
}

module.exports = { seedProduction };
