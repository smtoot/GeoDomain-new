const puppeteer = require('puppeteer');

async function testAdminDetailed() {
  console.log('🔍 Testing Admin Login with Detailed Session Check...');
  
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

    // Wait longer for session to be established
    console.log('⏳ Waiting for session to be established...');
    await page.waitForTimeout(5000);

    // Check session state multiple times
    for (let i = 0; i < 3; i++) {
      console.log(`🔍 Session check ${i + 1}/3...`);
      
      const sessionInfo = await page.evaluate(() => {
        const cookies = document.cookie;
        const localStorage = window.localStorage;
        const sessionStorage = window.sessionStorage;
        
        // Check for NextAuth session
        const nextAuthSession = localStorage.getItem('nextauth.session') || 
                               sessionStorage.getItem('nextauth.session') ||
                               localStorage.getItem('__nextauth.session') ||
                               sessionStorage.getItem('__nextauth.session');
        
        return {
          cookies: cookies,
          localStorage: localStorage,
          sessionStorage: sessionStorage,
          nextAuthSession: nextAuthSession,
          url: window.location.href
        };
      });
      
      console.log('🍪 Cookies:', sessionInfo.cookies);
      console.log('💾 LocalStorage keys:', Object.keys(sessionInfo.localStorage));
      console.log('🗂️ SessionStorage keys:', Object.keys(sessionInfo.sessionStorage));
      console.log('🔐 NextAuth Session:', sessionInfo.nextAuthSession ? 'Found' : 'Not found');
      
      if (sessionInfo.nextAuthSession) {
        console.log('✅ NextAuth session found!');
        break;
      }
      
      if (i < 2) {
        console.log('⏳ Waiting 3 more seconds...');
        await page.waitForTimeout(3000);
      }
    }

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
    } else {
      console.log('❌ Admin dashboard not accessible');
      
      // Check what's on the login page
      const loginContent = await page.evaluate(() => {
        const title = document.title;
        const h1 = document.querySelector('h1')?.textContent;
        const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], .text-red-500, .text-red-600');
        return {
          title: title,
          h1: h1,
          errorCount: errorElements.length,
          errors: Array.from(errorElements).map(el => el.textContent).filter(text => text && text.trim())
        };
      });
      
      console.log('📄 Login page content:', loginContent);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testAdminDetailed().catch(console.error);
