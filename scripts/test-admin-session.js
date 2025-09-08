const puppeteer = require('puppeteer');

async function testAdminSession() {
  console.log('🔍 Testing Admin Session...');
  
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

    console.log('🌐 Navigating to login page...');
    await page.goto('https://geo-domain-new.vercel.app/login', { 
      waitUntil: 'networkidle2',
      timeout: 60000 
    });

    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 30000 });

    console.log('📝 Filling login form...');
    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) emailInput.value = '';
    });
    await page.type('input[type="email"]', 'admin@geodomainland.com');

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
    console.log('📍 Current URL after login:', currentUrl);

    // Wait a bit for session to be established
    await page.waitForTimeout(3000);

    // Check session state
    console.log('🔍 Checking session state...');
    const sessionInfo = await page.evaluate(() => {
      // Check if there's a session in localStorage or cookies
      const cookies = document.cookie;
      const localStorage = window.localStorage;
      return {
        cookies: cookies,
        localStorage: localStorage,
        url: window.location.href
      };
    });
    
    console.log('🍪 Cookies:', sessionInfo.cookies);
    console.log('💾 LocalStorage:', sessionInfo.localStorage);

    // Try to access admin page
    console.log('🌐 Navigating to admin page...');
    await page.goto('https://geo-domain-new.vercel.app/admin', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    const adminUrl = page.url();
    console.log('📍 Admin URL:', adminUrl);

    if (adminUrl.includes('/admin') && !adminUrl.includes('/login')) {
      console.log('✅ Admin dashboard accessible!');
      
      // Check if admin content is loaded
      const adminContent = await page.evaluate(() => {
        const adminElements = document.querySelectorAll('[class*="admin"], h1, h2');
        return Array.from(adminElements).map(el => el.textContent).filter(text => text && text.trim());
      });
      
      console.log('📄 Admin content found:', adminContent);
      
    } else {
      console.log('❌ Admin dashboard not accessible');
      
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

testAdminSession().catch(console.error);
