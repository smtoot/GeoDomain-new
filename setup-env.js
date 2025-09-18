const fs = require('fs');
const path = require('path');

const envContent = `DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your_nextauth_secret_here_make_it_long_and_random"
NEXTAUTH_URL="http://localhost:3002"`;

const envPath = path.join(__dirname, '.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local file');
} catch (error) {
  console.error('❌ Failed to create .env.local:', error);
}