import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing production database connection...');
    
    // Test basic database connection
    const userCount = await prisma.user.count();
    console.log('✅ User count:', userCount);
    
    // Test if wholesale tables exist
    try {
      const wholesaleConfigCount = await prisma.wholesaleConfig.count();
      console.log('✅ WholesaleConfig count:', wholesaleConfigCount);
    } catch (error) {
      console.error('❌ WholesaleConfig table error:', error);
      return NextResponse.json({
        success: false,
        error: 'WholesaleConfig table not found',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    try {
      const wholesaleDomainCount = await prisma.wholesaleDomain.count();
      console.log('✅ WholesaleDomain count:', wholesaleDomainCount);
    } catch (error) {
      console.error('❌ WholesaleDomain table error:', error);
      return NextResponse.json({
        success: false,
        error: 'WholesaleDomain table not found',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    try {
      const wholesaleSaleCount = await prisma.wholesaleSale.count();
      console.log('✅ WholesaleSale count:', wholesaleSaleCount);
    } catch (error) {
      console.error('❌ WholesaleSale table error:', error);
      return NextResponse.json({
        success: false,
        error: 'WholesaleSale table not found',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    // Test wholesale config creation
    try {
      const config = await prisma.wholesaleConfig.findFirst();
      if (!config) {
        // Try to create default config
        const systemUser = await prisma.user.findFirst({
          where: {
            OR: [
              { role: 'ADMIN' },
              { role: 'SUPER_ADMIN' }
            ]
          },
          select: { id: true }
        });
        
        if (systemUser) {
          const newConfig = await prisma.wholesaleConfig.create({
            data: {
              price: 299.00,
              isActive: true,
              updatedBy: systemUser.id,
            },
          });
          console.log('✅ Created default wholesale config:', newConfig.id);
        } else {
          console.log('⚠️ No admin user found to create wholesale config');
        }
      } else {
        console.log('✅ Wholesale config exists:', config.id);
      }
    } catch (error) {
      console.error('❌ Wholesale config creation error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to create wholesale config',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Production database connection successful',
      data: {
        userCount,
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });
    
  } catch (error) {
    console.error('❌ Production database test failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }, { status: 500 });
  }
}
