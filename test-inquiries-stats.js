import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInquiriesStats() {
  console.log('🧪 Testing Inquiries Stats...');
  
  try {
    // Test basic inquiry count
    const totalInquiries = await prisma.inquiry.count({
      where: { sellerId: 'cmf6h3veo0002poccm37exeny' }
    });
    console.log('✅ Total inquiries:', totalInquiries);
    
    // Test pending inquiries
    const pendingInquiries = await prisma.inquiry.count({
      where: { 
        sellerId: 'cmf6h3veo0002poccm37exeny',
        status: 'PENDING_REVIEW'
      }
    });
    console.log('✅ Pending inquiries:', pendingInquiries);
    
    // Test open inquiries
    const openInquiries = await prisma.inquiry.count({
      where: { 
        sellerId: 'cmf6h3veo0002poccm37exeny',
        status: 'OPEN'
      }
    });
    console.log('✅ Open inquiries:', openInquiries);
    
    // Test closed inquiries
    const closedInquiries = await prisma.inquiry.count({
      where: { 
        sellerId: 'cmf6h3veo0002poccm37exeny',
        status: 'CLOSED'
      }
    });
    console.log('✅ Closed inquiries:', closedInquiries);
    
    // Test deals count
    const dealsCount = await prisma.deal.count({
      where: {
        inquiry: {
          sellerId: 'cmf6h3veo0002poccm37exeny'
        }
      }
    });
    console.log('✅ Deals count:', dealsCount);
    
    console.log('🎉 All inquiries stats queries working!');
    
  } catch (error) {
    console.error('❌ Error testing inquiries stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInquiriesStats();
