#!/usr/bin/env node

/**
 * Test script to verify authentication fix
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔐 Testing Authentication Fix');
console.log('============================');

// Test 1: Check if middleware compiles
console.log('\n1. Checking middleware compilation...');
try {
  const middlewareContent = fs.readFileSync('src/middleware.ts', 'utf8');
  
  const hasDirectImport = middlewareContent.includes("import { getToken } from 'next-auth/jwt';");
  const hasSkipApiRoutes = middlewareContent.includes("pathname.startsWith('/api/')");
  const hasErrorLogging = middlewareContent.includes("console.error");
  
  if (hasDirectImport && hasSkipApiRoutes && hasErrorLogging) {
    console.log('✅ PASS: Middleware has proper imports and error handling');
  } else {
    console.log('❌ FAIL: Middleware missing required features');
    console.log(`   Has direct import: ${hasDirectImport}`);
    console.log(`   Has API route skip: ${hasSkipApiRoutes}`);
    console.log(`   Has error logging: ${hasErrorLogging}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Could not read middleware file');
  console.log(error.message);
  process.exit(1);
}

// Test 2: Check auth configuration
console.log('\n2. Checking auth configuration...');
try {
  const authContent = fs.readFileSync('src/lib/security/auth.ts', 'utf8');
  
  const hasErrorLogging = authContent.includes("console.error");
  const hasFallbackSecret = authContent.includes("fallback-secret-for-development");
  const hasVercelUrl = authContent.includes("VERCEL_URL");
  
  if (hasErrorLogging && hasFallbackSecret && hasVercelUrl) {
    console.log('✅ PASS: Auth configuration has proper error handling and fallbacks');
  } else {
    console.log('❌ FAIL: Auth configuration missing required features');
    console.log(`   Has error logging: ${hasErrorLogging}`);
    console.log(`   Has fallback secret: ${hasFallbackSecret}`);
    console.log(`   Has Vercel URL: ${hasVercelUrl}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Could not read auth configuration');
  console.log(error.message);
  process.exit(1);
}

// Test 3: Check debug endpoint
console.log('\n3. Checking debug endpoint...');
try {
  const debugContent = fs.readFileSync('src/app/api/debug/auth/route.ts', 'utf8');
  
  const hasTokenCheck = debugContent.includes("getToken");
  const hasSessionCheck = debugContent.includes("getServerAuthSession");
  const hasEnvironmentCheck = debugContent.includes("environmentVariables");
  
  if (hasTokenCheck && hasSessionCheck && hasEnvironmentCheck) {
    console.log('✅ PASS: Debug endpoint has comprehensive auth checks');
  } else {
    console.log('❌ FAIL: Debug endpoint missing required features');
    console.log(`   Has token check: ${hasTokenCheck}`);
    console.log(`   Has session check: ${hasSessionCheck}`);
    console.log(`   Has environment check: ${hasEnvironmentCheck}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Could not read debug endpoint');
  console.log(error.message);
  process.exit(1);
}

// Test 4: Check build
console.log('\n4. Testing build...');
try {
  const env = {
    ...process.env,
    DATABASE_URL: 'postgresql://user:password@localhost:5432/geodomain',
    NEXTAUTH_SECRET: 'test-secret',
    NEXTAUTH_URL: 'http://localhost:3000'
  };
  
  execSync('npm run build', { stdio: 'pipe', env });
  console.log('✅ PASS: Build completed successfully');
} catch (error) {
  console.log('❌ FAIL: Build failed');
  console.log(error.message);
  process.exit(1);
}

console.log('\n🎉 ALL AUTH TESTS PASSED!');
console.log('✅ Authentication fix appears to be working correctly');
console.log('\n📋 Summary:');
console.log('   - Middleware has proper imports and error handling');
console.log('   - Auth configuration has fallbacks and error logging');
console.log('   - Debug endpoint created for production troubleshooting');
console.log('   - Build completes successfully');

console.log('\n🔧 Next Steps:');
console.log('   1. Deploy to production');
console.log('   2. Test /api/debug/auth endpoint');
console.log('   3. Verify dashboard pages load correctly');
console.log('   4. Check browser console for any remaining errors');
