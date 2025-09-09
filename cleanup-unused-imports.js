#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get list of files with unused imports
function getFilesWithUnusedImports() {
  try {
    const result = execSync('npx eslint src --format=json', { encoding: 'utf8' });
    const eslintResults = JSON.parse(result);
    
    return eslintResults
      .filter(file => file.messages && file.messages.length > 0)
      .filter(file => file.messages.some(msg => 
        msg.ruleId === '@typescript-eslint/no-unused-vars' && 
        msg.message.includes('is defined but never used')
      ))
      .map(file => ({
        filePath: file.filePath,
        unusedVars: file.messages
          .filter(msg => msg.ruleId === '@typescript-eslint/no-unused-vars' && msg.message.includes('is defined but never used'))
          .map(msg => ({
            line: msg.line,
            column: msg.column,
            message: msg.message,
            variable: extractVariableName(msg.message)
          }))
      }));
  } catch (error) {
    console.error('Error running ESLint:', error.message);
    return [];
  }
}

function extractVariableName(message) {
  const match = message.match(/'([^']+)' is defined but never used/);
  return match ? match[1] : null;
}

// Remove unused imports from a file
function removeUnusedImports(filePath, unusedVars) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Group unused vars by line
    const unusedByLine = {};
    unusedVars.forEach(variable => {
      if (!unusedByLine[variable.line]) {
        unusedByLine[variable.line] = [];
      }
      unusedByLine[variable.line].push(variable.variable);
    });
    
    // Process each line with unused imports
    Object.keys(unusedByLine).forEach(lineNum => {
      const lineIndex = parseInt(lineNum) - 1;
      const lines = content.split('\n');
      const line = lines[lineIndex];
      
      if (line && line.trim().startsWith('import')) {
        const unusedInLine = unusedByLine[lineNum];
        
        // Handle different import patterns
        if (line.includes('{')) {
          // Named imports: import { a, b, c } from 'module'
          const importMatch = line.match(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/);
          if (importMatch) {
            const imports = importMatch[1].split(',').map(imp => imp.trim());
            const module = importMatch[2];
            
            // Remove unused imports
            const remainingImports = imports.filter(imp => {
              const cleanImp = imp.trim().split(' as ')[0].trim();
              return !unusedInLine.includes(cleanImp);
            });
            
            if (remainingImports.length === 0) {
              // Remove entire import line
              lines[lineIndex] = '';
            } else if (remainingImports.length !== imports.length) {
              // Update import line
              lines[lineIndex] = `import { ${remainingImports.join(', ')} } from '${module}';`;
            }
            
            modified = true;
          }
        } else {
          // Default import: import something from 'module'
          const defaultMatch = line.match(/import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/);
          if (defaultMatch) {
            const importName = defaultMatch[1];
            if (unusedInLine.includes(importName)) {
              lines[lineIndex] = '';
              modified = true;
            }
          }
        }
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, lines.join('\n'));
      console.log(`✅ Cleaned up ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main cleanup function
function cleanupUnusedImports() {
  console.log('🔍 Scanning for files with unused imports...');
  
  const filesWithUnused = getFilesWithUnusedImports();
  console.log(`📊 Found ${filesWithUnused.length} files with unused imports`);
  
  let cleanedCount = 0;
  
  filesWithUnused.forEach(file => {
    console.log(`\n🧹 Processing: ${file.filePath}`);
    console.log(`   Unused variables: ${file.unusedVars.map(v => v.variable).join(', ')}`);
    
    if (removeUnusedImports(file.filePath, file.unusedVars)) {
      cleanedCount++;
    }
  });
  
  console.log(`\n🎉 Cleanup complete! Cleaned ${cleanedCount} files.`);
  
  // Run ESLint again to check remaining issues
  console.log('\n🔍 Checking remaining issues...');
  try {
    execSync('npx eslint src --format=json | jq ".[] | select(.messages | length > 0) | {filePath: .filePath, unusedImports: [.messages[] | select(.ruleId == \"@typescript-eslint/no-unused-vars\")]} | select(.unusedImports | length > 0)"', { stdio: 'inherit' });
  } catch (error) {
    console.log('✅ No more unused import issues found!');
  }
}

// Run the cleanup
cleanupUnusedImports();
