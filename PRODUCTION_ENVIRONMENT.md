# 🚨 PRODUCTION ENVIRONMENT CONFIGURATION

## ⚠️ CRITICAL: DO NOT DELETE OR MODIFY THIS FILE

This file contains essential production environment details that MUST be preserved and referenced for all production operations.

---

## 📊 **Production Database Configuration**

### **Database URL**

```
postgres://c16dd8c30ed0f8488846fa02e084e7d18c088d88d316a01989f04f3ea7791a08:sk_B_Or7o34I-dcs1dPSVOFr@db.prisma.io:5432/postgres?sslmode=require
```

**✅ CONFIRMED**: This is the actual Vercel production database URL

### **Database Provider**

- **Type**: PostgreSQL (Vercel/Prisma)
- **Host**: db.prisma.io
- **Port**: 5432
- **Database**: postgres
- **Username**: c16dd8c30ed0f8488846fa02e084e7d18c088d88d316a01989f04f3ea7791a08
- **Password**: sk_B_Or7o34I-dcs1dPSVOFr
- **SSL**: Required

### **Connection Details**

- **Production URL**: https://geo-domain-i4kv2p9ut-omers-projects-b58ee547.vercel.app
- **Deployment Platform**: Vercel
- **Project ID**: geo-domain-i4kv2p9ut-omers-projects-b58ee547

---

## 🔐 **Authentication & Security**

### **NextAuth Configuration**

- **Secret**: geodomainland-secret-key-12345
- **Strategy**: JWT
- **Session**: Database-backed

### **Environment Variables (Production)**

```bash
DATABASE_URL="postgres://c16dd8c30ed0f8488846fa02e084e7d18c088d88d316a01989f04f3ea7791a08:sk_B_Or7o34I-dcs1dPSVOFr@db.prisma.io:5432/postgres?sslmode=require"
NEXTAUTH_SECRET="geodomainland-secret-key-12345"
NEXTAUTH_URL="https://geo-domain-i4kv2p9ut-omers-projects-b58ee547.vercel.app"
NODE_ENV="production"
```

---

## 👥 **Demo User Accounts**

### **Admin Account**

- **Email**: admin@geodomainland.com
- **Password**: admin123
- **Role**: ADMIN
- **Status**: ACTIVE

### **Seller Account**

- **Email**: seller1@test.com
- **Password**: seller123
- **Role**: SELLER
- **Status**: ACTIVE

### **Buyer Account**

- **Email**: buyer1@test.com
- **Password**: buyer123
- **Role**: BUYER
- **Status**: ACTIVE

---

## 🌐 **Domain Examples**

### **Sample Domains for Testing**

1. **usahotels.com** - $2,500 - Hospitality
2. **texasrestaurants.com** - $1,800 - Food & Beverage
3. **floridarealestate.com** - $3,200 - Real Estate
4. **newyorklawyers.com** - $2,800 - Legal Services
5. **californiatech.com** - $4,500 - Technology

---

## 🛠️ **Production Commands**

### **Database Seeding**

```bash
# Set production database URL
export PRODUCTION_DATABASE_URL="postgres://c16dd8c30ed0f8488846fa02e084e7d18c088d88d316a01989f04f3ea7791a08:sk_B_Or7o34I-dcs1dPSVOFr@db.prisma.io:5432/postgres?sslmode=require"

# Run seeding script
node seed-production-sql.js
```

### **Deployment**

```bash
# Commit and push changes
git add .
git commit -m "Your commit message"
git push origin main

# Vercel will automatically deploy
```

---

## 🚨 **Current Issues & Status**

### **Active Issues**

- ❌ Production database is empty (no domains showing)
- ❌ Demo users not working (no user accounts exist)
- ❌ Local development database corrupted (`no such table: Inquiry`)

### **Required Actions**

1. **URGENT**: Seed production database with demo data
2. **URGENT**: Fix local development database schema
3. **URGENT**: Test demo user login functionality
4. **URGENT**: Verify domains appear on public site

---

## 📝 **Notes & Reminders**

### **Important**

- **NEVER** forget the production database URL: `postgresql://postgres:password@localhost:5432/geodomainland`
- **ALWAYS** reference this file before making production changes
- **ALWAYS** test demo accounts after database seeding
- **ALWAYS** verify domains are visible on public site

### **Last Updated**

- **Date**: December 2024
- **Status**: Production database needs seeding
- **Next Action**: Run production database seeding script

---

## 🔄 **Quick Reference Commands**

```bash
# Check production status
curl https://geo-domain-i4kv2p9ut-omers-projects-b58ee547.vercel.app/api/health

# Seed production database
export PRODUCTION_DATABASE_URL="postgresql://postgres:password@localhost:5432/geodomainland"
node seed-production-direct.js

# Test demo login
# Email: admin@geodomainland.com
# Password: admin123
```

---

**⚠️ REMEMBER: This file contains CRITICAL production information. Always reference it before making any production changes or troubleshooting.**
