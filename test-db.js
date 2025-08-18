const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test user query
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@geodomainland.com' }
    });
    
    if (adminUser) {
      console.log('✅ Admin user found:', {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status,
        hasPassword: !!adminUser.password
      });
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Test all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    });
    
    console.log('📋 Total users in database:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
