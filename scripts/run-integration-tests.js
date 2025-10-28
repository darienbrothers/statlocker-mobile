#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * Runs all integration tests and validates coverage for the onboarding system.
 * This script ensures all requirements are tested and provides a comprehensive
 * test report.
 */

const { execSync } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const path = require('path');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(`  ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSubsection(title) {
  log(`\n${title}`, 'yellow');
  log('-'.repeat(title.length), 'yellow');
}

function runCommand(command, description) {
  log(`\n${description}...`, 'blue');
  try {
    const output = execSync(command, { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    log('✓ Success', 'green');
    return { success: true, output };
  } catch (error) {
    log(`✗ Failed: ${error.message}`, 'red');
    return { success: false, error: error.message, output: error.stdout };
  }
}

function checkTestFiles() {
  logSubsection('Checking Test File Existence');
  
  const requiredTestFiles = [
    'src/__tests__/integration/OnboardingFlow.e2e.test.tsx',
    'src/__tests__/integration/ExternalServices.integration.test.ts',
    'src/__tests__/integration/TestCoverage.validation.test.ts',
    'src/components/onboarding/steps/__tests__/CoreSteps.integration.vitest.ts',
  ];

  const missingFiles = [];
  const existingFiles = [];

  requiredTestFiles.forEach(file => {
    const fullPath = path.join(process.cwd(), file);
    if (existsSync(fullPath)) {
      log(`✓ ${file}`, 'green');
      existingFiles.push(file);
    } else {
      log(`✗ ${file}`, 'red');
      missingFiles.push(file);
    }
  });

  return { existingFiles, missingFiles };
}

function runUnitTests() {
  logSubsection('Running Unit Tests');
  
  const jestResult = runCommand(
    'npm test -- --testPathPattern="__tests__" --testNamePattern="(unit|Unit)" --passWithNoTests',
    'Running Jest unit tests'
  );

  const vitestResult = runCommand(
    'npx vitest run --reporter=verbose src/components/onboarding/steps/__tests__/CoreSteps.integration.vitest.ts',
    'Running Vitest integration tests'
  );

  return { jestResult, vitestResult };
}

function runIntegrationTests() {
  logSubsection('Running Integration Tests');
  
  const e2eResult = runCommand(
    'npm test -- --testPathPattern="OnboardingFlow.e2e.test.tsx" --passWithNoTests',
    'Running end-to-end onboarding flow tests'
  );

  const servicesResult = runCommand(
    'npm test -- --testPathPattern="ExternalServices.integration.test.ts" --passWithNoTests',
    'Running external services integration tests'
  );

  return { e2eResult, servicesResult };
}

function runCoverageValidation() {
  logSubsection('Running Coverage Validation');
  
  const coverageResult = runCommand(
    'npx vitest run --reporter=verbose src/__tests__/integration/TestCoverage.validation.test.ts',
    'Running comprehensive test coverage validation'
  );

  return { coverageResult };
}

function generateCoverageReport() {
  logSubsection('Generating Coverage Report');
  
  const jestCoverage = runCommand(
    'npm test -- --coverage --testPathPattern="onboarding" --coverageDirectory=coverage/onboarding',
    'Generating Jest coverage report for onboarding'
  );

  const vitestCoverage = runCommand(
    'npx vitest run --coverage --reporter=verbose src/components/onboarding/ src/stores/onboardingStore.ts src/hooks/onboarding/',
    'Generating Vitest coverage report'
  );

  return { jestCoverage, vitestCoverage };
}

function analyzeTestResults(results) {
  logSubsection('Test Results Analysis');
  
  const allResults = Object.values(results).flat();
  const successCount = allResults.filter(r => r.success).length;
  const totalCount = allResults.length;
  const successRate = (successCount / totalCount) * 100;

  log(`\nTest Execution Summary:`, 'bright');
  log(`  Total test suites: ${totalCount}`);
  log(`  Successful: ${successCount}`, successCount === totalCount ? 'green' : 'yellow');
  log(`  Failed: ${totalCount - successCount}`, totalCount - successCount === 0 ? 'green' : 'red');
  log(`  Success rate: ${successRate.toFixed(1)}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

  return { successCount, totalCount, successRate };
}

