/**
 * Parental Consent Service
 * 
 * Handles parental consent workflows for minors, including
 * consent requests, verification, and account activation.
 */

import * as SecureStore from 'expo-secure-store';
import { logInfo, logError } from '@/lib/logging';
import { auditLogService } from './AuditLogService';
import { consentManagementService, AgeVerificationData } from './ConsentManagementService';

export interface ParentalConsentRequest {
  id: string;
  childUserId: string;
  childEmail: string;
  childDateOfBirth: Date;
  parentEmail: string;
  parentName?: string;
  region: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  requestedAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
  verificationToken: string;
  metadata: {
    childAge: number;
    minimumAge: number;
    law: string; // COPPA, GDPR-K, etc.
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface ParentalConsentResponse {
  requestId: string;
  approved: boolean;
  parentName: string;
  parentEmail: string;
  verificationMethod: 'email' | 'phone' | 'document';
  consentGiven: boolean;
  timestamp: Date;
  ipAddress?: string;
  digitalSignature?: string;
}

export interface PendingAccount {
  userId: string;
  email: string;
  hashedPassword: string;
  profile: any;
  consentRequestId: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending_parental_consent' | 'approved' | 'expired';
}

export class ParentalConsentService {
  private static instance: ParentalConsentService;
  private consentRequests: Map<string, ParentalConsentRequest> = new Map();
  private pendingAccounts: Map<string, PendingAccount> = new Map();

  private constructor() {}

  public static getInstance(): ParentalConsentService {
    if (!ParentalConsentService.instance) {
      ParentalConsentService.instance = new ParentalConsentService();
    }
    return ParentalConsentService.instance;
  }

  /**
   * Check if user requires parental consent
   */
  public requiresParentalConsent(ageData: AgeVerificationData): boolean {
    return ageData.requiresParentalConsent;
  }

  /**
   * Create parental consent request
   */
  public async createConsentRequest(
    childUserId: string,
    childEmail: string,
    childDateOfBirth: Date,
    parentEmail: string,
    region: string = 'US',
    metadata?: any
  ): Promise<ParentalConsentRequest> {
    try {
      const ageData = consentManagementService.verifyAge(childDateOfBirth, region);
      
      if (!ageData.requiresParentalConsent) {
        throw new Error('Parental consent not required for this age');
      }

      const requestId = this.generateRequestId();
      const verificationToken = this.generateVerificationToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

      const request: ParentalConsentRequest = {
        id: requestId,
        childUserId,
        childEmail,
        childDateOfBirth,
        parentEmail,
        region,
        status: 'pending',
        requestedAt: now,
        expiresAt,
        verificationToken,
        metadata: {
          childAge: ageData.age,
          minimumAge: ageData.minimumAge,
          law: this.getLawForRegion(region),
          ...metadata,
        },
      };

      // Store the request
      await this.storeConsentRequest(request);
      this.consentRequests.set(requestId, request);

      // Send parental consent email (placeholder - would integrate with email service)
      await this.sendParentalConsentEmail(request);

      // Log the request
      await auditLogService.logSecurityEvent({
        type: 'PARENTAL_CONSENT_REQUESTED',
        userId: childUserId,
        metadata: {
          parentEmail,
          childAge: ageData.age,
          region,
          law: request.metadata.law,
        },
      });

      logInfo('ParentalConsent: Consent request created', {
        requestId,
        childUserId,
        parentEmail,
        childAge: ageData.age,
      });

      return request;
    } catch (error) {
      logError('ParentalConsent: Failed to create consent request', error as Error);
      throw error;
    }
  }

  /**
   * Process parental consent response
   */
  public async processConsentResponse(
    requestId: string,
    verificationToken: string,
    response: Omit<ParentalConsentResponse, 'requestId' | 'timestamp'>
  ): Promise<{ success: boolean; accountActivated?: boolean }> {
    try {
      const request = await this.getConsentRequest(requestId);
      if (!request) {
        throw new Error('Consent request not found');
      }

      // Verify token
      if (request.verificationToken !== verificationToken) {
        throw new Error('Invalid verification token');
      }

      // Check if request is still valid
      if (request.status !== 'pending') {
        throw new Error('Consent request is no longer pending');
      }

      if (new Date() > request.expiresAt) {
        request.status = 'expired';
        await this.storeConsentRequest(request);
        throw new Error('Consent request has expired');
      }

      // Update request status
      request.status = response.approved ? 'approved' : 'denied';
      request.respondedAt = new Date();
      await this.storeConsentRequest(request);

      // Create response record
      const consentResponse: ParentalConsentResponse = {
        ...response,
        requestId,
        timestamp: new Date(),
      };
      await this.storeConsentResponse(consentResponse);

      // Log the response
      await auditLogService.logSecurityEvent({
        type: response.approved ? 'PARENTAL_CONSENT_APPROVED' : 'PARENTAL_CONSENT_DENIED',
        userId: request.childUserId,
        metadata: {
          parentEmail: response.parentEmail,
          parentName: response.parentName,
          verificationMethod: response.verificationMethod,
        },
      });

      let accountActivated = false;

      // If approved, activate the pending account
      if (response.approved) {
        accountActivated = await this.activatePendingAccount(request.childUserId);
      } else {
        // If denied, clean up the pending account
        await this.cleanupPendingAccount(request.childUserId);
      }

      logInfo('ParentalConsent: Consent response processed', {
        requestId,
        approved: response.approved,
        accountActivated,
      });

      return { success: true, accountActivated };
    } catch (error) {
      logError('ParentalConsent: Failed to process consent response', error as Error);
      throw error;
    }
  }

  /**
   * Create pending account for minor
   */
  public async createPendingAccount(
    userId: string,
    email: string,
    hashedPassword: string,
    profile: any,
    consentRequestId: string
  ): Promise<PendingAccount> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days

      const pendingAccount: PendingAccount = {
        userId,
        email,
        hashedPassword,
        profile,
        consentRequestId,
        createdAt: now,
        expiresAt,
        status: 'pending_parental_consent',
      };

      await this.storePendingAccount(pendingAccount);
      this.pendingAccounts.set(userId, pendingAccount);

      logInfo('ParentalConsent: Pending account created', { userId, email });

      return pendingAccount;
    } catch (error) {
      logError('ParentalConsent: Failed to create pending account', error as Error);
      throw error;
    }
  }

