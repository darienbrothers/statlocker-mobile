/**
 * Session Manager
 * 
 * Handles session validation, refresh, and multi-device management
 */

import * as SecureStore from 'expo-secure-store';
import { getFirebaseAuth } from '@/lib/firebase';
import { logInfo, logError, logWarning } from '@/lib/logging';
import { DeviceInfo, UserSession } from '@/types/auth';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Session storage keys
 */
const SESSION_KEYS = {
  DEVICE_ID: 'auth_device_id',
  SESSION_DATA: 'auth_session_data',
  LAST_ACTIVITY: 'auth_last_activity',
  SESSION_VERSION: 'auth_session_version',
} as const;

/**
 * Session configuration
 */
const SESSION_CONFIG = {
  MAX_IDLE_TIME: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  MAX_ABSOLUTE_TIME: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
  ACTIVITY_UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
  SESSION_VERSION: '1.0',
} as const;

/**
 * Session Manager Class
 */
export class SessionManager {
  private lastActivityUpdate = 0;
  private deviceId: string | null = null;

  /**
   * Initialize session manager
   */
  async initialize(): Promise<void> {
    try {
      logInfo('SessionManager: Initializing');
      
      // Get or create device ID
      this.deviceId = await this.getOrCreateDeviceId();
      
      // Update last activity
      await this.updateLastActivity();
      
      logInfo('SessionManager: Initialized', { deviceId: this.deviceId });
    } catch (error) {
      logError('SessionManager: Initialization failed', error as Error);
      throw error;
    }
  }

  /**
   * Get or create a unique device ID
   */
  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await SecureStore.getItemAsync(SESSION_KEYS.DEVICE_ID);
      
      if (!deviceId) {
        // Generate new device ID
        deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        await SecureStore.setItemAsync(SESSION_KEYS.DEVICE_ID, deviceId);
        logInfo('SessionManager: Created new device ID', { deviceId });
      }
      
