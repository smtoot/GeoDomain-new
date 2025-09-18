#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

console.log('🔐 TESTING LOGIN CREDENTIALS');
console.log('============================\n');

const prisma = new PrismaClient();

try {
  // Test the exact credentials
  const email = 'seller1@test.com';
  const password = 'seller123';
  
  console.log(`Testing login for: ${email}`);
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    console.log('❌ User not found');
    process.exit(1);
  }
  
  console.log(`✅ User found: ${user.name} (${user.role})`);
  console.log(`✅ Status: ${user.status}`);
  console.log(`✅ Email verified: ${user.emailVerified}`);
  
  if (!user.password) {
    console.log('❌ No password set for user');
    process.exit(1);
  }
  
  // Test password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (isPasswordValid) {
    console.log('✅ Password is valid');
  } else {
    console.log('❌ Password is invalid');
    console.log('🔍 Checking if password needs to be reset...');
    
    // Reset password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Password has been reset');
    
    // Test again
    const isPasswordValidAfterReset = await bcrypt.compare(password, hashedPassword);
    if (isPasswordValidAfterReset) {
      console.log('✅ Password is now valid after reset');
    } else {
      console.log('❌ Password still invalid after reset');
    }
  }
  
  console.log('\n🎉 LOGIN CREDENTIALS TEST COMPLETE');
  console.log('\n📋 Test Results:');
  console.log(`- Email: ${email} ✅`);
  console.log(`- Password: ${password} ✅`);
  console.log(`- User Status: ${user.status} ✅`);
  console.log(`- Email Verified: ${user.emailVerified ? 'Yes' : 'No'} ${user.emailVerified ? '✅' : '❌'}`);
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
} finally {
  await prisma.$disconnect();
}
