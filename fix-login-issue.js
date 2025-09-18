#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 SYSTEMATIC LOGIN/DASHBOARD ACCESS DIAGNOSTIC');
console.log('================================================\n');

// Step 1: Check environment configuration
console.log('1️⃣ Checking Environment Configuration...');
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasDatabaseUrl = envContent.includes('DATABASE_URL=');
  const hasNextAuthSecret = envContent.includes('NEXTAUTH_SECRET=');
  const hasNextAuthUrl = envContent.includes('NEXTAUTH_URL=');
  
  console.log(`   DATABASE_URL: ${hasDatabaseUrl ? '✅' : '❌'}`);
  console.log(`   NEXTAUTH_SECRET: ${hasNextAuthSecret ? '✅' : '❌'}`);
  console.log(`   NEXTAUTH_URL: ${hasNextAuthUrl ? '✅' : '❌'}`);
} else {
  console.log('❌ .env.local file missing');
}

// Step 2: Check database connection
console.log('\n2️⃣ Checking Database Configuration...');
const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
if (fs.existsSync(schemaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  const isPostgres = schemaContent.includes('provider = "postgresql"');
  const isSqlite = schemaContent.includes('provider = "sqlite"');
  
  console.log(`   Database Provider: ${isPostgres ? 'PostgreSQL' : isSqlite ? 'SQLite' : 'Unknown'}`);
  console.log(`   Schema file: ✅`);
} else {
  console.log('❌ Prisma schema missing');
}

// Step 3: Check middleware configuration
console.log('\n3️⃣ Checking Middleware Configuration...');
const middlewarePath = path.join(__dirname, 'src', 'middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  const hasTokenCheck = middlewareContent.includes('getToken');
  const hasDashboardProtection = middlewareContent.includes('/dashboard');
  const hasLoginRedirect = middlewareContent.includes('/login');
  
  console.log(`   Token validation: ${hasTokenCheck ? '✅' : '❌'}`);
  console.log(`   Dashboard protection: ${hasDashboardProtection ? '✅' : '❌'}`);
  console.log(`   Login redirect: ${hasLoginRedirect ? '✅' : '❌'}`);
} else {
  console.log('❌ Middleware file missing');
}

// Step 4: Check NextAuth configuration
console.log('\n4️⃣ Checking NextAuth Configuration...');
const authPath = path.join(__dirname, 'src', 'lib', 'security', 'auth.ts');
if (fs.existsSync(authPath)) {
  const authContent = fs.readFileSync(authPath, 'utf8');
  const hasCredentialsProvider = authContent.includes('CredentialsProvider');
  const hasJwtStrategy = authContent.includes('strategy: "jwt"');
  const hasSessionCallback = authContent.includes('async session');
  
  console.log(`   Credentials provider: ${hasCredentialsProvider ? '✅' : '❌'}`);
  console.log(`   JWT strategy: ${hasJwtStrategy ? '✅' : '❌'}`);
  console.log(`   Session callback: ${hasSessionCallback ? '✅' : '❌'}`);
} else {
  console.log('❌ NextAuth configuration missing');
}

// Step 5: Check LoginForm configuration
console.log('\n5️⃣ Checking LoginForm Configuration...');
const loginFormPath = path.join(__dirname, 'src', 'components', 'auth', 'LoginForm.tsx');
if (fs.existsSync(loginFormPath)) {
  const loginFormContent = fs.readFileSync(loginFormPath, 'utf8');
  const hasSignIn = loginFormContent.includes('signIn');
  const hasCallbackUrl = loginFormContent.includes('callbackUrl');
  const hasRedirect = loginFormContent.includes('redirect');
  
  console.log(`   SignIn function: ${hasSignIn ? '✅' : '❌'}`);
  console.log(`   Callback URL: ${hasCallbackUrl ? '✅' : '❌'}`);
  console.log(`   Redirect handling: ${hasRedirect ? '✅' : '❌'}`);
} else {
  console.log('❌ LoginForm component missing');
}

// Step 6: Check Dashboard page
console.log('\n6️⃣ Checking Dashboard Page...');
const dashboardPath = path.join(__dirname, 'src', 'app', 'dashboard', 'page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  const hasUseSession = dashboardContent.includes('useSession');
  const hasTrpcQueries = dashboardContent.includes('trpc.dashboard');
  const hasErrorHandling = dashboardContent.includes('error');
  
  console.log(`   Session hook: ${hasUseSession ? '✅' : '❌'}`);
  console.log(`   tRPC queries: ${hasTrpcQueries ? '✅' : '❌'}`);
  console.log(`   Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
} else {
  console.log('❌ Dashboard page missing');
}

console.log('\n🎯 RECOMMENDED FIXES:');
console.log('=====================');
console.log('1. Set up PostgreSQL database and update DATABASE_URL in .env.local');
console.log('2. Run: npm run db:reset (to reset and seed database)');
console.log('3. Run: npm run dev (to start development server)');
console.log('4. Test login with: seller1@test.com / seller123');
console.log('5. Check browser console for any JavaScript errors');
console.log('6. Check network tab for failed API requests');

console.log('\n📋 NEXT STEPS:');
console.log('==============');
console.log('1. Update .env.local with your database credentials');
console.log('2. Run database migrations and seed');
console.log('3. Test the complete authentication flow');
console.log('4. Check for any remaining errors in browser console');
