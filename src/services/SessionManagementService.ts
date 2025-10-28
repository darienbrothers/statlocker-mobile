/**
 * Session Management Service
 * 
 * Handles multi-device session tracking, management, and security.
 * Provides device registration, active session monitoring, and global sign-out functionality.
 */

import * as SecureStore from 'expo-secure-store';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getFirebaseAuth } from '@/lib/firebase';
import { logInfo, logError } from '@/lib/logging';
import { auditLogService } from './AuditLogService';
import { User } from '@/types/auth';

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: string;
  osVersion: string;
  appVersion: string;
  brand?: string;
  model?: string;
  lastActive: number;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
  };
}

export interface UserSession {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  createdAt: number;
  lastActive: number;
  isActive: boolean;
  refreshToken?: string;
  expiresAt?: number;
}

export interface SessionManagementConfig {
  maxConcurrentSessions: number;
  sessionTimeoutMinutes: number;
  deviceTrackingEnabled: boolean;
  auditLoggingEnabled: boolean;
  autoCleanupEnabled: boolean;
  cleanupIntervalHours: number;
}

export class SessionManagementService {
  private static instance: SessionManagementService;
  private auth = getFirebaseAuth();
  private config: SessionManagementConfig;
  private currentSession: UserSession | null = null;
  private cleanupTimer?: any;

  private constructor() {
    this.config = {
      maxConcurrentSessions: 5,
      sessionTimeoutMinutes: 60 * 24 * 30, // 30 days
      deviceTrackingEnabled: true,
      auditLoggingEnabled: true,
      autoCleanupEnabled: true,
      cleanupIntervalHours: 24,
    };
  }

  public static getInstance(): SessionManagementService {
    if (!SessionManagementService.instance) {
      SessionManagementService.instance = new SessionManagementService();
    }
    return SessionManagementService.instance;
  }

  /**
   * Initialize session management
   */
  public async initialize(): Promise<void> {
    try {
      // Start cleanup timer if enabled
      if (this.config.autoCleanupEnabled) {
        this.startCleanupTimer();
      }

      logInfo('SessionManagement: Initialized successfully');
    } catch (error) {
      logError('SessionManagement: Initialization failed', error as Error);
    }
  }

  /**
   * Create a new session for the current device
   */
  public async createSession(user: User): Promise<UserSession> {
    try {
      const deviceInfo = await this.getCurrentDeviceInfo();
      const sessionId = this.generateSessionId();
      
      const session: UserSession = {
        sessionId,
        userId: user.uid,
        deviceInfo,
        createdAt: Date.now(),
        lastActive: Date.now(),
        isActive: true,
      };

      // Store session locally
      await this.storeSessionLocally(session);
      
      // Store session in user's session list
      await this.addToUserSessions(user.uid, session);
      
      // Enforce concurrent session limits
      await this.enforceConcurrentSessionLimits(user.uid);
      
      // Log session creation
      if (this.config.auditLoggingEnabled) {
        await auditLogService.logSessionEvent('started', user.uid, sessionId, deviceInfo);
      }

      this.currentSession = session;
      
      logInfo('SessionManagement: Session created', {
        sessionId,
        userId: user.uid,
        deviceId: deviceInfo.deviceId,
      });

      return session;
    } catch (error) {
      logError('SessionManagement: Failed to create session', error as Error);
      throw error;
    }
  }

  /**
   * Update session activity
   */
  public async updateSessionActivity(sessionId?: string): Promise<void> {
    try {
      const session = sessionId ? await this.getSession(sessionId) : this.currentSession;
      if (!session) return;

      session.lastActive = Date.now();
      
      // Update local storage
      await this.storeSessionLocally(session);
      
      // Update in user's session list
      await this.updateUserSession(session.userId, session);
      
      this.currentSession = session;
    } catch (error) {
      logError('SessionManagement: Failed to update session activity', error as Error);
    }
  }

  /**
   * End the current session
   */
  public async endSession(sessionId?: string): Promise<void> {
    try {
      const session = sessionId ? await this.getSession(sessionId) : this.currentSession;
      if (!session) return;

      session.isActive = false;
      
      // Update session status
      await this.updateUserSession(session.userId, session);
      
      // Remove from local storage
      await this.removeSessionLocally(session.sessionId);
      
      // Log session end
      if (this.config.auditLoggingEnabled) {
        await auditLogService.logSessionEvent('ended', session.userId, session.sessionId);
      }

      if (this.currentSession?.sessionId === session.sessionId) {
        this.currentSession = null;
      }
      
      logInfo('SessionManagement: Session ended', {
        sessionId: session.sessionId,
        userId: session.userId,
      });
    } catch (error) {
      logError('SessionManagement: Failed to end session', error as Error);
    }
  }

