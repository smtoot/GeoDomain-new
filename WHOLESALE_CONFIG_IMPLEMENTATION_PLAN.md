# 🚀 **GLOBAL WHOLESALE CONFIGURATION - DETAILED IMPLEMENTATION PLAN**

## 📋 **OVERVIEW**

### **What We're Building:**
- **Global Wholesale Price**: One price for ALL wholesale domains (default: $299)
- **Global Commission Amount**: One commission for ALL wholesale sales (default: $25)
- **Admin Interface**: Simple page to update both values
- **Automatic Calculations**: Seller payout = Wholesale price - Commission

### **Default Configuration:**
- **Wholesale Price**: $299
- **Commission**: $25
- **Seller Payout**: $274
- **Platform Revenue**: $25 per sale

---

## 🎯 **PHASE 1: DATABASE & BACKEND (Week 1)**

### **Step 1.1: Database Schema Updates**

#### **Create Wholesale Configuration Table**
```sql
-- Global wholesale configuration table
CREATE TABLE wholesale_config (
  id VARCHAR(255) PRIMARY KEY,
  wholesale_price DECIMAL(10,2) NOT NULL DEFAULT 299.00,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default configuration
INSERT INTO wholesale_config (id, wholesale_price, commission_amount, updated_by) 
VALUES ('default', 299.00, 25.00, 'admin');
```

#### **Update Existing Tables (if needed)**
```sql
-- Add configuration tracking to wholesale domains
ALTER TABLE wholesale_domains ADD COLUMN config_version VARCHAR(255);
ALTER TABLE wholesale_domains ADD COLUMN price_override DECIMAL(10,2) NULL;

-- Add configuration tracking to wholesale sales
ALTER TABLE wholesale_sales ADD COLUMN config_version VARCHAR(255);
ALTER TABLE wholesale_sales ADD COLUMN commission_amount DECIMAL(10,2);
ALTER TABLE wholesale_sales ADD COLUMN seller_payout DECIMAL(10,2);
```

### **Step 1.2: Prisma Schema Updates**

#### **Add to schema.prisma**
```prisma
model WholesaleConfig {
  id               String   @id @default("default")
  wholesalePrice   Decimal  @default(299.00) @db.Decimal(10, 2)
  commissionAmount Decimal  @default(25.00) @db.Decimal(10, 2)
  isActive         Boolean  @default(true)
  updatedBy        String
  updatedAt        DateTime @updatedAt
  createdAt        DateTime @default(now())
  
  // Relations
  updatedByUser    User     @relation("WholesaleConfigUpdatedBy", fields: [updatedBy], references: [id])
  
  @@map("wholesale_config")
}

// Update existing models
model WholesaleDomain {
  // ... existing fields ...
  configVersion    String?
  priceOverride    Decimal? @db.Decimal(10, 2)
  
  @@map("wholesale_domains")
}

model WholesaleSale {
  // ... existing fields ...
  configVersion    String?
  commissionAmount Decimal? @db.Decimal(10, 2)
  sellerPayout     Decimal? @db.Decimal(10, 2)
  
  @@map("wholesale_sales")
}
```

### **Step 1.3: Backend Services**

