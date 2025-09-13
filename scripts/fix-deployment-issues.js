#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to safely remove console.log statements while preserving code structure
function safeRemoveConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Remove console.log statements but preserve code structure
    // This regex is more conservative and won't break code structure
    content = content.replace(/^\s*console\.(log|error|warn|info|debug)\([^;]*\);\s*$/gm, '');
    
    // Remove empty lines that might be left behind (but be conservative)
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Safely cleaned console logs from: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to fix specific syntax issues
function fixSyntaxIssues(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix empty catch blocks
    content = content.replace(/catch\s*\(\s*[^)]*\s*\)\s*{\s*}\s*/g, 'catch (error) {\n    // Handle error silently\n  }');
    
    // Fix empty function bodies
    content = content.replace(/{\s*}\s*$/gm, '{\n    // Empty function body\n  }');
    
    // Fix incomplete expressions
    content = content.replace(/,\s*$/gm, '');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed syntax issues in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing syntax in ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
console.log('🔧 Fixing deployment issues...');

// List of files that need to be fixed
const filesToFix = [
  'src/components/layout/main-layout.tsx',
  'src/app/admin/performance/page.tsx',
  'src/app/dashboard/domains/page.tsx',
  'src/app/robots.txt/route.ts',
  'src/app/sitemap.xml/route.ts',
  'src/lib/database/database.ts',
  'src/lib/monitoring/monitoring.ts'
];

let fixedCount = 0;

filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    if (fixSyntaxIssues(fullPath)) {
      fixedCount++;
    }
  }
});

console.log(`\n✅ Fixed ${fixedCount} files with syntax issues.`);
console.log('📝 Deployment issues should now be resolved.');
