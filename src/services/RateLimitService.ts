/**
 * Rate Limiting Service
 * 
 * Implements authentication rate limiting to prevent brute force attacks.
 * Tracks failed attempts per device and IP, with configurable thresholds and lockout periods.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { RateLimitConfig, RateLimitState, RateLimitResult, SecurityEvent } from '@/types/security';

// Forward declaration to avoid circular dependency
let auditLogService: any;

export class RateLimitService {
  private static instance: RateLimitService;
  private config: RateLimitConfig;
  private deviceId: string | null = null;

  private constructor() {
    // Default configuration based on requirements
    this.config = {
      maxAttempts: 5,
      windowMinutes: 15,
      lockoutMinutes: 15,
      enableDeviceTracking: true,
      enableIpTracking: true,
      logSecurityEvents: true,
    };
  }

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  /**
   * Initialize the rate limiting service
   */
  public async initialize(): Promise<void> {
    try {
      // Import audit log service to avoid circular dependency
      const { auditLogService: als } = await import('./AuditLogService');
      auditLogService = als;
      
      // Get device identifier
      this.deviceId = await this.getDeviceIdentifier();
      
      // Clean up expired entries on startup
      await this.cleanupExpiredEntries();
    } catch (error) {
      console.error('Failed to initialize RateLimitService:', error);
      // Continue without device tracking if initialization fails
    }
  }

  /**
   * Check if authentication attempt is allowed
   */
  public async checkAttemptAllowed(identifier: string): Promise<RateLimitResult> {
    try {
      const state = await this.getRateLimitState(identifier);
      const now = Date.now();
      
      // Check if currently locked out
      if (state.isLockedOut && state.lockoutExpiresAt && now < state.lockoutExpiresAt) {
        const remainingMs = state.lockoutExpiresAt - now;
        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
        
        return {
          allowed: false,
          isLockedOut: true,
          remainingLockoutMs: remainingMs,
          remainingLockoutMinutes: remainingMinutes,
          attemptsRemaining: 0,
          windowExpiresAt: state.windowExpiresAt,
          message: `Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
        };
      }
      
      // Check if window has expired
      if (state.windowExpiresAt && now > state.windowExpiresAt) {
        // Reset the window
        await this.resetRateLimitState(identifier);
        const freshState = await this.getRateLimitState(identifier);
        
        return {
          allowed: true,
          isLockedOut: false,
          remainingLockoutMs: 0,
          remainingLockoutMinutes: 0,
          attemptsRemaining: this.config.maxAttempts - freshState.failedAttempts,
          windowExpiresAt: freshState.windowExpiresAt,
          message: null,
        };
      }
      
      // Check if we've exceeded max attempts
      if (state.failedAttempts >= this.config.maxAttempts) {
        // Trigger lockout
        const lockoutExpiresAt = now + (this.config.lockoutMinutes * 60 * 1000);
        await this.setLockout(identifier, lockoutExpiresAt);
        
        // Log security event
        if (this.config.logSecurityEvents) {
          await this.logSecurityEvent({
            type: 'RATE_LIMIT_TRIGGERED',
            timestamp: now,
            metadata: {
              identifier,
              failedAttempts: state.failedAttempts,
              lockoutMinutes: this.config.lockoutMinutes,
            },
          });
        }
        
        const remainingMinutes = this.config.lockoutMinutes;
        return {
          allowed: false,
          isLockedOut: true,
          remainingLockoutMs: this.config.lockoutMinutes * 60 * 1000,
          remainingLockoutMinutes: remainingMinutes,
          attemptsRemaining: 0,
          windowExpiresAt: state.windowExpiresAt,
          message: `Too many failed attempts. Try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.`,
        };
      }
      
      // Attempt is allowed
      return {
        allowed: true,
        isLockedOut: false,
        remainingLockoutMs: 0,
        remainingLockoutMinutes: 0,
        attemptsRemaining: this.config.maxAttempts - state.failedAttempts,
        windowExpiresAt: state.windowExpiresAt,
        message: null,
      };
      
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Fail open - allow the attempt if we can't check rate limits
      return {
        allowed: true,
        isLockedOut: false,
        remainingLockoutMs: 0,
        remainingLockoutMinutes: 0,
        attemptsRemaining: this.config.maxAttempts,
        windowExpiresAt: null,
        message: null,
      };
    }
  }

  /**
   * Record a failed authentication attempt
   */
  public async recordFailedAttempt(identifier: string): Promise<RateLimitResult> {
    try {
      const state = await this.getRateLimitState(identifier);
      const now = Date.now();
      
      // Initialize window if this is the first attempt
      if (!state.windowExpiresAt) {
        state.windowExpiresAt = now + (this.config.windowMinutes * 60 * 1000);
      }
      
      // Increment failed attempts
      state.failedAttempts += 1;
      state.lastAttemptAt = now;
      
      // Save updated state
      await this.saveRateLimitState(identifier, state);
      
      // Log security event
      if (this.config.logSecurityEvents) {
        await this.logSecurityEvent({
          type: 'FAILED_AUTH_ATTEMPT',
          timestamp: now,
          metadata: {
            identifier,
            attemptNumber: state.failedAttempts,
            windowExpiresAt: state.windowExpiresAt,
          },
        });
      }
      
      // Check if this triggers a lockout
      return await this.checkAttemptAllowed(identifier);
      
    } catch (error) {
      console.error('Error recording failed attempt:', error);
      // Return a safe default
      return {
        allowed: true,
        isLockedOut: false,
        remainingLockoutMs: 0,
        remainingLockoutMinutes: 0,
        attemptsRemaining: this.config.maxAttempts - 1,
        windowExpiresAt: null,
        message: null,
      };
    }
  }

  /**
   * Record a successful authentication (resets rate limiting)
   */
  public async recordSuccessfulAttempt(identifier: string): Promise<void> {
    try {
      await this.resetRateLimitState(identifier);
      
      // Log security event
      if (this.config.logSecurityEvents) {
        await this.logSecurityEvent({
          type: 'SUCCESSFUL_AUTH',
          timestamp: Date.now(),
          metadata: {
            identifier,
            resetRateLimit: true,
          },
        });
      }
    } catch (error) {
      console.error('Error recording successful attempt:', error);
    }
  }

  /**
   * Get current rate limit status for an identifier
   */
  public async getRateLimitStatus(identifier: string): Promise<RateLimitResult> {
    return await this.checkAttemptAllowed(identifier);
  }

  /**
   * Get device-based identifier for rate limiting
   */
  public async getDeviceIdentifier(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }
    
    try {
      // Try to get stored device ID first
      const storedId = await SecureStore.getItemAsync('device_rate_limit_id');
      if (storedId) {
        this.deviceId = storedId;
        return storedId;
      }
      
      // Generate new device ID
      const deviceInfo = {
        brand: Device.brand,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
      };
      
      // Create a hash-like identifier from device info + timestamp
      const deviceString = JSON.stringify(deviceInfo) + Date.now();
      const deviceId = btoa(deviceString).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      // Store for future use
      await SecureStore.setItemAsync('device_rate_limit_id', deviceId);
      this.deviceId = deviceId;
      
      return deviceId;
    } catch (error) {
      console.error('Error generating device identifier:', error);
      // Fallback to a simple identifier
      const fallbackId = `${Platform.OS}_${Date.now()}`;
      this.deviceId = fallbackId;
      return fallbackId;
    }
  }

  /**
   * Get IP-based identifier (when available)
   */
  public async getIpIdentifier(): Promise<string | null> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      // Note: IP address is not directly available in Expo
      // This would need to be implemented with a backend service
      // For now, we'll use network type as a partial identifier
      return networkState.type ? `network_${networkState.type}` : null;
    } catch (error) {
      console.error('Error getting IP identifier:', error);
      return null;
    }
  }

  /**
   * Get combined identifier for rate limiting
   */
  public async getCombinedIdentifier(email?: string): Promise<string> {
    const deviceId = await this.getDeviceIdentifier();
    const ipId = await this.getIpIdentifier();
    
    // Combine identifiers for more robust rate limiting
    const parts = [deviceId];
    if (ipId) parts.push(ipId);
    if (email) parts.push(email.toLowerCase());
    
    return parts.join('|');
  }

  // Private helper methods

  private async getRateLimitState(identifier: string): Promise<RateLimitState> {
    try {
      const key = `rate_limit_${identifier}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Return default state
      return {
        failedAttempts: 0,
        windowExpiresAt: null,
        lastAttemptAt: null,
        isLockedOut: false,
        lockoutExpiresAt: null,
      };
    } catch (error) {
      console.error('Error getting rate limit state:', error);
      return {
        failedAttempts: 0,
        windowExpiresAt: null,
        lastAttemptAt: null,
        isLockedOut: false,
        lockoutExpiresAt: null,
      };
    }
  }

  private async saveRateLimitState(identifier: string, state: RateLimitState): Promise<void> {
    try {
      const key = `rate_limit_${identifier}`;
      await SecureStore.setItemAsync(key, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving rate limit state:', error);
    }
  }

  private async resetRateLimitState(identifier: string): Promise<void> {
    try {
      const key = `rate_limit_${identifier}`;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('Error resetting rate limit state:', error);
    }
  }

  private async setLockout(identifier: string, lockoutExpiresAt: number): Promise<void> {
    try {
      const state = await this.getRateLimitState(identifier);
      state.isLockedOut = true;
      state.lockoutExpiresAt = lockoutExpiresAt;
      await this.saveRateLimitState(identifier, state);
    } catch (error) {
      console.error('Error setting lockout:', error);
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    try {
      // This would ideally iterate through all stored rate limit keys
      // For now, we'll rely on individual checks to clean up expired entries
      // A more robust implementation would maintain an index of all keys
    } catch (error) {
      console.error('Error cleaning up expired entries:', error);
    }
  }

  private async logSecurityEvent(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    try {
      // Use audit log service if available, otherwise fallback to local storage
      if (auditLogService) {
        await auditLogService.logSecurityEvent(event);
      } else {
        // Fallback to local storage
        const fullEvent = {
          ...event,
          id: `${event.timestamp}_${Math.random().toString(36).substring(2, 15)}`,
        };
        const key = `security_event_${event.timestamp}`;
        await SecureStore.setItemAsync(key, JSON.stringify(fullEvent));
        console.log('Security Event:', fullEvent);
      }
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Update rate limiting configuration
   */
  public updateConfig(newConfig: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): RateLimitConfig {
    return { ...this.config };
  }

  /**
   * Clear all rate limiting data (for testing or admin purposes)
   */
  public async clearAllRateLimitData(): Promise<void> {
    try {
      // This is a simplified implementation
      // In production, you'd want to maintain an index of all rate limit keys
      console.warn('clearAllRateLimitData called - implement key enumeration for production');
    } catch (error) {
      console.error('Error clearing rate limit data:', error);
    }
  }
}

// Export singleton instance
export const rateLimitService = RateLimitService.getInstance();