#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up GeoDomainLand Database...\n');

try {
  // Step 1: Update .env.local with PostgreSQL connection
  console.log('1️⃣ Updating environment configuration...');
  const envPath = path.join(__dirname, '.env.local');
  const envContent = `# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/geodomainland"

# NextAuth
NEXTAUTH_SECRET="geodomainland-secret-key-${Date.now()}"
NEXTAUTH_URL="http://localhost:3000"

# Redis (optional - for caching)
REDIS_URL="redis://localhost:6379"

# Environment
NODE_ENV="development"

# Vercel (for production)
VERCEL_URL=""
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env.local with PostgreSQL configuration');

  // Step 2: Start Docker services
  console.log('\n2️⃣ Starting Docker services...');
  try {
    execSync('docker-compose -f docker-compose.dev.yml up -d', { stdio: 'inherit' });
    console.log('✅ Docker services started');
  } catch (error) {
    console.log('⚠️  Docker services may already be running or Docker is not available');
  }

  // Step 3: Wait for database to be ready
  console.log('\n3️⃣ Waiting for database to be ready...');
  setTimeout(() => {
    try {
      // Step 4: Run database migrations
      console.log('\n4️⃣ Running database migrations...');
      execSync('npx prisma db push', { stdio: 'inherit' });
      console.log('✅ Database migrations completed');

      // Step 5: Seed the database
      console.log('\n5️⃣ Seeding database...');
      execSync('npm run db:seed', { stdio: 'inherit' });
      console.log('✅ Database seeded successfully');

      console.log('\n🎉 Database setup complete!');
      console.log('\n📋 Next steps:');
      console.log('1. Run: npm run dev');
      console.log('2. Go to: http://localhost:3000/login');
      console.log('3. Login with: seller1@test.com / seller123');
      console.log('4. You should now be able to access the dashboard!');

    } catch (error) {
      console.error('❌ Error during database setup:', error.message);
      console.log('\n🔧 Manual setup required:');
      console.log('1. Make sure PostgreSQL is running on localhost:5432');
      console.log('2. Run: npx prisma db push');
      console.log('3. Run: npm run db:seed');
    }
  }, 5000); // Wait 5 seconds for database to be ready

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}