  /**
   * Get pending account status
   */
  public async getPendingAccountStatus(userId: string): Promise<PendingAccount | null> {
    try {
      // Check cache first
      if (this.pendingAccounts.has(userId)) {
        return this.pendingAccounts.get(userId)!;
      }

      // Load from storage
      const account = await this.loadPendingAccount(userId);
      if (account) {
        this.pendingAccounts.set(userId, account);
      }

      return account;
    } catch (error) {
      logError('ParentalConsent: Failed to get pending account status', error as Error);
      return null;
    }
  }

  /**
   * Get consent request status
   */
  public async getConsentRequestStatus(requestId: string): Promise<ParentalConsentRequest | null> {
    try {
      return await this.getConsentRequest(requestId);
    } catch (error) {
      logError('ParentalConsent: Failed to get consent request status', error as Error);
      return null;
    }
  }

  /**
   * Resend parental consent email
   */
  public async resendConsentEmail(requestId: string): Promise<void> {
    try {
      const request = await this.getConsentRequest(requestId);
      if (!request) {
        throw new Error('Consent request not found');
      }

      if (request.status !== 'pending') {
        throw new Error('Cannot resend email for non-pending request');
      }

      await this.sendParentalConsentEmail(request);

      logInfo('ParentalConsent: Consent email resent', { requestId });
    } catch (error) {
      logError('ParentalConsent: Failed to resend consent email', error as Error);
      throw error;
    }
  }

  /**
   * Clean up expired requests and accounts
   */
  public async cleanupExpiredRequests(): Promise<void> {
    try {
      const now = new Date();
      
      // Clean up expired consent requests
      for (const [requestId, request] of this.consentRequests) {
        if (now > request.expiresAt && request.status === 'pending') {
          request.status = 'expired';
          await this.storeConsentRequest(request);
          
          // Clean up associated pending account
          await this.cleanupPendingAccount(request.childUserId);
        }
      }

      // Clean up expired pending accounts
      for (const [userId, account] of this.pendingAccounts) {
        if (now > account.expiresAt && account.status === 'pending_parental_consent') {
          await this.cleanupPendingAccount(userId);
        }
      }

      logInfo('ParentalConsent: Cleanup completed');
    } catch (error) {
      logError('ParentalConsent: Failed to cleanup expired requests', error as Error);
    }
  }

  // Private helper methods

