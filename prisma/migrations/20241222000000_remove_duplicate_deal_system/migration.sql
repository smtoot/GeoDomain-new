-- Remove Duplicate Deal System
-- This migration removes the unused InquiryDeal model and related fields

-- Drop the inquiry_deals table and all its constraints
DROP TABLE IF EXISTS "inquiry_deals" CASCADE;

-- Remove the converted_deal_id field from inquiries table
ALTER TABLE "inquiries" DROP COLUMN IF EXISTS "converted_deal_id";

-- Note: The Deal model remains as the unified deal system
-- All existing functionality continues to work through the Deal model
