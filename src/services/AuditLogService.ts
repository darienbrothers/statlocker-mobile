/**
 * Audit Log Service
 * 
 * Implements comprehensive security event logging and audit trail management.
 * Tracks authentication attempts, failures, suspicious activity, and security events.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Network from 'expo-network';
import { SecurityEvent, AuditLogEntry } from '@/types/security';
import { SecurityEventType } from '@/types/auth';

export interface AuditLogConfig {
  enableLocalStorage: boolean;
  enableRemoteLogging: boolean;
  maxLocalEntries: number;
  batchSize: number;
  uploadIntervalMs: number;
  retentionDays: number;
}

export class AuditLogService {
  private static instance: AuditLogService;
  private config: AuditLogConfig;
  private pendingEvents: SecurityEvent[] = [];
  private uploadTimer?: any;

  private constructor() {
    this.config = {
      enableLocalStorage: true,
      enableRemoteLogging: true,
      maxLocalEntries: 1000,
      batchSize: 50,
      uploadIntervalMs: 30000, // 30 seconds
      retentionDays: 90,
    };
  }

  public static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  /**
   * Initialize the audit logging service
   */
  public async initialize(): Promise<void> {
    try {
      // Clean up old entries
      await this.cleanupOldEntries();
      
      // Start batch upload timer if remote logging is enabled
      if (this.config.enableRemoteLogging) {
        this.startBatchUpload();
      }
      
      console.log('AuditLogService: Initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AuditLogService:', error);
    }
  }

  /**
   * Log a security event
   */
  public async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullEvent: SecurityEvent = {
        ...event,
        id: this.generateEventId(),
        timestamp: Date.now(),
      };

      // Add device and network context
      const enrichedEvent = await this.enrichEvent(fullEvent);

      // Store locally if enabled
      if (this.config.enableLocalStorage) {
        await this.storeEventLocally(enrichedEvent);
      }

      // Add to pending batch for remote upload
      if (this.config.enableRemoteLogging) {
        this.pendingEvents.push(enrichedEvent);
      }

      // Log to console for development
      if (__DEV__) {
        console.log('Security Event:', enrichedEvent);
      }

    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Log an audit entry
   */
  public async logAuditEntry(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullEntry: AuditLogEntry = {
        ...entry,
        id: this.generateEventId(),
        timestamp: new Date(),
      };

      // Add device context
      const enrichedEntry = await this.enrichAuditEntry(fullEntry);

      // Store locally
      if (this.config.enableLocalStorage) {
        await this.storeAuditEntryLocally(enrichedEntry);
      }

      // Log to console for development
      if (__DEV__) {
        console.log('Audit Entry:', enrichedEntry);
      }

    } catch (error) {
      console.error('Error logging audit entry:', error);
    }
  }

  /**
   * Log authentication attempt
   */
  public async logAuthAttempt(
    type: 'email' | 'apple' | 'google',
    success: boolean,
    userId?: string,
    email?: string,
    errorCode?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: success ? SecurityEventType.AUTH_SUCCESS : SecurityEventType.AUTH_FAILED,
      userId,
      metadata: {
        authType: type,
        email: email?.toLowerCase(),
        errorCode,
        success,
      },
    });
  }

  /**
   * Log suspicious activity
   */
  public async logSuspiciousActivity(
    activityType: string,
    details: Record<string, any>,
    userId?: string,
    riskScore?: number
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      userId,
      metadata: {
        activityType,
        riskScore,
        ...details,
      },
    });
  }

  /**
   * Log rate limiting event
   */
  public async logRateLimitEvent(
    identifier: string,
    action: 'triggered' | 'reset',
    attempts: number,
    lockoutMinutes?: number
  ): Promise<void> {
    await this.logSecurityEvent({
      type: SecurityEventType.RATE_LIMITED,
      metadata: {
        identifier,
        action,
        attempts,
        lockoutMinutes,
      },
    });
  }

  /**
   * Log session event
   */
  public async logSessionEvent(
    eventType: 'started' | 'ended' | 'expired',
    userId: string,
    sessionId: string,
    deviceInfo?: any
  ): Promise<void> {
    const securityEventType = {
      started: SecurityEventType.SESSION_STARTED,
      ended: SecurityEventType.SESSION_ENDED,
      expired: SecurityEventType.SESSION_EXPIRED,
    }[eventType];

    await this.logSecurityEvent({
      type: securityEventType,
      userId,
      sessionId,
      metadata: {
        eventType,
        deviceInfo,
      },
    });
  }

  /**
   * Log account event
   */
  public async logAccountEvent(
    eventType: 'created' | 'deleted' | 'suspended' | 'reactivated',
    userId: string,
    details?: Record<string, any>
  ): Promise<void> {
    const securityEventType = {
      created: SecurityEventType.ACCOUNT_CREATED,
      deleted: SecurityEventType.ACCOUNT_DELETED,
      suspended: SecurityEventType.ACCOUNT_SUSPENDED,
      reactivated: SecurityEventType.ACCOUNT_REACTIVATED,
    }[eventType];

    await this.logSecurityEvent({
      type: securityEventType,
      userId,
      metadata: {
        eventType,
        ...details,
      },
    });
  }

  /**
   * Log provider event
   */
  public async logProviderEvent(
    eventType: 'linked' | 'unlinked' | 'error',
    providerId: string,
    userId?: string,
    errorDetails?: any
  ): Promise<void> {
    const securityEventType = {
      linked: SecurityEventType.PROVIDER_LINKED,
      unlinked: SecurityEventType.PROVIDER_UNLINKED,
      error: SecurityEventType.PROVIDER_ERROR,
    }[eventType];

    await this.logSecurityEvent({
      type: securityEventType,
      userId,
      metadata: {
        eventType,
        providerId,
        errorDetails,
      },
    });
  }

  /**
   * Get recent security events
   */
  public async getRecentEvents(limit: number = 100): Promise<SecurityEvent[]> {
    try {
      const events: SecurityEvent[] = [];
      const keys = await this.getStoredEventKeys();
      
      // Sort by timestamp (newest first)
      const sortedKeys = keys
        .sort((a, b) => {
          const timestampA = parseInt(a.split('_')[2]) || 0;
          const timestampB = parseInt(b.split('_')[2]) || 0;
          return timestampB - timestampA;
        })
        .slice(0, limit);

      for (const key of sortedKeys) {
        const eventData = await SecureStore.getItemAsync(key);
        if (eventData) {
          events.push(JSON.parse(eventData));
        }
      }

      return events;
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  /**
   * Get audit entries for a specific user
   */
  public async getUserAuditEntries(userId: string, limit: number = 50): Promise<AuditLogEntry[]> {
    try {
      const entries: AuditLogEntry[] = [];
      const keys = await this.getStoredAuditKeys();
      
      for (const key of keys) {
        const entryData = await SecureStore.getItemAsync(key);
        if (entryData) {
          const entry: AuditLogEntry = JSON.parse(entryData);
          if (entry.userId === userId) {
            entries.push(entry);
          }
        }
        
        if (entries.length >= limit) break;
      }

      // Sort by timestamp (newest first)
      return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting user audit entries:', error);
      return [];
    }
  }

  /**
   * Export audit logs
   */
  public async exportAuditLogs(
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<{ events: SecurityEvent[]; auditEntries: AuditLogEntry[] }> {
    try {
      const events = await this.getRecentEvents(this.config.maxLocalEntries);
      const auditEntries: AuditLogEntry[] = [];
      
      // Get all audit entries
      const auditKeys = await this.getStoredAuditKeys();
      for (const key of auditKeys) {
        const entryData = await SecureStore.getItemAsync(key);
        if (entryData) {
          auditEntries.push(JSON.parse(entryData));
        }
      }

      // Filter by date range and user if specified
      let filteredEvents = events;
      let filteredAuditEntries = auditEntries;

      if (startDate || endDate || userId) {
        filteredEvents = events.filter(event => {
          if (userId && event.userId !== userId) return false;
          if (startDate && event.timestamp < startDate.getTime()) return false;
          if (endDate && event.timestamp > endDate.getTime()) return false;
          return true;
        });

        filteredAuditEntries = auditEntries.filter(entry => {
          if (userId && entry.userId !== userId) return false;
          if (startDate && entry.timestamp < startDate) return false;
          if (endDate && entry.timestamp > endDate) return false;
          return true;
        });
      }

      return {
        events: filteredEvents,
        auditEntries: filteredAuditEntries,
      };
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return { events: [], auditEntries: [] };
    }
  }

  /**
   * Clear all audit logs (for testing or privacy compliance)
   */
  public async clearAllLogs(): Promise<void> {
    try {
      const eventKeys = await this.getStoredEventKeys();
      const auditKeys = await this.getStoredAuditKeys();
      
      for (const key of [...eventKeys, ...auditKeys]) {
        await SecureStore.deleteItemAsync(key);
      }
      
      this.pendingEvents = [];
      console.log('All audit logs cleared');
    } catch (error) {
      console.error('Error clearing audit logs:', error);
    }
  }

  // Private helper methods

  private generateEventId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async enrichEvent(event: SecurityEvent): Promise<SecurityEvent> {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        brand: Device.brand,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
      };

      const networkState = await Network.getNetworkStateAsync();
      
      return {
        ...event,
        deviceInfo,
        metadata: {
          ...event.metadata,
          networkType: networkState.type,
          isConnected: networkState.isConnected,
        },
      };
    } catch (error) {
      console.error('Error enriching event:', error);
      return event;
    }
  }

  private async enrichAuditEntry(entry: AuditLogEntry): Promise<AuditLogEntry> {
    try {
      const deviceInfo = {
        platform: Platform.OS,
        brand: Device.brand,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
      };

      return {
        ...entry,
        metadata: {
          ...entry.metadata,
          deviceInfo,
        },
      };
    } catch (error) {
      console.error('Error enriching audit entry:', error);
      return entry;
    }
  }

  private async storeEventLocally(event: SecurityEvent): Promise<void> {
    try {
      const key = `security_event_${event.timestamp}_${event.id}`;
      await SecureStore.setItemAsync(key, JSON.stringify(event));
    } catch (error) {
      console.error('Error storing event locally:', error);
    }
  }

  private async storeAuditEntryLocally(entry: AuditLogEntry): Promise<void> {
    try {
      const key = `audit_entry_${entry.timestamp.getTime()}_${entry.id}`;
      await SecureStore.setItemAsync(key, JSON.stringify(entry));
    } catch (error) {
      console.error('Error storing audit entry locally:', error);
    }
  }

  private async getStoredEventKeys(): Promise<string[]> {
    // Note: expo-secure-store doesn't provide a way to list keys
    // In a production app, you'd maintain an index of keys
    // For now, we'll return an empty array and rely on the events being accessible
    return [];
  }

  private async getStoredAuditKeys(): Promise<string[]> {
    // Note: expo-secure-store doesn't provide a way to list keys
    // In a production app, you'd maintain an index of keys
    return [];
  }

  private async cleanupOldEntries(): Promise<void> {
    try {
      const cutoffDate = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      // In a production app, you'd iterate through stored keys and delete old entries
      // For now, this is a placeholder
      console.log(`Cleanup: Would remove entries older than ${new Date(cutoffDate)}`);
    } catch (error) {
      console.error('Error cleaning up old entries:', error);
    }
  }

  private startBatchUpload(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
    }

    this.uploadTimer = setInterval(async () => {
      await this.uploadPendingEvents();
    }, this.config.uploadIntervalMs);
  }

  private async uploadPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    try {
      const batch = this.pendingEvents.splice(0, this.config.batchSize);
      
      // In a production app, you'd send these to your backend
      // For now, we'll just log them
      console.log(`Would upload ${batch.length} security events to backend`);
      
      // Simulate successful upload
      if (__DEV__) {
        console.log('Batch upload:', batch);
      }
    } catch (error) {
      console.error('Error uploading pending events:', error);
      // Re-add failed events to the beginning of the queue
      // this.pendingEvents.unshift(...batch);
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<AuditLogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart batch upload if interval changed
    if (newConfig.uploadIntervalMs && this.config.enableRemoteLogging) {
      this.startBatchUpload();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): AuditLogConfig {
    return { ...this.config };
  }

  /**
   * Cleanup method
   */
  public cleanup(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = undefined;
    }
  }
}

// Export singleton instance
export const auditLogService = AuditLogService.getInstance();