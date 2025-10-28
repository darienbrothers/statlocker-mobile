#!/usr/bin/env node

/**
 * Asset Replacement Helper Script
 * 
 * This script helps you replace placeholder assets with your actual brand assets.
 * Run this script after placing your PNG files in the project root.
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

const assetMappings = {
  // Your source files (place these in project root)
  'logoBlack.png': 'logoBlack.png',
  'logoWhite.png': 'logoWhite.png', 
  'textLogoWhite.png': 'textLogoWhite.png',
  'textLogoBlack.png': 'textLogoBlack.png',
  'appicon.png': 'appicon.png',
  
  // Optional: if you have these files
  'icon.png': 'icon.png',
  'notification-icon.png': 'notification-icon.png'
};

function replaceAssets() {
  console.log('🎨 StatLocker Asset Replacement Tool\n');
  
  let replacedCount = 0;
  let skippedCount = 0;
  
  for (const [sourceFile, targetFile] of Object.entries(assetMappings)) {
    const sourcePath = path.join(__dirname, '..', sourceFile);
    const targetPath = path.join(ASSETS_DIR, targetFile);
    
    if (fs.existsSync(sourcePath)) {
      try {
        // Copy the file
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`✅ Replaced: ${targetFile}`);
        replacedCount++;
      } catch (error) {
        console.log(`❌ Failed to replace ${targetFile}: ${error.message}`);
      }
    } else {
      console.log(`⏭️  Skipped: ${sourceFile} (not found in project root)`);
      skippedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Replaced: ${replacedCount} assets`);
  console.log(`   Skipped: ${skippedCount} assets`);
  
  if (replacedCount > 0) {
    console.log(`\n🚀 Assets updated! Restart your development server to see changes.`);
    console.log(`   Run: npm start`);
  }
  
  if (skippedCount > 0) {
    console.log(`\n💡 To replace more assets:`);
    console.log(`   1. Place your PNG files in the project root`);
    console.log(`   2. Run this script again: npm run replace-assets`);
  }
}

// Run the replacement
replaceAssets();