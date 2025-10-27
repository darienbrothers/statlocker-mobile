/**
 * Analytics Adapter - Pluggable analytics system
 * 
 * Features:
 * - Provider flexibility (PostHog, Firebase Analytics, etc.)
 * - Screen view events for route navigation
 * - Tab change events with from/to tracking
 * - CTA press event tracking with context
 * - User properties and session management
 */

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsUser {
  id: string;
  email?: string;
  role?: 'athlete' | 'coach';
  sport?: string;
  position?: string;
  team?: string;
  [key: string]: any;
}

export interface AnalyticsProvider {
  // Event tracking
  track(event: AnalyticsEvent): void;
  
  // Screen tracking
  screen(screenName: string, properties?: Record<string, any>): void;
  
  // User identification
  identify(user: AnalyticsUser): void;
  
  // User properties
  setUserProperties(properties: Record<string, any>): void;
  
  // Session management
  startSession?(): void;
  endSession?(): void;
  
  // Lifecycle
  flush?(): Promise<void>;
  reset?(): void;
}

// Console Analytics Provider (Development)
class ConsoleAnalyticsProvider implements AnalyticsProvider {
  private user: AnalyticsUser | null = null;
  private sessionStartTime: Date | null = null;

  track(event: AnalyticsEvent): void {
    const timestamp = event.timestamp || new Date();
    console.log('📊 Analytics Event:', {
      ...event,
      timestamp: timestamp.toISOString(),
      user: this.user?.id,
      sessionDuration: this.getSessionDuration(),
    });
  }

  screen(screenName: string, properties?: Record<string, any>): void {
    console.log('📱 Screen View:', {
      screen: screenName,
      properties,
      user: this.user?.id,
      timestamp: new Date().toISOString(),
    });
  }

  identify(user: AnalyticsUser): void {
    this.user = user;
    console.log('👤 User Identified:', {
      id: user.id,
      role: user.role,
      sport: user.sport,
    });
  }

  setUserProperties(properties: Record<string, any>): void {
    if (this.user) {
      this.user = { ...this.user, ...properties };
    }
    console.log('🏷️ User Properties Updated:', properties);
  }

  startSession(): void {
    this.sessionStartTime = new Date();
    console.log('🚀 Session Started:', this.sessionStartTime.toISOString());
  }

  endSession(): void {
    const duration = this.getSessionDuration();
    console.log('🏁 Session Ended:', {
      duration: `${duration}ms`,
      startTime: this.sessionStartTime?.toISOString(),
    });
    this.sessionStartTime = null;
  }

  reset(): void {
    this.user = null;
    this.sessionStartTime = null;
    console.log('🔄 Analytics Reset');
  }

  private getSessionDuration(): number {
    return this.sessionStartTime 
      ? Date.now() - this.sessionStartTime.getTime()
      : 0;
  }
}

// PostHog Analytics Provider (Production)
class PostHogAnalyticsProvider implements AnalyticsProvider {
  private isInitialized = false;
  private user: AnalyticsUser | null = null;

  constructor() {
    // TODO: Initialize PostHog
    // posthog.init('your-api-key', { api_host: 'https://app.posthog.com' });
    this.isInitialized = false; // Set to true when PostHog is configured
  }

  track(event: AnalyticsEvent): void {
    if (!this.isInitialized) {
      // Fallback to console in development
      new ConsoleAnalyticsProvider().track(event);
      return;
    }

    // TODO: Implement PostHog tracking
    // posthog.capture(event.name, event.properties);
  }

  screen(screenName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().screen(screenName, properties);
      return;
    }

    // TODO: Implement PostHog screen tracking
    // posthog.capture('$pageview', { 
    //   $current_url: screenName,
    //   ...properties 
    // });
  }

  identify(user: AnalyticsUser): void {
    this.user = user;
    
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().identify(user);
      return;
    }

    // TODO: Implement PostHog identification
    // posthog.identify(user.id, {
    //   email: user.email,
    //   role: user.role,
    //   sport: user.sport,
    //   position: user.position,
    //   team: user.team,
    // });
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().setUserProperties(properties);
      return;
    }

    // TODO: Implement PostHog user properties
    // posthog.people.set(properties);
  }

  async flush(): Promise<void> {
    if (!this.isInitialized) return;
    
    // TODO: Flush PostHog
    // await posthog.flush();
  }

  reset(): void {
    this.user = null;
    
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().reset();
      return;
    }

    // TODO: Reset PostHog
    // posthog.reset();
  }
}

