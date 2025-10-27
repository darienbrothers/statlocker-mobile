#!/usr/bin/env node

/**
 * Auto-replace common hardcoded colors with design tokens
 *
 * Usage: node scripts/replace-colors.js [file-pattern]
 * Example: node scripts/replace-colors.js "src/**/*.{ts,tsx}"
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color replacement mappings
const colorReplacements = {
  // Hex colors to Tailwind classes
  '#0047AB': 'text-primary-900', // or bg-primary-900
  '#1558B8': 'text-primary-800',
  '#1F56C4': 'text-primary-700',
  '#2E6FD6': 'text-primary-600',
  '#3A84E9': 'text-primary-500',
  '#E6F0FF': 'text-primary-100',
  
  '#00D4FF': 'text-success',
  '#F5C542': 'text-warning',
  '#DC2626': 'text-danger',
  
  '#F9FAFB': 'text-gray-50',
  '#F3F4F6': 'text-gray-100',
  '#E5E7EB': 'text-gray-200',
  '#9CA3AF': 'text-gray-400',
  '#6B7280': 'text-gray-500',
  '#111827': 'text-gray-900',
  
  '#FFFFFF': 'text-white',
  '#ffffff': 'text-white',
  
  // Common color names
  'white': 'text-white',
  'black': 'text-gray-900',
  
  // Background variants
  'backgroundColor: "#0047AB"': 'className="bg-primary-900"',
  'backgroundColor: "#FFFFFF"': 'className="bg-white"',
  'backgroundColor: "white"': 'className="bg-white"',
};

function replaceColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    
    // Apply replacements
    for (const [oldColor, newToken] of Object.entries(colorReplacements)) {
      const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newToken);
        hasChanges = true;
        console.log(`  Replaced "${oldColor}" with "${newToken}"`);
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated ${filePath}`);
    }
    
    return hasChanges;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  const pattern = process.argv[2] || 'src/**/*.{ts,tsx}';
  
  console.log(`🔍 Searching for files matching: ${pattern}`);
  
  const files = glob.sync(pattern, {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/tokens.ts', // Skip token files
      '**/*.test.*',
      '**/*.spec.*',
    ],
  });
  
  if (files.length === 0) {
    console.log('No files found matching the pattern.');
    return;
  }
  
  console.log(`📁 Found ${files.length} files to process\n`);
  
  let totalChanges = 0;
  
  files.forEach(file => {
    console.log(`Processing: ${file}`);
    const hasChanges = replaceColorsInFile(file);
    if (hasChanges) {
      totalChanges++;
    }
  });
  
  console.log(`\n🎉 Processed ${files.length} files, updated ${totalChanges} files`);
  
  if (totalChanges > 0) {
    console.log('\n💡 Remember to:');
    console.log('  1. Review the changes');
    console.log('  2. Run npm run lint:fix to format');
    console.log('  3. Test your components');
  }
}

if (require.main === module) {
  main();
}

module.exports = { replaceColorsInFile, colorReplacements };