      return deviceId;
    } catch (error) {
      logError('SessionManager: Failed to get/create device ID', error as Error);
      // Fallback to a temporary ID
      return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
  }

  /**
   * Get current device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = this.deviceId || await this.getOrCreateDeviceId();
    
    return {
      deviceId,
      platform: Device.osName === 'iOS' ? 'ios' : Device.osName === 'Android' ? 'android' : 'web',
      deviceName: Device.deviceName || 'Unknown Device',
      osVersion: Device.osVersion || 'Unknown',
      appVersion: Constants.expoConfig?.version || '1.0.0',
      lastAccess: new Date(),
    };
  }

  /**
   * Update last activity timestamp
   */
  async updateLastActivity(): Promise<void> {
    const now = Date.now();
    
    // Throttle updates to avoid excessive storage writes
    if (now - this.lastActivityUpdate < SESSION_CONFIG.ACTIVITY_UPDATE_INTERVAL) {
      return;
    }
    
    try {
      await SecureStore.setItemAsync(SESSION_KEYS.LAST_ACTIVITY, now.toString());
      this.lastActivityUpdate = now;
    } catch (error) {
      logWarning('SessionManager: Failed to update last activity', { error });
    }
  }

  /**
   * Get last activity timestamp
   */
  async getLastActivity(): Promise<Date | null> {
    try {
      const timestamp = await SecureStore.getItemAsync(SESSION_KEYS.LAST_ACTIVITY);
      return timestamp ? new Date(parseInt(timestamp, 10)) : null;
    } catch (error) {
      logWarning('SessionManager: Failed to get last activity', { error });
      return null;
    }
  }

  /**
   * Validate current session
   */
  async validateSession(): Promise<boolean> {
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        logInfo('SessionManager: No current user');
        return false;
      }

      // Check if user token is still valid
      try {
        await currentUser.getIdToken(true); // Force refresh
        logInfo('SessionManager: Token is valid');
      } catch (tokenError) {
        logError('SessionManager: Token validation failed', tokenError as Error);
        return false;
      }

      // Check session age
      const lastActivity = await this.getLastActivity();
      if (lastActivity) {
        const timeSinceActivity = Date.now() - lastActivity.getTime();
        
        if (timeSinceActivity > SESSION_CONFIG.MAX_IDLE_TIME) {
          logInfo('SessionManager: Session expired due to inactivity', { 
            timeSinceActivity: Math.round(timeSinceActivity / (1000 * 60 * 60 * 24)) + ' days'
          });
          return false;
        }
      }

      // Check absolute session age
      if (currentUser.metadata.lastSignInTime) {
        const signInTime = new Date(currentUser.metadata.lastSignInTime).getTime();
        const sessionAge = Date.now() - signInTime;
        
        if (sessionAge > SESSION_CONFIG.MAX_ABSOLUTE_TIME) {
          logInfo('SessionManager: Session expired due to age', { 
            sessionAge: Math.round(sessionAge / (1000 * 60 * 60 * 24)) + ' days'
          });
          return false;
        }
      }

      // Update activity on successful validation
      await this.updateLastActivity();
      
      return true;
    } catch (error) {
      logError('SessionManager: Session validation failed', error as Error);
      return false;
    }
  }

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<boolean> {
    try {
      logInfo('SessionManager: Refreshing session');
      
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        logWarning('SessionManager: No user to refresh session for');
        return false;
      }

      // Force token refresh
      await currentUser.getIdToken(true);
      
      // Update last activity
      await this.updateLastActivity();
      
      logInfo('SessionManager: Session refreshed successfully');
      return true;
    } catch (error) {
      logError('SessionManager: Session refresh failed', error as Error);
      return false;
    }
  }

  /**
   * Create session data for storage
   */
  async createSessionData(userId: string): Promise<UserSession> {
    const deviceInfo = await this.getDeviceInfo();
    const now = new Date();
    
    return {
      sessionId: `${userId}-${deviceInfo.deviceId}-${now.getTime()}`,
      userId,
      deviceInfo,
      createdAt: now,
      lastActivity: now,
      expiresAt: new Date(now.getTime() + SESSION_CONFIG.MAX_ABSOLUTE_TIME),
      isActive: true,
    };
  }

  /**
   * Store session data
   */
  async storeSessionData(sessionData: UserSession): Promise<void> {
    try {
      const sessionJson = JSON.stringify({
        ...sessionData,
        version: SESSION_CONFIG.SESSION_VERSION,
      });
      
      await SecureStore.setItemAsync(SESSION_KEYS.SESSION_DATA, sessionJson);
      logInfo('SessionManager: Session data stored', { sessionId: sessionData.sessionId });
    } catch (error) {
      logError('SessionManager: Failed to store session data', error as Error);
      throw error;
    }
  }

  /**
   * Get stored session data
   */
  async getSessionData(): Promise<UserSession | null> {
    try {
      const sessionJson = await SecureStore.getItemAsync(SESSION_KEYS.SESSION_DATA);
      
      if (!sessionJson) {
        return null;
      }
      
      const sessionData = JSON.parse(sessionJson);
      
      // Check version compatibility
      if (sessionData.version !== SESSION_CONFIG.SESSION_VERSION) {
        logWarning('SessionManager: Session version mismatch, clearing session');
        await this.clearSessionData();
        return null;
      }
      
      // Convert date strings back to Date objects
      return {
        ...sessionData,
        createdAt: new Date(sessionData.createdAt),
        lastActivity: new Date(sessionData.lastActivity),
        expiresAt: new Date(sessionData.expiresAt),
        deviceInfo: {
          ...sessionData.deviceInfo,
          lastAccess: new Date(sessionData.deviceInfo.lastAccess),
        },
      };
    } catch (error) {
      logError('SessionManager: Failed to get session data', error as Error);
      return null;
    }
  }

  /**
   * Clear session data
   */
  async clearSessionData(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SESSION_KEYS.SESSION_DATA),
        SecureStore.deleteItemAsync(SESSION_KEYS.LAST_ACTIVITY),
      ]);
      
      logInfo('SessionManager: Session data cleared');
    } catch (error) {
      logError('SessionManager: Failed to clear session data', error as Error);
    }
  }

  /**
   * Clear all session storage (including device ID)
   */
  async clearAllSessionStorage(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(SESSION_KEYS.DEVICE_ID),
        SecureStore.deleteItemAsync(SESSION_KEYS.SESSION_DATA),
        SecureStore.deleteItemAsync(SESSION_KEYS.LAST_ACTIVITY),
      ]);
      
      this.deviceId = null;
      this.lastActivityUpdate = 0;
      
      logInfo('SessionManager: All session storage cleared');
    } catch (error) {
      logError('SessionManager: Failed to clear all session storage', error as Error);
    }
  }

  /**
   * Check if session requires recent authentication
   */
  async requiresRecentAuth(maxAgeMinutes: number = 5): Promise<boolean> {
    try {
      const auth = getFirebaseAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser || !currentUser.metadata.lastSignInTime) {
        return true; // Require auth if no user or no sign-in time
      }
      
      const lastSignIn = new Date(currentUser.metadata.lastSignInTime);
      const timeSinceSignIn = Date.now() - lastSignIn.getTime();
      const maxAge = maxAgeMinutes * 60 * 1000; // Convert to milliseconds
      
      return timeSinceSignIn > maxAge;
    } catch (error) {
      logError('SessionManager: Failed to check recent auth requirement', error as Error);
      return true; // Err on the side of caution
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();