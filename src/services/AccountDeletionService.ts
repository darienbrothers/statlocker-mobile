/**
 * Account Deletion Service
 * 
 * Handles secure account deletion with data export, re-authentication,
 * and compliance with data protection regulations (GDPR, CCPA).
 */

import { deleteUser } from 'firebase/auth';
import * as SecureStore from 'expo-secure-store';
import { logInfo, logError } from '@/lib/logging';
import { auditLogService } from './AuditLogService';
import { reauthenticationService } from './ReauthenticationService';
import { consentManagementService } from './ConsentManagementService';
import { parentalConsentService } from './ParentalConsentService';
import { sessionManagementService } from './SessionManagementService';
import { getFirebaseAuth } from '@/lib/firebase';

export interface DeletionRequest {
  id: string;
  userId: string;
  email: string;
  requestedAt: Date;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  reason?: string;
  dataExported: boolean;
  exportPath?: string;
  reauthenticatedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    region?: string;
    gracePeriodDays: number;
  };
}

export interface DataExport {
  userId: string;
  email: string;
  exportedAt: Date;
  exportVersion: string;
  data: {
    profile: any;
    consents: any[];
    sessions: any[];
    auditLogs: any[];
    parentalConsent?: any;
    preferences: any;
    metadata: {
      accountCreated: Date;
      lastLogin?: Date;
      totalSessions: number;
      dataRetentionDays: number;
    };
  };
}

export interface DeletionProgress {
  requestId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  steps: {
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    completedAt?: Date;
  }[];
  estimatedCompletion?: Date;
  canCancel: boolean;
}

export class AccountDeletionService {
  private static instance: AccountDeletionService;
  private auth = getFirebaseAuth();
  private deletionRequests: Map<string, DeletionRequest> = new Map();
  private deletionProgress: Map<string, DeletionProgress> = new Map();

  private constructor() {}

  public static getInstance(): AccountDeletionService {
    if (!AccountDeletionService.instance) {
      AccountDeletionService.instance = new AccountDeletionService();
    }
    return AccountDeletionService.instance;
  }

  /**
   * Export user data before deletion
   */
  public async exportUserData(userId: string): Promise<DataExport> {
    try {
      logInfo('AccountDeletion: Starting data export', { userId });

      // Get user profile data
      const profile = await this.getUserProfileData(userId);
      
      // Get consent data
      const consents = await consentManagementService.exportConsentData(userId);
      
      // Get session data
      const sessions = await this.getUserSessionData(userId);
      
      // Get audit logs
      const auditLogs = await this.getUserAuditLogs(userId);
      
      // Get parental consent data (if applicable)
      const parentalConsent = await this.getParentalConsentData(userId);
      
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      const exportData: DataExport = {
        userId,
        email: profile?.email || '',
        exportedAt: new Date(),
        exportVersion: '1.0',
        data: {
          profile: this.sanitizeProfileData(profile),
          consents: consents || [],
          sessions: this.sanitizeSessionData(sessions),
          auditLogs: this.sanitizeAuditLogs(auditLogs),
          parentalConsent: parentalConsent ? this.sanitizeParentalConsentData(parentalConsent) : undefined,
          preferences: preferences || {},
          metadata: {
            accountCreated: profile?.createdAt || new Date(),
            lastLogin: profile?.lastLoginAt,
            totalSessions: sessions?.length || 0,
            dataRetentionDays: profile?.privacy?.dataRetentionDays || 90,
          },
        },
      };

      // Store export for download
      await this.storeDataExport(exportData);

      // Log export
      await auditLogService.logSecurityEvent({
        type: 'DATA_EXPORTED',
        userId,
        metadata: {
          exportSize: JSON.stringify(exportData).length,
          exportVersion: exportData.exportVersion,
        },
      });

      logInfo('AccountDeletion: Data export completed', { 
        userId, 
        exportSize: JSON.stringify(exportData).length 
      });

      return exportData;
    } catch (error) {
      logError('AccountDeletion: Failed to export user data', error as Error);
      throw error;
    }
  }