  /**
   * Get all active sessions for a user
   */
  public async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const key = `user_sessions_${userId}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (!stored) {
        return [];
      }

      const sessions: UserSession[] = JSON.parse(stored);
      
      // Filter out expired sessions
      const now = Date.now();
      const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
      
      return sessions.filter(session => {
        const isExpired = (now - session.lastActive) > timeoutMs;
        return session.isActive && !isExpired;
      });
    } catch (error) {
      logError('SessionManagement: Failed to get user sessions', error as Error);
      return [];
    }
  }

  /**
   * Sign out from all devices
   */
  public async signOutAllDevices(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      // End all sessions
      for (const session of sessions) {
        session.isActive = false;
      }
      
      // Update stored sessions
      const key = `user_sessions_${userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(sessions));
      
      // Clear current session if it belongs to this user
      if (this.currentSession?.userId === userId) {
        await this.removeSessionLocally(this.currentSession.sessionId);
        this.currentSession = null;
      }
      
      // Log global sign out
      if (this.config.auditLoggingEnabled) {
        await auditLogService.logSecurityEvent({
          type: 'GLOBAL_SIGNOUT',
          userId,
          metadata: {
            sessionsTerminated: sessions.length,
            deviceIds: sessions.map(s => s.deviceInfo.deviceId),
          },
        });
      }
      
