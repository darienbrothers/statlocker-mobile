/**
 * Jest Setup Configuration
 * 
 * Global test setup and mocks for the StatLocker mobile app
 */

// Define React Native globals BEFORE any imports
global.__DEV__ = true;
global.__BUNDLE_START_TIME__ = Date.now();
global.__filename = '';
global.__dirname = '';

import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      name: 'StatLocker',
      slug: 'statlocker-mobile',
    },
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useLocalSearchParams: () => ({}),
  Link: ({ children, href, ...props }) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { ...props, testID: `link-${href}` }, children);
  },
  Stack: ({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { ...props, testID: 'stack' }, children);
  },
  Tabs: ({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { ...props, testID: 'tabs' }, children);
  },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: ({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { ...props, testID: 'status-bar' }, children);
  },
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(),
  openURL: jest.fn(),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() => Promise.resolve({
    type: 'WIFI',
    isConnected: true,
    isInternetReachable: true,
  })),
  addNetworkStateListener: jest.fn(),
}));

// Mock React Native modules
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children, ...props }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, props, children);
  },
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  
  // Add missing mocks
  Reanimated.default.createAnimatedComponent = (component) => component;
  
  return {
    ...Reanimated,
    useSharedValue: (initial) => ({ value: initial }),
    useAnimatedStyle: (callback) => callback(),
    withTiming: (value, config, callback) => {
      if (callback) callback(true);
      return value;
    },
    withSpring: (value, config, callback) => {
      if (callback) callback(true);
      return value;
    },
    withRepeat: (value, count, reverse, callback) => {
      if (callback) callback(true);
      return value;
    },
    runOnJS: (fn) => fn,
    Easing: {
      linear: (t) => t,
      ease: (t) => t,
      quad: (t) => t * t,
      cubic: (t) => t * t * t,
      bezier: () => (t) => t,
      in: (easing) => easing,
      out: (easing) => easing,
      inOut: (easing) => easing,
    },
  };
});

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
  addEventListener: jest.fn(() => jest.fn()),
  useNetInfo: () => ({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  }),
}));

// Global test utilities
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock console methods to avoid noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers for consistent testing
jest.useFakeTimers();

// Global test timeout
jest.setTimeout(10000);

// Suppress specific warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (
        args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: An invalid form control') ||
        args[0].includes('componentWillReceiveProps has been renamed')
      )
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Global test helpers
global.testHelpers = {
  // Helper to wait for async operations
  waitFor: (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock functions with specific return values
  createMockFn: (returnValue) => jest.fn(() => returnValue),
  
  // Helper to create mock async functions
  createMockAsyncFn: (returnValue) => jest.fn(() => Promise.resolve(returnValue)),
  
  // Helper to advance timers and flush promises
  flushPromises: async () => {
    await new Promise(resolve => setImmediate(resolve));
    jest.runAllTimers();
  },
};