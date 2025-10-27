#!/usr/bin/env node

/**
 * Accessibility Check Script
 * 
 * Automated accessibility validation for StatLocker components
 * Checks color contrast, touch targets, and accessibility properties
 */

const fs = require('fs');
const path = require('path');

// Import accessibility utilities
const { getContrastRatio, meetsContrastRequirement, validateTouchTarget } = require('../src/lib/accessibility');

// StatLocker brand colors
const BRAND_COLORS = {
  primary: {
    900: '#0047AB', // Royal Blue
    800: '#1558B8',
    700: '#1F56C4',
    600: '#2E6FD6',
    500: '#3A84E9',
    100: '#E6F0FF',
  },
  success: '#00D4FF',
  warning: '#F5C542',
  danger: '#DC2626',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    500: '#6B7280',
    900: '#111827',
  },
  white: '#FFFFFF',
  muted: '#1F1F1F',
};

// Common color combinations used in the app
const COLOR_COMBINATIONS = [
  // Primary button
  { name: 'Primary Button Text', fg: BRAND_COLORS.white, bg: BRAND_COLORS.primary[900], context: 'button' },
  
  // Secondary button
  { name: 'Secondary Button Text', fg: BRAND_COLORS.primary[900], bg: BRAND_COLORS.white, context: 'button' },
  
  // Body text
  { name: 'Body Text', fg: BRAND_COLORS.gray[900], bg: BRAND_COLORS.white, context: 'text' },
  
  // Gray text
  { name: 'Gray Text', fg: BRAND_COLORS.gray[500], bg: BRAND_COLORS.white, context: 'text' },
  
  // Success text
  { name: 'Success Text', fg: BRAND_COLORS.success, bg: BRAND_COLORS.white, context: 'text' },
  
  // Warning text
  { name: 'Warning Text', fg: BRAND_COLORS.warning, bg: BRAND_COLORS.white, context: 'text' },
  
  // Danger text
  { name: 'Danger Text', fg: BRAND_COLORS.danger, bg: BRAND_COLORS.white, context: 'text' },
  
  // Light gray text (large text only)
  { name: 'Light Gray Text (Large)', fg: BRAND_COLORS.gray[400], bg: BRAND_COLORS.white, context: 'large-text' },
];

// Touch target test cases
const TOUCH_TARGET_TESTS = [
  { name: 'Button (Default)', width: 48, height: 48 },
  { name: 'Button (Small)', width: 44, height: 44 },
  { name: 'Button (Large)', width: 56, height: 56 },
  { name: 'Tab Bar Item', width: 64, height: 68 },
  { name: 'Icon Button', width: 44, height: 44 },
  { name: 'Close Button', width: 44, height: 44 },
  { name: 'FAB', width: 56, height: 56 },
];

/**
 * Check color contrast compliance
 */
function checkColorContrast() {
  console.log('\n🎨 Color Contrast Analysis');
  console.log('=' .repeat(50));
  
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  
  COLOR_COMBINATIONS.forEach(({ name, fg, bg, context }) => {
    const ratio = getContrastRatio(fg, bg);
    const isLargeText = context === 'large-text';
    const meetsAA = meetsContrastRequirement(fg, bg, 'AA', isLargeText);
    const meetsAAA = meetsContrastRequirement(fg, bg, 'AAA', isLargeText);
    
    let status = '❌ FAIL';
    let recommendation = '';
    
    if (meetsAAA) {
      status = '✅ PASS (AAA)';
      passCount++;
    } else if (meetsAA) {
      status = '✅ PASS (AA)';
      passCount++;
    } else {
      status = '❌ FAIL';
      failCount++;
      
      if (isLargeText) {
        recommendation = ' - Needs ≥3:1 ratio for large text';
      } else {
        recommendation = ' - Needs ≥4.5:1 ratio for normal text';
      }
    }
    
    console.log(`${name}: ${ratio.toFixed(2)}:1 ${status}${recommendation}`);
  });
  
  console.log(`\nSummary: ${passCount} passed, ${failCount} failed, ${warningCount} warnings`);
  
  return { passCount, failCount, warningCount };
}

/**
 * Check touch target compliance
 */