      logInfo('SessionManagement: Signed out from all devices', {
        userId,
        sessionsTerminated: sessions.length,
      });
    } catch (error) {
      logError('SessionManagement: Failed to sign out from all devices', error as Error);
      throw error;
    }
  }

  /**
   * Revoke a specific session
   */
  public async revokeSession(userId: string, sessionId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      const sessionIndex = sessions.findIndex(s => s.sessionId === sessionId);
      
      if (sessionIndex === -1) {
        throw new Error('Session not found');
      }
      
      // Mark session as inactive
      sessions[sessionIndex].isActive = false;
      
      // Update stored sessions
      const key = `user_sessions_${userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(sessions));
      
      // Clear current session if it's the one being revoked
      if (this.currentSession?.sessionId === sessionId) {
        await this.removeSessionLocally(sessionId);
        this.currentSession = null;
      }
      
      // Log session revocation
      if (this.config.auditLoggingEnabled) {
        await auditLogService.logSecurityEvent({
          type: 'SESSION_REVOKED',
          userId,
          sessionId,
          metadata: {
            deviceId: sessions[sessionIndex].deviceInfo.deviceId,
            revokedBy: 'user',
          },
        });
      }
      
      logInfo('SessionManagement: Session revoked', { userId, sessionId });
    } catch (error) {
      logError('SessionManagement: Failed to revoke session', error as Error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  /**
   * Check if current session is valid
   */
  public async isCurrentSessionValid(): Promise<boolean> {
    if (!this.currentSession) {
      return false;
    }

    const now = Date.now();
    const timeoutMs = this.config.sessionTimeoutMinutes * 60 * 1000;
    const isExpired = (now - this.currentSession.lastActive) > timeoutMs;
    
    return this.currentSession.isActive && !isExpired;
  }

  /**
   * Clean up expired sessions
   */
  public async cleanupExpiredSessions(): Promise<void> {
    try {
      // This would ideally iterate through all user session keys
      // For now, we'll clean up the current user's sessions
      if (this.currentSession) {
        const sessions = await this.getUserSessions(this.currentSession.userId);
        const activeSessions = sessions.filter(s => s.isActive);
        
        if (activeSessions.length !== sessions.length) {
          const key = `user_sessions_${this.currentSession.userId}`;
          await SecureStore.setItemAsync(key, JSON.stringify(activeSessions));
          
          logInfo('SessionManagement: Cleaned up expired sessions', {
            userId: this.currentSession.userId,
            removed: sessions.length - activeSessions.length,
          });
        }
      }
    } catch (error) {
      logError('SessionManagement: Failed to cleanup expired sessions', error as Error);
    }
  }

  // Private helper methods

  private async getCurrentDeviceInfo(): Promise<DeviceInfo> {
    try {
      const deviceId = await this.getOrCreateDeviceId();
      
      return {
        deviceId,
        deviceName: Device.deviceName || `${Device.brand} ${Device.modelName}` || 'Unknown Device',
        platform: Platform.OS,
        osVersion: Device.osVersion || 'Unknown',
        appVersion: '1.0.0', // This would come from app config
        brand: Device.brand || undefined,
        model: Device.modelName || undefined,
        lastActive: Date.now(),
      };
    } catch (error) {
      logError('SessionManagement: Failed to get device info', error as Error);
      
      // Return fallback device info
      return {
        deviceId: `fallback_${Date.now()}`,
        deviceName: 'Unknown Device',
        platform: Platform.OS,
        osVersion: 'Unknown',
        appVersion: '1.0.0',
        lastActive: Date.now(),
      };
    }
  }

  private async getOrCreateDeviceId(): Promise<string> {
    try {
      const key = 'session_device_id';
      let deviceId = await SecureStore.getItemAsync(key);
      
      if (!deviceId) {
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await SecureStore.setItemAsync(key, deviceId);
      }
      
      return deviceId;
    } catch (error) {
      logError('SessionManagement: Failed to get/create device ID', error as Error);
      return `fallback_${Date.now()}`;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async storeSessionLocally(session: UserSession): Promise<void> {
    try {
      const key = `current_session`;
      await SecureStore.setItemAsync(key, JSON.stringify(session));
    } catch (error) {
      logError('SessionManagement: Failed to store session locally', error as Error);
    }
  }

  private async removeSessionLocally(sessionId: string): Promise<void> {
    try {
      const key = `current_session`;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logError('SessionManagement: Failed to remove session locally', error as Error);
    }
  }

  private async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const key = `current_session`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (stored) {
        const session: UserSession = JSON.parse(stored);
        if (session.sessionId === sessionId) {
          return session;
        }
      }
      
      return null;
    } catch (error) {
      logError('SessionManagement: Failed to get session', error as Error);
      return null;
    }
  }

  private async addToUserSessions(userId: string, session: UserSession): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      sessions.push(session);
      
      const key = `user_sessions_${userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(sessions));
    } catch (error) {
      logError('SessionManagement: Failed to add to user sessions', error as Error);
    }
  }

  private async updateUserSession(userId: string, updatedSession: UserSession): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      const index = sessions.findIndex(s => s.sessionId === updatedSession.sessionId);
      
      if (index !== -1) {
        sessions[index] = updatedSession;
        
        const key = `user_sessions_${userId}`;
        await SecureStore.setItemAsync(key, JSON.stringify(sessions));
      }
    } catch (error) {
      logError('SessionManagement: Failed to update user session', error as Error);
    }
  }

  private async enforceConcurrentSessionLimits(userId: string): Promise<void> {
    try {
      const sessions = await this.getUserSessions(userId);
      
      if (sessions.length > this.config.maxConcurrentSessions) {
        // Sort by last active (oldest first)
        sessions.sort((a, b) => a.lastActive - b.lastActive);
        
        // Deactivate oldest sessions
        const sessionsToDeactivate = sessions.slice(0, sessions.length - this.config.maxConcurrentSessions);
        
        for (const session of sessionsToDeactivate) {
          session.isActive = false;
        }
        
        // Update stored sessions
        const key = `user_sessions_${userId}`;
        await SecureStore.setItemAsync(key, JSON.stringify(sessions));
        
        logInfo('SessionManagement: Enforced concurrent session limits', {
          userId,
          deactivated: sessionsToDeactivate.length,
        });
      }
    } catch (error) {
      logError('SessionManagement: Failed to enforce concurrent session limits', error as Error);
    }
  }

  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    const intervalMs = this.config.cleanupIntervalHours * 60 * 60 * 1000;
    
    this.cleanupTimer = setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, intervalMs);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<SessionManagementConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart cleanup timer if interval changed
    if (newConfig.cleanupIntervalHours && this.config.autoCleanupEnabled) {
      this.startCleanupTimer();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): SessionManagementConfig {
    return { ...this.config };
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
}

// Export singleton instance
export const sessionManagementService = SessionManagementService.getInstance();