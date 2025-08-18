import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create demo users with different roles
  const demoUsers = [
    // Admin users
    {
      email: 'admin@geodomainland.com',
      name: 'Admin User',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      password: 'admin123',
      company: 'GeoDomainLand',
      phone: '+1 (555) 123-4567',
    },
    {
      email: 'superadmin@geodomainland.com',
      name: 'Super Admin',
      role: 'SUPER_ADMIN' as const,
      status: 'ACTIVE' as const,
      password: 'superadmin123',
      company: 'GeoDomainLand',
      phone: '+1 (555) 987-6543',
    },
    
    // Seller users
    {
      email: 'seller1@test.com',
      name: 'John Seller',
      role: 'SELLER' as const,
      status: 'ACTIVE' as const,
      password: 'seller123',
      company: 'Tech Domains Inc.',
      phone: '+1 (555) 111-2222',
    },
    {
      email: 'seller2@test.com',
      name: 'Jane DomainOwner',
      role: 'SELLER' as const,
      status: 'ACTIVE' as const,
      password: 'seller123',
      company: 'Premium Domains LLC',
      phone: '+1 (555) 333-4444',
    },
    {
      email: 'seller3@test.com',
      name: 'Mike DomainTrader',
      role: 'SELLER' as const,
      status: 'ACTIVE' as const,
      password: 'seller123',
      company: 'Domain Empire',
      phone: '+1 (555) 555-6666',
    },
    
    // Buyer users
    {
      email: 'buyer1@test.com',
      name: 'Alice Buyer',
      role: 'BUYER' as const,
      status: 'ACTIVE' as const,
      password: 'buyer123',
      company: 'Startup Ventures',
      phone: '+1 (555) 777-8888',
    },
    {
      email: 'buyer2@test.com',
      name: 'Bob Investor',
      role: 'BUYER' as const,
      status: 'ACTIVE' as const,
      password: 'buyer123',
      company: 'Investment Group',
      phone: '+1 (555) 999-0000',
    },
    {
      email: 'buyer3@test.com',
      name: 'Carol Entrepreneur',
      role: 'BUYER' as const,
      status: 'ACTIVE' as const,
      password: 'buyer123',
      company: 'Innovation Labs',
      phone: '+1 (555) 111-3333',
    },
  ];

  // Create users with hashed passwords
  const createdUsers = [];
  for (const userData of demoUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        status: userData.status,
        password: hashedPassword,
        company: userData.company,
        phone: userData.phone,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      },
    });
    createdUsers.push(user);
    console.log(`✅ Created user: ${user.email} (${user.role})`);
  }

  // Get seller users for domain creation
  const sellers = createdUsers.filter(user => user.role === 'SELLER');
  const buyers = createdUsers.filter(user => user.role === 'BUYER');

  // Create comprehensive test domains
  const testDomains = [
    {
      name: 'techstartup.com',
      price: 15000,
      priceType: 'FIXED' as const,
      description: 'Perfect domain for a technology startup company. Premium tech domain with high commercial value.',
      industry: 'Technology',
      state: 'California',
      city: 'San Francisco',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=200&fit=crop',
    },
    {
      name: 'realestatepro.com',
      price: 8500,
      priceType: 'NEGOTIABLE' as const,
      description: 'Professional real estate domain for agents and brokers. Established brand potential.',
      industry: 'Real Estate',
      state: 'New York',
      city: 'New York',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=200&fit=crop',
    },
    {
      name: 'healthcareplus.com',
      price: 12000,
      priceType: 'FIXED' as const,
      description: 'Premium healthcare domain for medical services. Trustworthy and professional.',
      industry: 'Healthcare',
      state: 'Texas',
      city: 'Houston',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop',
    },
    {
      name: 'financehub.com',
      price: 25000,
      priceType: 'MAKE_OFFER' as const,
      description: 'High-value finance domain for financial services. Premium financial brand.',
      industry: 'Finance',
      state: 'California',
      city: 'Los Angeles',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop',
    },
    {
      name: 'techsolutions.com',
      price: 18000,
      priceType: 'FIXED' as const,
      description: 'Technology solutions domain for IT companies. Professional tech services.',
      industry: 'Technology',
      state: 'Washington',
      city: 'Seattle',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
    },
    {
      name: 'restaurantguide.com',
      price: 5500,
      priceType: 'NEGOTIABLE' as const,
      description: 'Restaurant guide domain for food and dining. Perfect for food industry.',
      industry: 'Food & Beverage',
      state: 'Illinois',
      city: 'Chicago',
      status: 'VERIFIED' as const,
      ownerId: sellers[2].id,
      logoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop',
    },
    {
      name: 'educationonline.com',
      price: 9500,
      priceType: 'FIXED' as const,
      description: 'Online education domain for e-learning platforms. Educational technology focus.',
      industry: 'Education',
      state: 'Massachusetts',
      city: 'Boston',
      status: 'VERIFIED' as const,
      ownerId: sellers[2].id,
      logoUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop',
    },
    {
      name: 'automotivepro.com',
      price: 7500,
      priceType: 'NEGOTIABLE' as const,
      description: 'Automotive professional domain for car services. Auto industry focused.',
      industry: 'Automotive',
      state: 'Michigan',
      city: 'Detroit',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=200&fit=crop',
    },
    {
      name: 'cryptotrader.com',
      price: 35000,
      priceType: 'MAKE_OFFER' as const,
      description: 'Premium cryptocurrency trading domain. High-value crypto brand.',
      industry: 'Finance',
      state: 'California',
      city: 'San Francisco',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop',
    },
    {
      name: 'fitnesspro.com',
      price: 6500,
      priceType: 'FIXED' as const,
      description: 'Fitness professional domain for health and wellness. Active lifestyle focus.',
      industry: 'Health & Fitness',
      state: 'Florida',
      city: 'Miami',
      status: 'VERIFIED' as const,
      ownerId: sellers[2].id,
      logoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    },
  ];

  // Create domains
  const createdDomains = [];
  for (const domainData of testDomains) {
    const domain = await prisma.domain.upsert({
      where: { name: domainData.name },
      update: {},
      create: domainData,
    });
    createdDomains.push(domain);
    console.log(`✅ Created domain: ${domain.name}`);
  }

  // Create domain analytics with realistic data
  for (const domain of createdDomains) {
    // Create analytics for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      await prisma.domainAnalytics.upsert({
        where: {
          domainId_date: {
            domainId: domain.id,
            date: date,
          },
        },
        update: {},
        create: {
          domainId: domain.id,
          date: date,
          views: Math.floor(Math.random() * 50) + 10,
          inquiries: Math.floor(Math.random() * 5) + 1,
        },
      });
    }
  }

  console.log('✅ Domain analytics created');

  // Create test inquiries
  const inquiryData = [
    {
      domainId: createdDomains[0].id, // techstartup.com
      buyerId: buyers[0].id,
      budgetRange: '$10,000 - $20,000',
      intendedUse: 'Starting a new tech startup',
      message: 'I\'m interested in this domain for my new technology startup. Can we discuss the price?',
      status: 'PENDING_REVIEW' as const,
    },
    {
      domainId: createdDomains[1].id, // realestatepro.com
      buyerId: buyers[1].id,
      budgetRange: '$5,000 - $10,000',
      intendedUse: 'Real estate agency website',
      message: 'Looking for a professional domain for my real estate business.',
      status: 'APPROVED' as const,
    },
    {
      domainId: createdDomains[2].id, // healthcareplus.com
      buyerId: buyers[2].id,
      budgetRange: '$8,000 - $15,000',
      intendedUse: 'Healthcare services platform',
      message: 'Interested in this domain for a healthcare services platform.',
      status: 'FORWARDED' as const,
    },
    {
      domainId: createdDomains[3].id, // financehub.com
      buyerId: buyers[0].id,
      budgetRange: '$20,000 - $30,000',
      intendedUse: 'Financial services company',
      message: 'Perfect domain for our financial services company. What\'s your best price?',
      status: 'PENDING_REVIEW' as const,
    },
    {
      domainId: createdDomains[4].id, // techsolutions.com
      buyerId: buyers[1].id,
      budgetRange: '$15,000 - $25,000',
      intendedUse: 'IT consulting services',
      message: 'Looking for a domain for our IT consulting business.',
      status: 'APPROVED' as const,
    },
  ];

  for (const inquiryDataItem of inquiryData) {
    const buyer = await prisma.user.findUnique({ where: { id: inquiryDataItem.buyerId } });
    const domain = await prisma.domain.findUnique({ where: { id: inquiryDataItem.domainId } });
    
    const inquiry = await prisma.inquiry.create({
      data: {
        ...inquiryDataItem,
        sellerId: domain!.ownerId,
        buyerName: buyer!.name!,
        buyerEmail: buyer!.email,
        buyerPhone: buyer!.phone,
        buyerCompany: buyer!.company,
      },
    });
    console.log(`✅ Created inquiry for ${domain!.name}`);
  }

  // Create test deals
  const dealData = [
    {
      inquiryId: (await prisma.inquiry.findFirst({ where: { status: 'APPROVED' } }))!.id,
      buyerId: buyers[1].id,
      sellerId: sellers[0].id,
      domainId: createdDomains[1].id,
      agreedPrice: 8500,
      currency: 'USD',
      paymentMethod: 'ESCROW_COM' as const,
      paymentInstructions: 'Payment to be made through Escrow.com',
      timeline: '30 days',
      terms: 'Standard domain transfer terms apply',
      status: 'AGREED' as const,
    },
    {
      inquiryId: (await prisma.inquiry.findFirst({ where: { status: 'APPROVED', domainId: createdDomains[4].id } }))!.id,
      buyerId: buyers[1].id,
      sellerId: sellers[0].id,
      domainId: createdDomains[4].id,
      agreedPrice: 18000,
      currency: 'USD',
      paymentMethod: 'WIRE_TRANSFER' as const,
      paymentInstructions: 'Wire transfer to specified account',
      timeline: '14 days',
      terms: 'Immediate transfer upon payment confirmation',
      status: 'PAYMENT_PENDING' as const,
    },
  ];

  for (const dealDataItem of dealData) {
    const deal = await prisma.deal.create({
      data: dealDataItem,
    });
    console.log(`✅ Created deal for ${(await prisma.domain.findUnique({ where: { id: dealDataItem.domainId } }))!.name}`);
  }

  // Create test messages
  const forwardedInquiry = await prisma.inquiry.findFirst({ where: { status: 'FORWARDED' } });
  if (forwardedInquiry) {
    const messageData = [
      {
        inquiryId: forwardedInquiry.id,
        senderId: buyers[2].id,
        receiverId: sellers[1].id,
        senderType: 'BUYER' as const,
        content: 'Thank you for the quick response. I\'m very interested in this domain.',
        status: 'PENDING' as const,
      },
      {
        inquiryId: forwardedInquiry.id,
        senderId: sellers[1].id,
        receiverId: buyers[2].id,
        senderType: 'SELLER' as const,
        content: 'Thank you for your interest. I\'m open to negotiation on the price.',
        status: 'APPROVED' as const,
      },
    ];

    for (const messageDataItem of messageData) {
      const message = await prisma.message.create({
        data: messageDataItem,
      });
      console.log(`✅ Created message in inquiry`);
    }
  }

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📋 Demo Account Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 Admin Accounts:');
  console.log('  Email: admin@geodomainland.com | Password: admin123');
  console.log('  Email: superadmin@geodomainland.com | Password: superadmin123');
  console.log('\n🏪 Seller Accounts:');
  console.log('  Email: seller1@test.com | Password: seller123');
  console.log('  Email: seller2@test.com | Password: seller123');
  console.log('  Email: seller3@test.com | Password: seller123');
  console.log('\n🛒 Buyer Accounts:');
  console.log('  Email: buyer1@test.com | Password: buyer123');
  console.log('  Email: buyer2@test.com | Password: buyer123');
  console.log('  Email: buyer3@test.com | Password: buyer123');
  console.log('\n📊 Test Data Created:');
  console.log(`  • ${createdUsers.length} users`);
  console.log(`  • ${createdDomains.length} domains`);
  console.log(`  • ${inquiryData.length} inquiries`);
  console.log(`  • ${dealData.length} deals`);
  console.log(`  • 2 messages`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