  /**
   * Request account deletion with grace period
   */
  public async requestAccountDeletion(
    userId: string,
    reason?: string,
    gracePeriodDays: number = 7
  ): Promise<DeletionRequest> {
    try {
      // Verify user is authenticated and requires re-auth
      const needsReauth = await reauthenticationService.requiresReauth('delete_account', userId);
      if (needsReauth) {
        throw new Error('Re-authentication required for account deletion');
      }

      const now = new Date();
      const scheduledFor = new Date(now.getTime() + (gracePeriodDays * 24 * 60 * 60 * 1000));
      
      const requestId = this.generateRequestId();
      
      const deletionRequest: DeletionRequest = {
        id: requestId,
        userId,
        email: this.auth.currentUser?.email || '',
        requestedAt: now,
        scheduledFor,
        status: 'pending',
        reason,
        dataExported: false,
        reauthenticatedAt: new Date(),
        metadata: {
          gracePeriodDays,
          region: 'US', // TODO: Get from user profile
        },
      };

      // Store the request
      await this.storeDeletionRequest(deletionRequest);
      this.deletionRequests.set(requestId, deletionRequest);

      // Initialize progress tracking
      const progress = this.initializeDeletionProgress(requestId);
      this.deletionProgress.set(requestId, progress);

      // Log deletion request
      await auditLogService.logSecurityEvent({
        type: 'ACCOUNT_DELETION_REQUESTED',
        userId,
        metadata: {
          requestId,
          gracePeriodDays,
          scheduledFor: scheduledFor.toISOString(),
          reason,
        },
      });

      logInfo('AccountDeletion: Deletion request created', {
        requestId,
        userId,
        scheduledFor: scheduledFor.toISOString(),
      });

      return deletionRequest;
    } catch (error) {
      logError('AccountDeletion: Failed to request account deletion', error as Error);
      throw error;
    }
  }

  /**
   * Cancel pending account deletion
   */
  public async cancelAccountDeletion(requestId: string, userId: string): Promise<void> {
    try {
      const request = await this.getDeletionRequest(requestId);
      if (!request) {
        throw new Error('Deletion request not found');
      }

      if (request.userId !== userId) {
        throw new Error('Unauthorized to cancel this deletion request');
      }

      if (request.status !== 'pending') {
        throw new Error('Cannot cancel deletion request in current status');
      }

      // Update request status
      request.status = 'cancelled';
      await this.storeDeletionRequest(request);

      // Update progress
      const progress = this.deletionProgress.get(requestId);
      if (progress) {
        progress.status = 'failed';
        progress.currentStep = 'Cancelled by user';
        progress.canCancel = false;
      }

      // Log cancellation
      await auditLogService.logSecurityEvent({
        type: 'ACCOUNT_DELETION_CANCELLED',
        userId,
        metadata: { requestId },
      });

      logInfo('AccountDeletion: Deletion request cancelled', { requestId, userId });
    } catch (error) {
      logError('AccountDeletion: Failed to cancel account deletion', error as Error);
      throw error;
    }
  }

  /**
   * Process account deletion (called by scheduled job)
   */
  public async processAccountDeletion(requestId: string): Promise<void> {
    try {
      const request = await this.getDeletionRequest(requestId);
      if (!request) {
        throw new Error('Deletion request not found');
      }

      if (request.status !== 'pending') {
        logInfo('AccountDeletion: Skipping non-pending request', { requestId, status: request.status });
        return;
      }

      if (new Date() < request.scheduledFor) {
        logInfo('AccountDeletion: Request not yet scheduled', { requestId, scheduledFor: request.scheduledFor });
        return;
      }

      // Update status to processing
      request.status = 'processing';
      await this.storeDeletionRequest(request);

      const progress = this.deletionProgress.get(requestId) || this.initializeDeletionProgress(requestId);
      progress.status = 'processing';
      this.deletionProgress.set(requestId, progress);

      logInfo('AccountDeletion: Starting account deletion process', { requestId, userId: request.userId });

      try {
        // Step 1: Export data if not already done
        if (!request.dataExported) {
          this.updateProgress(requestId, 'Exporting user data', 10);
          await this.exportUserData(request.userId);
          request.dataExported = true;
          await this.storeDeletionRequest(request);
        }

        // Step 2: Delete user sessions
        this.updateProgress(requestId, 'Clearing user sessions', 25);
        // Revoke all user sessions\n        const sessions = await sessionManagementService.getUserSessions(request.userId);\n        for (const session of sessions) {\n          await sessionManagementService.revokeSession(request.userId, session.id);\n        }

        // Step 3: Delete consent records
        this.updateProgress(requestId, 'Removing consent records', 40);
        await this.deleteConsentData(request.userId);

        // Step 4: Delete parental consent data (if applicable)
        this.updateProgress(requestId, 'Removing parental consent data', 55);
        await this.deleteParentalConsentData(request.userId);

        // Step 5: Delete user profile data
        this.updateProgress(requestId, 'Removing profile data', 70);
        await this.deleteUserProfileData(request.userId);

        // Step 6: Delete Firebase Auth user
        this.updateProgress(requestId, 'Deleting authentication account', 85);
        await this.deleteFirebaseUser(request.userId);

        // Step 7: Final cleanup
        this.updateProgress(requestId, 'Final cleanup', 95);
        await this.performFinalCleanup(request.userId);

        // Complete the deletion
        request.status = 'completed';
        request.completedAt = new Date();
        await this.storeDeletionRequest(request);

        this.updateProgress(requestId, 'Account deletion completed', 100);
        progress.status = 'completed';
        progress.canCancel = false;

        // Log completion
        await auditLogService.logSecurityEvent({
          type: 'ACCOUNT_DELETION_COMPLETED',
          userId: request.userId,
          metadata: {
            requestId,
            completedAt: request.completedAt.toISOString(),
          },
        });

        logInfo('AccountDeletion: Account deletion completed successfully', {
          requestId,
          userId: request.userId,
        });

      } catch (error) {
        // Handle deletion failure
        request.status = 'failed';
        request.failureReason = (error as Error).message;
        await this.storeDeletionRequest(request);

        progress.status = 'failed';
        progress.currentStep = `Failed: ${(error as Error).message}`;
        progress.canCancel = false;

        logError('AccountDeletion: Account deletion failed', error as Error);
        throw error;
      }

    } catch (error) {
      logError('AccountDeletion: Failed to process account deletion', error as Error);
      throw error;
    }
  }

