/**
 * Bot Protection Service
 * 
 * Implements bot protection mechanisms to prevent automated attacks.
 * Integrates with platform-specific services:
 * - iOS: DeviceCheck
 * - Android: SafetyNet (Play Integrity API)
 * - Web: reCAPTCHA
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { auditLogService } from './AuditLogService';

export interface BotProtectionConfig {
  enableDeviceCheck: boolean;
  enableSafetyNet: boolean;
  enableRecaptcha: boolean;
  riskThreshold: number; // 0-1, higher = more suspicious
  challengeOnSuspicious: boolean;
  logBotAttempts: boolean;
}

export interface BotProtectionResult {
  isBot: boolean;
  riskScore: number; // 0-1
  confidence: number; // 0-1
  reason?: string;
  challengeRequired: boolean;
  metadata?: Record<string, any>;
}

export interface DeviceAttestation {
  platform: string;
  deviceId: string;
  attestationToken?: string;
  timestamp: number;
  isValid: boolean;
  riskFactors: string[];
}

export class BotProtectionService {
  private static instance: BotProtectionService;
  private config: BotProtectionConfig;
  private deviceAttestation: DeviceAttestation | null = null;

  private constructor() {
    this.config = {
      enableDeviceCheck: Platform.OS === 'ios',
      enableSafetyNet: Platform.OS === 'android',
      enableRecaptcha: false, // Only for web
      riskThreshold: 0.7,
      challengeOnSuspicious: true,
      logBotAttempts: true,
    };
  }

  public static getInstance(): BotProtectionService {
    if (!BotProtectionService.instance) {
      BotProtectionService.instance = new BotProtectionService();
    }
    return BotProtectionService.instance;
  }

  /**
   * Initialize bot protection service
   */
  public async initialize(): Promise<void> {
    try {
      // Initialize platform-specific services
      if (Platform.OS === 'ios' && this.config.enableDeviceCheck) {
        await this.initializeDeviceCheck();
      } else if (Platform.OS === 'android' && this.config.enableSafetyNet) {
        await this.initializeSafetyNet();
      }

      console.log('BotProtectionService: Initialized successfully');
    } catch (error) {
      console.error('Failed to initialize BotProtectionService:', error);
    }
  }

  /**
   * Verify if the current request is from a bot
   */
  public async verifyHuman(context: string, userId?: string): Promise<BotProtectionResult> {
    try {
      const riskFactors: string[] = [];
      let riskScore = 0;
      let confidence = 0.5;

      // Device-based checks
      const deviceRisk = await this.assessDeviceRisk();
      riskScore += deviceRisk.score * 0.4;
      riskFactors.push(...deviceRisk.factors);

      // Behavioral checks
      const behaviorRisk = await this.assessBehavioralRisk(context, userId);
      riskScore += behaviorRisk.score * 0.3;
      riskFactors.push(...behaviorRisk.factors);

      // Platform-specific attestation
      const attestationRisk = await this.assessPlatformAttestation();
      riskScore += attestationRisk.score * 0.3;
      riskFactors.push(...attestationRisk.factors);
      confidence = Math.max(confidence, attestationRisk.confidence);

      // Determine if bot
      const isBot = riskScore > this.config.riskThreshold;
      const challengeRequired = this.config.challengeOnSuspicious && riskScore > 0.5;

      const result: BotProtectionResult = {
        isBot,
        riskScore: Math.min(riskScore, 1),
        confidence,
        challengeRequired,
        reason: isBot ? `High risk score: ${riskScore.toFixed(2)}` : undefined,
        metadata: {
          riskFactors,
          platform: Platform.OS,
          context,
        },
      };

      // Log suspicious activity
      if (this.config.logBotAttempts && (isBot || riskScore > 0.6)) {
        await auditLogService.logSuspiciousActivity(
          'bot_detection',
          {
            riskScore,
            riskFactors,
            context,
            platform: Platform.OS,
          },
          userId,
          riskScore
        );
      }

      return result;
    } catch (error) {
      console.error('Error in bot verification:', error);
      
      // Fail open - allow the request but log the error
      return {
        isBot: false,
        riskScore: 0,
        confidence: 0,
        challengeRequired: false,
        reason: 'Verification failed',
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' },
      };
    }
  }

  /**
   * Challenge a potentially suspicious user
   */
  public async presentChallenge(type: 'captcha' | 'device_verification'): Promise<boolean> {
    try {
      if (type === 'captcha') {
        return await this.presentCaptchaChallenge();
      } else if (type === 'device_verification') {
        return await this.presentDeviceVerificationChallenge();
      }
      
      return false;
    } catch (error) {
      console.error('Error presenting challenge:', error);
      return false;
    }
  }

  /**
   * Get device trust score
   */
  public async getDeviceTrustScore(): Promise<number> {
    try {
      const deviceRisk = await this.assessDeviceRisk();
      return 1 - deviceRisk.score; // Convert risk to trust
    } catch (error) {
      console.error('Error getting device trust score:', error);
      return 0.5; // Neutral trust
    }
  }

  // Private methods

  private async initializeDeviceCheck(): Promise<void> {
    try {
      // iOS DeviceCheck integration
      // Note: This requires native iOS implementation
      console.log('DeviceCheck: Would initialize iOS DeviceCheck API');
      
      // In a real implementation, you would:
      // 1. Generate device token using DeviceCheck framework
      // 2. Send token to your backend for verification
      // 3. Store attestation result
      
      this.deviceAttestation = {
        platform: 'ios',
        deviceId: await this.getDeviceId(),
        timestamp: Date.now(),
        isValid: true,
        riskFactors: [],
      };
    } catch (error) {
      console.error('DeviceCheck initialization failed:', error);
    }
  }

  private async initializeSafetyNet(): Promise<void> {
    try {
      // Android SafetyNet/Play Integrity integration
      // Note: This requires native Android implementation
      console.log('SafetyNet: Would initialize Android Play Integrity API');
      
      // In a real implementation, you would:
      // 1. Generate integrity token using Play Integrity API
      // 2. Send token to your backend for verification
      // 3. Store attestation result
      
      this.deviceAttestation = {
        platform: 'android',
        deviceId: await this.getDeviceId(),
        timestamp: Date.now(),
        isValid: true,
        riskFactors: [],
      };
    } catch (error) {
      console.error('SafetyNet initialization failed:', error);
    }
  }

  private async assessDeviceRisk(): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    try {
      // Check if device is rooted/jailbroken
      const isRooted = await this.checkDeviceIntegrity();
      if (isRooted) {
        factors.push('rooted_device');
        score += 0.4;
      }

      // Check device characteristics
      if (!Device.isDevice) {
        factors.push('simulator');
        score += 0.8;
      }

      // Check for suspicious device properties
      if (Device.brand === null || Device.modelName === null) {
        factors.push('unknown_device');
        score += 0.3;
      }

      // Check device age (very old or very new devices can be suspicious)
      const deviceAge = await this.estimateDeviceAge();
      if (deviceAge < 30 || deviceAge > 2000) { // Less than 30 days or more than 5+ years
        factors.push('unusual_device_age');
        score += 0.2;
      }

    } catch (error) {
      console.error('Error assessing device risk:', error);
      factors.push('assessment_error');
      score += 0.1;
    }

    return { score: Math.min(score, 1), factors };
  }

  private async assessBehavioralRisk(context: string, userId?: string): Promise<{ score: number; factors: string[] }> {
    const factors: string[] = [];
    let score = 0;

    try {
      // Check request frequency
      const requestFrequency = await this.getRequestFrequency(context, userId);
      if (requestFrequency > 10) { // More than 10 requests per minute
        factors.push('high_frequency');
        score += 0.5;
      }

      // Check for rapid successive attempts
      const lastAttempt = await this.getLastAttemptTime(context, userId);
      if (lastAttempt && Date.now() - lastAttempt < 1000) { // Less than 1 second
        factors.push('rapid_attempts');
        score += 0.6;
      }

      // Check for unusual patterns
      const patternRisk = await this.checkUnusualPatterns(context, userId);
      if (patternRisk > 0.5) {
        factors.push('unusual_patterns');
        score += patternRisk * 0.4;
      }

    } catch (error) {
      console.error('Error assessing behavioral risk:', error);
      factors.push('behavioral_assessment_error');
      score += 0.1;
    }

    return { score: Math.min(score, 1), factors };
  }

  private async assessPlatformAttestation(): Promise<{ score: number; factors: string[]; confidence: number }> {
    const factors: string[] = [];
    let score = 0;
    let confidence = 0.5;

    try {
      if (!this.deviceAttestation) {
        factors.push('no_attestation');
        score += 0.3;
        return { score, factors, confidence };
      }

      // Check attestation age
      const age = Date.now() - this.deviceAttestation.timestamp;
      if (age > 24 * 60 * 60 * 1000) { // Older than 24 hours
        factors.push('stale_attestation');
        score += 0.2;
      }

      // Check attestation validity
      if (!this.deviceAttestation.isValid) {
        factors.push('invalid_attestation');
        score += 0.7;
      }

      // Add platform-specific risk factors
      factors.push(...this.deviceAttestation.riskFactors);
      score += this.deviceAttestation.riskFactors.length * 0.1;

      confidence = this.deviceAttestation.isValid ? 0.8 : 0.3;

    } catch (error) {
      console.error('Error assessing platform attestation:', error);
      factors.push('attestation_error');
      score += 0.2;
    }

    return { score: Math.min(score, 1), factors, confidence };
  }

  private async checkDeviceIntegrity(): Promise<boolean> {
    try {
      // Basic checks for rooted/jailbroken devices
      // Note: This is a simplified implementation
      // In production, you'd use more sophisticated detection
      
      if (Platform.OS === 'ios') {
        // Check for common jailbreak indicators
        // This would require native implementation
        return false;
      } else if (Platform.OS === 'android') {
        // Check for common root indicators
        // This would require native implementation
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking device integrity:', error);
      return false;
    }
  }

  private async estimateDeviceAge(): Promise<number> {
    try {
      // Estimate device age based on OS version and model
      // This is a simplified implementation
      const osVersion = Device.osVersion;
      if (osVersion) {
        // Very rough estimation - in production you'd have a proper database
        const majorVersion = parseInt(osVersion.split('.')[0]);
        if (Platform.OS === 'ios') {
          return Math.max(0, (17 - majorVersion) * 365); // iOS 17 is recent
        } else if (Platform.OS === 'android') {
          return Math.max(0, (14 - majorVersion) * 365); // Android 14 is recent
        }
      }
      return 365; // Default to 1 year
    } catch (error) {
      console.error('Error estimating device age:', error);
      return 365;
    }
  }

  private async getDeviceId(): Promise<string> {
    try {
      const stored = await SecureStore.getItemAsync('bot_protection_device_id');
      if (stored) return stored;
      
      const deviceId = `${Platform.OS}_${Device.brand}_${Device.modelName}_${Date.now()}`;
      await SecureStore.setItemAsync('bot_protection_device_id', deviceId);
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return `fallback_${Date.now()}`;
    }
  }

  private async getRequestFrequency(context: string, userId?: string): Promise<number> {
    try {
      const key = `request_freq_${context}_${userId || 'anonymous'}`;
      const stored = await SecureStore.getItemAsync(key);
      
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        // Count requests in the last minute
        const recentRequests = data.requests.filter((timestamp: number) => now - timestamp < 60000);
        
        // Update stored data
        recentRequests.push(now);
        await SecureStore.setItemAsync(key, JSON.stringify({ requests: recentRequests }));
        
        return recentRequests.length;
      } else {
        // First request
        await SecureStore.setItemAsync(key, JSON.stringify({ requests: [Date.now()] }));
        return 1;
      }
    } catch (error) {
      console.error('Error getting request frequency:', error);
      return 0;
    }
  }

  private async getLastAttemptTime(context: string, userId?: string): Promise<number | null> {
    try {
      const key = `last_attempt_${context}_${userId || 'anonymous'}`;
      const stored = await SecureStore.getItemAsync(key);
      
      const now = Date.now();
      await SecureStore.setItemAsync(key, now.toString());
      
      return stored ? parseInt(stored) : null;
    } catch (error) {
      console.error('Error getting last attempt time:', error);
      return null;
    }
  }

  private async checkUnusualPatterns(context: string, userId?: string): Promise<number> {
    try {
      // Check for unusual patterns in behavior
      // This is a simplified implementation
      
      const frequency = await this.getRequestFrequency(context, userId);
      if (frequency > 20) return 0.8; // Very high frequency
      if (frequency > 10) return 0.5; // High frequency
      if (frequency > 5) return 0.2;  // Moderate frequency
      
      return 0;
    } catch (error) {
      console.error('Error checking unusual patterns:', error);
      return 0;
    }
  }

  private async presentCaptchaChallenge(): Promise<boolean> {
    try {
      // In a real implementation, this would present a CAPTCHA
      console.log('Would present CAPTCHA challenge');
      
      // For now, simulate user solving CAPTCHA
      return Math.random() > 0.3; // 70% success rate
    } catch (error) {
      console.error('Error presenting CAPTCHA challenge:', error);
      return false;
    }
  }

  private async presentDeviceVerificationChallenge(): Promise<boolean> {
    try {
      // In a real implementation, this would trigger device verification
      console.log('Would present device verification challenge');
      
      // For now, simulate device verification
      return Math.random() > 0.2; // 80% success rate
    } catch (error) {
      console.error('Error presenting device verification challenge:', error);
      return false;
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<BotProtectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): BotProtectionConfig {
    return { ...this.config };
  }

  /**
   * Clear stored data (for testing)
   */
  public async clearStoredData(): Promise<void> {
    try {
      // Clear device attestation
      this.deviceAttestation = null;
      
      // In a production app, you'd clear all stored keys
      console.log('Bot protection data cleared');
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }
}

// Export singleton instance
export const botProtectionService = BotProtectionService.getInstance();