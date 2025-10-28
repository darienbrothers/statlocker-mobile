/**
 * Consent Management Service
 * 
 * Handles user consent tracking for Terms of Service, Privacy Policy,
 * and other legal documents with version control and compliance features.
 */

import * as SecureStore from 'expo-secure-store';
import { logInfo, logError } from '@/lib/logging';
import { auditLogService } from './AuditLogService';

export interface ConsentRecord {
  documentType: 'terms_of_service' | 'privacy_policy' | 'data_processing' | 'marketing';
  version: string;
  consentGiven: boolean;
  timestamp: Date;
  userId: string;
  ipAddress?: string;
  userAgent?: string;
  method: 'explicit' | 'implicit' | 'pre_ticked' | 'opt_out';
  locale: string;
}

export interface LegalDocument {
  type: 'terms_of_service' | 'privacy_policy' | 'data_processing' | 'marketing';
  version: string;
  title: string;
  content: string;
  effectiveDate: Date;
  lastModified: Date;
  isActive: boolean;
  requiredForRegistration: boolean;
  minimumAge?: number;
  regions: string[]; // ISO country codes
}

export interface ConsentStatus {
  userId: string;
  termsOfService: ConsentRecord | null;
  privacyPolicy: ConsentRecord | null;
  dataProcessing: ConsentRecord | null;
  marketing: ConsentRecord | null;
  isCompliant: boolean;
  missingConsents: string[];
  lastUpdated: Date;
}

export interface ConsentRequest {
  documentType: 'terms_of_service' | 'privacy_policy' | 'data_processing' | 'marketing';
  consentGiven: boolean;
  method: 'explicit' | 'implicit' | 'pre_ticked' | 'opt_out';
  locale?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AgeVerificationData {
  dateOfBirth: Date;
  age: number;
  region: string;
  requiresParentalConsent: boolean;
  minimumAge: number;
  verificationMethod: 'self_declared' | 'document_verified' | 'parent_verified';
}

export class ConsentManagementService {
  private static instance: ConsentManagementService;
  private documents: Map<string, LegalDocument> = new Map();
  private consentCache: Map<string, ConsentStatus> = new Map();

  private constructor() {
    this.initializeDefaultDocuments();
  }

  public static getInstance(): ConsentManagementService {
    if (!ConsentManagementService.instance) {
      ConsentManagementService.instance = new ConsentManagementService();
    }
    return ConsentManagementService.instance;
  }

  /**
   * Initialize default legal documents
   */
  private initializeDefaultDocuments(): void {
    const now = new Date();
    
    // Terms of Service
    this.documents.set('terms_of_service_v1.0', {
      type: 'terms_of_service',
      version: '1.0',
      title: 'Terms of Service',
      content: 'Default Terms of Service content...',
      effectiveDate: now,
      lastModified: now,
      isActive: true,
      requiredForRegistration: true,
      minimumAge: 13,
      regions: ['US', 'CA', 'GB', 'EU'],
    });

    // Privacy Policy
    this.documents.set('privacy_policy_v1.0', {
      type: 'privacy_policy',
      version: '1.0',
      title: 'Privacy Policy',
      content: 'Default Privacy Policy content...',
      effectiveDate: now,
      lastModified: now,
      isActive: true,
      requiredForRegistration: true,
      minimumAge: 13,
      regions: ['US', 'CA', 'GB', 'EU'],
    });

    // Data Processing Agreement
    this.documents.set('data_processing_v1.0', {
      type: 'data_processing',
      version: '1.0',
      title: 'Data Processing Agreement',
      content: 'Default Data Processing Agreement content...',
      effectiveDate: now,
      lastModified: now,
      isActive: true,
      requiredForRegistration: true,
      minimumAge: 16, // GDPR requirement
      regions: ['EU'],
    });

    // Marketing Communications
    this.documents.set('marketing_v1.0', {
      type: 'marketing',
      version: '1.0',
      title: 'Marketing Communications',
      content: 'Marketing communications consent...',
      effectiveDate: now,
      lastModified: now,
      isActive: true,
      requiredForRegistration: false,
      regions: ['US', 'CA', 'GB', 'EU'],
    });
  }

