#!/usr/bin/env node

/**
 * GeoDomain E2E Test Suite
 * 
 * Comprehensive testing of all major functionality:
 * 1. Authentication & Authorization
 * 2. Navigation & Routing
 * 3. Domain Browsing & Search
 * 4. Admin Dashboard
 * 5. User Dashboard
 * 6. Domain Details & Inquiries
 * 7. Responsive Design
 * 8. Performance
 * 9. Error Handling
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
  slowMo: 50,
  timeout: 30000,
  viewport: { width: 1280, height: 720 }
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

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

async function waitForNavigation(page, timeout = 10000) {
  try {
    await page.waitForNavigation({ timeout });
    return true;
  } catch {
    return false;
  }
}

// Test classes
class AuthTests {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async testLoginPage() {
    log('Testing login page...');
    
    await this.page.goto(`${this.baseUrl}/login`);
    await this.page.waitForLoadState('networkidle');
    
    const title = await this.page.title();
    recordTest('Login page loads', title.includes('Login'), `Title: ${title}`);
    
    const hasEmailInput = await this.page.$('input[type="email"]') !== null;
    const hasPasswordInput = await this.page.$('input[type="password"]') !== null;
    const hasSubmitButton = await this.page.$('button[type="submit"]') !== null;
    
    recordTest('Login form elements present', hasEmailInput && hasPasswordInput && hasSubmitButton);
  }

  async testAdminLogin() {
    log('Testing admin login...');
    
    await this.page.goto(`${this.baseUrl}/login`);
    
    // Fill login form
    await this.page.fill('input[type="email"]', 'admin@geodomain.com');
    await this.page.fill('input[type="password"]', 'admin123');
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect
    await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    const currentUrl = this.page.url();
    recordTest('Admin login successful', currentUrl.includes('/dashboard'), `URL: ${currentUrl}`);
    
    // Check for admin-specific elements
    const hasAdminNav = await this.page.$('a[href="/admin/users"]') !== null;
    recordTest('Admin navigation present', hasAdminNav);
  }

  async testSessionPersistence() {
    log('Testing session persistence...');
    
    // Refresh page
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    
    const stillLoggedIn = this.page.url().includes('/dashboard');
    recordTest('Session persists on refresh', stillLoggedIn);
  }

  async testLogout() {
    log('Testing logout...');
    
    const logoutButton = await this.page.$('button:has-text("Logout")');
    if (logoutButton) {
      await logoutButton.click();
      await this.page.waitForURL('**/login**', { timeout: 10000 });
      
      const loggedOut = this.page.url().includes('/login');
      recordTest('Logout successful', loggedOut);
    } else {
      recordTest('Logout button found', false, 'Logout button not found');
    }
  }
}

class NavigationTests {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async testHomePage() {
    log('Testing home page...');
    
    await this.page.goto(this.baseUrl);
    await this.page.waitForLoadState('networkidle');
    
    const title = await this.page.title();
    recordTest('Home page loads', title.includes('GeoDomain'), `Title: ${title}`);
    
    const hasNavigation = await this.page.$('nav') !== null;
    recordTest('Navigation present', hasNavigation);
  }

  async testDomainsPage() {
    log('Testing domains page...');
    
    await this.page.goto(`${this.baseUrl}/domains`);
    await this.page.waitForLoadState('networkidle');
    
    const title = await this.page.title();
    recordTest('Domains page loads', title.includes('Domains'), `Title: ${title}`);
    
    const hasSearchInput = await this.page.$('input[placeholder*="search" i]') !== null;
    recordTest('Search input present', hasSearchInput);
    
    const hasFilters = await this.page.$('select') !== null;
    recordTest('Filter controls present', hasFilters);
  }

  async testAdminNavigation() {
    log('Testing admin navigation...');
    
    // Login as admin first
    await this.page.goto(`${this.baseUrl}/login`);
    await this.page.fill('input[type="email"]', 'admin@geodomain.com');
    await this.page.fill('input[type="password"]', 'admin123');
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL('**/dashboard**');
    
    // Test admin pages
    const adminPages = [
      { name: 'User Management', url: '/admin/users' },
      { name: 'Domain Moderation', url: '/admin/domains' },
      { name: 'Deal Management', url: '/admin/deals' }
    ];
    
    for (const page of adminPages) {
      await this.page.goto(`${this.baseUrl}${page.url}`);
      await this.page.waitForLoadState('networkidle');
      
      const currentUrl = this.page.url();
      recordTest(`Admin ${page.name} page loads`, currentUrl.includes(page.url), `URL: ${currentUrl}`);
    }
  }
}

class DomainTests {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async testDomainSearch() {
    log('Testing domain search...');
    
    await this.page.goto(`${this.baseUrl}/domains`);
    await this.page.waitForLoadState('networkidle');
    
    const searchInput = await this.page.$('input[placeholder*="search" i]');
    if (searchInput) {
      await searchInput.fill('tech');
      await searchInput.press('Enter');
      await this.page.waitForLoadState('networkidle');
      
      const hasResults = await this.page.$('[data-testid="domain-card"]') !== null;
      recordTest('Domain search returns results', hasResults);
    } else {
      recordTest('Search input found', false, 'Search input not found');
    }
  }

