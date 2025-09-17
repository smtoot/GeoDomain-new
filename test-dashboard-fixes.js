#!/usr/bin/env node

/**
 * Dashboard Fixes Verification Script
 * Tests the critical fixes for wholesale and inquiries dashboard sections
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Dashboard Fixes Verification Script');
console.log('=====================================\n');

// Test 1: Check if build succeeds
console.log('1. Testing build process...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build successful\n');
} catch (error) {
  console.log('❌ Build failed:', error.message);
  process.exit(1);
}

// Test 2: Check critical files for fixes
console.log('2. Checking critical file fixes...');

const filesToCheck = [
  {
    path: 'src/components/wholesale/WholesaleDomainModal.tsx',
    checks: [
      { pattern: /export default WholesaleDomainModal/, description: 'Default export added' },
      { pattern: /function WholesaleDomainModal/, description: 'Function declaration correct' }
    ]
  },
  {
    path: 'src/app/dashboard/wholesale/page.tsx',
    checks: [
      { pattern: /import\('@\/components\/wholesale\/WholesaleDomainModal'\)/, description: 'Dynamic import syntax correct' },
      { pattern: /enabled: isClient && userRole === 'SELLER'/, description: 'Query enabling condition added' }
    ]
  },
  {
    path: 'src/app/dashboard/inquiries/page.tsx',
    checks: [
      { pattern: /enabled: userRole === 'SELLER'/, description: 'Query enabling condition added' },
      { pattern: /refetchOnWindowFocus: false/, description: 'Refetch options added' }
    ]
  },
  {
    path: 'src/components/providers/trpc-provider.tsx',
    checks: [
      { pattern: /transformer: superjson/, description: 'Superjson transformer enabled' }
    ]
  },
  {
    path: 'src/server/trpc.ts',
    checks: [
      { pattern: /transformer: superjson/, description: 'Server superjson transformer enabled' }
    ]
  }
];

let allChecksPassed = true;

filesToCheck.forEach(file => {
  console.log(`   Checking ${file.path}...`);
  
  if (!fs.existsSync(file.path)) {
    console.log(`   ❌ File not found: ${file.path}`);
    allChecksPassed = false;
    return;
  }
  
  const content = fs.readFileSync(file.path, 'utf8');
  
  file.checks.forEach(check => {
    if (check.pattern.test(content)) {
      console.log(`   ✅ ${check.description}`);
    } else {
      console.log(`   ❌ ${check.description} - NOT FOUND`);
      allChecksPassed = false;
    }
  });
});

if (allChecksPassed) {
  console.log('\n✅ All critical file checks passed\n');
} else {
  console.log('\n❌ Some critical file checks failed\n');
  process.exit(1);
}

// Test 3: Check for React hooks violations
console.log('3. Checking for React hooks violations...');

let hooksViolationsFound = false;

const dashboardFiles = [
  'src/app/dashboard/wholesale/page.tsx',
  'src/app/dashboard/inquiries/page.tsx'
];

dashboardFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check if hooks are called after conditional returns
    const lines = content.split('\n');
    let foundConditionalReturn = false;
    let inFunctionBody = false;
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if we're in the main function body
      if (trimmedLine.includes('function') && trimmedLine.includes('Client')) {
        inFunctionBody = true;
        foundConditionalReturn = false;
        return;
      }
      
      if (inFunctionBody) {
        // Check for conditional returns (not the final return)
        if (trimmedLine.startsWith('return') && !trimmedLine.includes('</')) {
          foundConditionalReturn = true;
        }
        
        // Check for hooks after conditional returns
        if (foundConditionalReturn && (
          trimmedLine.includes('useQuery') || 
          trimmedLine.includes('useMutation') || 
          trimmedLine.includes('useEffect') ||
          trimmedLine.includes('useState')
        )) {
          console.log(`   ❌ Hook called after conditional return in ${file}:${index + 1} - ${trimmedLine}`);
          hooksViolationsFound = true;
        }
        
        // Reset flag when we hit the main return statement
        if (trimmedLine.startsWith('return') && trimmedLine.includes('</')) {
          foundConditionalReturn = false;
        }
      }
    });
  }
});

if (!hooksViolationsFound) {
  console.log('✅ No React hooks violations found\n');
} else {
  console.log('❌ React hooks violations found\n');
  process.exit(1);
}

// Test 4: Check package.json for React version consistency
console.log('4. Checking React version consistency...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const reactVersion = packageJson.dependencies.react;
const reactDomVersion = packageJson.dependencies['react-dom'];

if (reactVersion === reactDomVersion) {
  console.log(`✅ React versions consistent: ${reactVersion}\n`);
} else {
  console.log(`❌ React versions inconsistent: react=${reactVersion}, react-dom=${reactDomVersion}\n`);
  process.exit(1);
}

// Test 5: Check for TypeScript errors
console.log('5. Checking for TypeScript errors...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ No TypeScript errors found\n');
} catch (error) {
  console.log('❌ TypeScript errors found:', error.message);
  process.exit(1);
}

console.log('🎉 All verification tests passed!');
console.log('\n📋 Summary of fixes applied:');
console.log('   • Fixed dynamic import syntax for WholesaleDomainModal');
console.log('   • Added default export to WholesaleDomainModal component');
console.log('   • Fixed React hooks calling order in inquiries page');
console.log('   • Enabled superjson transformer for proper data serialization');
console.log('   • Added proper query enabling conditions based on user role');
console.log('   • Added refetch options to prevent unnecessary API calls');
console.log('\n🚀 Dashboard sections should now work correctly!');
