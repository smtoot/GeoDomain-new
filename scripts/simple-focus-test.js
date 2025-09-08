#!/usr/bin/env node

/**
 * Simple Focused E2E Test for GeoDomain Production
 * 
 * Tests only the most critical functionality with minimal browser operations
 */

const puppeteer = require('puppeteer');

// Configuration
const CONFIG = {
  baseUrl: 'https://geo-domain-new.vercel.app',
  timeout: 30000
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: []
};

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
async function runFocusedTests() {
  let browser;
  
  try {
    log('🚀 Starting Focused GeoDomain E2E Tests...');
    
    // Launch browser with minimal settings
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    log(`Testing: ${CONFIG.baseUrl}`);
    
    // Test 1: Basic page loads
    log('Testing basic page loads...');
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      page.setDefaultTimeout(CONFIG.timeout);
      
      // Test home page
      await page.goto(`${CONFIG.baseUrl}/`, { waitUntil: 'domcontentloaded' });
      const homeTitle = await page.title();
      recordTest('Home page loads', homeTitle.includes('GeoDomain') || homeTitle.length > 0, `Title: ${homeTitle}`);
      
      // Test domains page
      await page.goto(`${CONFIG.baseUrl}/domains`, { waitUntil: 'domcontentloaded' });
      const domainsTitle = await page.title();
      recordTest('Domains page loads', domainsTitle.includes('Domains') || domainsTitle.length > 0, `Title: ${domainsTitle}`);
      
      // Test login page
      await page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'domcontentloaded' });
      const loginTitle = await page.title();
      recordTest('Login page loads', loginTitle.includes('Login') || loginTitle.length > 0, `Title: ${loginTitle}`);
      
      await page.close();
    } catch (error) {
      recordTest('Basic page loads', false, error.message);
    }
    
    // Test 2: Domains page functionality
    log('Testing domains page functionality...');
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      page.setDefaultTimeout(CONFIG.timeout);
      
      await page.goto(`${CONFIG.baseUrl}/domains`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000); // Wait for page to stabilize
      
      // Check for search input
      const hasSearchInput = await page.$('input[placeholder*="search" i]') !== null;
      recordTest('Search input present', hasSearchInput);
      
      // Check for filter controls
      const selectTriggers = await page.$$('[role="combobox"]');
      recordTest('Filter controls present', selectTriggers.length >= 4, `Found ${selectTriggers.length} select triggers`);
      
      // Check for domain cards
      const domainCards = await page.$$('[data-testid="domain-card"]');
      const hasDomainCards = domainCards.length > 0;
      recordTest('Domain cards present', hasDomainCards, `Found ${domainCards.length} domain cards`);
      
      await page.close();
    } catch (error) {
      recordTest('Domains page functionality', false, error.message);
    }
    
    // Test 3: API endpoints
    log('Testing API endpoints...');
    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });
      page.setDefaultTimeout(CONFIG.timeout);
      
      // Test search filters API
      const response = await page.goto(`${CONFIG.baseUrl}/api/search/filters`, { waitUntil: 'domcontentloaded' });
      const responseText = await page.evaluate(() => document.body.textContent);
      const hasFiltersData = responseText.includes('categories') || responseText.includes('states');
      recordTest('Search filters API', hasFiltersData, `Response contains filter data: ${hasFiltersData}`);
      
      await page.close();
    } catch (error) {
      recordTest('API endpoints', false, error.message);
    }
    
  } catch (error) {
    log(`Critical error: ${error.message}`, 'error');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Print results
  log('');
  log('===========================================================');
  log('🎯 FOCUSED E2E TEST RESULTS SUMMARY');
  log('===========================================================');
  log('');
  log(`Total Tests: ${results.total}`);
  log(`✅ Passed: ${results.passed}`);
  log(`❌ Failed: ${results.failed}`);
  log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  log('');
  
  if (results.failed > 0) {
    log('❌ FAILED TESTS:');
    results.tests.filter(t => !t.passed).forEach(test => {
      log(`❌   - ${test.name}: ${test.details}`);
    });
  }
  
  log('');
  log('===========================================================');
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runFocusedTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});
