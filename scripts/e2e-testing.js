#!/usr/bin/env node

/**
 * Comprehensive End-to-End Testing Script for GeoDomain
 * 
 * This script tests all major functionality of the GeoDomain application:
 * - Authentication flows
 * - Navigation and routing
 * - Domain browsing and search
 * - Admin dashboard functionality
 * - User dashboard features
 * - Domain details and inquiries
 * - Responsive design
 * - Performance metrics
 * - Error handling
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: 'https://geo-domain-new.vercel.app',
  localUrl: 'http://localhost:3000',
  useLocal: false, // Set to true for local testing
  headless: true,
  slowMo: 100, // Slow down operations for better visibility
  timeout: 30000,
  viewport: { width: 1280, height: 720 },
  testUsers: {
    admin: { email: 'admin@geodomain.com', password: 'admin123' },
    seller: { email: 'seller@geodomain.com', password: 'seller123' },
    buyer: { email: 'buyer@geodomain.com', password: 'buyer123' }
  }
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: [],
  startTime: new Date(),
  endTime: null
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function logTestResult(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`PASSED: ${testName}`, 'success');
  } else {
    testResults.failed++;
    log(`FAILED: ${testName} - ${details}`, 'error');
  }
  testResults.details.push({ testName, passed, details, timestamp: new Date() });
}

async function takeScreenshot(page, name) {
  const screenshotPath = path.join(__dirname, 'screenshots', `${name}-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

async function waitForNavigation(page, timeout = 10000) {
  try {
    await page.waitForNavigation({ timeout });
    return true;
  } catch (error) {
    return false;
  }
}

// Test suites
class E2ETestSuite {
  constructor(browser, page) {
    this.browser = browser;
    this.page = page;
    this.baseUrl = CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl;
  }

  async setup() {
    log('Setting up test environment...');
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // Set viewport
    await this.page.setViewport(CONFIG.viewport);
    
    // Set default timeout
    this.page.setDefaultTimeout(CONFIG.timeout);
    
    log('Test environment setup complete');
  }

  async testHomePage() {
    log('Testing home page...');
    
    try {
      await this.page.goto(this.baseUrl);
      await this.page.waitForLoadState('networkidle');
      
      // Check if page loads
      const title = await this.page.title();
      logTestResult('Home page loads', title.includes('GeoDomain'), `Title: ${title}`);
      
      // Check for main navigation elements
      const hasNav = await this.page.$('nav') !== null;
      logTestResult('Navigation present', hasNav);
      
      // Check for domain search functionality
      const hasSearch = await this.page.$('input[placeholder*="search" i]') !== null;
      logTestResult('Search functionality present', hasSearch);
      
      // Check for domain listings
      const hasDomains = await this.page.$('[data-testid="domain-card"]') !== null;
      logTestResult('Domain listings present', hasDomains);
      
      await takeScreenshot(this.page, 'home-page');
      
    } catch (error) {
      logTestResult('Home page test', false, error.message);
    }
  }

  async testAuthentication() {
    log('Testing authentication flows...');
    
    try {
      // Test login page
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.waitForLoadState('networkidle');
      
      const loginTitle = await this.page.title();
      logTestResult('Login page loads', loginTitle.includes('Login'), `Title: ${loginTitle}`);
      
      // Test login form elements
      const hasEmailInput = await this.page.$('input[type="email"]') !== null;
      const hasPasswordInput = await this.page.$('input[type="password"]') !== null;
      const hasLoginButton = await this.page.$('button[type="submit"]') !== null;
      
      logTestResult('Login form elements present', hasEmailInput && hasPasswordInput && hasLoginButton);
      
      // Test admin login
      await this.page.fill('input[type="email"]', CONFIG.testUsers.admin.email);
      await this.page.fill('input[type="password"]', CONFIG.testUsers.admin.password);
      await this.page.click('button[type="submit"]');
      
      // Wait for redirect
      await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
      
      const currentUrl = this.page.url();
      logTestResult('Admin login successful', currentUrl.includes('/dashboard'), `URL: ${currentUrl}`);
      
      // Test session persistence (refresh page)
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      
      const stillLoggedIn = this.page.url().includes('/dashboard');
      logTestResult('Session persistence', stillLoggedIn);
      
      // Test logout
      const logoutButton = await this.page.$('button:has-text("Logout")');
      if (logoutButton) {
        await logoutButton.click();
        await this.page.waitForURL('**/login**', { timeout: 10000 });
        
        const loggedOut = this.page.url().includes('/login');
        logTestResult('Logout successful', loggedOut);
      }
      
      await takeScreenshot(this.page, 'authentication-test');
      
    } catch (error) {
      logTestResult('Authentication test', false, error.message);
    }
  }

  async testNavigation() {
    log('Testing navigation and routing...');
    
    try {
      // Login as admin first
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.fill('input[type="email"]', CONFIG.testUsers.admin.email);
      await this.page.fill('input[type="password"]', CONFIG.testUsers.admin.password);
      await this.page.click('button[type="submit"]');
      await this.page.waitForURL('**/dashboard**');
      
      // Test sidebar navigation
      const navItems = [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'User Management', href: '/admin/users' },
        { name: 'Domain Moderation', href: '/admin/domains' },
        { name: 'Deal Management', href: '/admin/deals' }
      ];
      
      for (const item of navItems) {
        const link = await this.page.$(`a[href="${item.href}"]`);
        if (link) {
          await link.click();
          await this.page.waitForLoadState('networkidle');
          
          const currentUrl = this.page.url();
          const navigated = currentUrl.includes(item.href);
          logTestResult(`Navigation to ${item.name}`, navigated, `Expected: ${item.href}, Got: ${currentUrl}`);
        }
      }
      
      // Test domains page navigation
      await this.page.goto(`${this.baseUrl}/domains`);
      await this.page.waitForLoadState('networkidle');
      
      const domainsPageTitle = await this.page.title();
      logTestResult('Domains page loads', domainsPageTitle.includes('Domains'), `Title: ${domainsPageTitle}`);
      
      await takeScreenshot(this.page, 'navigation-test');
      
    } catch (error) {
      logTestResult('Navigation test', false, error.message);
    }
  }

  async testDomainsPage() {
    log('Testing domains page functionality...');
    
    try {
      await this.page.goto(`${this.baseUrl}/domains`);
      await this.page.waitForLoadState('networkidle');
      
      // Test search functionality
      const searchInput = await this.page.$('input[placeholder*="search" i]');
      if (searchInput) {
        await searchInput.fill('tech');
        await searchInput.press('Enter');
        await this.page.waitForLoadState('networkidle');
        
        const hasResults = await this.page.$('[data-testid="domain-card"]') !== null;
        logTestResult('Domain search works', hasResults);
      }
      
      // Test filter functionality
      const categoryFilter = await this.page.$('select[name="category"]');
      if (categoryFilter) {
        await categoryFilter.selectOption('Technology Services');
        await this.page.waitForLoadState('networkidle');
        
        const filteredResults = await this.page.$('[data-testid="domain-card"]') !== null;
        logTestResult('Category filter works', filteredResults);
      }
      
      // Test pagination
      const pagination = await this.page.$('[data-testid="pagination"]');
      if (pagination) {
        const nextButton = await this.page.$('button:has-text("Next")');
        if (nextButton) {
          await nextButton.click();
          await this.page.waitForLoadState('networkidle');
          
          const pageChanged = this.page.url().includes('page=2');
          logTestResult('Pagination works', pageChanged);
        }
      }
      
      // Test domain card interactions
      const domainCard = await this.page.$('[data-testid="domain-card"]');
      if (domainCard) {
        await domainCard.click();
        await this.page.waitForLoadState('networkidle');
        
        const isDomainDetail = this.page.url().includes('/domains/');
        logTestResult('Domain card click navigation', isDomainDetail);
      }
      
      await takeScreenshot(this.page, 'domains-page-test');
      
    } catch (error) {
      logTestResult('Domains page test', false, error.message);
    }
  }

  async testAdminDashboard() {
    log('Testing admin dashboard functionality...');
    
    try {
      // Login as admin
      await this.page.goto(`${this.baseUrl}/login`);
      await this.page.fill('input[type="email"]', CONFIG.testUsers.admin.email);
      await this.page.fill('input[type="password"]', CONFIG.testUsers.admin.password);
      await this.page.click('button[type="submit"]');
      await this.page.waitForURL('**/dashboard**');
      
      // Test admin dashboard elements
      const hasUserManagement = await this.page.$('a[href="/admin/users"]') !== null;
      const hasDomainModeration = await this.page.$('a[href="/admin/domains"]') !== null;
      const hasDealManagement = await this.page.$('a[href="/admin/deals"]') !== null;
      
      logTestResult('Admin dashboard navigation present', hasUserManagement && hasDomainModeration && hasDealManagement);
      
      // Test user management
      await this.page.goto(`${this.baseUrl}/admin/users`);
      await this.page.waitForLoadState('networkidle');
      
      const hasUserTable = await this.page.$('table') !== null;
      logTestResult('User management page loads', hasUserTable);
      
      // Test domain moderation
      await this.page.goto(`${this.baseUrl}/admin/domains`);
      await this.page.waitForLoadState('networkidle');
      
      const hasDomainTable = await this.page.$('table') !== null;
      logTestResult('Domain moderation page loads', hasDomainTable);
      
      await takeScreenshot(this.page, 'admin-dashboard-test');
      
    } catch (error) {
      logTestResult('Admin dashboard test', false, error.message);
    }
  }

  async testResponsiveDesign() {
    log('Testing responsive design...');
    
    try {
      const viewports = [
        { width: 320, height: 568, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1280, height: 720, name: 'Desktop' }
      ];
      
      for (const viewport of viewports) {
        await this.page.setViewport(viewport);
        await this.page.goto(`${this.baseUrl}/domains`);
        await this.page.waitForLoadState('networkidle');
        
        // Check if navigation is responsive
        const nav = await this.page.$('nav');
        if (nav) {
          const navVisible = await nav.isVisible();
          logTestResult(`${viewport.name} navigation visible`, navVisible);
        }
        
        // Check if domain cards are responsive
        const domainCards = await this.page.$$('[data-testid="domain-card"]');
        const cardsVisible = domainCards.length > 0;
        logTestResult(`${viewport.name} domain cards visible`, cardsVisible);
        
        await takeScreenshot(this.page, `responsive-${viewport.name.toLowerCase()}`);
      }
      
    } catch (error) {
      logTestResult('Responsive design test', false, error.message);
    }
  }

  async testPerformance() {
    log('Testing performance metrics...');
    
    try {
      const startTime = Date.now();
      
      await this.page.goto(`${this.baseUrl}/domains`);
      await this.page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      const performanceGood = loadTime < 5000; // 5 seconds
      
      logTestResult('Page load performance', performanceGood, `Load time: ${loadTime}ms`);
      
      // Test with network throttling
      await this.page.emulateNetworkConditions({
        offline: false,
        downloadThroughput: 500 * 1024 / 8, // 500 kbps
        uploadThroughput: 500 * 1024 / 8,
        latency: 200
      });
      
      const slowStartTime = Date.now();
      await this.page.reload();
      await this.page.waitForLoadState('networkidle');
      
      const slowLoadTime = Date.now() - slowStartTime;
      const slowPerformanceGood = slowLoadTime < 10000; // 10 seconds on slow connection
      
      logTestResult('Slow connection performance', slowPerformanceGood, `Load time: ${slowLoadTime}ms`);
      
    } catch (error) {
      logTestResult('Performance test', false, error.message);
    }
  }

  async testErrorHandling() {
    log('Testing error handling...');
    
    try {
      // Test 404 page
      await this.page.goto(`${this.baseUrl}/nonexistent-page`);
      await this.page.waitForLoadState('networkidle');
      
      const has404Content = await this.page.$('text=404') !== null || await this.page.$('text=Not Found') !== null;
      logTestResult('404 page handling', has404Content);
      
      // Test invalid domain page
      await this.page.goto(`${this.baseUrl}/domains/invalid-domain-12345`);
      await this.page.waitForLoadState('networkidle');
      
      const hasErrorContent = await this.page.$('text=not found') !== null || await this.page.$('text=error') !== null;
      logTestResult('Invalid domain page handling', hasErrorContent);
      
      await takeScreenshot(this.page, 'error-handling-test');
      
    } catch (error) {
      logTestResult('Error handling test', false, error.message);
    }
  }

  async runAllTests() {
    log('Starting comprehensive E2E testing...');
    
    await this.setup();
    
    // Run all test suites
    await this.testHomePage();
    await this.testAuthentication();
    await this.testNavigation();
    await this.testDomainsPage();
    await this.testAdminDashboard();
    await this.testResponsiveDesign();
    await this.testPerformance();
    await this.testErrorHandling();
    
    // Generate test report
    await this.generateReport();
  }

  async generateReport() {
    testResults.endTime = new Date();
    const duration = testResults.endTime - testResults.startTime;
    
    log('\n' + '='.repeat(60));
    log('E2E TEST RESULTS SUMMARY');
    log('='.repeat(60));
    log(`Total Tests: ${testResults.total}`);
    log(`Passed: ${testResults.passed}`, 'success');
    log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
    log(`Duration: ${Math.round(duration / 1000)}s`);
    log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.failed > 0) {
      log('\nFAILED TESTS:');
      testResults.details
        .filter(test => !test.passed)
        .forEach(test => {
          log(`- ${test.testName}: ${test.details}`, 'error');
        });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'e2e-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    log(`\nDetailed report saved to: ${reportPath}`);
    
    log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  let browser;
  
  try {
    log('Launching browser...');
    browser = await puppeteer.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const testSuite = new E2ETestSuite(browser, page);
    
    await testSuite.runAllTests();
    
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { E2ETestSuite, CONFIG };
