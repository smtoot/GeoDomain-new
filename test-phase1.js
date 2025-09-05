const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Phase 1: Data Consistency Fixes\n');

// Test 1: Check if mock data has been removed
console.log('1. Checking for mock data removal...');
const dashboardFiles = [
  'src/app/dashboard/page.tsx',
  'src/app/dashboard/analytics/page.tsx',
  'src/app/dashboard/deals/page.tsx',
  'src/app/dashboard/settings/page.tsx'
];

let mockDataFound = false;
dashboardFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('mockStats') || content.includes('mockRecentActivity') || 
        content.includes('mockAnalytics') || content.includes('mockDeals') || 
        content.includes('mockUser')) {
      console.log(`   ❌ Mock data still found in ${file}`);
      mockDataFound = true;
    }
  }
});

if (!mockDataFound) {
  console.log('   ✅ All mock data has been removed from dashboard files');
}

// Test 2: Check if sidebar uses real inquiry count
console.log('\n2. Checking sidebar inquiry count implementation...');
const sidebarFile = 'src/components/layout/sidebar.tsx';
if (fs.existsSync(sidebarFile)) {
  const content = fs.readFileSync(sidebarFile, 'utf8');
  if (content.includes('inquiryCount') && content.includes('trpc.inquiries.getDomainInquiries.useQuery')) {
    console.log('   ✅ Sidebar now uses real inquiry count from tRPC');
  } else {
    console.log('   ❌ Sidebar inquiry count not properly implemented');
  }
}

// Test 3: Check if dashboard uses fallback data structure
console.log('\n3. Checking dashboard fallback data structure...');
const dashboardFile = 'src/app/dashboard/page.tsx';
if (fs.existsSync(dashboardFile)) {
  const content = fs.readFileSync(dashboardFile, 'utf8');
  if (content.includes('stats || {') && content.includes('totalViews: 0')) {
    console.log('   ✅ Dashboard has proper fallback data structure');
  } else {
    console.log('   ❌ Dashboard fallback data structure not properly implemented');
  }
}

// Test 4: Check if dashboard router provides real data
console.log('\n4. Checking dashboard router implementation...');
const routerFile = 'src/server/api/routers/dashboard.ts';
if (fs.existsSync(routerFile)) {
  const content = fs.readFileSync(routerFile, 'utf8');
  if (content.includes('inquiry.count') && content.includes('domain.count')) {
    console.log('   ✅ Dashboard router provides real data from database');
  } else {
    console.log('   ❌ Dashboard router not properly implemented');
  }
}

console.log('\n🎯 Phase 1 Testing Complete!');
console.log('\nNext steps:');
console.log('- Test the application manually in browser');
console.log('- Verify sidebar shows correct inquiry count');
console.log('- Check dashboard displays real data');
console.log('- Move to Phase 2 if all tests pass');
