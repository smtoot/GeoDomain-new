#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to safely remove console.log statements from a file
function cleanConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Remove console.log statements more carefully
    // Pattern 1: Simple console.log statements
    content = content.replace(/^\s*console\.log\([^;]*\);\s*$/gm, '');
    
    // Pattern 2: Console.log statements with template literals
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    
    // Pattern 3: Console.log statements in JSX (but be careful)
    content = content.replace(/\s*{console\.log\([^)]*\);}\s*/g, '');
    
    // Pattern 4: Console.log statements that are part of expressions
    content = content.replace(/console\.log\([^)]*\);\s*/g, '');
    
    // Clean up multiple empty lines
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Cleaned: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and clean files
function cleanDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git, and other build directories
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(item)) {
        cleanDirectory(fullPath);
      }
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      // Only clean source files, not scripts
      if (!dirPath.includes('scripts') && !item.includes('test') && !item.includes('spec')) {
        cleanConsoleLogs(fullPath);
      }
    }
  }
}

// Main execution
console.log('🧹 Starting careful console.log cleanup...');

// Clean specific problematic files first
const problematicFiles = [
  'src/app/dashboard/domains/page.tsx',
  'src/lib/monitoring/monitoring.ts'
];

for (const file of problematicFiles) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    cleanConsoleLogs(fullPath);
  }
}

// Clean src directory
const srcPath = path.join(__dirname, '..', 'src');
if (fs.existsSync(srcPath)) {
  cleanDirectory(srcPath);
  console.log('✅ Cleaned src directory');
} else {
  console.log('❌ src directory not found');
}

console.log('🎉 Console.log cleanup completed!');
