/**
 * DeepLinkService Tests
 */
import { DeepLinkService } from '../DeepLinkService';

// Mock expo-linking
jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  parse: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

describe('DeepLinkService', () => {
  let service: DeepLinkService;

  beforeEach(() => {
    service = DeepLinkService.getInstance();
    jest.clearAllMocks();
  });

  it('creates singleton instance', () => {
    const instance1 = DeepLinkService.getInstance();
    const instance2 = DeepLinkService.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('initializes without errors', () => {
    expect(() => service.initialize()).not.toThrow();
  });

  it('creates deep link URLs correctly', () => {
    const url = service.createDeepLink('dashboard');
    expect(url).toBe('statlocker://dashboard');
  });

  it('creates deep link URLs with params', () => {
    const url = service.createDeepLink('stats', { filter: 'goals' });
    expect(url).toBe('statlocker://stats?filter=goals');
  });

  it('handles auth success correctly', () => {
    expect(() => service.handleAuthSuccess()).not.toThrow();
  });

  it('clears pending links', () => {
    service.clearPendingLink();
    expect(service.getPendingLink()).toBeNull();
  });
});