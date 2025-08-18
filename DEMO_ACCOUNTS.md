# 🎯 Demo Accounts for GeoDomainLand Testing

This document provides information about the demo accounts available for testing the GeoDomainLand platform.

## 📋 Available Demo Accounts

### 🔐 Admin Accounts
These accounts have full administrative access to the platform:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@geodomainland.com` | `admin123` | Admin | Standard admin user with moderation capabilities |
| `superadmin@geodomainland.com` | `superadmin123` | Super Admin | Super admin with full system access |

### 🏪 Seller Accounts
These accounts can list and sell domains:

| Email | Password | Role | Company | Description |
|-------|----------|------|---------|-------------|
| `seller1@test.com` | `seller123` | Seller | Tech Domains Inc. | John Seller - Technology domains |
| `seller2@test.com` | `seller123` | Seller | Premium Domains LLC | Jane DomainOwner - Premium domains |
| `seller3@test.com` | `seller123` | Seller | Domain Empire | Mike DomainTrader - Various domains |

### 🛒 Buyer Accounts
These accounts can browse domains and submit inquiries:

| Email | Password | Role | Company | Description |
|-------|----------|------|---------|-------------|
| `buyer1@test.com` | `buyer123` | Buyer | Startup Ventures | Alice Buyer - Startup investor |
| `buyer2@test.com` | `buyer123` | Buyer | Investment Group | Bob Investor - Investment professional |
| `buyer3@test.com` | `buyer123` | Buyer | Innovation Labs | Carol Entrepreneur - Innovation company |

## 🎮 How to Use Demo Accounts

### 1. **Admin Testing**
- **Login**: Use admin accounts to test moderation features
- **Features to test**:
  - User management
  - Domain moderation
  - Inquiry moderation
  - Message moderation
  - Deal management
  - Payment verification
  - System analytics

### 2. **Seller Testing**
- **Login**: Use seller accounts to test seller features
- **Features to test**:
  - Domain listing creation
  - Domain management
  - Inquiry responses
  - Analytics dashboard
  - Deal management
  - Revenue tracking

### 3. **Buyer Testing**
- **Login**: Use buyer accounts to test buyer features
- **Features to test**:
  - Domain browsing
  - Search and filtering
  - Inquiry submission
  - Message communication
  - Deal tracking
  - Purchase history

## 📊 Test Data Available

### Domains
The system includes 10 test domains across various industries:
- **Technology**: techstartup.com, techsolutions.com
- **Real Estate**: realestatepro.com
- **Healthcare**: healthcareplus.com
- **Finance**: financehub.com, cryptotrader.com
- **Food & Beverage**: restaurantguide.com
- **Education**: educationonline.com
- **Automotive**: automotivepro.com
- **Health & Fitness**: fitnesspro.com

### Inquiries & Deals
- **5 test inquiries** in various states (pending, approved, forwarded)
- **2 test deals** in different stages (agreed, payment pending)
- **Test messages** between buyers and sellers

### Analytics Data
- **30 days of analytics** for each domain
- **Realistic view and inquiry data**
- **Performance metrics** for testing dashboards

## 🧪 Testing Scenarios

### Scenario 1: Complete Purchase Flow
1. Login as `buyer1@test.com`
2. Browse domains and find one of interest
3. Submit an inquiry
4. Login as admin to moderate the inquiry
5. Login as seller to respond to the inquiry
6. Complete the deal process

### Scenario 2: Admin Moderation
1. Login as `admin@geodomainland.com`
2. Review pending inquiries
3. Approve or reject inquiries
4. Moderate messages
5. Manage deals and payments

### Scenario 3: Seller Dashboard
1. Login as `seller1@test.com`
2. View domain analytics
3. Manage domain listings
4. Respond to inquiries
5. Track revenue and performance

### Scenario 4: Buyer Experience
1. Login as `buyer2@test.com`
2. Search for domains
3. Submit multiple inquiries
4. Track inquiry status
5. Communicate with sellers

## 🔄 Resetting Demo Data

To reset the demo data to its initial state, run:

```bash
# Clear the database
npx prisma db push --force-reset

# Re-seed with demo data
npx tsx prisma/seed.ts
```

## ⚠️ Important Notes

- **Demo accounts are for testing only** - Do not use in production
- **Passwords are simple** - These are demo accounts with basic passwords
- **Data is reset** - Demo data may be reset during development
- **No real transactions** - All deals and payments are simulated
- **Admin moderation** - All inquiries and messages go through admin review

## 🎯 Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Choose a demo account** based on what you want to test

3. **Login** using the credentials above

4. **Explore the features** relevant to that user role

5. **Test different scenarios** using multiple accounts

## 📞 Support

If you encounter any issues with the demo accounts or need help testing specific features, please refer to the main documentation or contact the development team.

---

**Happy Testing! 🚀**
