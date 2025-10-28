import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // Test environment
    environment: 'jsdom',
    
    // Global setup
    globals: true,
    
    // Setup files
    setupFiles: ['./vitest.setup.ts'],
    
    // Test patterns
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'src/**/__tests__/**/*.{js,ts,tsx}'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      '.expo',
      'dist',
      'coverage'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/index.ts',
        'vitest.config.ts',
        'vitest.setup.ts'
      ]
    },
    
    // Test timeout
    testTimeout: 10000,
    
    // Concurrent tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './src')
    }
  },
  
  // Define global variables
  define: {
    __DEV__: true,
    __BUNDLE_START_TIME__: Date.now(),
    global: 'globalThis'
  }
})