import { prisma } from '@/lib/prisma';
import { WholesaleConfigService, WholesalePricingSummary } from './wholesale-config.service';

export interface WholesaleAnalytics {
  totalSales: number;
  totalRevenue: number;
  wholesalePrice: number;
  commissionAmount: number;
  sellerPayout: number;
  topSellingCategories: CategorySales[];
}

export interface CategorySales {
  category: string;
  sales: number;
}

export class WholesaleSaleService {
  /**
   * Process a wholesale sale with current configuration
   */
  static async processSale(wholesaleSaleId: string): Promise<void> {
    const wholesaleSale = await prisma.wholesaleSale.findUnique({
      where: { id: wholesaleSaleId },
      include: { 
        domain: true,
        wholesaleDomain: true,
      },
    });

    if (!wholesaleSale) {
      throw new Error('Wholesale sale not found');
    }

    // Get current configuration
    const config = await WholesaleConfigService.getConfig();

    // Calculate amounts
    const commissionAmount = config.commissionAmount;
    const sellerPayout = config.wholesalePrice - config.commissionAmount;
    const payoutDate = new Date();
    payoutDate.setDate(payoutDate.getDate() + 7); // 7 days

    // Update wholesale sale with configuration data
    await prisma.wholesaleSale.update({
      where: { id: wholesaleSaleId },
      data: {
        configVersion: config.id,
        commissionAmount: commissionAmount,
        sellerPayout: sellerPayout,
        price: config.wholesalePrice, // Update to current wholesale price
      },
    });

    // Create revenue record
    await prisma.platformRevenue.create({
      data: {
        dealId: wholesaleSaleId,
        revenueType: 'WHOLESALE_FEE',
        amount: commissionAmount,
      },
    });

    // Schedule seller payout
    await prisma.sellerPayout.create({
      data: {
        sellerId: wholesaleSale.sellerId,
        dealId: wholesaleSaleId,
        amount: sellerPayout,
        payoutDate,
        status: 'PENDING',
      },
    });
  }

  /**
   * Get wholesale pricing summary
   */
  static async getPricingSummary(): Promise<WholesalePricingSummary> {
    const config = await WholesaleConfigService.getConfig();
    
    const domains = await prisma.wholesaleDomain.findMany({
      include: { domain: true },
    });

    const totalRevenue = await prisma.platformRevenue.aggregate({
      where: { revenueType: 'WHOLESALE_FEE' },
      _sum: { amount: true },
    });

    return {
      totalDomains: domains.length,
      wholesalePrice: config.wholesalePrice,
      commissionAmount: config.commissionAmount,
      sellerPayout: config.wholesalePrice - config.commissionAmount,
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      lastUpdated: config.updatedAt,
    };
  }

  /**
   * Get wholesale analytics
   */
  static async getWholesaleAnalytics(): Promise<WholesaleAnalytics> {
    const config = await WholesaleConfigService.getConfig();
    
    const sales = await prisma.wholesaleSale.findMany({
      include: { 
        domain: true,
        wholesaleDomain: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const revenue = await prisma.platformRevenue.aggregate({
      where: { revenueType: 'WHOLESALE_FEE' },
      _sum: { amount: true },
    });

    return {
      totalSales: sales.length,
      totalRevenue: Number(revenue._sum.amount) || 0,
      wholesalePrice: config.wholesalePrice,
      commissionAmount: config.commissionAmount,
      sellerPayout: config.wholesalePrice - config.commissionAmount,
      topSellingCategories: this.getTopSellingCategories(sales),
    };
  }

  /**
   * Get top selling categories
   */
  private static getTopSellingCategories(sales: any[]): CategorySales[] {
    const categoryMap = new Map<string, number>();
    
    sales.forEach(sale => {
      const category = sale.domain.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, sales: count }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 10);
  }

  /**
   * Create a new wholesale sale
   */
  static async createWholesaleSale(
    wholesaleDomainId: string,
    buyerId: string,
    paymentMethod: string
  ): Promise<string> {
    // Get the wholesale domain
    const wholesaleDomain = await prisma.wholesaleDomain.findUnique({
      where: { id: wholesaleDomainId },
      include: { domain: true },
    });

    if (!wholesaleDomain) {
      throw new Error('Wholesale domain not found');
    }

    if (wholesaleDomain.status !== 'ACTIVE') {
      throw new Error('Wholesale domain is not available for sale');
    }

    // Get current configuration
    const config = await WholesaleConfigService.getConfig();

    // Create the sale
    const sale = await prisma.wholesaleSale.create({
      data: {
        wholesaleDomainId,
        buyerId,
        sellerId: wholesaleDomain.domain.ownerId,
        price: config.wholesalePrice,
        paymentMethod,
        configVersion: config.id,
        commissionAmount: config.commissionAmount,
        sellerPayout: config.wholesalePrice - config.commissionAmount,
      },
    });

    // Update wholesale domain status
    await prisma.wholesaleDomain.update({
      where: { id: wholesaleDomainId },
      data: {
        status: 'SOLD',
        soldAt: new Date(),
        soldTo: buyerId,
      },
    });

    return sale.id;
  }

  /**
   * Complete a wholesale sale (mark as paid and process)
   */
  static async completeWholesaleSale(wholesaleSaleId: string): Promise<void> {
    const sale = await prisma.wholesaleSale.findUnique({
      where: { id: wholesaleSaleId },
    });

    if (!sale) {
      throw new Error('Wholesale sale not found');
    }

    if (sale.status !== 'PENDING') {
      throw new Error('Sale is not in pending status');
    }

    // Update sale status
    await prisma.wholesaleSale.update({
      where: { id: wholesaleSaleId },
      data: {
        status: 'PAID',
        completedAt: new Date(),
      },
    });

    // Process the sale (create revenue and payout records)
    await this.processSale(wholesaleSaleId);
  }
}