  /**
   * Get deletion request status
   */
  public async getDeletionRequestStatus(requestId: string): Promise<DeletionRequest | null> {
    return await this.getDeletionRequest(requestId);
  }

  /**
   * Get deletion progress
   */
  public getDeletionProgress(requestId: string): DeletionProgress | null {
    return this.deletionProgress.get(requestId) || null;
  }

  /**
   * Get user's active deletion requests
   */
  public async getUserDeletionRequests(userId: string): Promise<DeletionRequest[]> {
    try {
      // In a real implementation, this would query a database
      // For now, we'll check stored requests
      const requests: DeletionRequest[] = [];
      
      for (const request of this.deletionRequests.values()) {
        if (request.userId === userId) {
          requests.push(request);
        }
      }

      return requests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
    } catch (error) {
      logError('AccountDeletion: Failed to get user deletion requests', error as Error);
      return [];
    }
  }

  // Private helper methods

  private generateRequestId(): string {
    return `del_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDeletionProgress(requestId: string): DeletionProgress {
    return {
      requestId,
      status: 'pending',
      progress: 0,
      currentStep: 'Deletion request created',
      steps: [
        { name: 'Export user data', status: 'pending' },
        { name: 'Clear user sessions', status: 'pending' },
        { name: 'Remove consent records', status: 'pending' },
        { name: 'Remove parental consent data', status: 'pending' },
        { name: 'Remove profile data', status: 'pending' },
        { name: 'Delete authentication account', status: 'pending' },
        { name: 'Final cleanup', status: 'pending' },
      ],
      canCancel: true,
    };
  }

  private updateProgress(requestId: string, currentStep: string, progress: number): void {
    const progressData = this.deletionProgress.get(requestId);
    if (progressData) {
      progressData.currentStep = currentStep;
      progressData.progress = progress;
      
      // Update step status
      const stepIndex = Math.floor((progress / 100) * progressData.steps.length);
      if (stepIndex < progressData.steps.length) {
        progressData.steps[stepIndex].status = 'processing';
        
        // Mark previous steps as completed
        for (let i = 0; i < stepIndex; i++) {
          if (progressData.steps[i].status !== 'completed') {
            progressData.steps[i].status = 'completed';
            progressData.steps[i].completedAt = new Date();
          }
        }
      }
    }
  }

  private async getUserProfileData(userId: string): Promise<any> {
    try {
      // This would typically fetch from your user profile service
      // For now, we'll return a placeholder
      return {
        userId,
        email: this.auth.currentUser?.email,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        privacy: { dataRetentionDays: 90 },
      };
    } catch (error) {
      logError('AccountDeletion: Failed to get user profile data', error as Error);
      return null;
    }
  }

  private async getUserSessionData(userId: string): Promise<any[]> {
    try {
      // Get session data from session management service
      return []; // Placeholder
    } catch (error) {
      logError('AccountDeletion: Failed to get user session data', error as Error);
      return [];
    }
  }

  private async getUserAuditLogs(userId: string): Promise<any[]> {
    try {
      // Get audit logs for the user
      return []; // Placeholder
    } catch (error) {
      logError('AccountDeletion: Failed to get user audit logs', error as Error);
      return [];
    }
  }

  private async getParentalConsentData(userId: string): Promise<any> {
    try {
      return await parentalConsentService.getPendingAccountStatus(userId);
    } catch (error) {
      return null;
    }
  }

  private async getUserPreferences(userId: string): Promise<any> {
    try {
      // Get user preferences
      return {}; // Placeholder
    } catch (error) {
      return {};
    }
  }

  private sanitizeProfileData(profile: any): any {
    if (!profile) return null;
    
    // Remove sensitive internal data
    const sanitized = { ...profile };
    delete sanitized.hashedPassword;
    delete sanitized.internalId;
    return sanitized;
  }

  private sanitizeSessionData(sessions: any[]): any[] {
    return sessions.map(session => ({
      ...session,
      // Remove sensitive session tokens
      accessToken: undefined,
      refreshToken: undefined,
    }));
  }

  private sanitizeAuditLogs(logs: any[]): any[] {
    return logs.map(log => ({
      ...log,
      // Remove sensitive internal data
      internalMetadata: undefined,
    }));
  }

  private sanitizeParentalConsentData(data: any): any {
    if (!data) return null;
    
    return {
      ...data,
      // Remove sensitive tokens
      verificationToken: undefined,
    };
  }

  private async deleteConsentData(userId: string): Promise<void> {
    try {
      // Clear consent management data
      consentManagementService.clearCache(userId);
      
      // Delete stored consent records
      const key = `consent_status_${userId}`;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logError('AccountDeletion: Failed to delete consent data', error as Error);
    }
  }

  private async deleteParentalConsentData(userId: string): Promise<void> {
    try {
      // Clean up parental consent data
      const key = `pending_account_${userId}`;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logError('AccountDeletion: Failed to delete parental consent data', error as Error);
    }
  }

  private async deleteUserProfileData(userId: string): Promise<void> {
    try {
      // Delete user profile data
      const key = `user_profile_${userId}`;
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      logError('AccountDeletion: Failed to delete user profile data', error as Error);
    }
  }

  private async deleteFirebaseUser(userId: string): Promise<void> {
    try {
      if (this.auth.currentUser && this.auth.currentUser.uid === userId) {
        await deleteUser(this.auth.currentUser);
      }
    } catch (error) {
      logError('AccountDeletion: Failed to delete Firebase user', error as Error);
      throw error;
    }
  }

  private async performFinalCleanup(userId: string): Promise<void> {
    try {
      // Clear any remaining cached data
      // Clear session management data (no clearCache method available)
      consentManagementService.clearCache(userId);
      
      // Remove any remaining stored data
      const keys = [
        `user_${userId}`,
        `profile_${userId}`,
        `settings_${userId}`,
      ];
      
      for (const key of keys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // Ignore errors for non-existent keys
        }
      }
    } catch (error) {
      logError('AccountDeletion: Failed to perform final cleanup', error as Error);
    }
  }

  // Storage methods

  private async storeDeletionRequest(request: DeletionRequest): Promise<void> {
    try {
      const key = `deletion_request_${request.id}`;
      await SecureStore.setItemAsync(key, JSON.stringify(request));
    } catch (error) {
      logError('AccountDeletion: Failed to store deletion request', error as Error);
      throw error;
    }
  }

  private async getDeletionRequest(requestId: string): Promise<DeletionRequest | null> {
    try {
      // Check cache first
      if (this.deletionRequests.has(requestId)) {
        return this.deletionRequests.get(requestId)!;
      }

      // Load from storage
      const key = `deletion_request_${requestId}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (stored) {
        const request = JSON.parse(stored);
        // Convert date strings back to Date objects
        request.requestedAt = new Date(request.requestedAt);
        request.scheduledFor = new Date(request.scheduledFor);
        if (request.reauthenticatedAt) {
          request.reauthenticatedAt = new Date(request.reauthenticatedAt);
        }
        if (request.completedAt) {
          request.completedAt = new Date(request.completedAt);
        }
        
        this.deletionRequests.set(requestId, request);
        return request;
      }
      
      return null;
    } catch (error) {
      logError('AccountDeletion: Failed to get deletion request', error as Error);
      return null;
    }
  }

  private async storeDataExport(exportData: DataExport): Promise<void> {
    try {
      const key = `data_export_${exportData.userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(exportData));
    } catch (error) {
      logError('AccountDeletion: Failed to store data export', error as Error);
      throw error;
    }
  }
}

// Export singleton instance
export const accountDeletionService = AccountDeletionService.getInstance();