#### **Wholesale Configuration Service**
```typescript
// src/lib/services/wholesale-config.service.ts
import { prisma } from '@/lib/prisma';

export interface WholesaleConfig {
  id: string;
  wholesalePrice: number;
  commissionAmount: number;
  isActive: boolean;
  updatedBy: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface WholesaleConfigUpdate {
  wholesalePrice: number;
  commissionAmount: number;
  updatedBy: string;
}

export class WholesaleConfigService {
  /**
   * Get current active wholesale configuration
   */
  static async getConfig(): Promise<WholesaleConfig> {
    const config = await prisma.wholesaleConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) {
      throw new Error('Wholesale configuration not found');
    }

    return {
      id: config.id,
      wholesalePrice: Number(config.wholesalePrice),
      commissionAmount: Number(config.commissionAmount),
      isActive: config.isActive,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
      createdAt: config.createdAt,
    };
  }

  /**
   * Update wholesale configuration
   */
  static async updateConfig(update: WholesaleConfigUpdate): Promise<WholesaleConfig> {
    // Validate inputs
    if (update.wholesalePrice < 50) {
      throw new Error('Wholesale price must be at least $50');
    }
    if (update.commissionAmount < 1) {
      throw new Error('Commission amount must be at least $1');
    }
    if (update.commissionAmount >= update.wholesalePrice) {
      throw new Error('Commission amount must be less than wholesale price');
    }

    // Update configuration
    const config = await prisma.wholesaleConfig.update({
      where: { id: 'default' },
      data: {
        wholesalePrice: update.wholesalePrice,
        commissionAmount: update.commissionAmount,
        updatedBy: update.updatedBy,
        updatedAt: new Date(),
      },
    });

    return {
      id: config.id,
      wholesalePrice: Number(config.wholesalePrice),
      commissionAmount: Number(config.commissionAmount),
      isActive: config.isActive,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
      createdAt: config.createdAt,
    };
  }

  /**
   * Get configuration history (optional)
   */
  static async getConfigHistory(): Promise<WholesaleConfig[]> {
    const configs = await prisma.wholesaleConfig.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return configs.map(config => ({
      id: config.id,
      wholesalePrice: Number(config.wholesalePrice),
      commissionAmount: Number(config.commissionAmount),
      isActive: config.isActive,
      updatedBy: config.updatedBy,
      updatedAt: config.updatedAt,
      createdAt: config.createdAt,
    }));
  }
}
```

#### **Wholesale Sale Processing Service**
```typescript
// src/lib/services/wholesale-sale.service.ts
import { prisma } from '@/lib/prisma';
import { WholesaleConfigService } from './wholesale-config.service';

export class WholesaleSaleService {
  /**
   * Process a wholesale sale with current configuration
   */
  static async processSale(wholesaleSaleId: string): Promise<void> {
    const wholesaleSale = await prisma.wholesaleSale.findUnique({
      where: { id: wholesaleSaleId },
      include: { domain: true },
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
}
```

---

## 🎯 **PHASE 2: tRPC API ENDPOINTS (Week 1)**

### **Step 2.1: Create tRPC Router**

#### **Wholesale Config Router**
```typescript
// src/server/api/routers/wholesale-config.ts
import { z } from 'zod';
import { createTRPCRouter, adminProcedure, protectedProcedure } from '@/server/api/trpc';
import { WholesaleConfigService } from '@/lib/services/wholesale-config.service';
import { WholesaleSaleService } from '@/lib/services/wholesale-sale.service';

export const wholesaleConfigRouter = createTRPCRouter({
  // Get current configuration
  getConfig: protectedProcedure.query(async () => {
    return await WholesaleConfigService.getConfig();
  }),

  // Update configuration (admin only)
  updateConfig: adminProcedure
    .input(
      z.object({
        wholesalePrice: z.number().min(50, 'Wholesale price must be at least $50'),
        commissionAmount: z.number().min(1, 'Commission amount must be at least $1'),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return await WholesaleConfigService.updateConfig({
        wholesalePrice: input.wholesalePrice,
        commissionAmount: input.commissionAmount,
        updatedBy: ctx.session.user.id,
      });
    }),

  // Get configuration history (admin only)
  getConfigHistory: adminProcedure.query(async () => {
    return await WholesaleConfigService.getConfigHistory();
  }),

  // Get pricing summary
  getPricingSummary: protectedProcedure.query(async () => {
    return await WholesaleSaleService.getPricingSummary();
  }),

  // Process wholesale sale
  processSale: adminProcedure
    .input(z.object({ wholesaleSaleId: z.string() }))
    .mutation(async ({ input }) => {
      await WholesaleSaleService.processSale(input.wholesaleSaleId);
      return { success: true };
    }),
});
```

### **Step 2.2: Update Main Router**
```typescript
// src/server/api/root.ts
import { wholesaleConfigRouter } from './routers/wholesale-config';

export const appRouter = createTRPCRouter({
  // ... existing routers ...
  wholesaleConfig: wholesaleConfigRouter,
});
```

---

## 🎯 **PHASE 3: ADMIN INTERFACE (Week 2)**

### **Step 3.1: Admin Wholesale Config Page**