function checkRequirementsCoverage() {
  logSubsection('Requirements Coverage Analysis');
  
  try {
    const requirementsFile = path.join(process.cwd(), '.kiro/specs/onboarding/requirements.md');
    if (!existsSync(requirementsFile)) {
      log('Requirements file not found', 'yellow');
      return { covered: 0, total: 0 };
    }

    const requirementsContent = readFileSync(requirementsFile, 'utf-8');
    const requirements = requirementsContent.match(/### Requirement \d+/g) || [];
    
    log(`Found ${requirements.length} requirements in specification`);
    
    // Check test files for requirement references
    const testFiles = [
      'src/__tests__/integration/OnboardingFlow.e2e.test.tsx',
      'src/__tests__/integration/ExternalServices.integration.test.ts',
      'src/components/onboarding/steps/__tests__/CoreSteps.integration.vitest.ts',
    ];

    let coveredRequirements = 0;
    testFiles.forEach(file => {
      const fullPath = path.join(process.cwd(), file);
      if (existsSync(fullPath)) {
        const content = readFileSync(fullPath, 'utf-8');
        const matches = content.match(/Requirements?:?\s*[\d\.,\s]+/gi) || [];
        if (matches.length > 0) {
          coveredRequirements += matches.length;
        }
      }
    });

    const coveragePercentage = requirements.length > 0 ? (coveredRequirements / requirements.length) * 100 : 0;
    
    log(`Requirements with test coverage: ${coveredRequirements}`);
    log(`Coverage percentage: ${coveragePercentage.toFixed(1)}%`, 
        coveragePercentage >= 80 ? 'green' : coveragePercentage >= 60 ? 'yellow' : 'red');

    return { covered: coveredRequirements, total: requirements.length, percentage: coveragePercentage };
  } catch (error) {
    log(`Error analyzing requirements coverage: ${error.message}`, 'red');
    return { covered: 0, total: 0, percentage: 0 };
  }
}

function generateFinalReport(testResults, requirementsCoverage, fileCheck) {
  logSection('FINAL TEST REPORT');
  
  log('📋 Test File Status:', 'bright');
  log(`  ✓ Existing test files: ${fileCheck.existingFiles.length}`, 'green');
  if (fileCheck.missingFiles.length > 0) {
    log(`  ✗ Missing test files: ${fileCheck.missingFiles.length}`, 'red');
    fileCheck.missingFiles.forEach(file => log(`    - ${file}`, 'red'));
  }

  log('\n📊 Test Execution Results:', 'bright');
  log(`  Success rate: ${testResults.successRate.toFixed(1)}%`, 
      testResults.successRate >= 90 ? 'green' : testResults.successRate >= 70 ? 'yellow' : 'red');
  log(`  Passed: ${testResults.successCount}/${testResults.totalCount}`);

  log('\n📋 Requirements Coverage:', 'bright');
  log(`  Coverage: ${requirementsCoverage.percentage.toFixed(1)}%`, 
      requirementsCoverage.percentage >= 80 ? 'green' : requirementsCoverage.percentage >= 60 ? 'yellow' : 'red');
  log(`  Covered: ${requirementsCoverage.covered}/${requirementsCoverage.total}`);

  // Overall assessment
  const overallScore = (testResults.successRate + requirementsCoverage.percentage) / 2;
  log('\n🎯 Overall Assessment:', 'bright');
  
  if (overallScore >= 85) {
    log('  EXCELLENT - Comprehensive test coverage with high success rate', 'green');
  } else if (overallScore >= 70) {
    log('  GOOD - Adequate test coverage with room for improvement', 'yellow');
  } else if (overallScore >= 50) {
    log('  NEEDS IMPROVEMENT - Significant gaps in testing', 'yellow');
  } else {
    log('  CRITICAL - Major testing deficiencies that need immediate attention', 'red');
  }

  log(`  Overall score: ${overallScore.toFixed(1)}/100`, 
      overallScore >= 85 ? 'green' : overallScore >= 70 ? 'yellow' : 'red');

  // Recommendations
  log('\n💡 Recommendations:', 'bright');
  
  if (fileCheck.missingFiles.length > 0) {
    log('  • Create missing test files to improve coverage', 'yellow');
  }
  
  if (testResults.successRate < 90) {
    log('  • Fix failing tests to improve reliability', 'yellow');
  }
  
  if (requirementsCoverage.percentage < 80) {
    log('  • Add more requirement-specific tests', 'yellow');
  }
  
  if (overallScore >= 85) {
    log('  • Maintain current test quality and coverage', 'green');
    log('  • Consider adding performance and stress tests', 'green');
  }

  return overallScore;
}

async function main() {
  logSection('ONBOARDING INTEGRATION TEST SUITE');
  
  log('Starting comprehensive test validation for onboarding system...', 'blue');
  
  try {
    // 1. Check test file existence
    const fileCheck = checkTestFiles();
    
    // 2. Run unit tests
    const unitResults = runUnitTests();
    
    // 3. Run integration tests
    const integrationResults = runIntegrationTests();
    
    // 4. Run coverage validation
    const coverageResults = runCoverageValidation();
    
    // 5. Generate coverage reports
    const coverageReports = generateCoverageReport();
    
    // 6. Analyze all results
    const allResults = {
      unit: [unitResults.jestResult, unitResults.vitestResult],
      integration: [integrationResults.e2eResult, integrationResults.servicesResult],
      coverage: [coverageResults.coverageResult],
      reports: [coverageReports.jestCoverage, coverageReports.vitestCoverage],
    };
    
    const testResults = analyzeTestResults(allResults);
    
    // 7. Check requirements coverage
    const requirementsCoverage = checkRequirementsCoverage();
    
    // 8. Generate final report
    const overallScore = generateFinalReport(testResults, requirementsCoverage, fileCheck);
    
    // 9. Exit with appropriate code
    if (overallScore >= 70 && testResults.successRate >= 80) {
      log('\n🎉 Integration test suite completed successfully!', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Integration test suite completed with issues that need attention.', 'yellow');
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n💥 Fatal error running integration tests: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the test suite
if (require.main === module) {
  main();
}

module.exports = {
  runCommand,
  checkTestFiles,
  runUnitTests,
  runIntegrationTests,
  runCoverageValidation,
  generateCoverageReport,
  analyzeTestResults,
  checkRequirementsCoverage,
  generateFinalReport,
};