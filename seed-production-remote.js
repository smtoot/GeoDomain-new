#!/usr/bin/env node

/**
 * Remote Production Database Seeding Script
 * 
 * This script calls the production seeding API endpoint to populate the database.
 * 
 * Usage: node seed-production-remote.js
 */

const https = require('https');
const http = require('http');

// Configuration
const PRODUCTION_URL = 'https://geo-domain-i4kv2p9ut-omers-projects-b58ee547.vercel.app';
const SEED_TOKEN = 'default-seed-token-2024'; // Change this to match your SEED_AUTH_TOKEN

async function seedProduction() {
  console.log('🚀 Starting remote production database seeding...\n');

  const url = `${PRODUCTION_URL}/api/seed-production`;
  
  const postData = JSON.stringify({});
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SEED_TOKEN}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const client = PRODUCTION_URL.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Production database seeded successfully!');
            console.log('\n📊 Results:');
            console.log(`  • ${response.data.users} users created`);
            console.log(`  • ${response.data.domains} domains created`);
            console.log(`  • ${response.data.inquiries} inquiries created`);
            console.log(`  • ${response.data.analytics} analytics records created`);
            
            console.log('\n📋 Demo Account Credentials:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🔐 Admin Account:');
            console.log(`  Email: ${response.demoAccounts.admin.email} | Password: ${response.demoAccounts.admin.password}`);
            console.log('\n🏪 Seller Account:');
            console.log(`  Email: ${response.demoAccounts.seller.email} | Password: ${response.demoAccounts.seller.password}`);
            console.log('\n🛒 Buyer Account:');
            console.log(`  Email: ${response.demoAccounts.buyer.email} | Password: ${response.demoAccounts.buyer.password}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            console.log('\n🎯 Next Steps:');
            console.log('1. Visit your production site - domains should now be visible');
            console.log('2. Test demo user login with the credentials above');
            console.log('3. Verify all dashboards load properly');
            
            resolve(response);
          } else {
            console.error('❌ Seeding failed:', response.error || response.message);
            reject(new Error(response.error || response.message));
          }
        } catch (error) {
          console.error('❌ Failed to parse response:', error.message);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function main() {
  try {
    await seedProduction();
  } catch (error) {
    console.error('\n❌ Remote seeding failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the production URL is correct');
    console.log('2. Verify the SEED_AUTH_TOKEN matches in production');
    console.log('3. Ensure the API endpoint is accessible');
    console.log('4. Check production logs for detailed error messages');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedProduction };
