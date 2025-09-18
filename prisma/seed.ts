import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@geodomainland.com' },
    update: {},
    create: {
      email: 'admin@geodomainland.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created user: ${admin.email} (${admin.role})`);

  const seller1 = await prisma.user.upsert({
    where: { email: 'seller1@test.com' },
    update: {},
    create: {
      email: 'seller1@test.com',
      name: 'Seller One',
      password: await bcrypt.hash('seller123', 10),
      role: 'SELLER',
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Created user: ${seller1.email} (${seller1.role})`);

  const buyer1 = await prisma.user.upsert({
    where: { email: 'buyer1@test.com' },
    update: {},
    create: {
      email: 'buyer1@test.com',
      name: 'Buyer One',
      password: await bcrypt.hash('buyer123', 10),
      role: 'BUYER',
      status: 'ACTIVE',
      },
    });
  console.log(`✅ Created user: ${buyer1.email} (${buyer1.role})`);

  // Create demo domains
  const domains = [
    { name: 'usahotels.com', price: 25000, category: 'Travel', state: null, city: null, description: 'Premium domain for USA hotels.' },
    { name: 'texashotels.com', price: 18000, category: 'Travel', state: 'Texas', city: null, description: 'Great domain for Texas hotels.' },
    { name: 'miamihotels.com', price: 22000, category: 'Travel', state: 'Florida', city: 'Miami', description: 'Exclusive domain for Miami hotels.' },
    { name: 'californiarestaurants.com', price: 15000, category: 'Food', state: 'California', city: null, description: 'Ideal for California restaurants.' },
    { name: 'chicagorestaurants.com', price: 18000, category: 'Food', state: 'Illinois', city: 'Chicago', description: 'Perfect for Chicago restaurants.' },
    { name: 'usarealestate.com', price: 30000, category: 'Real Estate', state: null, city: null, description: 'Top-tier domain for USA real estate.' },
    { name: 'floridarealestate.com', price: 20000, category: 'Real Estate', state: 'Florida', city: null, description: 'Excellent for Florida real estate.' },
    { name: 'newyorkrealestate.com', price: 28000, category: 'Real Estate', state: 'New York', city: null, description: 'Prime domain for New York real estate.' },
  ];

  for (const domainData of domains) {
    const existingDomain = await prisma.domain.findUnique({
      where: { name: domainData.name }
    });

    if (!existingDomain) {
      await prisma.domain.create({
        data: {
          name: domainData.name,
          price: domainData.price,
          category: domainData.category,
          state: domainData.state,
          city: domainData.city,
          description: domainData.description,
          status: 'VERIFIED',
          isFeatured: Math.random() > 0.5,
          ownerId: seller1.id,
        },
      });
      console.log(`✅ Created domain: ${domainData.name}`);
    }
  }

  // Create demo inquiries
  const domain1 = await prisma.domain.findFirst({ where: { name: 'usahotels.com' } });
  const domain2 = await prisma.domain.findFirst({ where: { name: 'texashotels.com' } });

  if (domain1 && domain2) {
    const existingInquiry1 = await prisma.inquiry.findFirst({
      where: { domainId: domain1.id, buyerId: buyer1.id }
    });

    if (!existingInquiry1) {
      await prisma.inquiry.create({
      data: {
          domainId: domain1.id,
          buyerId: buyer1.id,
          sellerId: domain1.ownerId,
          subject: 'Inquiry about usahotels.com',
          message: 'I am interested in usahotels.com. What is the best price?',
          status: 'OPEN',
      },
    });
      console.log('✅ Created inquiry for usahotels.com');
    }

    const existingInquiry2 = await prisma.inquiry.findFirst({
      where: { domainId: domain2.id, buyerId: buyer1.id }
    });

    if (!existingInquiry2) {
      await prisma.inquiry.create({
        data: {
          domainId: domain2.id,
          buyerId: buyer1.id,
          sellerId: domain2.ownerId,
          subject: 'Inquiry about texashotels.com',
          message: 'Is texashotels.com still available?',
          status: 'OPEN',
        },
      });
      console.log('✅ Created inquiry for texashotels.com');
    }
  }

  console.log('\n🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });