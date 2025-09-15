-- Phase 1: Hybrid Inquiry System Foundation
-- This migration adds new statuses and fields for the hybrid inquiry system
-- All changes are backward compatible and non-breaking

-- Add new inquiry statuses to existing enum
ALTER TYPE "InquiryStatus" ADD VALUE 'OPEN';
ALTER TYPE "InquiryStatus" ADD VALUE 'CONVERTED_TO_DEAL';
ALTER TYPE "InquiryStatus" ADD VALUE 'CLOSED';

-- Add new message statuses to existing enum
ALTER TYPE "MessageStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "MessageStatus" ADD VALUE 'FLAGGED';

-- Add optional fields to inquiries table (non-breaking)
ALTER TABLE "inquiries" ADD COLUMN "converted_deal_id" TEXT;
ALTER TABLE "inquiries" ADD COLUMN "direct_messaging_enabled" BOOLEAN DEFAULT FALSE;

-- Add optional fields to messages table (non-breaking)
ALTER TABLE "messages" ADD COLUMN "flagged" BOOLEAN DEFAULT FALSE;
ALTER TABLE "messages" ADD COLUMN "flagged_reason" TEXT;
ALTER TABLE "messages" ADD COLUMN "contact_info_detected" BOOLEAN DEFAULT FALSE;

-- Create new inquiry_deals table (separate from existing system)
CREATE TABLE "inquiry_deals" (
  "id" TEXT NOT NULL,
  "inquiry_id" TEXT NOT NULL,
  "domain_id" TEXT NOT NULL,
  "buyer_id" TEXT NOT NULL,
  "seller_id" TEXT NOT NULL,
  "amount" DECIMAL(10,2),
  "status" TEXT DEFAULT 'NEGOTIATING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TIMESTAMP(3),
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "inquiry_deals_pkey" PRIMARY KEY ("id")
);

-- Create indexes for new table
CREATE INDEX "inquiry_deals_inquiry_id_idx" ON "inquiry_deals"("inquiry_id");
CREATE INDEX "inquiry_deals_domain_id_idx" ON "inquiry_deals"("domain_id");
CREATE INDEX "inquiry_deals_buyer_id_idx" ON "inquiry_deals"("buyer_id");
CREATE INDEX "inquiry_deals_seller_id_idx" ON "inquiry_deals"("seller_id");
CREATE INDEX "inquiry_deals_status_idx" ON "inquiry_deals"("status");
CREATE INDEX "inquiry_deals_created_at_idx" ON "inquiry_deals"("created_at");

-- Add foreign key constraints
ALTER TABLE "inquiry_deals" ADD CONSTRAINT "inquiry_deals_inquiry_id_fkey" FOREIGN KEY ("inquiry_id") REFERENCES "inquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiry_deals" ADD CONSTRAINT "inquiry_deals_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiry_deals" ADD CONSTRAINT "inquiry_deals_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inquiry_deals" ADD CONSTRAINT "inquiry_deals_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for flagged messages
CREATE INDEX "messages_flagged_idx" ON "messages"("flagged");
CREATE INDEX "messages_contact_info_detected_idx" ON "messages"("contact_info_detected");
