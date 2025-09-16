const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://c16dd8c30ed0f8488846fa02e084e7d18c088d88d316a01989f04f3ea7791a08:sk_B_Or7o34I-dcs1dPSVOFr@db.prisma.io:5432/postgres?sslmode=require"
    }
  }
});

async function checkUsers() {
  try {
    console.log('Checking users in database...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - Role: ${user.role}, Status: ${user.status}, Verified: ${user.emailVerified}`);
    });
    
    if (users.length === 0) {
      console.log('\nNo users found! Need to seed the database.');
    }
    
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
