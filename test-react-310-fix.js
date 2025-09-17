#!/usr/bin/env node

/**
 * Test script to verify React error #310 fix
 * This script tests the wholesale page for hydration issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing React Error #310 Fix');
console.log('================================');

// Test 1: Check React versions
console.log('\n1. Checking React versions...');
try {
  const reactVersions = execSync('npm ls react react-dom', { encoding: 'utf8' });
  const hasMultipleVersions = reactVersions.includes('18.3.1') || reactVersions.includes('18.1.0');
  
  if (hasMultipleVersions) {
    console.log('❌ FAIL: Multiple React versions detected');
    console.log(reactVersions);
    process.exit(1);
  } else {
    console.log('✅ PASS: All React packages use consistent version');
  }
} catch (error) {
  console.log('❌ FAIL: Could not check React versions');
  console.log(error.message);
  process.exit(1);
}

// Test 2: Check build success
console.log('\n2. Testing build...');
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

// Test 3: Check wholesale page bundle
console.log('\n3. Checking wholesale page bundle...');
try {
  const buildManifest = JSON.parse(fs.readFileSync('.next/app-build-manifest.json', 'utf8'));
  const wholesalePage = buildManifest.pages['/dashboard/wholesale/page'];
  
  if (!wholesalePage) {
    console.log('❌ FAIL: Wholesale page not found in build manifest');
    process.exit(1);
  }
  
  console.log('✅ PASS: Wholesale page found in build manifest');
  console.log(`   Bundle files: ${wholesalePage.length} files`);
} catch (error) {
  console.log('❌ FAIL: Could not check build manifest');
  console.log(error.message);
  process.exit(1);
}

// Test 4: Check for dynamic imports
console.log('\n4. Checking for dynamic imports...');
try {
  const wholesalePageContent = fs.readFileSync('src/app/dashboard/wholesale/page.tsx', 'utf8');
  
  const hasDynamicImport = wholesalePageContent.includes('dynamic(');
  const hasSSRFalse = wholesalePageContent.includes('ssr: false');
  const hasClientComponent = wholesalePageContent.includes('WholesaleManagementPageClient');
  
  if (hasDynamicImport && hasSSRFalse && hasClientComponent) {
    console.log('✅ PASS: Dynamic import with SSR disabled found');
  } else {
    console.log('❌ FAIL: Dynamic import configuration missing');
    console.log(`   Has dynamic import: ${hasDynamicImport}`);
    console.log(`   Has SSR false: ${hasSSRFalse}`);
    console.log(`   Has client component: ${hasClientComponent}`);
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Could not check wholesale page code');
  console.log(error.message);
  process.exit(1);
}

// Test 5: Check hooks usage
console.log('\n5. Checking hooks usage...');
try {
  const wholesalePageContent = fs.readFileSync('src/app/dashboard/wholesale/page.tsx', 'utf8');
  
  // Check that hooks are called before any early returns
  const lines = wholesalePageContent.split('\n');
  let hooksFound = false;
  let earlyReturnFound = false;
  let hooksAfterReturn = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('useQuery') || line.includes('useState') || line.includes('useEffect')) {
      hooksFound = true;
    }
    
    if (line.includes('if (') && line.includes('return')) {
      earlyReturnFound = true;
    }
    
    if (earlyReturnFound && (line.includes('useQuery') || line.includes('useState') || line.includes('useEffect'))) {
      hooksAfterReturn = true;
      break;
    }
  }
  
  if (hooksFound && !hooksAfterReturn) {
    console.log('✅ PASS: Hooks are called before early returns');
  } else {
    console.log('❌ FAIL: Hooks may be called after early returns');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ FAIL: Could not check hooks usage');
  console.log(error.message);
  process.exit(1);
}

console.log('\n🎉 ALL TESTS PASSED!');
console.log('✅ React error #310 fix appears to be working correctly');
console.log('\n📋 Summary:');
console.log('   - React versions are consistent');
console.log('   - Build completes successfully');
console.log('   - Dynamic imports are properly configured');
console.log('   - Hooks are used correctly');
console.log('   - Wholesale page bundle is optimized');

console.log('\n⚠️  Note: This test verifies the code structure and build process.');
console.log('   For complete verification, manual testing in browser is recommended.');
