#!/usr/bin/env node

/**
 * Health Check Script for GeoDomain
 * 
 * Simple HTTP requests to verify the site is accessible and responding
 */

const https = require('https');
const http = require('http');

const CONFIG = {
  baseUrl: 'https://geo-domain-new.vercel.app',
  localUrl: 'http://localhost:3000',
  useLocal: process.argv.includes('--local'),
  timeout: 10000
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

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.get(url, { timeout: CONFIG.timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
  });
}

async function testEndpoint(name, path) {
  try {
    const url = `${CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl}${path}`;
    const response = await makeRequest(url);
    
    const isSuccess = response.statusCode >= 200 && response.statusCode < 500;
    recordTest(name, isSuccess, `Status: ${response.statusCode}`);
    
    return response;
  } catch (error) {
    recordTest(name, false, error.message);
    return null;
  }
}

async function runHealthCheck() {
  log('🏥 Starting GeoDomain Health Check...');
  
  const baseUrl = CONFIG.useLocal ? CONFIG.localUrl : CONFIG.baseUrl;
  log(`Testing: ${baseUrl}`);
  
  // Test 1: Home page
  await testEndpoint('Home page', '/');
  
  // Test 2: Domains page
  await testEndpoint('Domains page', '/domains');
  
  // Test 3: Login page
  await testEndpoint('Login page', '/login');
  
  // Test 4: Admin pages (should redirect to login)
  await testEndpoint('Admin users page', '/admin/users');
  
  // Test 5: API health check
  await testEndpoint('API health check', '/api/health/check');
  
  // Test 6: Search filters API
  await testEndpoint('Search filters API', '/api/search/filters');
  
  // Test 7: 404 page
  await testEndpoint('404 page', '/nonexistent-page');
  
  // Generate report
  generateReport();
}

function generateReport() {
  const duration = Date.now() - results.startTime;
  const successRate = Math.round((results.passed / results.total) * 100);
  
  log('\n' + '='.repeat(60));
  log('🏥 HEALTH CHECK RESULTS');
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
  
  log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run health check
if (require.main === module) {
  runHealthCheck().catch(console.error);
}

module.exports = { runHealthCheck };
