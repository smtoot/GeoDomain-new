#!/usr/bin/env node

/**
 * Simple E2E Test for GeoDomain
 * 
 * Tests the most critical functionality:
 * 1. Home page loads
 * 2. Domains page loads
 * 3. Search functionality works
 * 4. Navigation works
 * 5. Admin login works
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'https://geo-domain-new.vercel.app',
  localUrl: 'http://localhost:3000',
  useLocal: process.argv.includes('--local'),
  headless: process.argv.includes('--headless') || true,
  slowMo: 100,
  timeout: 30000
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
  startTime: new Date()
};

// Utility functions
function log(message, type = 'info') {
  const icons = { info: 'ℹ️', success: '✅', error: '❌', warning: '⚠️' };
  console.log(`${icons[type]} ${message}`);
}

function recordTest(name, passed, details = '') {
  results.total++;
  if (passed) {
    results.passed++;
    log(`PASS: ${name}`, 'success');
  } else {
    results.failed++;
    log(`FAIL: ${name} - ${details}`, 'error');
  }
  results.tests.push({ name, passed, details, timestamp: new Date() });
}

// Main test runner
async function runE2ETests() {
  let browser;
  
  try {
    log('🚀 Starting GeoDomain E2E Tests...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    page.setDefaultTimeout(CONFIG.timeout);
    
    const baseUrl = CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl;
    
    // Test 1: Home page loads
    log('Testing home page...');
    try {
      await page.goto(baseUrl);
      await page.waitForSelector('body');
      
      const title = await page.title();
      recordTest('Home page loads', title.includes('GeoDomain'), `Title: ${title}`);
      
      const hasNavigation = await page.$('nav') !== null;
      recordTest('Navigation present', hasNavigation);
    } catch (error) {
      recordTest('Home page test', false, error.message);
    }
    
    // Test 2: Domains page loads
    log('Testing domains page...');
    try {
      await page.goto(`${baseUrl}/domains`);
      await page.waitForSelector('body');
      
      const title = await page.title();
      recordTest('Domains page loads', title.includes('Domains'), `Title: ${title}`);
      
      const hasSearchInput = await page.$('input[placeholder*="search" i]') !== null;
      recordTest('Search input present', hasSearchInput);
      
      const hasFilters = await page.$('select') !== null;
      recordTest('Filter controls present', hasFilters);
    } catch (error) {
      recordTest('Domains page test', false, error.message);
    }
    
    // Test 3: Search functionality
    log('Testing search functionality...');
    try {
      await page.goto(`${baseUrl}/domains`);
      await page.waitForSelector('body');
      
      const searchInput = await page.$('input[placeholder*="search" i]');
      if (searchInput) {
        await searchInput.type('tech');
        await searchInput.press('Enter');
        await page.waitForTimeout(2000); // Wait for search results
        
        const hasResults = await page.$('[data-testid="domain-card"]') !== null;
        recordTest('Search returns results', hasResults);
      } else {
        recordTest('Search input found', false, 'Search input not found');
      }
    } catch (error) {
      recordTest('Search functionality test', false, error.message);
    }
    
    // Test 4: Login page
    log('Testing login page...');
    try {
      await page.goto(`${baseUrl}/login`);
      await page.waitForSelector('body');
      
      const title = await page.title();
      recordTest('Login page loads', title.includes('Login'), `Title: ${title}`);
      
      const hasEmailInput = await page.$('input[type="email"]') !== null;
      const hasPasswordInput = await page.$('input[type="password"]') !== null;
      const hasSubmitButton = await page.$('button[type="submit"]') !== null;
      
      recordTest('Login form elements present', hasEmailInput && hasPasswordInput && hasSubmitButton);
    } catch (error) {
      recordTest('Login page test', false, error.message);
    }
    
    // Test 5: Admin login
    log('Testing admin login...');
    try {
      await page.goto(`${baseUrl}/login`);
      await page.waitForSelector('body');
      
      // Fill login form
      await page.type('input[type="email"]', 'admin@geodomain.com');
      await page.type('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for redirect
      await page.waitForNavigation({ timeout: 10000 });
      
      const currentUrl = page.url();
      recordTest('Admin login successful', currentUrl.includes('/dashboard'), `URL: ${currentUrl}`);
      
      // Check for admin-specific elements
      const hasAdminNav = await page.$('a[href="/admin/users"]') !== null;
      recordTest('Admin navigation present', hasAdminNav);
    } catch (error) {
      recordTest('Admin login test', false, error.message);
    }
    
    // Test 6: Admin pages
    log('Testing admin pages...');
    try {
      // Test user management page
      await page.goto(`${baseUrl}/admin/users`);
      await page.waitForSelector('body');
      
      const currentUrl = page.url();
      recordTest('Admin users page loads', currentUrl.includes('/admin/users'), `URL: ${currentUrl}`);
      
      // Test domain moderation page
      await page.goto(`${baseUrl}/admin/domains`);
      await page.waitForSelector('body');
      
      const domainsUrl = page.url();
      recordTest('Admin domains page loads', domainsUrl.includes('/admin/domains'), `URL: ${domainsUrl}`);
    } catch (error) {
      recordTest('Admin pages test', false, error.message);
    }
    
    // Test 7: Responsive design
    log('Testing responsive design...');
    try {
      // Test mobile view
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(`${baseUrl}/domains`);
      await page.waitForSelector('body');
      
      const hasMobileNav = await page.$('nav') !== null;
      recordTest('Mobile navigation present', hasMobileNav);
      
      // Test tablet view
      await page.setViewport({ width: 768, height: 1024 });
      await page.goto(`${baseUrl}/domains`);
      await page.waitForSelector('body');
      
      const hasTabletNav = await page.$('nav') !== null;
      recordTest('Tablet navigation present', hasTabletNav);
    } catch (error) {
      recordTest('Responsive design test', false, error.message);
    }
    
    // Test 8: Performance
    log('Testing performance...');
    try {
      const startTime = Date.now();
      await page.goto(`${baseUrl}/domains`);
      await page.waitForSelector('body');
      const loadTime = Date.now() - startTime;
      
      const performanceGood = loadTime < 5000; // 5 seconds
      recordTest('Page load performance', performanceGood, `Load time: ${loadTime}ms`);
    } catch (error) {
      recordTest('Performance test', false, error.message);
    }
    
    // Test 9: Error handling
    log('Testing error handling...');
    try {
      // Test 404 page
      await page.goto(`${baseUrl}/nonexistent-page`);
      await page.waitForSelector('body');
      
      const has404Content = await page.$('text=404') !== null || 
                           await page.$('text=Not Found') !== null;
      recordTest('404 page handling', has404Content);
    } catch (error) {
      recordTest('Error handling test', false, error.message);
    }
    
    // Generate report
    generateReport();
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateReport() {
  const duration = Date.now() - results.startTime;
  const successRate = Math.round((results.passed / results.total) * 100);
  
  log('\n' + '='.repeat(60));
  log('🎯 E2E TEST RESULTS SUMMARY');
  log('='.repeat(60));
  log(`Total Tests: ${results.total}`);
  log(`Passed: ${results.passed}`, 'success');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${successRate}%`);
  log(`Duration: ${Math.round(duration / 1000)}s`);
  
  if (results.failed > 0) {
    log('\n❌ FAILED TESTS:');
    results.tests
      .filter(test => !test.passed)
      .forEach(test => {
        log(`  - ${test.name}: ${test.details}`, 'error');
      });
  }
  
  // Save report
  const reportPath = path.join(__dirname, 'e2e-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    ...results,
    duration,
    successRate,
    endTime: new Date()
  }, null, 2));
  
  log(`\n📊 Detailed report saved to: ${reportPath}`);
  log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
  runE2ETests().catch(console.error);
}

module.exports = { runE2ETests };
