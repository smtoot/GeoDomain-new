#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to remove console.log statements from a file
function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Remove console.log statements (including multi-line ones)
    content = content.replace(/console\.log\([^;]*\);?\s*/g, '');
    content = content.replace(/console\.error\([^;]*\);?\s*/g, '');
    content = content.replace(/console\.warn\([^;]*\);?\s*/g, '');
    content = content.replace(/console\.info\([^;]*\);?\s*/g, '');
    content = content.replace(/console\.debug\([^;]*\);?\s*/g, '');
    
    // Remove empty lines that might be left behind
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Cleaned console logs from: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and process files
function processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let processedCount = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.next', 'dist', 'build'].includes(item)) {
          walkDir(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          if (removeConsoleLogs(fullPath)) {
            processedCount++;
          }
        }
      }
    }
  }
  
  walkDir(dirPath);
  return processedCount;
}

// Main execution
console.log('🧹 Starting console.log cleanup...');

const srcPath = path.join(__dirname, '..', 'src');
const processedCount = processDirectory(srcPath);

console.log(`\n✅ Cleanup complete! Processed ${processedCount} files.`);
console.log('📝 Note: Review the changes before committing to ensure no important logging was removed.');
