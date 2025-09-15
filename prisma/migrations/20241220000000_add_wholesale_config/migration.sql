-- CreateEnum
CREATE TYPE "RevenueType" AS ENUM ('COMMISSION', 'WHOLESALE_FEE', 'FEATURED_FEE', 'OUTBOUND_FEE');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "wholesale_config" ADD COLUMN     "wholesalePrice" DECIMAL(10,2) DEFAULT 299.00,
ADD COLUMN     "commissionAmount" DECIMAL(10,2) DEFAULT 25.00,
ADD COLUMN     "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "wholesale_domains" ADD COLUMN     "configVersion" TEXT,
ADD COLUMN     "priceOverride" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "wholesale_sales" ADD COLUMN     "configVersion" TEXT,
ADD COLUMN     "commissionAmount" DECIMAL(10,2),
ADD COLUMN     "sellerPayout" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "platform_revenue" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "revenueType" "RevenueType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,4),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_revenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_payouts" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payoutDate" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "platform_revenue_dealId_idx" ON "platform_revenue"("dealId");

-- CreateIndex
CREATE INDEX "platform_revenue_revenueType_idx" ON "platform_revenue"("revenueType");

-- CreateIndex
CREATE INDEX "platform_revenue_createdAt_idx" ON "platform_revenue"("createdAt");

-- CreateIndex
CREATE INDEX "seller_payouts_sellerId_idx" ON "seller_payouts"("sellerId");

-- CreateIndex
CREATE INDEX "seller_payouts_dealId_idx" ON "seller_payouts"("dealId");

-- CreateIndex
CREATE INDEX "seller_payouts_status_idx" ON "seller_payouts"("status");

-- CreateIndex
CREATE INDEX "seller_payouts_payoutDate_idx" ON "seller_payouts"("payoutDate");

-- AddForeignKey
ALTER TABLE "seller_payouts" ADD CONSTRAINT "seller_payouts_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default wholesale configuration
INSERT INTO "wholesale_config" ("id", "wholesalePrice", "commissionAmount", "isActive", "updatedBy", "updatedAt", "createdAt") 
VALUES ('default', 299.00, 25.00, true, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Update existing wholesale domains to use global pricing
UPDATE "wholesale_domains" 
SET "configVersion" = 'default'
WHERE "configVersion" IS NULL;

-- Update existing wholesale sales with commission data
UPDATE "wholesale_sales" 
SET "commissionAmount" = 25.00, 
    "sellerPayout" = "price" - 25.00, 
    "configVersion" = 'default'
WHERE "commissionAmount" IS NULL;
