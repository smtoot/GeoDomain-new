-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_adminId_idx" ON "audit_logs"("adminId");

-- CreateIndex
CREATE INDEX "audit_logs_action_createdAt_idx" ON "audit_logs"("action", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "deals_status_createdAt_idx" ON "deals"("status", "createdAt");

-- CreateIndex
CREATE INDEX "deals_inquiryId_idx" ON "deals"("inquiryId");

-- CreateIndex
CREATE INDEX "deals_buyerId_status_idx" ON "deals"("buyerId", "status");

-- CreateIndex
CREATE INDEX "deals_sellerId_status_idx" ON "deals"("sellerId", "status");

-- CreateIndex
CREATE INDEX "deals_domainId_idx" ON "deals"("domainId");

-- CreateIndex
CREATE INDEX "domain_analytics_domainId_date_idx" ON "domain_analytics"("domainId", "date");

-- CreateIndex
CREATE INDEX "domain_analytics_date_idx" ON "domain_analytics"("date");

-- CreateIndex
CREATE INDEX "domain_transfers_dealId_idx" ON "domain_transfers"("dealId");

-- CreateIndex
CREATE INDEX "domain_transfers_domainId_idx" ON "domain_transfers"("domainId");

-- CreateIndex
CREATE INDEX "domain_transfers_status_createdAt_idx" ON "domain_transfers"("status", "createdAt");

-- CreateIndex
CREATE INDEX "domains_status_createdAt_idx" ON "domains"("status", "createdAt");

-- CreateIndex
CREATE INDEX "domains_geographicScope_state_city_idx" ON "domains"("geographicScope", "state", "city");

-- CreateIndex
CREATE INDEX "domains_category_price_idx" ON "domains"("category", "price");

-- CreateIndex
CREATE INDEX "domains_ownerId_status_idx" ON "domains"("ownerId", "status");

-- CreateIndex
CREATE INDEX "domains_name_idx" ON "domains"("name");

-- CreateIndex
CREATE INDEX "domains_publishedAt_idx" ON "domains"("publishedAt");

-- CreateIndex
CREATE INDEX "feature_flags_name_idx" ON "feature_flags"("name");

-- CreateIndex
CREATE INDEX "feature_flags_enabled_idx" ON "feature_flags"("enabled");

-- CreateIndex
CREATE INDEX "file_attachments_messageId_idx" ON "file_attachments"("messageId");

-- CreateIndex
CREATE INDEX "file_attachments_status_createdAt_idx" ON "file_attachments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "inquiries_status_createdAt_idx" ON "inquiries"("status", "createdAt");

-- CreateIndex
CREATE INDEX "inquiries_domainId_status_idx" ON "inquiries"("domainId", "status");

-- CreateIndex
CREATE INDEX "inquiries_sellerId_status_idx" ON "inquiries"("sellerId", "status");

-- CreateIndex
CREATE INDEX "inquiries_buyerId_status_idx" ON "inquiries"("buyerId", "status");

-- CreateIndex
CREATE INDEX "inquiries_buyerEmail_idx" ON "inquiries"("buyerEmail");

-- CreateIndex
CREATE INDEX "inquiry_moderations_inquiryId_idx" ON "inquiry_moderations"("inquiryId");

-- CreateIndex
CREATE INDEX "inquiry_moderations_status_priority_idx" ON "inquiry_moderations"("status", "priority");

-- CreateIndex
CREATE INDEX "inquiry_moderations_reviewDate_idx" ON "inquiry_moderations"("reviewDate");

-- CreateIndex
CREATE INDEX "message_moderations_messageId_idx" ON "message_moderations"("messageId");

-- CreateIndex
CREATE INDEX "message_moderations_status_reviewDate_idx" ON "message_moderations"("status", "reviewDate");

-- CreateIndex
CREATE INDEX "messages_inquiryId_sentDate_idx" ON "messages"("inquiryId", "sentDate");

-- CreateIndex
CREATE INDEX "messages_senderId_status_idx" ON "messages"("senderId", "status");

-- CreateIndex
CREATE INDEX "messages_receiverId_status_idx" ON "messages"("receiverId", "status");

-- CreateIndex
CREATE INDEX "messages_status_sentDate_idx" ON "messages"("status", "sentDate");

-- CreateIndex
CREATE INDEX "payments_dealId_idx" ON "payments"("dealId");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE INDEX "payments_externalReference_idx" ON "payments"("externalReference");

-- CreateIndex
CREATE INDEX "transactions_dealId_idx" ON "transactions"("dealId");

-- CreateIndex
CREATE INDEX "transactions_domainId_idx" ON "transactions"("domainId");

-- CreateIndex
CREATE INDEX "transactions_buyerId_idx" ON "transactions"("buyerId");

-- CreateIndex
CREATE INDEX "transactions_status_createdAt_idx" ON "transactions"("status", "createdAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_status_idx" ON "users"("role", "status");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "verification_attempts_domainId_idx" ON "verification_attempts"("domainId");

-- CreateIndex
CREATE INDEX "verification_attempts_status_createdAt_idx" ON "verification_attempts"("status", "createdAt");

-- CreateIndex
CREATE INDEX "verification_attempts_token_idx" ON "verification_attempts"("token");
