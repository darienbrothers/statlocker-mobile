/**
 * Analytics System Tests
 */
import {
  Analytics,
  ConsoleAnalyticsProvider,
  PostHogAnalyticsProvider,
  FirebaseAnalyticsProvider,
  analytics,
  trackEvent,
  trackScreen,
  trackTabChange,
  trackCTAPress,
  type AnalyticsEvent,
  type AnalyticsUser,
} from '../analytics';

describe('Analytics System', () => {
  // Mock console methods
  const originalConsole = {
    log: console.log,
  };

  beforeEach(() => {
    console.log = jest.fn();
  });

  afterAll(() => {
    Object.assign(console, originalConsole);
  });

  describe('ConsoleAnalyticsProvider', () => {
    let provider: ConsoleAnalyticsProvider;

    beforeEach(() => {
      provider = new ConsoleAnalyticsProvider();
    });

    it('tracks events to console', () => {
      const event: AnalyticsEvent = {
        name: 'test_event',
        properties: { key: 'value' },
      };

      provider.track(event);

      expect(console.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.objectContaining({
          name: 'test_event',
          properties: { key: 'value' },
        })
      );
    });

    it('tracks screen views to console', () => {
      provider.screen('Dashboard', { section: 'main' });

      expect(console.log).toHaveBeenCalledWith(
        '📱 Screen View:',
        expect.objectContaining({
          screen: 'Dashboard',
          properties: { section: 'main' },
        })
      );
    });

    it('identifies users', () => {
      const user: AnalyticsUser = {
        id: '123',
        email: 'test@example.com',
        role: 'athlete',
      };

      provider.identify(user);

      expect(console.log).toHaveBeenCalledWith(
        '👤 User Identified:',
        expect.objectContaining({
          id: '123',
          role: 'athlete',
        })
      );
    });

    it('sets user properties', () => {
      const properties = { sport: 'lacrosse', position: 'midfielder' };

      provider.setUserProperties(properties);

      expect(console.log).toHaveBeenCalledWith(
        '🏷️ User Properties Updated:',
        properties
      );
    });

    it('manages sessions', () => {
      provider.startSession();
      expect(console.log).toHaveBeenCalledWith(
        '🚀 Session Started:',
        expect.any(String)
      );

      provider.endSession();
      expect(console.log).toHaveBeenCalledWith(
        '🏁 Session Ended:',
        expect.objectContaining({
          duration: expect.any(String),
        })
      );
    });

    it('resets state', () => {
      provider.reset();

      expect(console.log).toHaveBeenCalledWith('🔄 Analytics Reset');
    });
  });

  describe('PostHogAnalyticsProvider', () => {
    let provider: PostHogAnalyticsProvider;

    beforeEach(() => {
      provider = new PostHogAnalyticsProvider();
    });

    it('falls back to console when not initialized', () => {
      const event: AnalyticsEvent = {
        name: 'test_event',
        properties: { key: 'value' },
      };

      provider.track(event);

      // Should fallback to console
      expect(console.log).toHaveBeenCalledWith(
        '📊 Analytics Event:',
        expect.any(Object)
      );
    });

    it('handles screen tracking when not initialized', () => {
      provider.screen('Dashboard');

      expect(console.log).toHaveBeenCalledWith(
        '📱 Screen View:',
        expect.any(Object)
      );
    });

    it('handles user identification when not initialized', () => {
      const user: AnalyticsUser = { id: '123', role: 'athlete' };

      provider.identify(user);

      expect(console.log).toHaveBeenCalledWith(
        '👤 User Identified:',
        expect.any(Object)
      );
    });
  });

  describe('Analytics Manager', () => {
    let testAnalytics: Analytics;
    let mockProvider: jest.Mocked<ConsoleAnalyticsProvider>;

    beforeEach(() => {
      mockProvider = {
        track: jest.fn(),
        screen: jest.fn(),
        identify: jest.fn(),
        setUserProperties: jest.fn(),
        startSession: jest.fn(),
        endSession: jest.fn(),
        reset: jest.fn(),
      } as any;

      testAnalytics = new Analytics(mockProvider);
    });

    it('tracks events', () => {
      testAnalytics.track('test_event', { key: 'value' });

      expect(mockProvider.track).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test_event',
          properties: { key: 'value' },
        })
      );
    });

    it('tracks screen views', () => {
      testAnalytics.screen('Dashboard', { section: 'main' });

      expect(mockProvider.screen).toHaveBeenCalledWith('Dashboard', { section: 'main' });
    });

    it('identifies users', () => {
      const user: AnalyticsUser = { id: '123', role: 'athlete' };

      testAnalytics.identify(user);

      expect(mockProvider.identify).toHaveBeenCalledWith(user);
    });

    it('tracks tab changes', () => {
      testAnalytics.tabChange('dashboard', 'stats');

      expect(mockProvider.track).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'tab_change',
          properties: {
            from_tab: 'dashboard',
            to_tab: 'stats',
          },
        })
      );
    });

    it('tracks CTA presses', () => {
      testAnalytics.ctaPress('sign_up', { source: 'header' });

      expect(mockProvider.track).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'cta_press',
          properties: {
            cta_name: 'sign_up',
            source: 'header',
          },
        })
      );
    });

    it('manages sessions', () => {
      testAnalytics.startSession();
      expect(mockProvider.startSession).toHaveBeenCalled();

      testAnalytics.endSession();
      expect(mockProvider.endSession).toHaveBeenCalled();
    });

    it('respects enabled state', () => {
      testAnalytics.setEnabled(false);

      testAnalytics.track('test_event');

      expect(mockProvider.track).not.toHaveBeenCalled();
    });

    it('resets state', () => {
      testAnalytics.reset();

      expect(mockProvider.reset).toHaveBeenCalled();
    });
  });

  describe('Convenience Functions', () => {
    it('trackEvent calls analytics.track', () => {
      const spy = jest.spyOn(analytics, 'track');

      trackEvent('test_event', { key: 'value' });

      expect(spy).toHaveBeenCalledWith('test_event', { key: 'value' });
      spy.mockRestore();
    });

    it('trackScreen calls analytics.screenView', () => {
      const spy = jest.spyOn(analytics, 'screenView');

      trackScreen('Dashboard', { section: 'main' });

      expect(spy).toHaveBeenCalledWith('Dashboard', { section: 'main' });
      spy.mockRestore();
    });

    it('trackTabChange calls analytics.tabChange', () => {
      const spy = jest.spyOn(analytics, 'tabChange');

      trackTabChange('dashboard', 'stats');

      expect(spy).toHaveBeenCalledWith('dashboard', 'stats');
      spy.mockRestore();
    });

    it('trackCTAPress calls analytics.ctaPress', () => {
      const spy = jest.spyOn(analytics, 'ctaPress');

      trackCTAPress('sign_up', { source: 'header' });

      expect(spy).toHaveBeenCalledWith('sign_up', { source: 'header' });
      spy.mockRestore();
    });
  });
});