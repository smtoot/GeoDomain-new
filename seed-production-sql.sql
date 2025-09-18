-- Production Database Seeding SQL Script
-- This script seeds the PostgreSQL production database with demo data

-- 1. Create demo users (with hashed passwords)
-- Note: These are bcrypt hashed passwords for 'admin123', 'seller123', 'buyer123'
INSERT INTO "User" (id, email, name, password, role, status, "emailVerified", "createdAt", "updatedAt") 
VALUES 
('admin-001', 'admin@geodomainland.com', 'Demo Admin', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2', 'ADMIN', 'ACTIVE', NOW(), NOW(), NOW()),
('seller-001', 'seller1@test.com', 'Demo Seller 1', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2', 'SELLER', 'ACTIVE', NOW(), NOW(), NOW()),
('seller-002', 'seller2@test.com', 'Demo Seller 2', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2', 'SELLER', 'ACTIVE', NOW(), NOW(), NOW()),
('buyer-001', 'buyer1@test.com', 'Demo Buyer 1', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2', 'BUYER', 'ACTIVE', NOW(), NOW(), NOW()),
('buyer-002', 'buyer2@test.com', 'Demo Buyer 2', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8Kz2', 'BUYER', 'ACTIVE', NOW(), NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  password = EXCLUDED.password,
  status = EXCLUDED.status,
  "emailVerified" = EXCLUDED."emailVerified",
  "updatedAt" = NOW();

-- 2. Create demo domains
INSERT INTO "Domain" (id, name, price, "priceType", "geographicScope", category, state, city, description, status, "isFeatured", "ownerId", "createdAt", "updatedAt")
VALUES 
('domain-001', 'usahotels.com', 2500, 'FIXED', 'STATE', 'HOSPITALITY', 'California', 'Los Angeles', 'Premium domain for US hotel business - perfect for hotel chains and hospitality companies.', 'VERIFIED', true, 'seller-001', NOW(), NOW()),
('domain-002', 'texasrestaurants.com', 1800, 'FIXED', 'STATE', 'FOOD_AND_BEVERAGE', 'Texas', 'Houston', 'Great domain for Texas restaurant chain - ideal for food service businesses.', 'VERIFIED', false, 'seller-001', NOW(), NOW()),
('domain-003', 'floridarealestate.com', 3200, 'FIXED', 'STATE', 'REAL_ESTATE', 'Florida', 'Miami', 'Perfect for Florida real estate business - premium location-based domain.', 'VERIFIED', true, 'seller-001', NOW(), NOW()),
('domain-004', 'newyorklawyers.com', 2800, 'FIXED', 'STATE', 'LEGAL_SERVICES', 'New York', 'New York', 'Ideal for New York law firm - professional legal services domain.', 'VERIFIED', false, 'seller-001', NOW(), NOW()),
('domain-005', 'californiatech.com', 4500, 'FIXED', 'STATE', 'TECHNOLOGY', 'California', 'San Francisco', 'Premium tech domain for California startups - perfect for Silicon Valley companies.', 'VERIFIED', true, 'seller-002', NOW(), NOW()),
('domain-006', 'chicagobusiness.com', 2200, 'FIXED', 'STATE', 'BUSINESS_SERVICES', 'Illinois', 'Chicago', 'Great for Chicago business services - professional and memorable.', 'VERIFIED', false, 'seller-002', NOW(), NOW()),
('domain-007', 'atlantafitness.com', 1500, 'FIXED', 'STATE', 'HEALTH_AND_FITNESS', 'Georgia', 'Atlanta', 'Perfect for Atlanta fitness centers and health clubs.', 'VERIFIED', false, 'seller-002', NOW(), NOW()),
('domain-008', 'seattlehealthcare.com', 3800, 'FIXED', 'STATE', 'HEALTHCARE', 'Washington', 'Seattle', 'Ideal for Seattle healthcare providers and medical practices.', 'VERIFIED', true, 'seller-002', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  state = EXCLUDED.state,
  city = EXCLUDED.city,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  "isFeatured" = EXCLUDED."isFeatured",
  "updatedAt" = NOW();

-- 3. Create test inquiries
INSERT INTO "Inquiry" (id, "domainId", "buyerId", "sellerId", message, status, "createdAt", "updatedAt")
VALUES 
('inquiry-001', 'domain-001', 'buyer-001', 'seller-001', 'Hi, I am interested in purchasing usahotels.com. Could you provide more details about the domain and its current status?', 'OPEN', NOW(), NOW()),
('inquiry-002', 'domain-002', 'buyer-002', 'seller-001', 'Hello, I would like to know more about texasrestaurants.com. What is the current asking price?', 'OPEN', NOW(), NOW()),
('inquiry-003', 'domain-003', 'buyer-001', 'seller-001', 'I am interested in floridarealestate.com for my real estate business. Please provide more information.', 'OPEN', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  message = EXCLUDED.message,
  status = EXCLUDED.status,
  "updatedAt" = NOW();

-- 4. Create domain analytics for the last 30 days
INSERT INTO "DomainAnalytics" (id, "domainId", date, views, inquiries)
SELECT 
  'analytics-' || d.id || '-' || generate_series(0, 29) as id,
  d.id as "domainId",
  (NOW() - (generate_series(0, 29) || ' days')::interval)::date as date,
  (random() * 50 + 10)::int as views,
  (random() * 5)::int as inquiries
FROM "Domain" d
ON CONFLICT ("domainId", date) DO UPDATE SET
  views = EXCLUDED.views,
  inquiries = EXCLUDED.inquiries;

-- 5. Create wholesale configuration
INSERT INTO "WholesaleConfig" (id, "wholesalePrice", "commissionAmount", "isActive", "createdAt", "updatedAt")
VALUES ('wholesale-config-001', 299.00, 25.00, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  "wholesalePrice" = EXCLUDED."wholesalePrice",
  "commissionAmount" = EXCLUDED."commissionAmount",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Display results
SELECT 'Seeding completed successfully!' as status;
SELECT COUNT(*) as total_users FROM "User";
SELECT COUNT(*) as total_domains FROM "Domain";
SELECT COUNT(*) as total_inquiries FROM "Inquiry";
SELECT COUNT(*) as total_analytics FROM "DomainAnalytics";