function checkTouchTargets() {
  console.log('\n👆 Touch Target Analysis');
  console.log('=' .repeat(50));
  
  let passCount = 0;
  let failCount = 0;
  let warningCount = 0;
  
  TOUCH_TARGET_TESTS.forEach(({ name, width, height }) => {
    const validation = validateTouchTarget(width, height);
    
    if (validation.isValid) {
      if (validation.recommendations.length === 0) {
        console.log(`${name}: ${width}×${height}pt ✅ OPTIMAL`);
        passCount++;
      } else {
        console.log(`${name}: ${width}×${height}pt ⚠️  MINIMUM (${validation.recommendations[0]})`);
        warningCount++;
      }
    } else {
      console.log(`${name}: ${width}×${height}pt ❌ TOO SMALL (${validation.recommendations[0]})`);
      failCount++;
    }
  });
  
  console.log(`\nSummary: ${passCount} optimal, ${warningCount} minimum, ${failCount} too small`);
  
  return { passCount, failCount, warningCount };
}

/**
 * Scan component files for accessibility issues
 */
function scanComponentFiles() {
  console.log('\n🔍 Component File Analysis');
  console.log('=' .repeat(50));
  
  const componentsDir = path.join(__dirname, '../src/components');
  const componentFiles = fs.readdirSync(componentsDir)
    .filter(file => file.endsWith('.tsx') && !file.includes('.test.'))
    .slice(0, 10); // Limit to first 10 files for demo
  
  let issuesFound = 0;
  
  componentFiles.forEach(file => {
    const filePath = path.join(componentsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const issues = [];
    
    // Check for hardcoded colors (should use design tokens)
    const hardcodedColorRegex = /#[0-9a-fA-F]{6}|rgb\(|rgba\(/g;
    const hardcodedColors = content.match(hardcodedColorRegex);
    if (hardcodedColors && hardcodedColors.length > 0) {
      issues.push(`Found ${hardcodedColors.length} hardcoded color(s)`);
    }
    
    // Check for missing accessibility labels on Pressable/TouchableOpacity
    if (content.includes('<Pressable') || content.includes('<TouchableOpacity')) {
      if (!content.includes('accessibilityLabel')) {
        issues.push('Interactive element may be missing accessibilityLabel');
      }
    }
    
    // Check for missing accessibility roles
    if (content.includes('<Pressable') && !content.includes('accessibilityRole')) {
      issues.push('Pressable component may be missing accessibilityRole');
    }
    
    // Check for inline styles (should use className)
    const inlineStyleRegex = /style=\{\{[^}]+\}\}/g;
    const inlineStyles = content.match(inlineStyleRegex);
    if (inlineStyles && inlineStyles.length > 3) { // Allow some inline styles
      issues.push(`Found ${inlineStyles.length} inline styles (prefer className)`);
    }
    
    if (issues.length > 0) {
      console.log(`${file}:`);
      issues.forEach(issue => {
        console.log(`  ⚠️  ${issue}`);
        issuesFound++;
      });
    } else {
      console.log(`${file}: ✅ No issues found`);
    }
  });
  
  console.log(`\nSummary: ${issuesFound} potential issues found in ${componentFiles.length} files`);
  
  return issuesFound;
}

/**
 * Generate accessibility report
 */
function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    colorContrast: results.colorContrast,
    touchTargets: results.touchTargets,
    componentIssues: results.componentIssues,
    overall: {
      status: results.colorContrast.failCount === 0 && results.touchTargets.failCount === 0 ? 'PASS' : 'FAIL',
      criticalIssues: results.colorContrast.failCount + results.touchTargets.failCount,
      warnings: results.colorContrast.warningCount + results.touchTargets.warningCount + results.componentIssues,
    }
  };
  
  // Write report to file
  const reportPath = path.join(__dirname, '../accessibility-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📊 Report saved to: ${reportPath}`);
  
  return report;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 StatLocker Accessibility Check');
  console.log('=' .repeat(50));
  
  try {
    const colorResults = checkColorContrast();
    const touchResults = checkTouchTargets();
    const componentIssues = scanComponentFiles();
    
    const results = {
      colorContrast: colorResults,
      touchTargets: touchResults,
      componentIssues: componentIssues,
    };
    
    const report = generateReport(results);
    
    console.log('\n🎯 Overall Results');
    console.log('=' .repeat(50));
    console.log(`Status: ${report.overall.status}`);
    console.log(`Critical Issues: ${report.overall.criticalIssues}`);
    console.log(`Warnings: ${report.overall.warnings}`);
    
    if (report.overall.status === 'FAIL') {
      console.log('\n❌ Accessibility check failed. Please fix critical issues before release.');
      process.exit(1);
    } else {
      console.log('\n✅ Accessibility check passed!');
      if (report.overall.warnings > 0) {
        console.log(`⚠️  ${report.overall.warnings} warnings found. Consider addressing for better accessibility.`);
      }
      process.exit(0);
    }
    
  } catch (error) {
    console.error('Error running accessibility check:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  checkColorContrast,
  checkTouchTargets,
  scanComponentFiles,
  generateReport,
};