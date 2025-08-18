const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testNextAuth() {
  try {
    console.log('🔍 Testing NextAuth configuration...');
    
    // Test the exact same logic as the auth.ts file
    const credentials = {
      email: 'admin@geodomainland.com',
      password: 'admin123'
    };
    
    if (!credentials?.email || !credentials?.password) {
      console.log('❌ Missing credentials');
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: credentials.email
      }
    });

    if (!user || !user.password) {
      console.log('❌ User not found or no password');
      return;
    }

    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }

    console.log('✅ NextAuth authentication logic works!');
    console.log('✅ User data:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    });
    
    // Test with a buyer account too
    const buyerCredentials = {
      email: 'buyer1@test.com',
      password: 'buyer123'
    };
    
    const buyerUser = await prisma.user.findUnique({
      where: {
        email: buyerCredentials.email
      }
    });

    if (buyerUser && buyerUser.password) {
      const isBuyerPasswordValid = await bcrypt.compare(
        buyerCredentials.password,
        buyerUser.password
      );
      
      console.log('✅ Buyer authentication:', isBuyerPasswordValid ? 'Valid' : 'Invalid');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNextAuth();
