const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://c16dd8c30ed0f8488846fa02e084e7d18c088d88d316a01989f04f3ea7791a08:sk_B_Or7o34I-dcs1dPSVOFr@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function debugSession() {
  try {
    console.log('Testing domain creation with a known user...');
    
    // Test with seller1@test.com (John Seller)
    const testUser = await prisma.user.findUnique({
      where: { email: 'seller1@test.com' },
      select: { id: true, email: true, name: true, role: true, status: true }
    });
    
    if (!testUser) {
      console.log('Test user not found!');
      return;
    }
    
    console.log('Test user found:', testUser);
    
    // Test domain creation
    const testDomain = await prisma.domain.create({
      data: {
        name: 'test-domain-' + Date.now() + '.com',
        price: 1000,
        priceType: 'FIXED',
        description: 'Test domain for debugging',
        geographicScope: 'STATE',
        state: 'California',
        category: 'Technology',
        ownerId: testUser.id,
        status: 'DRAFT'
      }
    });
    
    console.log('Domain created successfully:', testDomain);
    
    // Clean up
    await prisma.domain.delete({
      where: { id: testDomain.id }
    });
    
    console.log('Test domain cleaned up');
    
  } catch (error) {
    console.error('Error in debug session:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSession();
