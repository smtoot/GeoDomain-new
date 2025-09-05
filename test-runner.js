#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 GeoDomainLand Test Runner');
console.log('=============================\n');

const testSuites = [
  { name: 'Database Utilities', path: 'src/__tests__/lib/database.test.ts' },
  { name: 'Email System', path: 'src/__tests__/lib/email.test.ts' },
  { name: 'Cache Service', path: 'src/__tests__/lib/cache.test.ts' },
  { name: 'Monitoring System', path: 'src/__tests__/lib/monitoring.test.ts' },
  { name: 'Notification Components', path: 'src/__tests__/components/NotificationCenter.test.tsx' },
  { name: 'Notification System', path: 'src/__tests__/lib/notifications.test.ts' }
];

async function runTests() {
  let passed = 0;
  let failed = 0;
  let total = 0;

  for (const suite of testSuites) {
    console.log(`\n🔍 Testing: ${suite.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = execSync(`npm test -- --testPathPatterns="${suite.path}" --silent`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      // Parse test results
      const match = result.match(/Test Suites: (\d+) passed, (\d+) total/);
      if (match) {
        const suitePassed = parseInt(match[1]);
        const suiteTotal = parseInt(match[2]);
        
        if (suitePassed === suiteTotal) {
          console.log(`✅ ${suite.name}: ${suitePassed}/${suiteTotal} tests passed`);
          passed += suitePassed;
        } else {
          console.log(`❌ ${suite.name}: ${suitePassed}/${suiteTotal} tests passed`);
          failed += (suiteTotal - suitePassed);
        }
        total += suiteTotal;
      }
    } catch (error) {
      console.log(`❌ ${suite.name}: Failed to run tests`);
      failed++;
    }
  }

  console.log('\n📊 Test Summary');
  console.log('─'.repeat(50));
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests are passing! Phase 12 is complete!');
  } else {
    console.log(`\n⚠️  ${failed} tests need to be fixed to complete Phase 12.`);
  }
}

runTests().catch(console.error);
