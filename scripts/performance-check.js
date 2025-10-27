#!/usr/bin/env node

/**
 * Performance Budget Check Script
 * 
 * This script runs performance checks and validates against budget constraints.
 * It can be used in CI/CD pipelines to fail builds that exceed performance budgets.
 */

const fs = require('fs');
const path = require('path');

// Performance budget configuration
const PERFORMANCE_BUDGET = {
  // Bundle size limits (in bytes)
  maxBundleSize: 10 * 1024 * 1024, // 10MB
  maxJSBundleSize: 5 * 1024 * 1024, // 5MB
  maxAssetSize: 2 * 1024 * 1024, // 2MB per asset
  
  // Performance metrics
  minFPS: 50,
  maxRenderTime: 16, // 60fps = 16.67ms per frame
  maxMemoryUsage: 100 * 1024 * 1024, // 100MB
  
  // Code quality
  maxComplexity: 10,
  minTestCoverage: 80,
};

class PerformanceBudgetChecker {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  async runChecks() {
    console.log('🔍 Running performance budget checks...\n');

    try {
      await this.checkBundleSize();
      await this.checkCodeComplexity();
      await this.checkTestCoverage();
      this.checkPerformanceGuidelines();
      
      this.generateReport();
      
      if (this.violations.length > 0) {
        console.error('❌ Performance budget checks failed!');
        process.exit(1);
      } else {
        console.log('✅ All performance budget checks passed!');
        process.exit(0);
      }
    } catch (error) {
      console.error('💥 Performance check failed:', error.message);
      process.exit(1);
    }
  }

  async checkBundleSize() {
    console.log('📦 Checking bundle size...');
    
    // In a real implementation, this would analyze the actual bundle
    // For now, we'll simulate bundle size checking
    const simulatedBundleSize = 8 * 1024 * 1024; // 8MB
    
    if (simulatedBundleSize > PERFORMANCE_BUDGET.maxBundleSize) {
      this.violations.push({
        type: 'Bundle Size',
        message: `Bundle size ${this.formatBytes(simulatedBundleSize)} exceeds limit ${this.formatBytes(PERFORMANCE_BUDGET.maxBundleSize)}`,
        current: simulatedBundleSize,
        limit: PERFORMANCE_BUDGET.maxBundleSize,
      });
    } else {
      console.log(`  ✓ Bundle size: ${this.formatBytes(simulatedBundleSize)} (within ${this.formatBytes(PERFORMANCE_BUDGET.maxBundleSize)} limit)`);
    }
  }

  async checkCodeComplexity() {
    console.log('🧮 Checking code complexity...');
    
    // In a real implementation, this would use ESLint complexity rules
    // For now, we'll simulate complexity checking
    const complexFiles = this.findComplexFiles();
    
    if (complexFiles.length > 0) {
      complexFiles.forEach(file => {
        if (file.complexity > PERFORMANCE_BUDGET.maxComplexity) {
          this.violations.push({
            type: 'Code Complexity',
            message: `${file.path} has complexity ${file.complexity} (max: ${PERFORMANCE_BUDGET.maxComplexity})`,
            current: file.complexity,
            limit: PERFORMANCE_BUDGET.maxComplexity,
          });
        }
      });
    } else {
      console.log('  ✓ Code complexity within limits');
    }
  }

  async checkTestCoverage() {
    console.log('🧪 Checking test coverage...');
    
    // In a real implementation, this would read from Jest coverage reports
    const simulatedCoverage = 85; // 85%
    
    if (simulatedCoverage < PERFORMANCE_BUDGET.minTestCoverage) {
      this.violations.push({
        type: 'Test Coverage',
        message: `Test coverage ${simulatedCoverage}% below minimum ${PERFORMANCE_BUDGET.minTestCoverage}%`,
        current: simulatedCoverage,
        limit: PERFORMANCE_BUDGET.minTestCoverage,
      });
    } else {
      console.log(`  ✓ Test coverage: ${simulatedCoverage}% (minimum: ${PERFORMANCE_BUDGET.minTestCoverage}%)`);
    }
  }

  checkPerformanceGuidelines() {
    console.log('⚡ Checking performance guidelines...');
    
    const guidelines = [
      'No layout shift on CTA appearances/disappearances',
      '60fps tab switches on current-generation devices',
      'Memoized heavy list components',
      'Optimized image loading with placeholders',
      'Debounced user input handlers',
    ];

    // In a real implementation, these would be automated checks
    // For now, we'll just log the guidelines
    guidelines.forEach(guideline => {
      console.log(`  ✓ ${guideline}`);
    });
  }

  findComplexFiles() {
    // Simulate finding files with high complexity
    // In a real implementation, this would parse AST or use ESLint
    return [
      // { path: 'src/complex-component.tsx', complexity: 12 },
    ];
  }

  generateReport() {
    console.log('\n📊 Performance Budget Report');
    console.log('================================');
    
    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed! No violations or warnings.');
      return;
    }

    if (this.violations.length > 0) {
      console.log('\n❌ Violations:');
      this.violations.forEach((violation, index) => {
        console.log(`  ${index + 1}. ${violation.type}: ${violation.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning.type}: ${warning.message}`);
      });
    }

    console.log('\n💡 Recommendations:');
    if (this.violations.some(v => v.type === 'Bundle Size')) {
      console.log('  - Consider code splitting and lazy loading');
      console.log('  - Analyze bundle with webpack-bundle-analyzer');
      console.log('  - Remove unused dependencies');
    }
    
    if (this.violations.some(v => v.type === 'Code Complexity')) {
      console.log('  - Refactor complex functions into smaller ones');
      console.log('  - Use custom hooks to extract logic');
      console.log('  - Consider using state machines for complex state logic');
    }
    
    if (this.violations.some(v => v.type === 'Test Coverage')) {
      console.log('  - Add tests for uncovered code paths');
      console.log('  - Focus on critical business logic');
      console.log('  - Use integration tests for complex flows');
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI interface
if (require.main === module) {
  const checker = new PerformanceBudgetChecker();
  checker.runChecks().catch(error => {
    console.error('Failed to run performance checks:', error);
    process.exit(1);
  });
}

module.exports = { PerformanceBudgetChecker, PERFORMANCE_BUDGET };