  /**
   * Get active legal documents for a region
   */
  public getActiveDocuments(region: string = 'US'): LegalDocument[] {
    return Array.from(this.documents.values())
      .filter(doc => doc.isActive && doc.regions.includes(region))
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  /**
   * Get required documents for registration
   */
  public getRequiredDocuments(region: string = 'US', age?: number): LegalDocument[] {
    return this.getActiveDocuments(region)
      .filter(doc => {
        if (!doc.requiredForRegistration) return false;
        if (age !== undefined && doc.minimumAge && age < doc.minimumAge) return false;
        return true;
      });
  }

  /**
   * Record user consent
   */
  public async recordConsent(userId: string, request: ConsentRequest): Promise<ConsentRecord> {
    try {
      const document = this.getLatestDocument(request.documentType);
      if (!document) {
        throw new Error(`Document type ${request.documentType} not found`);
      }

      const consentRecord: ConsentRecord = {\
        documentType: request.documentType,
        version: document.version,
        consentGiven: request.consentGiven,
        timestamp: new Date(),
        userId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        method: request.method,
        locale: request.locale || 'en',
      };

      // Store consent record
      await this.storeConsentRecord(consentRecord);

      // Update consent status cache
      await this.updateConsentStatus(userId);

      // Log consent event
      await auditLogService.logSecurityEvent({
        type: 'CONSENT_RECORDED',
        userId,
        metadata: {
          documentType: request.documentType,
          version: document.version,
          consentGiven: request.consentGiven,
          method: request.method,
        },
      });

      logInfo('ConsentManagement: Consent recorded', {
        userId,
        documentType: request.documentType,
        consentGiven: request.consentGiven,
      });

      return consentRecord;
    } catch (error) {
      logError('ConsentManagement: Failed to record consent', error as Error);
      throw error;
    }
  }

  /**
   * Get user consent status
   */
  public async getConsentStatus(userId: string): Promise<ConsentStatus> {
    try {
      // Check cache first
      if (this.consentCache.has(userId)) {
        const cached = this.consentCache.get(userId)!;
        // Return cached if less than 1 hour old
        if (Date.now() - cached.lastUpdated.getTime() < 60 * 60 * 1000) {
          return cached;
        }
      }

      // Load from storage
      const status = await this.loadConsentStatus(userId);
      this.consentCache.set(userId, status);

      return status;
    } catch (error) {
      logError('ConsentManagement: Failed to get consent status', error as Error);
      throw error;
    }
  }

  /**
   * Check if user has all required consents
   */
  public async isConsentCompliant(userId: string, region: string = 'US', age?: number): Promise<boolean> {
    try {
      const status = await this.getConsentStatus(userId);
      const requiredDocs = this.getRequiredDocuments(region, age);

      for (const doc of requiredDocs) {
        const consent = this.getConsentForDocument(status, doc.type);
        if (!consent || !consent.consentGiven) {
          return false;
        }

        // Check if consent is for current version
        if (consent.version !== doc.version) {
          return false;
        }
      }

      return true;
    } catch (error) {
      logError('ConsentManagement: Failed to check compliance', error as Error);
      return false;
    }
  }

  /**
   * Get missing consents for a user
   */
  public async getMissingConsents(userId: string, region: string = 'US', age?: number): Promise<LegalDocument[]> {
    try {
      const status = await this.getConsentStatus(userId);
      const requiredDocs = this.getRequiredDocuments(region, age);
      const missing: LegalDocument[] = [];

      for (const doc of requiredDocs) {
        const consent = this.getConsentForDocument(status, doc.type);
        if (!consent || !consent.consentGiven || consent.version !== doc.version) {
          missing.push(doc);
        }
      }

      return missing;
    } catch (error) {
      logError('ConsentManagement: Failed to get missing consents', error as Error);
      return [];
    }
  }

  /**
   * Verify age and determine consent requirements
   */
  public verifyAge(dateOfBirth: Date, region: string = 'US'): AgeVerificationData {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate()) 
      ? age - 1 
      : age;

    // Determine minimum age and parental consent requirements by region
    let minimumAge = 13; // Default COPPA age
    let requiresParentalConsent = false;

    switch (region.toUpperCase()) {
      case 'EU':
      case 'GB':
        minimumAge = 16; // GDPR-K age
        requiresParentalConsent = actualAge < 16;
        break;
      case 'US':
      case 'CA':
        minimumAge = 13; // COPPA age
        requiresParentalConsent = actualAge < 13;
        break;
      default:
        minimumAge = 13;
        requiresParentalConsent = actualAge < 13;
    }

    return {
      dateOfBirth,
      age: actualAge,
      region,
      requiresParentalConsent,
      minimumAge,
      verificationMethod: 'self_declared',
    };
  }

  /**
   * Update consent status when documents change
   */
  public async updateConsentStatus(userId: string): Promise<ConsentStatus> {
    try {
      const records = await this.loadConsentRecords(userId);
      const requiredDocs = this.getRequiredDocuments();
      
      const status: ConsentStatus = {
        userId,
        termsOfService: this.getLatestConsentRecord(records, 'terms_of_service'),
        privacyPolicy: this.getLatestConsentRecord(records, 'privacy_policy'),
        dataProcessing: this.getLatestConsentRecord(records, 'data_processing'),
        marketing: this.getLatestConsentRecord(records, 'marketing'),
        isCompliant: false,
        missingConsents: [],
        lastUpdated: new Date(),
      };

      // Check compliance
      const missing: string[] = [];
      for (const doc of requiredDocs) {
        const consent = this.getConsentForDocument(status, doc.type);
        if (!consent || !consent.consentGiven || consent.version !== doc.version) {
          missing.push(doc.type);
        }
      }

      status.missingConsents = missing;
      status.isCompliant = missing.length === 0;

      // Store updated status
      await this.storeConsentStatus(status);
      this.consentCache.set(userId, status);

      return status;
    } catch (error) {
      logError('ConsentManagement: Failed to update consent status', error as Error);
      throw error;
    }
  }

