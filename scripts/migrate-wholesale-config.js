#!/usr/bin/env node

/**
 * Migration script for wholesale configuration system
 * This script applies the database changes for the global wholesale configuration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting wholesale configuration migration...');

  try {
    // 1. Check if wholesale_config table exists and has the default record
    const existingConfig = await prisma.wholesaleConfig.findUnique({
      where: { id: 'default' },
    });

    if (!existingConfig) {
      console.log('📝 Creating default wholesale configuration...');
      
      // Find an admin user to use as the updater
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      if (!adminUser) {
        throw new Error('No admin user found. Please create an admin user first.');
      }

      // Create default configuration
      await prisma.wholesaleConfig.create({
        data: {
          id: 'default',
          wholesalePrice: 299.00,
          commissionAmount: 25.00,
          isActive: true,
          updatedBy: adminUser.id,
        },
      });

      console.log('✅ Default wholesale configuration created');
    } else {
      console.log('✅ Default wholesale configuration already exists');
    }

    // 2. Update existing wholesale domains to use global pricing
    console.log('📝 Updating existing wholesale domains...');
    
    const updatedDomains = await prisma.wholesaleDomain.updateMany({
      where: {
        configVersion: null,
      },
      data: {
        configVersion: 'default',
      },
    });

    console.log(`✅ Updated ${updatedDomains.count} wholesale domains`);

    // 3. Update existing wholesale sales with commission data
    console.log('📝 Updating existing wholesale sales...');
    
    const updatedSales = await prisma.wholesaleSale.updateMany({
      where: {
        commissionAmount: null,
      },
      data: {
        commissionAmount: 25.00,
        configVersion: 'default',
      },
    });

    console.log(`✅ Updated ${updatedSales.count} wholesale sales`);

    // 4. Calculate seller payouts for existing sales
    console.log('📝 Calculating seller payouts for existing sales...');
    
    const salesToUpdate = await prisma.wholesaleSale.findMany({
      where: {
        sellerPayout: null,
        commissionAmount: { not: null },
      },
    });

    for (const sale of salesToUpdate) {
      const sellerPayout = Number(sale.price) - Number(sale.commissionAmount);
      await prisma.wholesaleSale.update({
        where: { id: sale.id },
        data: { sellerPayout },
      });
    }

    console.log(`✅ Calculated seller payouts for ${salesToUpdate.length} sales`);

    // 5. Create revenue records for existing wholesale sales
    console.log('📝 Creating revenue records for existing wholesale sales...');
    
    const salesWithoutRevenue = await prisma.wholesaleSale.findMany({
      where: {
        commissionAmount: { not: null },
      },
    });

    for (const sale of salesWithoutRevenue) {
      // Check if revenue record already exists
      const existingRevenue = await prisma.platformRevenue.findFirst({
        where: {
          dealId: sale.id,
          revenueType: 'WHOLESALE_FEE',
        },
      });

      if (!existingRevenue) {
        await prisma.platformRevenue.create({
          data: {
            dealId: sale.id,
            revenueType: 'WHOLESALE_FEE',
            amount: sale.commissionAmount,
          },
        });
      }
    }

    console.log(`✅ Created revenue records for ${salesWithoutRevenue.length} sales`);

    // 6. Create seller payout records for existing sales
    console.log('📝 Creating seller payout records for existing wholesale sales...');
    
    const salesWithoutPayouts = await prisma.wholesaleSale.findMany({
      where: {
        sellerPayout: { not: null },
        status: 'COMPLETED',
      },
    });

    for (const sale of salesWithoutPayouts) {
      // Check if payout record already exists
      const existingPayout = await prisma.sellerPayout.findFirst({
        where: {
          dealId: sale.id,
        },
      });

      if (!existingPayout) {
        const payoutDate = new Date();
        payoutDate.setDate(payoutDate.getDate() + 7); // 7 days from now

        await prisma.sellerPayout.create({
          data: {
            sellerId: sale.sellerId,
            dealId: sale.id,
            amount: sale.sellerPayout,
            payoutDate,
            status: 'PENDING',
          },
        });
      }
    }

    console.log(`✅ Created seller payout records for ${salesWithoutPayouts.length} sales`);

    console.log('🎉 Wholesale configuration migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`- Default configuration: ${existingConfig ? 'Already existed' : 'Created'}`);
    console.log(`- Updated domains: ${updatedDomains.count}`);
    console.log(`- Updated sales: ${updatedSales.count}`);
    console.log(`- Calculated payouts: ${salesToUpdate.length}`);
    console.log(`- Created revenue records: ${salesWithoutRevenue.length}`);
    console.log(`- Created payout records: ${salesWithoutPayouts.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
