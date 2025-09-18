#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

console.log('🔐 TESTING NEXTAUTH LOGIN FLOW');
console.log('===============================\n');

const prisma = new PrismaClient();

async function testNextAuthFlow() {
  try {
    const email = 'seller1@test.com';
    const password = 'seller123';
    
    console.log('1️⃣ Testing user lookup...');
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ User found: ${user.name} (${user.role})`);
    console.log(`✅ Status: ${user.status}`);
    console.log(`✅ Email verified: ${user.emailVerified}`);
    
    console.log('\n2️⃣ Testing password validation...');
    if (!user.password) {
      console.log('❌ No password set');
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log(`✅ Password valid: ${isPasswordValid}`);
    
    console.log('\n3️⃣ Testing NextAuth conditions...');
    
    // Check all NextAuth conditions
    const conditions = [
      { name: 'User exists', value: !!user },
      { name: 'Password exists', value: !!user.password },
      { name: 'Password valid', value: isPasswordValid },
      { name: 'Status is ACTIVE', value: user.status === 'ACTIVE' },
      { name: 'Email is verified', value: !!user.emailVerified }
    ];
    
    conditions.forEach(condition => {
      console.log(`   ${condition.value ? '✅' : '❌'} ${condition.name}: ${condition.value}`);
    });
    
    const allConditionsMet = conditions.every(c => c.value);
    console.log(`\n🎯 All conditions met: ${allConditionsMet ? '✅' : '❌'}`);
    
    if (allConditionsMet) {
      console.log('\n✅ NextAuth should work! The issue might be:');
      console.log('   - Server needs restart after .env.local changes');
      console.log('   - Browser cache needs clearing');
      console.log('   - Wrong port (should be localhost:3002)');
    } else {
      console.log('\n❌ NextAuth conditions not met. Fix the issues above.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testNextAuthFlow();