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

  // Create comprehensive test domains with geo-targeted names
  const testDomains = [
    {
      name: 'usahotels.com',
      price: 45000,
      priceType: 'MAKE_OFFER' as const,
      description: 'Premium national hotel domain for USA-wide hotel services. Perfect for major hotel chains and hospitality companies.',
      geographicScope: 'NATIONAL' as const,
      state: null,
      city: null,
      category: 'hotels',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop',
      registrar: 'Network Solutions',
      expirationDate: new Date('2026-05-25'),
      metaTitle: 'USAHotels.com - Premium National Hotel Domain',
      metaDescription: 'Premium national hotel domain for USA-wide hotel services. Perfect for major hotel chains.',
    },
    {
      name: 'texashotels.com',
      price: 28000,
      priceType: 'NEGOTIABLE' as const,
      description: 'State-wide hotel domain for Texas hospitality services. Ideal for Texas-based hotel chains and travel companies.',
      geographicScope: 'STATE' as const,
      state: 'Texas',
      city: null,
      category: 'hotels',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=200&fit=crop',
      registrar: 'Register.com',
      expirationDate: new Date('2025-11-14'),
      metaTitle: 'TexasHotels.com - State-wide Hotel Domain',
      metaDescription: 'State-wide hotel domain for Texas hospitality services. Perfect for Texas-based hotel chains.',
    },
    {
      name: 'miamihotels.com',
      price: 22000,
      priceType: 'FIXED' as const,
      description: 'City-specific hotel domain for Miami hospitality. Perfect for Miami-based hotels and resorts.',
      geographicScope: 'CITY' as const,
      state: 'Florida',
      city: 'Miami',
      category: 'hotels',
      status: 'VERIFIED' as const,
      ownerId: sellers[2].id,
      logoUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=200&fit=crop',
      registrar: 'GoDaddy',
      expirationDate: new Date('2025-12-15'),
      metaTitle: 'MiamiHotels.com - Miami Hotel Domain',
      metaDescription: 'City-specific hotel domain for Miami hospitality. Perfect for Miami-based hotels and resorts.',
    },
    {
      name: 'californiarestaurants.com',
      price: 32000,
      priceType: 'FIXED' as const,
      description: 'State-wide restaurant directory for California dining. Perfect for California restaurant chains and food services.',
      geographicScope: 'STATE' as const,
      state: 'California',
      city: null,
      category: 'restaurants',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=200&fit=crop',
      registrar: 'Domain.com',
      expirationDate: new Date('2026-01-30'),
      metaTitle: 'CaliforniaRestaurants.com - State Restaurant Directory',
      metaDescription: 'State-wide restaurant directory for California dining. Perfect for California restaurant chains.',
    },
    {
      name: 'chicagorestaurants.com',
      price: 18000,
      priceType: 'NEGOTIABLE' as const,
      description: 'City-specific restaurant domain for Chicago dining scene. Ideal for Chicago restaurants and food delivery services.',
      geographicScope: 'CITY' as const,
      state: 'Illinois',
      city: 'Chicago',
      category: 'restaurants',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=200&fit=crop',
      registrar: 'Bluehost',
      expirationDate: new Date('2025-09-05'),
      metaTitle: 'ChicagoRestaurants.com - Chicago Dining Domain',
      metaDescription: 'City-specific restaurant domain for Chicago dining scene. Perfect for Chicago restaurants.',
    },
    {
      name: 'usarealestate.com',
      price: 55000,
      priceType: 'MAKE_OFFER' as const,
      description: 'Premium national real estate domain for USA-wide property services. Perfect for major real estate companies.',
      geographicScope: 'NATIONAL' as const,
      state: null,
      city: null,
      category: 'real-estate',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=200&fit=crop',
      registrar: 'Namecheap',
      expirationDate: new Date('2025-08-22'),
      metaTitle: 'USARealEstate.com - National Real Estate Domain',
      metaDescription: 'Premium national real estate domain for USA-wide property services. Perfect for major real estate companies.',
    },
    {
      name: 'floridarealestate.com',
      price: 35000,
      priceType: 'FIXED' as const,
      description: 'State-wide real estate domain for Florida property market. Ideal for Florida real estate agencies.',
      geographicScope: 'STATE' as const,
      state: 'Florida',
      city: null,
      category: 'real-estate',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=200&fit=crop',
      registrar: 'Google Domains',
      expirationDate: new Date('2026-03-10'),
      metaTitle: 'FloridaRealEstate.com - Florida Property Domain',
      metaDescription: 'State-wide real estate domain for Florida property market. Perfect for Florida real estate agencies.',
    },
    {
      name: 'newyorkrealestate.com',
      price: 42000,
      priceType: 'NEGOTIABLE' as const,
      description: 'State-wide real estate domain for New York property market. Premium domain for NY real estate professionals.',
      geographicScope: 'STATE' as const,
      state: 'New York',
      city: null,
      category: 'real-estate',
      status: 'VERIFIED' as const,
      ownerId: sellers[2].id,
      logoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=200&fit=crop',
      registrar: 'Cloudflare',
      expirationDate: new Date('2025-11-30'),
      metaTitle: 'NewYorkRealEstate.com - NY Property Domain',
      metaDescription: 'State-wide real estate domain for New York property market. Perfect for NY real estate professionals.',
    },
    {
      name: 'usalawyers.com',
      price: 38000,
      priceType: 'MAKE_OFFER' as const,
      description: 'National legal services domain for USA-wide law firms. Premium domain for legal professionals.',
      geographicScope: 'NATIONAL' as const,
      state: null,
      city: null,
      category: 'law',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=200&fit=crop',
      registrar: 'Hover',
      expirationDate: new Date('2026-01-15'),
      metaTitle: 'USALawyers.com - National Legal Services Domain',
      metaDescription: 'National legal services domain for USA-wide law firms. Perfect for legal professionals.',
    },
    {
      name: 'texaslawyers.com',
      price: 25000,
      priceType: 'FIXED' as const,
      description: 'State-wide legal services domain for Texas law firms. Ideal for Texas-based attorneys and legal services.',
      geographicScope: 'STATE' as const,
      state: 'Texas',
      city: null,
      category: 'law',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=400&h=200&fit=crop',
      registrar: 'DreamHost',
      expirationDate: new Date('2026-02-20'),
      metaTitle: 'TexasLawyers.com - Texas Legal Services Domain',
      metaDescription: 'State-wide legal services domain for Texas law firms. Perfect for Texas-based attorneys.',
    },
    {
      name: 'michigancleaning.com',
      price: 12000,
      priceType: 'NEGOTIABLE' as const,
      description: 'State-wide cleaning services domain for Michigan. Perfect for Michigan cleaning companies and janitorial services.',
      geographicScope: 'STATE' as const,
      state: 'Michigan',
      city: null,
      category: 'professional-services',
      status: 'VERIFIED' as const,
      ownerId: sellers[2].id,
      logoUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=200&fit=crop',
      registrar: 'HostGator',
      expirationDate: new Date('2025-10-12'),
      metaTitle: 'MichiganCleaning.com - Michigan Cleaning Services',
      metaDescription: 'State-wide cleaning services domain for Michigan. Perfect for Michigan cleaning companies.',
    },
    {
      name: 'atlantafitness.com',
      price: 15000,
      priceType: 'FIXED' as const,
      description: 'City-specific fitness domain for Atlanta health and wellness. Ideal for Atlanta gyms and fitness centers.',
      geographicScope: 'CITY' as const,
      state: 'Georgia',
      city: 'Atlanta',
      category: 'professional-services',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      registrar: '1&1 IONOS',
      expirationDate: new Date('2025-12-08'),
      metaTitle: 'AtlantaFitness.com - Atlanta Fitness Domain',
      metaDescription: 'City-specific fitness domain for Atlanta health and wellness. Perfect for Atlanta gyms.',
    },
    {
      name: 'usainvestment.com',
      price: 65000,
      priceType: 'MAKE_OFFER' as const,
      description: 'Premium national investment domain for USA-wide financial services. High-value domain for investment firms.',
      geographicScope: 'NATIONAL' as const,
      state: null,
      city: null,
      category: 'financial-services',
      status: 'VERIFIED' as const,
      ownerId: sellers[1].id,
      logoUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=200&fit=crop',
      registrar: 'Porkbun',
      expirationDate: new Date('2026-04-18'),
      metaTitle: 'USAInvestment.com - National Investment Domain',
      metaDescription: 'Premium national investment domain for USA-wide financial services. Perfect for investment firms.',
    },
    {
      name: 'californiatech.com',
      price: 45000,
      priceType: 'NEGOTIABLE' as const,
      description: 'State-wide technology domain for California tech companies. Perfect for Silicon Valley and California tech startups.',
      geographicScope: 'STATE' as const,
      state: 'California',
      city: null,
      category: 'technology',
      status: 'VERIFIED' as const,
      ownerId: sellers[2].id,
      logoUrl: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=200&fit=crop',
      registrar: 'Network Solutions',
      expirationDate: new Date('2026-05-25'),
      metaTitle: 'CaliforniaTech.com - California Technology Domain',
      metaDescription: 'State-wide technology domain for California tech companies. Perfect for Silicon Valley startups.',
    },
    {
      name: 'seattlehealthcare.com',
      price: 28000,
      priceType: 'FIXED' as const,
      description: 'City-specific healthcare domain for Seattle medical services. Ideal for Seattle healthcare providers and clinics.',
      geographicScope: 'CITY' as const,
      state: 'Washington',
      city: 'Seattle',
      category: 'healthcare',
      status: 'VERIFIED' as const,
      ownerId: sellers[0].id,
      logoUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop',
      registrar: 'Register.com',
      expirationDate: new Date('2025-11-14'),
      metaTitle: 'SeattleHealthcare.com - Seattle Medical Services',
      metaDescription: 'City-specific healthcare domain for Seattle medical services. Perfect for Seattle healthcare providers.',
    },
  ];

  // Create domains
  const createdDomains = [];
  for (const domainData of testDomains) {
    const domain = await prisma.domain.upsert({
      where: { name: domainData.name },
      update: {
        registrar: domainData.registrar,
        expirationDate: domainData.expirationDate,
        metaTitle: domainData.metaTitle,
        metaDescription: domainData.metaDescription,
      },
      create: domainData,
    });
    createdDomains.push(domain);
    console.log(`✅ Created/Updated domain: ${domain.name} with registrar: ${domainData.registrar}`);
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
      domainId: createdDomains[0].id, // usahotels.com
      buyerId: buyers[0].id,
      budgetRange: '$40,000 - $50,000',
      intendedUse: 'National hotel chain website',
      message: 'I\'m interested in this domain for our national hotel chain expansion. Can we discuss the price?',
      status: 'PENDING_REVIEW' as const,
    },
    {
      domainId: createdDomains[1].id, // texashotels.com
      buyerId: buyers[1].id,
      budgetRange: '$25,000 - $30,000',
      intendedUse: 'Texas hotel business',
      message: 'Looking for a professional domain for my Texas hotel business.',
      status: 'APPROVED' as const,
    },
    {
      domainId: createdDomains[2].id, // miamihotels.com
      buyerId: buyers[2].id,
      budgetRange: '$20,000 - $25,000',
      intendedUse: 'Miami resort website',
      message: 'Interested in this domain for a Miami resort and hospitality business.',
      status: 'FORWARDED' as const,
    },
    {
      domainId: createdDomains[3].id, // californiarestaurants.com
      buyerId: buyers[0].id,
      budgetRange: '$30,000 - $35,000',
      intendedUse: 'California restaurant chain',
      message: 'Perfect domain for our California restaurant chain. What\'s your best price?',
      status: 'PENDING_REVIEW' as const,
    },
    {
      domainId: createdDomains[4].id, // chicagorestaurants.com
      buyerId: buyers[1].id,
      budgetRange: '$15,000 - $20,000',
      intendedUse: 'Chicago dining directory',
      message: 'Looking for a domain for our Chicago restaurant directory business.',
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
      sellerId: sellers[1].id,
      domainId: createdDomains[1].id, // texashotels.com
      agreedPrice: 28000,
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
      sellerId: sellers[1].id,
      domainId: createdDomains[4].id, // chicagorestaurants.com
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
