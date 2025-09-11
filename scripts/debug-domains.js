// Simple script to check domains without Prisma connection
console.log('🔍 Debug: Checking domain listing logic...');

// Check if the issue might be in the frontend query
console.log('📋 Admin domains page query parameters:');
console.log('  - searchTerm: "" (empty)');
console.log('  - statusFilter: "ALL"');
console.log('  - currentPage: 1');
console.log('  - limit: 20');

console.log('\n🔍 Possible issues:');
console.log('1. Domain might be permanently deleted (not in database)');
console.log('2. Domain might have a different status than expected');
console.log('3. Domain might have a different name (case sensitivity)');
console.log('4. Query might be failing due to authentication issues');
console.log('5. Database connection issues');

console.log('\n💡 Next steps:');
console.log('1. Check browser console for any errors');
console.log('2. Check if the tRPC query is being called');
console.log('3. Verify the domain exists in the database');
console.log('4. Check the domain status and name exactly');
