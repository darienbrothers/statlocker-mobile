/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/jest.setup.js'
  ],
  
  // Module name mapping for path aliases
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/app/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/app/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
  ],
  
  // Coverage configuration
  collectCoverage: false, // Enable via CLI flag
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/**/index.ts', // Usually just re-exports
    '!app/_layout.tsx', // Expo Router layout files
    '!app/**/+html.tsx', // Expo Router HTML files
    '!app/**/+not-found.tsx', // Expo Router 404 files
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    // Specific thresholds for critical paths
    './src/lib/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
    './src/components/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
    './src/hooks/': {
      statements: 85,
      branches: 80,
      functions: 85,
      lines: 85,
    },
    './src/store/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json-summary',
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Mock configuration
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|@react-native-community|react-native-vector-icons)/)',
  ],
  
  // Global setup and teardown
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: false,
  
  // Bail on first test failure (useful for CI)
  bail: false,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Notify mode (for watch mode)
  notify: false,
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Custom test environment options
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  
  // Max workers for parallel execution
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
};