  /**
   * Withdraw consent for a document type
   */
  public async withdrawConsent(userId: string, documentType: string, reason?: string): Promise<void> {
    try {
      const withdrawalRecord: ConsentRecord = {
        documentType: documentType as any,
        version: this.getLatestDocument(documentType as any)?.version || '1.0',
        consentGiven: false,
        timestamp: new Date(),
        userId,
        method: 'explicit',
        locale: 'en',
      };

      await this.storeConsentRecord(withdrawalRecord);
      await this.updateConsentStatus(userId);

      // Log withdrawal
      await auditLogService.logSecurityEvent({
        type: 'CONSENT_WITHDRAWN',
        userId,
        metadata: {
          documentType,
          reason: reason || 'User requested',
        },
      });

      logInfo('ConsentManagement: Consent withdrawn', { userId, documentType, reason });
    } catch (error) {
      logError('ConsentManagement: Failed to withdraw consent', error as Error);
      throw error;
    }
  }

  /**
   * Export user consent data
   */
  public async exportConsentData(userId: string): Promise<any> {
    try {
      const status = await this.getConsentStatus(userId);
      const records = await this.loadConsentRecords(userId);

      return {
        userId,
        consentStatus: status,
        consentHistory: records,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      logError('ConsentManagement: Failed to export consent data', error as Error);
      throw error;
    }
  }

  // Private helper methods

  private getLatestDocument(type: string): LegalDocument | undefined {
    return Array.from(this.documents.values())
      .filter(doc => doc.type === type && doc.isActive)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())[0];
  }

  private getConsentForDocument(status: ConsentStatus, type: string): ConsentRecord | null {
    switch (type) {
      case 'terms_of_service':
        return status.termsOfService;
      case 'privacy_policy':
        return status.privacyPolicy;
      case 'data_processing':
        return status.dataProcessing;
      case 'marketing':
        return status.marketing;
      default:
        return null;
    }
  }

  private getLatestConsentRecord(records: ConsentRecord[], type: string): ConsentRecord | null {
    return records
      .filter(record => record.documentType === type)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0] || null;
  }

  private async storeConsentRecord(record: ConsentRecord): Promise<void> {
    try {
      const key = `consent_record_${record.userId}_${record.documentType}_${Date.now()}`;
      await SecureStore.setItemAsync(key, JSON.stringify(record));
    } catch (error) {
      logError('ConsentManagement: Failed to store consent record', error as Error);
      throw error;
    }
  }

  private async loadConsentRecords(userId: string): Promise<ConsentRecord[]> {
    try {
      // In a real implementation, this would query a database
      // For now, we'll simulate with SecureStore
      const records: ConsentRecord[] = [];
      
      // This is a simplified implementation
      // In production, you'd have a proper database query
      
      return records;
    } catch (error) {
      logError('ConsentManagement: Failed to load consent records', error as Error);
      return [];
    }
  }

  private async loadConsentStatus(userId: string): Promise<ConsentStatus> {
    try {
      const key = `consent_status_${userId}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (stored) {
        const status = JSON.parse(stored);
        // Convert date strings back to Date objects
        status.lastUpdated = new Date(status.lastUpdated);
        if (status.termsOfService) {
          status.termsOfService.timestamp = new Date(status.termsOfService.timestamp);
        }
        if (status.privacyPolicy) {
          status.privacyPolicy.timestamp = new Date(status.privacyPolicy.timestamp);
        }
        if (status.dataProcessing) {
          status.dataProcessing.timestamp = new Date(status.dataProcessing.timestamp);
        }
        if (status.marketing) {
          status.marketing.timestamp = new Date(status.marketing.timestamp);
        }
        return status;
      }

      // Return default status if none exists
      return {
        userId,
        termsOfService: null,
        privacyPolicy: null,
        dataProcessing: null,
        marketing: null,
        isCompliant: false,
        missingConsents: [],
        lastUpdated: new Date(),
      };
    } catch (error) {
      logError('ConsentManagement: Failed to load consent status', error as Error);
      throw error;
    }
  }

  private async storeConsentStatus(status: ConsentStatus): Promise<void> {
    try {
      const key = `consent_status_${status.userId}`;
      await SecureStore.setItemAsync(key, JSON.stringify(status));
    } catch (error) {
      logError('ConsentManagement: Failed to store consent status', error as Error);
      throw error;
    }
  }

  /**
   * Clear consent cache
   */
  public clearCache(userId?: string): void {
    if (userId) {
      this.consentCache.delete(userId);
    } else {
      this.consentCache.clear();
    }
  }
}

// Export singleton instance
export const consentManagementService = ConsentManagementService.getInstance();