#!/usr/bin/env node

/**
 * Robust E2E Test for GeoDomain Production
 * 
 * Handles browser stability issues and provides reliable testing
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
  slowMo: 200,
  timeout: 60000, // Increased to 60 seconds for production
  protocolTimeout: 120000 // 2 minutes for protocol operations
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

async function createNewPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  page.setDefaultTimeout(CONFIG.timeout);
  page.setDefaultNavigationTimeout(CONFIG.timeout);
  return page;
}

async function safeGoto(page, url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout });
      await page.waitForTimeout(1000); // Wait for page to stabilize
      return true;
    } catch (error) {
      if (i === retries - 1) throw error;
      log(`Retry ${i + 1} for ${url}`, 'warning');
      await page.waitForTimeout(2000);
    }
  }
}

// Main test runner
async function runE2ETests() {
  let browser;
  
  try {
    log('🚀 Starting Robust GeoDomain E2E Tests...');
    
    // Launch browser with more stable settings for production
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      protocolTimeout: CONFIG.protocolTimeout,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--max_old_space_size=4096'
      ]
    });
    
    const baseUrl = CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl;
    log(`Testing: ${baseUrl}`);
    
    // Test 1: Home page
    log('Testing home page...');
    try {
      const page = await createNewPage(browser);
      await safeGoto(page, baseUrl);
      
      const title = await page.title();
      recordTest('Home page loads', title.includes('GeoDomain'), `Title: ${title}`);
      
      const hasNavigation = await page.$('nav') !== null;
      recordTest('Navigation present', hasNavigation);
      
      await page.close();
    } catch (error) {
      recordTest('Home page test', false, error.message);
    }
    
    // Test 2: Domains page
    log('Testing domains page...');
    try {
      const page = await createNewPage(browser);
      await safeGoto(page, `${baseUrl}/domains`);
      
      const title = await page.title();
      recordTest('Domains page loads', title.includes('Domains') || title.includes('GeoDomain'), `Title: ${title}`);
      
      const hasSearchInput = await page.$('input[placeholder*="search" i]') !== null;
      recordTest('Search input present', hasSearchInput);
      
      // Check for Radix UI Select components using multiple selector strategies
      const hasCategoryFilter = await page.$('[data-testid="category-filter"]') !== null;
      const hasStateFilter = await page.$('[data-testid="state-filter"]') !== null;
      const hasCityFilter = await page.$('[data-testid="city-filter"]') !== null;
      const hasScopeFilter = await page.$('[data-testid="scope-filter"]') !== null;
      
      // Fallback: Check for Radix UI Select components by role and placeholder text
      const selectTriggers = await page.$$('[role="combobox"]');
      
      // Check for placeholder text in select triggers
      let categoryByPlaceholder = false;
      let stateByPlaceholder = false;
      let cityByPlaceholder = false;
      let scopeByPlaceholder = false;
      
      for (const trigger of selectTriggers) {
        const placeholder = await trigger.evaluate(el => el.getAttribute('placeholder') || el.textContent || '');
        if (placeholder.toLowerCase().includes('category')) categoryByPlaceholder = true;
        if (placeholder.toLowerCase().includes('state')) stateByPlaceholder = true;
        if (placeholder.toLowerCase().includes('city')) cityByPlaceholder = true;
        if (placeholder.toLowerCase().includes('scope')) scopeByPlaceholder = true;
      }
      
      // Use data-testid if available, otherwise fall back to role-based detection
      const hasFilters = (hasCategoryFilter || categoryByPlaceholder) && 
                        (hasStateFilter || stateByPlaceholder) && 
                        (hasCityFilter || cityByPlaceholder) && 
                        (hasScopeFilter || scopeByPlaceholder) &&
                        selectTriggers.length >= 4;
      
      recordTest('Filter controls present', hasFilters, `Data-testid: C:${hasCategoryFilter} S:${hasStateFilter} Ci:${hasCityFilter} Sc:${hasScopeFilter} | Role-based: C:${categoryByPlaceholder} S:${stateByPlaceholder} Ci:${cityByPlaceholder} Sc:${scopeByPlaceholder} | Total SelectTriggers: ${selectTriggers.length}`);
      
      await page.close();
    } catch (error) {
      recordTest('Domains page test', false, error.message);
    }
    
    // Test 3: Search functionality
    log('Testing search functionality...');
    try {
      const page = await createNewPage(browser);
      await safeGoto(page, `${baseUrl}/domains`);
      
      // Wait for page to fully load
      await page.waitForTimeout(2000);
      
      const searchInput = await page.$('input[placeholder*="search" i]');
      if (searchInput) {
        // Clear any existing text and type search term
        await searchInput.click();
        await searchInput.evaluate(input => input.value = '');
        await searchInput.type('tech');
        
        // Wait a bit for the search to process
        await page.waitForTimeout(2000);
        
        // Check for domain cards (both with and without data-testid)
        const hasResultsWithTestId = await page.$('[data-testid="domain-card"]') !== null;
        const hasResultsWithoutTestId = await page.$('.group.hover\\:shadow-lg') !== null;
        const hasAnyResults = hasResultsWithTestId || hasResultsWithoutTestId;
        
        recordTest('Search returns results', hasAnyResults, `With testid: ${hasResultsWithTestId}, Without testid: ${hasResultsWithoutTestId}`);
      } else {
        recordTest('Search input found', false, 'Search input not found');
      }
      
      await page.close();
    } catch (error) {
      recordTest('Search functionality test', false, error.message);
    }
    
    // Test 4: Login page
    log('Testing login page...');
    try {
      const page = await createNewPage(browser);
      await safeGoto(page, `${baseUrl}/login`);
      
      const title = await page.title();
      recordTest('Login page loads', title.includes('Login') || title.includes('GeoDomain'), `Title: ${title}`);
      
      const hasEmailInput = await page.$('input[type="email"]') !== null;
      const hasPasswordInput = await page.$('input[type="password"]') !== null;
      const hasSubmitButton = await page.$('button[type="submit"]') !== null;
      
      recordTest('Login form elements present', hasEmailInput && hasPasswordInput && hasSubmitButton);
      
      await page.close();
    } catch (error) {
      recordTest('Login page test', false, error.message);
    }
    
    // Test 5: Admin login
    log('Testing admin login...');
    try {
      const page = await createNewPage(browser);
      await safeGoto(page, `${baseUrl}/login`);
      
      // Wait for form to be ready
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
      
      // Fill login form with retry logic
      await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
      });
      
      await page.type('input[type="email"]', 'admin@geodomain.com', { delay: 100 });
      await page.type('input[type="password"]', 'admin123', { delay: 100 });
      
      // Click submit and wait for navigation
      await Promise.all([
        page.waitForNavigation({ timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);
      
      const currentUrl = page.url();
      recordTest('Admin login successful', currentUrl.includes('/dashboard') || currentUrl.includes('/admin'), `URL: ${currentUrl}`);
      
      // Check for admin-specific elements
      const hasAdminNav = await page.$('a[href="/admin/users"]') !== null;
      recordTest('Admin navigation present', hasAdminNav);
      
      await page.close();
    } catch (error) {
      recordTest('Admin login test', false, error.message);
    }
    
    // Test 6: Admin pages
    log('Testing admin pages...');
    try {
      const page = await createNewPage(browser);
      
      // Login first with improved error handling
      await safeGoto(page, `${baseUrl}/login`);
      
      // Wait for form elements
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });
      await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
      
      // Clear and fill form
      await page.evaluate(() => {
        const emailInput = document.querySelector('input[type="email"]');
        const passwordInput = document.querySelector('input[type="password"]');
        if (emailInput) emailInput.value = '';
        if (passwordInput) passwordInput.value = '';
      });
      
      await page.type('input[type="email"]', 'admin@geodomain.com', { delay: 100 });
      await page.type('input[type="password"]', 'admin123', { delay: 100 });
      
      // Submit and wait for navigation
      await Promise.all([
        page.waitForNavigation({ timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);
      
      // Test user management page
      await safeGoto(page, `${baseUrl}/admin/users`);
      await page.waitForTimeout(2000); // Wait for page to load
      const currentUrl = page.url();
      recordTest('Admin users page loads', currentUrl.includes('/admin/users'), `URL: ${currentUrl}`);
      
      // Test domain moderation page
      await safeGoto(page, `${baseUrl}/admin/domains`);
      await page.waitForTimeout(2000); // Wait for page to load
      const domainsUrl = page.url();
      recordTest('Admin domains page loads', domainsUrl.includes('/admin/domains'), `URL: ${domainsUrl}`);
      
      await page.close();
    } catch (error) {
      recordTest('Admin pages test', false, error.message);
    }
    
    // Test 7: Responsive design
    log('Testing responsive design...');
    try {
      const page = await createNewPage(browser);
      
      // Test mobile view
      await page.setViewport({ width: 375, height: 667 });
      await safeGoto(page, `${baseUrl}/domains`);
      
      const hasMobileNav = await page.$('nav') !== null;
      recordTest('Mobile navigation present', hasMobileNav);
      
      // Test tablet view
      await page.setViewport({ width: 768, height: 1024 });
      await safeGoto(page, `${baseUrl}/domains`);
      
      const hasTabletNav = await page.$('nav') !== null;
      recordTest('Tablet navigation present', hasTabletNav);
      
      await page.close();
    } catch (error) {
      recordTest('Responsive design test', false, error.message);
    }
    
    // Test 8: Performance
    log('Testing performance...');
    try {
      const page = await createNewPage(browser);
      
      const startTime = Date.now();
      await safeGoto(page, `${baseUrl}/domains`);
      const loadTime = Date.now() - startTime;
      
      const performanceGood = loadTime < 8000; // 8 seconds for production
      recordTest('Page load performance', performanceGood, `Load time: ${loadTime}ms`);
      
      await page.close();
    } catch (error) {
      recordTest('Performance test', false, error.message);
    }
    
    // Test 9: Error handling
    log('Testing error handling...');
    try {
      const page = await createNewPage(browser);
      
      // Test 404 page
      await safeGoto(page, `${baseUrl}/nonexistent-page`);
      
      const has404Content = await page.$('text=404') !== null || 
                           await page.$('text=Not Found') !== null ||
                           await page.$('text=Page not found') !== null;
      recordTest('404 page handling', has404Content);
      
      await page.close();
    } catch (error) {
      recordTest('Error handling test', false, error.message);
    }
    
    // Test 10: API endpoints
    log('Testing API endpoints...');
    try {
      const page = await createNewPage(browser);
      
      // Test search filters API
      const response = await page.goto(`${baseUrl}/api/search/filters`);
      const status = response.status();
      recordTest('Search filters API', status === 200, `Status: ${status}`);
      
      // Test health check API
      const healthResponse = await page.goto(`${baseUrl}/api/health/check`);
      const healthStatus = healthResponse.status();
      recordTest('Health check API', healthStatus === 200, `Status: ${healthStatus}`);
      
      await page.close();
    } catch (error) {
      recordTest('API endpoints test', false, error.message);
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
  log('🎯 ROBUST E2E TEST RESULTS SUMMARY');
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
  const reportPath = path.join(__dirname, 'robust-e2e-test-report.json');
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
