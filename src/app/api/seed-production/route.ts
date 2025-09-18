import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Simple security check - you can add more sophisticated auth here
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SEED_AUTH_TOKEN || 'default-seed-token-2024';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🌱 Starting production database seeding...');

    // 1. Create demo users
    console.log('👥 Creating demo users...');
    
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

    const createdUsers = [];
    for (const userData of demoUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      
      const user = await prisma.user.upsert({
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
      
      createdUsers.push(user);
      console.log(`  ✅ ${userData.email} (${userData.role})`);
    }

    // 2. Get sellers for domain assignment
    const sellers = createdUsers.filter(user => user.role === 'SELLER');
    if (sellers.length === 0) {
      throw new Error('No sellers found to assign domains to');
    }

    // 3. Create demo domains
    console.log('🌐 Creating demo domains...');
    
    const demoDomains = [
      {
        name: 'usahotels.com',
        price: 2500,
        category: 'HOSPITALITY',
        state: 'California',
        city: 'Los Angeles',
        description: 'Premium domain for US hotel business - perfect for hotel chains and hospitality companies.'
      },
      {
        name: 'texasrestaurants.com',
        price: 1800,
        category: 'FOOD_AND_BEVERAGE',
        state: 'Texas',
        city: 'Houston',
        description: 'Great domain for Texas restaurant chain - ideal for food service businesses.'
      },
      {
        name: 'floridarealestate.com',
        price: 3200,
        category: 'REAL_ESTATE',
        state: 'Florida',
        city: 'Miami',
        description: 'Perfect for Florida real estate business - premium location-based domain.'
      },
      {
        name: 'newyorklawyers.com',
        price: 2800,
        category: 'LEGAL_SERVICES',
        state: 'New York',
        city: 'New York',
        description: 'Ideal for New York law firm - professional legal services domain.'
      },
      {
        name: 'californiatech.com',
        price: 4500,
        category: 'TECHNOLOGY',
        state: 'California',
        city: 'San Francisco',
        description: 'Premium tech domain for California startups - perfect for Silicon Valley companies.'
      },
      {
        name: 'chicagobusiness.com',
        price: 2200,
        category: 'BUSINESS_SERVICES',
        state: 'Illinois',
        city: 'Chicago',
        description: 'Great for Chicago business services - professional and memorable.'
      },
      {
        name: 'atlantafitness.com',
        price: 1500,
        category: 'HEALTH_AND_FITNESS',
        state: 'Georgia',
        city: 'Atlanta',
        description: 'Perfect for Atlanta fitness centers and health clubs.'
      },
      {
        name: 'seattlehealthcare.com',
        price: 3800,
        category: 'HEALTHCARE',
        state: 'Washington',
        city: 'Seattle',
        description: 'Ideal for Seattle healthcare providers and medical practices.'
      }
    ];

    const createdDomains = [];
    for (const domainData of demoDomains) {
      const domain = await prisma.domain.upsert({
        where: { name: domainData.name },
        update: {
          price: domainData.price,
          category: domainData.category,
          state: domainData.state,
          city: domainData.city,
          description: domainData.description,
          status: 'VERIFIED',
          isFeatured: Math.random() > 0.7
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
          ownerId: sellers[0].id
        }
      });
      
      createdDomains.push(domain);
      console.log(`  ✅ ${domainData.name} - $${domainData.price}`);
    }

    // 4. Create some test inquiries
    console.log('💬 Creating test inquiries...');
    
    const buyers = createdUsers.filter(user => user.role === 'BUYER');
    if (buyers.length > 0 && createdDomains.length > 0) {
      for (let i = 0; i < Math.min(3, createdDomains.length); i++) {
        const domain = createdDomains[i];
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
    console.log('📊 Creating domain analytics...');
    
    for (const domain of createdDomains) {
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

    console.log('🎉 Production database seeded successfully!');

    return NextResponse.json({
      success: true,
      message: 'Production database seeded successfully!',
      data: {
        users: createdUsers.length,
        domains: createdDomains.length,
        inquiries: Math.min(3, createdDomains.length),
        analytics: createdDomains.length * 30
      },
      demoAccounts: {
        admin: { email: 'admin@geodomainland.com', password: 'admin123' },
        seller: { email: 'seller1@test.com', password: 'seller123' },
        buyer: { email: 'buyer1@test.com', password: 'buyer123' }
      }
    });

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to seed production database'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Production seeding endpoint. Use POST with authorization header.',
    usage: 'POST /api/seed-production with Authorization: Bearer <token>',
    note: 'Set SEED_AUTH_TOKEN environment variable for security'
  });
}