  private async getConsentRequest(requestId: string): Promise<ParentalConsentRequest | null> {
    // Check cache first
    if (this.consentRequests.has(requestId)) {
      return this.consentRequests.get(requestId)!;
    }

    // Load from storage
    const request = await this.loadConsentRequest(requestId);
    if (request) {
      this.consentRequests.set(requestId, request);
    }

    return request;
  }

  private async activatePendingAccount(userId: string): Promise<boolean> {
    try {
      const pendingAccount = await this.getPendingAccountStatus(userId);
      if (!pendingAccount) {
        return false;
      }

      // Mark account as approved
      pendingAccount.status = 'approved';
      await this.storePendingAccount(pendingAccount);

      // Here you would typically create the actual Firebase user account
      // For now, we'll just log the activation
      logInfo('ParentalConsent: Account activated', { userId });

      return true;
    } catch (error) {
      logError('ParentalConsent: Failed to activate pending account', error as Error);
      return false;
    }
  }

  private async cleanupPendingAccount(userId: string): Promise<void> {
    try {
      // Remove from cache
      this.pendingAccounts.delete(userId);
      
      // Remove from storage
      const key = `pending_account_${userId}`;
      await SecureStore.deleteItemAsync(key);

      logInfo('ParentalConsent: Pending account cleaned up', { userId });
    } catch (error) {
      logError('ParentalConsent: Failed to cleanup pending account', error as Error);
    }
  }

  private async sendParentalConsentEmail(request: ParentalConsentRequest): Promise<void> {
    // This is a placeholder - in a real implementation, you would integrate with an email service
    // The email would contain a link to verify parental consent with the verification token
    
    const consentUrl = `https://your-app.com/parental-consent/${request.id}?token=${request.verificationToken}`;
    
    logInfo('ParentalConsent: Email would be sent', {
      to: request.parentEmail,
      subject: 'Parental Consent Required',
      consentUrl,
    });

    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
  }

  private generateRequestId(): string {
    return `pcr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substr(2, 32);
  }

  private getLawForRegion(region: string): string {
    switch (region.toUpperCase()) {
      case 'US':
      case 'CA':
        return 'COPPA';
      case 'EU':
      case 'GB':
        return 'GDPR-K';
      default:
        return 'COPPA';
    }
  }

  // Storage methods (using SecureStore for now, would use database in production)

  private async storeConsentRequest(request: ParentalConsentRequest): Promise<void> {
    try {
      const key = `consent_request_${request.id}`;
      await SecureStore.setItemAsync(key, JSON.stringify(request));
    } catch (error) {
      logError('ParentalConsent: Failed to store consent request', error as Error);
      throw error;
    }
  }

  private async loadConsentRequest(requestId: string): Promise<ParentalConsentRequest | null> {
    try {
      const key = `consent_request_${requestId}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (stored) {
        const request = JSON.parse(stored);
        // Convert date strings back to Date objects
        request.requestedAt = new Date(request.requestedAt);
        request.expiresAt = new Date(request.expiresAt);
        request.childDateOfBirth = new Date(request.childDateOfBirth);
        if (request.respondedAt) {
          request.respondedAt = new Date(request.respondedAt);
        }
        return request;
      }
      
      return null;
    } catch (error) {
      logError('ParentalConsent: Failed to load consent request', error as Error);
      return null;
    }
  }

  private async storeConsentResponse(response: ParentalConsentResponse): Promise<void> {
    try {
      const key = `consent_response_${response.requestId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(response));
    } catch (error) {
      logError('ParentalConsent: Failed to store consent response', error as Error);
      throw error;
    }
  }

  private async storePendingAccount(account: PendingAccount): Promise<void> {
    try {
      const key = `pending_account_${account.userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(account));
    } catch (error) {
      logError('ParentalConsent: Failed to store pending account', error as Error);
      throw error;
    }
  }

  private async loadPendingAccount(userId: string): Promise<PendingAccount | null> {
    try {
      const key = `pending_account_${userId}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (stored) {
        const account = JSON.parse(stored);
        // Convert date strings back to Date objects
        account.createdAt = new Date(account.createdAt);
        account.expiresAt = new Date(account.expiresAt);
        return account;
      }
      
      return null;
    } catch (error) {
      logError('ParentalConsent: Failed to load pending account', error as Error);
      return null;
    }
  }
}

// Export singleton instance
export const parentalConsentService = ParentalConsentService.getInstance();