const puppeteer = require('puppeteer');

async function testAdminLogin() {
  console.log('🔍 Testing Admin Login...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    timeout: 120000,
    protocolTimeout: 180000
  });

  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(60000);
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      } else if (msg.text().includes('🔍') || msg.text().includes('❌') || msg.text().includes('✅')) {
        console.log('📝 Console:', msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });

    // Listen for unhandled rejections
    page.on('unhandledrejection', error => {
      console.log('❌ Unhandled Rejection:', error.reason);
    });

    console.log('🌐 Navigating to login page...');
    await page.goto('https://geo-domain-new.vercel.app/login', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });
    await page.waitForSelector('input[type="password"]', { timeout: 30000 });
    await page.waitForSelector('button[type="submit"]', { timeout: 30000 });

    console.log('📝 Filling login form...');
    // Clear and fill email
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) emailInput.value = '';
    });
    await page.type('input[type="email"]', 'admin@geodomainland.com');

    // Clear and fill password
    await page.evaluate(() => {
      const passwordInput = document.querySelector('input[type="password"]');
      if (passwordInput) passwordInput.value = '';
    });
    await page.type('input[type="password"]', 'admin123');

    console.log('🔐 Submitting login form...');
    await page.click('button[type="submit"]');

    console.log('⏳ Waiting for navigation...');
    try {
      await page.waitForNavigation({ 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });
    } catch (error) {
      console.log('⚠️ Navigation timeout, checking current URL...');
    }

    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    // Check if login was successful
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/admin')) {
      console.log('✅ Admin login successful!');
      
      // Test admin dashboard access
      console.log('🌐 Testing admin dashboard access...');
      await page.goto('https://geo-domain-new.vercel.app/admin', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });
      
      const adminUrl = page.url();
      console.log('📍 Admin URL:', adminUrl);
      
      if (adminUrl.includes('/admin')) {
        console.log('✅ Admin dashboard accessible!');
      } else {
        console.log('❌ Admin dashboard not accessible');
      }
      
    } else {
      console.log('❌ Admin login failed');
      
      // Check for error messages
      const errorElements = await page.$$('[class*="error"], [class*="alert"], .text-red-500, .text-red-600');
      if (errorElements.length > 0) {
        console.log('❌ Found error elements:', errorElements.length);
        for (let i = 0; i < errorElements.length; i++) {
          const errorText = await page.evaluate(el => el.textContent, errorElements[i]);
          console.log(`   Error ${i + 1}:`, errorText);
        }
      }
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAdminLogin().catch(console.error);
