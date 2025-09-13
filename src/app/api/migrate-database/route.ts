import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Only allow in production environment
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({
        success: false,
        error: 'This endpoint is only available in production'
      }, { status: 403 });
    }

    console.log('🚀 Starting production database migration...');

    // Test basic database connection
    const userCount = await prisma.user.count();
    console.log('✅ User count:', userCount);

    // Check if wholesale tables exist and create them if needed
    let wholesaleConfigCount = 0;
    let wholesaleDomainCount = 0;
    let wholesaleSaleCount = 0;

    try {
      wholesaleConfigCount = await prisma.wholesaleConfig.count();
      console.log('✅ WholesaleConfig table exists:', wholesaleConfigCount);
    } catch (error) {
      console.log('⚠️ WholesaleConfig table does not exist, will be created by schema push');
    }

    try {
      wholesaleDomainCount = await prisma.wholesaleDomain.count();
      console.log('✅ WholesaleDomain table exists:', wholesaleDomainCount);
    } catch (error) {
      console.log('⚠️ WholesaleDomain table does not exist, will be created by schema push');
    }

    try {
      wholesaleSaleCount = await prisma.wholesaleSale.count();
      console.log('✅ WholesaleSale table exists:', wholesaleSaleCount);
    } catch (error) {
      console.log('⚠️ WholesaleSale table does not exist, will be created by schema push');
    }

    // If wholesale tables don't exist, we need to run schema push
    if (wholesaleConfigCount === 0 && wholesaleDomainCount === 0 && wholesaleSaleCount === 0) {
      console.log('🔧 Wholesale tables missing, attempting to create default config...');
      
      // Try to create a default wholesale config
      try {
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
      } catch (error) {
        console.error('❌ Failed to create wholesale config:', error);
        return NextResponse.json({
          success: false,
          error: 'Database schema migration required',
          details: 'Wholesale tables do not exist in production database. Please run: npx prisma db push',
          tables: {
            users: userCount,
            wholesaleConfig: 'Missing',
            wholesaleDomain: 'Missing', 
            wholesaleSale: 'Missing'
          }
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Production database migration check completed',
      data: {
        userCount,
        wholesaleConfigCount,
        wholesaleDomainCount,
        wholesaleSaleCount,
        environment: process.env.NODE_ENV,
        databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
      }
    });

  } catch (error) {
    console.error('❌ Production database migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Database migration failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      databaseUrl: process.env.DATABASE_URL ? 'Set' : 'Not set'
    }, { status: 500 });
  }
}
