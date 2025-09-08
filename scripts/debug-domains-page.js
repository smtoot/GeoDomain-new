#!/usr/bin/env node

/**
 * Debug script to check domains page loading
 */

const puppeteer = require('puppeteer');

async function debugDomainsPage() {
  let browser;
  
  try {
    console.log('🔍 Debugging domains page...');
    
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.text().includes('🔍 [DOMAINS PAGE]')) {
        console.log('📝 Console:', msg.text());
      }
    });
    
    // Listen for errors
    page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
    
    // Navigate to domains page
    console.log('🌐 Navigating to domains page...');
    await page.goto('https://geo-domain-new.vercel.app/domains', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Check if page is stuck in loading state
    const loadingElement = await page.$('.animate-spin');
    if (loadingElement) {
      console.log('⚠️  Page appears to be stuck in loading state');
    }
    
    // Check for any error messages
    const errorElements = await page.$$('.text-red-500, .text-red-600, .bg-red-50');
    if (errorElements.length > 0) {
      console.log(`⚠️  Found ${errorElements.length} error elements`);
      for (let i = 0; i < errorElements.length; i++) {
        const text = await errorElements[i].evaluate(el => el.textContent);
        console.log(`   Error ${i + 1}: ${text}`);
      }
    }
    
    // Check for domain cards
    const domainCards = await page.$$('[data-testid="domain-card"]');
    console.log(`📊 Found ${domainCards.length} domain cards`);
    
    // Check for search input
    const searchInput = await page.$('input[placeholder*="search" i]');
    console.log(`🔍 Search input present: ${searchInput !== null}`);
    
    // Check for filter controls
    const selectTriggers = await page.$$('[role="combobox"]');
    console.log(`🎛️  Filter controls present: ${selectTriggers.length}`);
    
    // Get page title
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Check if there's a "No domains found" message
    const noDomainsMessage = await page.$('text="No domains found"');
    if (noDomainsMessage) {
      console.log('⚠️  "No domains found" message is displayed');
    }
    
    await page.close();
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugDomainsPage();