#### **Create Admin Page**
```typescript
// src/app/admin/wholesale-config/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, DollarSign, Percent } from 'lucide-react';

export default function AdminWholesaleConfigPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [wholesalePrice, setWholesalePrice] = useState<number>(299);
  const [commissionAmount, setCommissionAmount] = useState<number>(25);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get current configuration
  const { data: config, isLoading: configLoading } = api.wholesaleConfig.getConfig.useQuery();
  
  // Get pricing summary
  const { data: summary, isLoading: summaryLoading } = api.wholesaleConfig.getPricingSummary.useQuery();

  // Update configuration mutation
  const updateConfig = api.wholesaleConfig.updateConfig.useMutation({
    onSuccess: () => {
      setSuccess('Configuration updated successfully!');
      setError(null);
      setIsUpdating(false);
      // Refresh data
      window.location.reload();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess(null);
      setIsUpdating(false);
    },
  });

  // Initialize form with current config
  useState(() => {
    if (config) {
      setWholesalePrice(config.wholesalePrice);
      setCommissionAmount(config.commissionAmount);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsUpdating(true);

    try {
      await updateConfig.mutateAsync({
        wholesalePrice,
        commissionAmount,
      });
    } catch (error) {
      // Error handled in onError
    }
  };

  const sellerPayout = wholesalePrice - commissionAmount;

  if (configLoading || summaryLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wholesale Configuration</h1>
          <p className="text-muted-foreground">
            Manage global wholesale pricing and commission settings
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Update Configuration
            </CardTitle>
            <CardDescription>
              Set the global wholesale price and commission amount
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Wholesale Price ($)</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    min="50"
                    step="0.01"
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    placeholder="299.00"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    This price will apply to ALL wholesale domains
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionAmount">Commission Amount ($)</Label>
                  <Input
                    id="commissionAmount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(Number(e.target.value))}
                    placeholder="25.00"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Platform commission per wholesale sale
                  </p>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Calculation Preview:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Wholesale Price:</span>
                      <span className="font-medium">${wholesalePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commission:</span>
                      <span className="font-medium">-${commissionAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span>Seller Payout:</span>
                      <span className="font-bold text-green-600">${sellerPayout.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Configuration
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Current Configuration & Summary */}
        <div className="space-y-6">
          {/* Current Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
              <CardDescription>
                Last updated: {config?.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : 'Never'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Wholesale Price:</span>
                  <span className="text-lg font-bold">${config?.wholesalePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Commission:</span>
                  <span className="text-lg font-bold">${config?.commissionAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm font-medium">Seller Payout:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${((config?.wholesalePrice || 0) - (config?.commissionAmount || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Summary Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Wholesale Domains:</span>
                  <span className="text-lg font-bold">{summary?.totalDomains || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total Revenue:</span>
                  <span className="text-lg font-bold text-green-600">
                    ${summary?.totalRevenue.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Revenue per Sale:</span>
                  <span className="text-lg font-bold">
                    ${summary?.commissionAmount.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### **Step 3.2: Add to Admin Navigation**

#### **Update Admin Sidebar**
```typescript
// src/components/admin/admin-sidebar.tsx
// Add to the navigation items:
{
  title: 'Wholesale Config',
  href: '/admin/wholesale-config',
  icon: DollarSign,
  description: 'Manage wholesale pricing'
}
```

---

## 🎯 **PHASE 4: INTEGRATION & TESTING (Week 2)**

### **Step 4.1: Update Existing Wholesale Components**

#### **Update Wholesale Domain Cards**
```typescript
// src/components/wholesale/wholesale-domain-card.tsx
// Update to use global configuration
const { data: config } = api.wholesaleConfig.getConfig.useQuery();

// Display price from config instead of individual domain price
const displayPrice = config?.wholesalePrice || 299;
```

#### **Update Wholesale Purchase Flow**
```typescript
// src/components/wholesale/wholesale-purchase-modal.tsx
// Update to use global configuration for pricing
const { data: config } = api.wholesaleConfig.getConfig.useQuery();

