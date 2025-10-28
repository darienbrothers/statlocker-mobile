/**
 * Deep Link Service
 * 
 * Handles deep linking functionality for the StatLocker app.
 * Manages navigation to specific screens based on URL schemes.
 */

import { router } from 'expo-router';
import * as Linking from 'expo-linking';

export interface DeepLinkData {
  screen?: string;
  params?: Record<string, string>;
}

class DeepLinkService {
  private pendingDeepLink: DeepLinkData | null = null;
  private isAuthenticated = false;

  /**
   * Initialize deep link handling
   */
  initialize() {
    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink(url);
      }
    });

    // Listen for incoming deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      this.handleDeepLink(event.url);
    });

    return () => subscription?.remove();
  }

  /**
   * Handle incoming deep link URL
   */
  private handleDeepLink(url: string) {
    try {
      const parsed = Linking.parse(url);
      const deepLinkData: DeepLinkData = {
        screen: parsed.path || undefined,
        params: parsed.queryParams as Record<string, string> || {},
      };

      if (this.isAuthenticated) {
        this.navigateToScreen(deepLinkData);
      } else {
        // Store for later if user isn't authenticated
        this.pendingDeepLink = deepLinkData;
      }
    } catch (error) {
      console.warn('Failed to parse deep link:', url, error);
    }
  }

  /**
   * Navigate to the specified screen
   */
  private navigateToScreen(data: DeepLinkData) {
    if (!data.screen) return;

    try {
      // Map deep link paths to app routes
      const routeMap: Record<string, string> = {
        'dashboard': '/(tabs)/dashboard',
        'stats': '/(tabs)/stats',
        'goals': '/(tabs)/goals',
        'recruiting': '/(tabs)/recruiting',
        'onboarding': '/(auth)/onboarding',
      };

      const route = routeMap[data.screen] || data.screen;
      
      if (data.params && Object.keys(data.params).length > 0) {
        router.push({ pathname: route as any, params: data.params });
      } else {
        router.push(route as any);
      }
    } catch (error) {
      console.warn('Failed to navigate to deep link screen:', data.screen, error);
    }
  }

  /**
   * Set authentication status
   */
  setAuthenticationStatus(isAuthenticated: boolean) {
    this.isAuthenticated = isAuthenticated;
  }

  /**
   * Handle successful authentication - process any pending deep links
   */
  handleAuthSuccess() {
    this.isAuthenticated = true;
    
    if (this.pendingDeepLink) {
      this.navigateToScreen(this.pendingDeepLink);
      this.pendingDeepLink = null;
    }
  }

  /**
   * Handle logout - clear any pending deep links
   */
  handleLogout() {
    this.isAuthenticated = false;
    this.pendingDeepLink = null;
  }

  /**
   * Create a deep link URL for sharing
   */
  createDeepLink(screen: string, params?: Record<string, string>): string {
    const baseUrl = 'statlocker://';
    let url = `${baseUrl}${screen}`;
    
    if (params && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    
    return url;
  }
}

// Export singleton instance
export const deepLinkService = new DeepLinkService();
export default DeepLinkService;