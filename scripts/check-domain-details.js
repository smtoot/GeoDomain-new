const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDomainDetails() {
  try {
    console.log('🔍 Checking domain details for hotelmichigan.com...');
    
    // Find domain by name
    const domain = await prisma.domain.findFirst({
      where: {
        name: {
          contains: 'hotelmichigan',
          mode: 'insensitive'
        }
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (domain) {
      console.log('✅ Domain found:');
      console.log('  ID:', domain.id);
      console.log('  Name:', domain.name);
      console.log('  Status:', domain.status);
      console.log('  Owner ID:', domain.ownerId);
      console.log('  Owner Name:', domain.owner.name);
      console.log('  Owner Email:', domain.owner.email);
      console.log('  Owner Role:', domain.owner.role);
      console.log('  Owner Status:', domain.owner.status);
      console.log('  Created At:', domain.createdAt);
      console.log('  Updated At:', domain.updatedAt);
    } else {
      console.log('❌ Domain not found');
      
      // List all domains to see what's available
      const allDomains = await prisma.domain.findMany({
        select: {
          id: true,
          name: true,
          status: true,
          ownerId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      
      console.log('\n📋 Available domains:');
      allDomains.forEach(d => {
        console.log(`  ${d.id} | ${d.name} | ${d.status} | Owner: ${d.ownerId}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDomainDetails();
