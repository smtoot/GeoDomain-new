-- Remove message moderation system
-- This migration removes the message_moderations table and related functionality

-- Drop the message_moderations table
DROP TABLE IF EXISTS "message_moderations";

-- Note: MessageStatus enum values (REJECTED, EDITED) are removed in schema
-- but we keep DELIVERED, FLAGGED, BLOCKED for the simplified system
