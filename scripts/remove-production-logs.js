#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to remove console.log statements from a file
function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console.log statements (including multi-line ones)
    content = content.replace(/console\.log\([^;]*\);?\s*/g, '');
    
    // Remove console.log statements with template literals and complex expressions
    content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
    
    // Remove any remaining console.log statements
    content = content.replace(/console\.log\([^)]*\);?\s*/g, '');
    
    // Clean up empty lines (more than 2 consecutive)
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned: ${filePath}`);
    return true;
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
        removeConsoleLogs(fullPath);
      }
    }
  }
}

// Main execution
console.log('🧹 Starting production log cleanup...');

// Clean src directory
const srcPath = path.join(__dirname, '..', 'src');
if (fs.existsSync(srcPath)) {
  cleanDirectory(srcPath);
  console.log('✅ Cleaned src directory');
} else {
  console.log('❌ src directory not found');
}

console.log('🎉 Production log cleanup completed!');
