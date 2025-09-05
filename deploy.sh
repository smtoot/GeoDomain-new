#!/bin/bash

# GeoDomain MVP Deployment Script for Vercel + PostgreSQL

echo "🚀 Starting GeoDomain MVP Deployment..."

# Step 1: Clean up
echo "📦 Cleaning up build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Step 2: Install dependencies
echo "📥 Installing dependencies..."
npm install

# Step 3: Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Step 4: Build the application
echo "🏗️ Building application..."
npm run build

# Step 5: Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Install Vercel CLI: npm i -g vercel"
    echo "2. Login to Vercel: vercel login"
    echo "3. Deploy: vercel --prod"
    echo "4. Set environment variables in Vercel dashboard"
    echo "5. Run database migration: npx prisma db push"
    echo "6. Seed database: npx tsx prisma/seed.ts"
else
    echo "❌ Build failed! Please fix the errors above."
    exit 1
fi
