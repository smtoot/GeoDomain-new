#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create .env.local file with necessary environment variables
const envContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/geodomainland"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here-change-in-production-$(date +%s)"
NEXTAUTH_URL="http://localhost:3000"

# Redis (optional - for caching)
REDIS_URL="redis://localhost:6379"

# Environment
NODE_ENV="development"

# Vercel (for production)
VERCEL_URL=""
`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
  console.log('📝 Please update the DATABASE_URL with your actual PostgreSQL connection string');
  console.log('🔑 Please update the NEXTAUTH_SECRET with a secure random string');
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  process.exit(1);
}
