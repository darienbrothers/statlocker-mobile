/**
 * Vitest Setup File
 * 
 * Global setup for Vitest tests
 */

import { vi } from 'vitest'

// React Native globals
globalThis.__DEV__ = true
globalThis.__BUNDLE_START_TIME__ = Date.now()
globalThis.__filename = ''
globalThis.__dirname = ''

// Mock React Native modules
vi.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: vi.fn((obj) => obj.ios || obj.default)
  },
  Dimensions: {
    get: vi.fn(() => ({ width: 375, height: 812 }))
  },
  StyleSheet: {
    create: vi.fn((styles) => styles),
    flatten: vi.fn((style) => style)
  },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TextInput: 'TextInput',
  Alert: {
    alert: vi.fn()
  }
}))

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(() => Promise.resolve()),
    getItem: vi.fn(() => Promise.resolve(null)),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getAllKeys: vi.fn(() => Promise.resolve([])),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
    multiRemove: vi.fn(() => Promise.resolve())
  }
}))

// Mock Expo modules
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    canGoBack: vi.fn(() => true)
  })),
  useLocalSearchParams: vi.fn(() => ({})),
  usePathname: vi.fn(() => '/'),
  Link: 'Link',
  Redirect: 'Redirect'
}))

// Mock Zustand persist middleware
vi.mock('zustand/middleware', () => ({
  persist: vi.fn((fn) => fn),
  createJSONStorage: vi.fn(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }))
}))

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
}

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true,
    status: 200,
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: '',
    clone: vi.fn(),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData())
  } as Response)
)

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  getEntriesByType: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  clearResourceTimings: vi.fn(),
  getEntries: vi.fn(() => []),
  setResourceTimingBufferSize: vi.fn(),
  toJSON: vi.fn(() => ({})),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(() => true),
  onresourcetimingbufferfull: null,
  timeOrigin: Date.now()
}

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16)
  return 1
})

global.cancelAnimationFrame = vi.fn()

// Mock window object for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Setup test environment
beforeEach(() => {
  vi.clearAllMocks()
})