  async testDomainFilters() {
    log('Testing domain filters...');
    
    await this.page.goto(`${this.baseUrl}/domains`);
    await this.page.waitForLoadState('networkidle');
    
    // Test category filter
    const categoryFilter = await this.page.$('select[name="category"]');
    if (categoryFilter) {
      await categoryFilter.selectOption('Technology Services');
      await this.page.waitForLoadState('networkidle');
      
      const filteredResults = await this.page.$('[data-testid="domain-card"]') !== null;
      recordTest('Category filter works', filteredResults);
    }
    
    // Test state filter
    const stateFilter = await this.page.$('select[name="state"]');
    if (stateFilter) {
      await stateFilter.selectOption('California');
      await this.page.waitForLoadState('networkidle');
      
      const stateFilteredResults = await this.page.$('[data-testid="domain-card"]') !== null;
      recordTest('State filter works', stateFilteredResults);
    }
  }

  async testDomainCardInteraction() {
    log('Testing domain card interaction...');
    
    await this.page.goto(`${this.baseUrl}/domains`);
    await this.page.waitForLoadState('networkidle');
    
    const domainCard = await this.page.$('[data-testid="domain-card"]');
    if (domainCard) {
      await domainCard.click();
      await this.page.waitForLoadState('networkidle');
      
      const isDomainDetail = this.page.url().includes('/domains/');
      recordTest('Domain card click navigation', isDomainDetail);
    } else {
      recordTest('Domain card found', false, 'No domain cards found');
    }
  }
}

class ResponsiveTests {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async testMobileView() {
    log('Testing mobile view...');
    
    await this.page.setViewport({ width: 375, height: 667 });
    await this.page.goto(`${this.baseUrl}/domains`);
    await this.page.waitForLoadState('networkidle');
    
    const hasMobileNav = await this.page.$('nav') !== null;
    recordTest('Mobile navigation present', hasMobileNav);
    
    const hasMobileContent = await this.page.$('[data-testid="domain-card"]') !== null;
    recordTest('Mobile content visible', hasMobileContent);
  }

  async testTabletView() {
    log('Testing tablet view...');
    
    await this.page.setViewport({ width: 768, height: 1024 });
    await this.page.goto(`${this.baseUrl}/domains`);
    await this.page.waitForLoadState('networkidle');
    
    const hasTabletNav = await this.page.$('nav') !== null;
    recordTest('Tablet navigation present', hasTabletNav);
    
    const hasTabletContent = await this.page.$('[data-testid="domain-card"]') !== null;
    recordTest('Tablet content visible', hasTabletContent);
  }
}

class PerformanceTests {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async testPageLoadTime() {
    log('Testing page load performance...');
    
    const startTime = Date.now();
    await this.page.goto(`${this.baseUrl}/domains`);
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    const performanceGood = loadTime < 5000; // 5 seconds
    recordTest('Page load performance', performanceGood, `Load time: ${loadTime}ms`);
  }

  async testSlowConnection() {
    log('Testing slow connection performance...');
    
    // Simulate slow connection
    await this.page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 500 * 1024 / 8, // 500 kbps
      uploadThroughput: 500 * 1024 / 8,
      latency: 200
    });
    
    const startTime = Date.now();
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    const performanceGood = loadTime < 10000; // 10 seconds
    recordTest('Slow connection performance', performanceGood, `Load time: ${loadTime}ms`);
  }
}

class ErrorHandlingTests {
  constructor(page, baseUrl) {
    this.page = page;
    this.baseUrl = baseUrl;
  }

  async test404Page() {
    log('Testing 404 page...');
    
    await this.page.goto(`${this.baseUrl}/nonexistent-page`);
    await this.page.waitForLoadState('networkidle');
    
    const has404Content = await this.page.$('text=404') !== null || 
                         await this.page.$('text=Not Found') !== null;
    recordTest('404 page handling', has404Content);
  }

  async testInvalidDomain() {
    log('Testing invalid domain page...');
    
    await this.page.goto(`${this.baseUrl}/domains/invalid-domain-12345`);
    await this.page.waitForLoadState('networkidle');
    
    const hasErrorContent = await this.page.$('text=not found') !== null || 
                           await this.page.$('text=error') !== null;
    recordTest('Invalid domain page handling', hasErrorContent);
  }
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
    await page.setViewport(CONFIG.viewport);
    page.setDefaultTimeout(CONFIG.timeout);
    
    const baseUrl = CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl;
    
    // Run test suites
    const authTests = new AuthTests(page, baseUrl);
    await authTests.testLoginPage();
    await authTests.testAdminLogin();
    await authTests.testSessionPersistence();
    await authTests.testLogout();
    
    const navTests = new NavigationTests(page, baseUrl);
    await navTests.testHomePage();
    await navTests.testDomainsPage();
    await navTests.testAdminNavigation();
    
    const domainTests = new DomainTests(page, baseUrl);
    await domainTests.testDomainSearch();
    await domainTests.testDomainFilters();
    await domainTests.testDomainCardInteraction();
    
    const responsiveTests = new ResponsiveTests(page, baseUrl);
    await responsiveTests.testMobileView();
    await responsiveTests.testTabletView();
    
    const perfTests = new PerformanceTests(page, baseUrl);
    await perfTests.testPageLoadTime();
    await perfTests.testSlowConnection();
    
    const errorTests = new ErrorHandlingTests(page, baseUrl);
    await errorTests.test404Page();
    await errorTests.testInvalidDomain();
    
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
