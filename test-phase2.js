const fs = require('fs');

console.log('🧪 Testing Phase 2: Core Features Fixes\n');

// Test 1: Check if inquiries management is fixed
console.log('1. Checking Inquiries Management fixes...');
const inquiriesFile = 'src/app/dashboard/inquiries/page.tsx';
const inquiriesRouter = 'src/server/api/routers/inquiries.ts';

if (fs.existsSync(inquiriesFile) && fs.existsSync(inquiriesRouter)) {
  const inquiriesContent = fs.readFileSync(inquiriesFile, 'utf8');
  const routerContent = fs.readFileSync(inquiriesRouter, 'utf8');
  
  if (!inquiriesContent.includes('mockInquiries') && 
      routerContent.includes('PENDING_REVIEW') &&
      routerContent.includes('getSellerInquiryCount')) {
    console.log('   ✅ Inquiries management properly fixed');
  } else {
    console.log('   ❌ Inquiries management still has issues');
  }
}

// Test 2: Check if deals management is fixed
console.log('\n2. Checking Deals Management fixes...');
const dealsFile = 'src/app/dashboard/deals/page.tsx';
const dealsRouter = 'src/server/api/routers/deals.ts';

if (fs.existsSync(dealsFile) && fs.existsSync(dealsRouter)) {
  const dealsContent = fs.readFileSync(dealsFile, 'utf8');
  const dealsRouterContent = fs.readFileSync(dealsRouter, 'utf8');
  
  if (!dealsContent.includes('mockDeals') && 
      dealsContent.includes('NEGOTIATING') &&
      dealsContent.includes('PAYMENT_PENDING') &&
      dealsRouterContent.includes('NEGOTIATING')) {
    console.log('   ✅ Deals management properly fixed');
  } else {
    console.log('   ❌ Deals management still has issues');
  }
}

// Test 3: Check if domain management is fixed
console.log('\n3. Checking Domain Management fixes...');
const domainsFile = 'src/app/dashboard/domains/page.tsx';
const domainsRouter = 'src/server/api/routers/domains.ts';

if (fs.existsSync(domainsFile) && fs.existsSync(domainsRouter)) {
  const domainsContent = fs.readFileSync(domainsFile, 'utf8');
  const domainsRouterContent = fs.readFileSync(domainsRouter, 'utf8');
  
  if (domainsContent.includes('domainInquiries') &&
      domainsRouterContent.includes('_count') &&
      domainsRouterContent.includes('inquiries: true')) {
    console.log('   ✅ Domain management properly fixed');
  } else {
    console.log('   ❌ Domain management still has issues');
  }
}

// Test 4: Check if sidebar inquiry count is working
console.log('\n4. Checking Sidebar Inquiry Count...');
const sidebarFile = 'src/components/layout/sidebar.tsx';

if (fs.existsSync(sidebarFile)) {
  const sidebarContent = fs.readFileSync(sidebarFile, 'utf8');
  
  if (sidebarContent.includes('getSellerInquiryCount') &&
      sidebarContent.includes('inquiryCount > 0 ? inquiryCount.toString() : undefined')) {
    console.log('   ✅ Sidebar inquiry count properly implemented');
  } else {
    console.log('   ❌ Sidebar inquiry count not properly implemented');
  }
}

console.log('\n🎯 Phase 2 Testing Complete!');
console.log('\nNext steps:');
console.log('- Test the application manually in browser');
console.log('- Verify all core features are working');
console.log('- Check data consistency across all pages');
console.log('- Move to Phase 3 if all tests pass');
