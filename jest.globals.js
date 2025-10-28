/**
 * Jest Global Setup
 * 
 * Define global variables before any modules are loaded
 */

// React Native globals - must be defined before any imports
global.__DEV__ = true;
global.__BUNDLE_START_TIME__ = Date.now();
global.__filename = '';
global.__dirname = '';

// Additional React Native globals that might be needed
global.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {};
global.window = global;
global.document = {};
global.navigator = { userAgent: 'node.js' };

// Polyfills for React Native environment
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0);
};

global.cancelAnimationFrame = (id) => {
  clearTimeout(id);
};

// Mock fetch for tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
  })
);

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(() => []),
  getEntriesByType: jest.fn(() => []),
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};