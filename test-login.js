const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://c16dd8c30ed0f8488846fa02e084e7d18c088d88d316a01989f04f3ea7791a08:sk_B_Or7o34I-dcs1dPSVOFr@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function testLogin() {
  try {
    console.log('Testing login credentials...');
    
    // Test with seller1@test.com
    const user = await prisma.user.findUnique({
      where: { email: 'seller1@test.com' }
    });
    
    if (!user) {
      console.log('User not found!');
      return;
    }
    
    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      hasPassword: !!user.password,
      emailVerified: user.emailVerified
    });
    
    // Test password (if it exists)
    if (user.password) {
      const testPassword = 'seller123'; // Correct password from seed
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log('Password test (seller123):', isValid ? 'VALID' : 'INVALID');
    } else {
      console.log('No password set for user');
    }
    
  } catch (error) {
    console.error('Error testing login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