const handlePurchase = async () => {
  // Use config.wholesalePrice and config.commissionAmount
  await processWholesaleSale({
    domainId,
    price: config.wholesalePrice,
    commissionAmount: config.commissionAmount,
  });
};
```

### **Step 4.2: Database Migration**

#### **Migration Script**
```typescript
// prisma/migrations/xxx_add_wholesale_config/migration.sql
-- Create wholesale_config table
CREATE TABLE wholesale_config (
  id VARCHAR(255) PRIMARY KEY,
  wholesale_price DECIMAL(10,2) NOT NULL DEFAULT 299.00,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 25.00,
  is_active BOOLEAN DEFAULT TRUE,
  updated_by VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default configuration
INSERT INTO wholesale_config (id, wholesale_price, commission_amount, updated_by) 
VALUES ('default', 299.00, 25.00, 'admin');

-- Update existing wholesale domains to use global pricing
UPDATE wholesale_domains 
SET price = 299.00, config_version = 'default'
WHERE price IS NULL OR price != 299.00;

-- Update existing wholesale sales with commission data
UPDATE wholesale_sales 
SET commission_amount = 25.00, seller_payout = 274.00, config_version = 'default'
WHERE commission_amount IS NULL;
```

### **Step 4.3: Testing Checklist**

#### **Functional Testing**
- [ ] Admin can view current configuration
- [ ] Admin can update wholesale price
- [ ] Admin can update commission amount
- [ ] Form validation works correctly
- [ ] Configuration changes are saved to database
- [ ] New wholesale sales use updated configuration
- [ ] Seller payouts are calculated correctly
- [ ] Revenue tracking works with new configuration

#### **Integration Testing**
- [ ] Wholesale domain cards show correct price
- [ ] Purchase flow uses correct pricing
- [ ] Commission calculations are accurate
- [ ] Seller payouts are scheduled correctly
- [ ] Revenue records are created properly

#### **Edge Case Testing**
- [ ] Commission amount cannot exceed wholesale price
- [ ] Wholesale price cannot be below $50
- [ ] Commission amount cannot be below $1
- [ ] Configuration updates are logged properly
- [ ] Multiple admins can update configuration

---

## 🎯 **PHASE 5: DEPLOYMENT & MONITORING (Week 3)**

### **Step 5.1: Production Deployment**

#### **Deployment Checklist**
- [ ] Database migration executed
- [ ] Default configuration inserted
- [ ] Admin interface accessible
- [ ] All existing wholesale domains updated
- [ ] Revenue tracking functional
- [ ] Seller payout system working

### **Step 5.2: Monitoring & Analytics**

#### **Key Metrics to Track**
- [ ] Configuration update frequency
- [ ] Wholesale sales volume
- [ ] Commission collection rate
- [ ] Seller payout processing time
- [ ] Revenue per wholesale sale
- [ ] Admin usage of configuration interface

---

## 📊 **IMPLEMENTATION TIMELINE**

### **Week 1: Backend & API**
- **Day 1-2**: Database schema and Prisma updates
- **Day 3-4**: Backend services implementation
- **Day 5**: tRPC API endpoints
- **Day 6-7**: Testing and bug fixes

### **Week 2: Frontend & Integration**
- **Day 1-2**: Admin interface development
- **Day 3-4**: Integration with existing components
- **Day 5**: Database migration
- **Day 6-7**: Testing and refinement

### **Week 3: Deployment & Monitoring**
- **Day 1-2**: Production deployment
- **Day 3-4**: Monitoring setup
- **Day 5-7**: Performance optimization and bug fixes

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements**
- ✅ Admin can set global wholesale price
- ✅ Admin can set global commission amount
- ✅ All wholesale domains use same price
- ✅ All wholesale sales use same commission
- ✅ Seller payouts calculated automatically
- ✅ Revenue tracking works correctly

### **Performance Requirements**
- ✅ Configuration updates complete in <2 seconds
- ✅ Wholesale sales process in <5 seconds
- ✅ Admin interface loads in <3 seconds
- ✅ Database queries optimized

### **User Experience Requirements**
- ✅ Simple, intuitive admin interface
- ✅ Clear pricing calculations
- ✅ Immediate feedback on updates
- ✅ Error handling and validation

---

## 🚀 **READY FOR IMPLEMENTATION**

This detailed plan provides:
- **Clear step-by-step implementation**
- **Specific code examples**
- **Database schema changes**
- **Testing procedures**
- **Deployment checklist**
- **Success criteria**

**Total Implementation Time**: 3 weeks
**Complexity**: Medium
**Risk Level**: Low (well-defined scope)

**Are you ready to proceed with this implementation plan?** 🎯
