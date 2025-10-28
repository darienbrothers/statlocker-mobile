# Vitest Testing Setup

This project now uses **Vitest** as an alternative testing framework that works better with React Native than Jest.

## Why Vitest?

- **Better React Native Support**: Avoids the `__DEV__` global issues that plague Jest with React Native
- **Faster Execution**: Vitest is generally faster than Jest
- **Modern Tooling**: Built on Vite with excellent TypeScript support
- **Jest-Compatible API**: Easy migration from Jest syntax

## Available Scripts

```bash
# Run all Vitest tests
npm run vitest:run

# Run tests in watch mode
npm run vitest:watch

# Run with coverage
npm run vitest:coverage

# Run with UI (browser-based test runner)
npm run vitest:ui

# Run integration tests specifically
npm run vitest:integration
```

## Configuration Files

- **`vitest.config.ts`** - Main Vitest configuration
- **`vitest.setup.ts`** - Global setup and mocks for React Native environment

## Integration Tests

The core onboarding integration tests are located at:
- `src/components/onboarding/steps/__tests__/CoreSteps.integration.vitest.ts`
- `src/components/onboarding/steps/__tests__/CoreSteps.validation.test.js`

These tests cover:

### Requirements Coverage
✅ **1.1 Role selection and validation**  
✅ **2.1 Sport and demographics collection**  
✅ **3.1 Position and level selection**  
✅ **4.1 Team details and organization info**  
✅ **5.1 Goal selection with exactly 3 goals**

### Test Categories

#### Step Navigation & Data Persistence
- Sequential navigation through steps 1-5
- Backward navigation to completed steps
- Prevention of navigation without validation
- Data persistence across step changes

#### Validation Rules & Error Handling
- Step-by-step validation for all required fields
- Error message generation and display
- Validation error recovery scenarios
- Field-specific validation rules

#### Step-Specific Business Logic
- Date of birth parsing and age calculation
- Position-specific goal options
- Goal selection logic (exactly 3 goals, FIFO replacement)
- Team type handling (high school vs club)
- Gender-specific position options

#### Data Persistence & Recovery
- Progress saving and loading
- Onboarding reset functionality
- Data integrity during navigation
- AsyncStorage integration

#### Complete Integration Flow
- End-to-end onboarding journey
- Error scenarios and recovery
- Referential integrity across steps

## Writing New Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('My Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should do something', () => {
    expect(true).toBe(true)
  })
})
```

### Mocking with Vitest

```typescript
import { vi } from 'vitest'

// Mock a function
const mockFn = vi.fn()

// Mock a module
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(() => Promise.resolve()),
    getItem: vi.fn(() => Promise.resolve(null)),
  }
}))
```

### React Native Component Testing

The setup automatically mocks common React Native components and modules:
- `react-native` core components
- `@react-native-async-storage/async-storage`
- `expo-router`
- `zustand/middleware`

## Migration from Jest

Most Jest tests can be migrated to Vitest by:

1. Changing imports:
   ```typescript
   // Before (Jest)
   import { jest } from '@jest/globals'
   
   // After (Vitest)
   import { vi } from 'vitest'
   ```

2. Updating mock syntax:
   ```typescript
   // Before (Jest)
   jest.fn()
   jest.mock()
   
   // After (Vitest)
   vi.fn()
   vi.mock()
   ```

3. Adding proper imports:
   ```typescript
   import { describe, it, expect, beforeEach } from 'vitest'
   ```

## Running Tests

### Development Workflow

1. **Run integration tests**: `npm run vitest:integration`
2. **Watch mode for development**: `npm run vitest:watch`
3. **Coverage reports**: `npm run vitest:coverage`
4. **UI for debugging**: `npm run vitest:ui`

### CI/CD Integration

For continuous integration, use:
```bash
npm run vitest:run --reporter=verbose
```

## Troubleshooting

### Common Issues

1. **Import errors**: Make sure all React Native modules are properly mocked in `vitest.setup.ts`
2. **Global variables**: Add any missing globals to the setup file
3. **Module resolution**: Check the alias configuration in `vitest.config.ts`

### Debug Mode

Use the UI runner for interactive debugging:
```bash
npm run vitest:ui
```

This opens a browser-based interface where you can:
- Run individual tests
- See detailed error messages
- Debug test execution
- View coverage reports

## Best Practices

1. **Keep tests focused**: Test one thing at a time
2. **Use descriptive names**: Make test intentions clear
3. **Mock external dependencies**: Avoid real network calls or file system operations
4. **Clean up**: Use `beforeEach` to reset mocks and state
5. **Test behavior, not implementation**: Focus on what the code does, not how it does it

## Performance

Vitest is significantly faster than Jest for this React Native project:
- **Cold start**: ~400ms vs ~2000ms+ with Jest
- **Watch mode**: Near-instant re-runs
- **Parallel execution**: Better utilization of multiple cores

The integration tests run in under 500ms, making them suitable for frequent execution during development.