// Firebase Analytics Provider (Alternative)
class FirebaseAnalyticsProvider implements AnalyticsProvider {
  private isInitialized = false;

  constructor() {
    // TODO: Initialize Firebase Analytics
    this.isInitialized = false;
  }

  track(event: AnalyticsEvent): void {
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().track(event);
      return;
    }

    // TODO: Implement Firebase Analytics tracking
    // analytics().logEvent(event.name, event.properties);
  }

  screen(screenName: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().screen(screenName, properties);
      return;
    }

    // TODO: Implement Firebase screen tracking
    // analytics().logScreenView({
    //   screen_name: screenName,
    //   screen_class: screenName,
    //   ...properties,
    // });
  }

  identify(user: AnalyticsUser): void {
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().identify(user);
      return;
    }

    // TODO: Implement Firebase user identification
    // analytics().setUserId(user.id);
    // analytics().setUserProperties({
    //   role: user.role,
    //   sport: user.sport,
    // });
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) {
      new ConsoleAnalyticsProvider().setUserProperties(properties);
      return;
    }

    // TODO: Implement Firebase user properties
    // analytics().setUserProperties(properties);
  }
}

// Analytics Manager
class Analytics {
  private provider: AnalyticsProvider;
  private isEnabled: boolean = true;

  constructor(provider?: AnalyticsProvider) {
    this.provider = provider || this.getDefaultProvider();
  }

  private getDefaultProvider(): AnalyticsProvider {
    // Use console in development, PostHog in production
    return __DEV__ ? new ConsoleAnalyticsProvider() : new PostHogAnalyticsProvider();
  }

  // Core tracking methods
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.provider.track({
      name: eventName,
      properties,
      timestamp: new Date(),
    });
  }

  screen(screenName: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.provider.screen(screenName, properties);
  }

  identify(user: AnalyticsUser): void {
    if (!this.isEnabled) return;

    this.provider.identify(user);
  }

  setUserProperties(properties: Record<string, any>): void {
    if (!this.isEnabled) return;

    this.provider.setUserProperties(properties);
  }

  // Convenience methods for common events
  screenView(screenName: string, properties?: Record<string, any>): void {
    this.screen(screenName, properties);
  }

  tabChange(fromTab: string, toTab: string, properties?: Record<string, any>): void {
    this.track('tab_change', {
      from_tab: fromTab,
      to_tab: toTab,
      ...properties,
    });
  }

  ctaPress(ctaName: string, context?: Record<string, any>): void {
    this.track('cta_press', {
      cta_name: ctaName,
      ...context,
    });
  }

  buttonPress(buttonName: string, context?: Record<string, any>): void {
    this.track('button_press', {
      button_name: buttonName,
      ...context,
    });
  }

  // Session management
  startSession(): void {
    this.provider.startSession?.();
  }

  endSession(): void {
    this.provider.endSession?.();
  }

  // Configuration
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  // Lifecycle
  async flush(): Promise<void> {
    if (this.provider.flush) {
      await this.provider.flush();
    }
  }

  reset(): void {
    this.provider.reset?.();
  }
}

// Global analytics instance
export const analytics = new Analytics();

// Convenience functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  analytics.track(eventName, properties);
};

export const trackScreen = (screenName: string, properties?: Record<string, any>) => {
  analytics.screenView(screenName, properties);
};

export const trackTabChange = (fromTab: string, toTab: string) => {
  analytics.tabChange(fromTab, toTab);
};

export const trackCTAPress = (ctaName: string, context?: Record<string, any>) => {
  analytics.ctaPress(ctaName, context);
};

// Export classes and types
export { 
  Analytics, 
  ConsoleAnalyticsProvider, 
  PostHogAnalyticsProvider, 
  FirebaseAnalyticsProvider 
};