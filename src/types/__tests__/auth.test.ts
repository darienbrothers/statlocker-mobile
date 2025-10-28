/**
 * Authentication Types Tests
 * 
 * Tests to ensure type definitions are working correctly
 */

// Mock React Native environment
global.__DEV__ = true;

import {
  AuthErrorCode,
  AuthError,
  User,
  AuthProvider,
  AuthState,
  SecurityEventType,
  SecurityEvent,
  DeviceInfo,
  UserSession,
  RateLimitConfig,
  PasswordValidationRules,
  PasswordStrength,
  EmailValidation,
} from '../auth';

describe('Authentication Types', () => {
  describe('AuthError', () => {
    it('should create a valid AuthError object', () => {
      const error: AuthError = {
        code: AuthErrorCode.INVALID_EMAIL,
        message: 'Invalid email format',
        userMessage: 'Please enter a valid email address',
        retryable: true,
        requiresAction: 'verify_email',
      };

      expect(error.code).toBe(AuthErrorCode.INVALID_EMAIL);
      expect(error.retryable).toBe(true);
      expect(error.requiresAction).toBe('verify_email');
    });
  });

  describe('User', () => {
    it('should create a valid User object', () => {
      const user: User = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        emailVerified: true,
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        providers: [
          {
            providerId: 'password',
            uid: 'test-uid-123',
            email: 'test@example.com',
          },
        ],
        createdAt: new Date(),
        lastSignIn: new Date(),
        consentVersion: '1.0',
        ageVerified: true,
        accountStatus: 'active',
      };

      expect(user.uid).toBe('test-uid-123');
      expect(user.emailVerified).toBe(true);
      expect(user.providers).toHaveLength(1);
      expect(user.providers[0].providerId).toBe('password');
    });
  });

  describe('AuthProvider', () => {
    it('should create valid AuthProvider objects', () => {
      const emailProvider: AuthProvider = {
        providerId: 'password',
        uid: 'test-uid',
        email: 'test@example.com',
      };

      const appleProvider: AuthProvider = {
        providerId: 'apple.com',
        uid: 'apple-uid',
        displayName: 'Test User',
      };

      const googleProvider: AuthProvider = {
        providerId: 'google.com',
        uid: 'google-uid',
        email: 'test@gmail.com',
        photoURL: 'https://lh3.googleusercontent.com/photo.jpg',
      };

      expect(emailProvider.providerId).toBe('password');
      expect(appleProvider.providerId).toBe('apple.com');
      expect(googleProvider.providerId).toBe('google.com');
    });
  });

  describe('AuthState', () => {
    it('should create a valid AuthState object', () => {
      const authState: AuthState = {
        user: null,
        isLoading: false,
        isAuthenticated: false,
        hasInitialized: true,
        error: null,
        sessionValid: false,
        lastActivity: new Date(),
      };

      expect(authState.isAuthenticated).toBe(false);
      expect(authState.hasInitialized).toBe(true);
      expect(authState.user).toBeNull();
    });
  });

  describe('SecurityEvent', () => {
    it('should create a valid SecurityEvent object', () => {
      const securityEvent: SecurityEvent = {
        id: 'event-123',
        type: SecurityEventType.AUTH_SUCCESS,
        userId: 'user-123',
        sessionId: 'session-123',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        success: true,
        metadata: {
          provider: 'password',
          loginMethod: 'email',
        },
        riskScore: 0.1,
        riskFactors: [],
      };

      expect(securityEvent.type).toBe(SecurityEventType.AUTH_SUCCESS);
      expect(securityEvent.success).toBe(true);
      expect(securityEvent.riskScore).toBe(0.1);
    });
  });

  describe('DeviceInfo', () => {
    it('should create a valid DeviceInfo object', () => {
      const deviceInfo: DeviceInfo = {
        deviceId: 'device-123',
        platform: 'ios',
        deviceName: 'iPhone 14 Pro',
        osVersion: '16.0',
        appVersion: '1.0.0',
        lastAccess: new Date(),
        pushToken: 'push-token-123',
        location: {
          country: 'US',
          region: 'CA',
          city: 'San Francisco',
        },
      };

      expect(deviceInfo.platform).toBe('ios');
      expect(deviceInfo.location?.country).toBe('US');
    });
  });

  describe('UserSession', () => {
    it('should create a valid UserSession object', () => {
      const session: UserSession = {
        sessionId: 'session-123',
        userId: 'user-123',
        deviceInfo: {
          deviceId: 'device-123',
          platform: 'ios',
          appVersion: '1.0.0',
          lastAccess: new Date(),
        },
        createdAt: new Date(),
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        isActive: true,
        ipAddress: '192.168.1.1',
      };

      expect(session.isActive).toBe(true);
      expect(session.deviceInfo.platform).toBe('ios');
    });
  });

  describe('RateLimitConfig', () => {
    it('should create a valid RateLimitConfig object', () => {
      const rateLimitConfig: RateLimitConfig = {
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes
        blockDurationMs: 30 * 60 * 1000, // 30 minutes
        identifier: 'ip',
      };

      expect(rateLimitConfig.maxAttempts).toBe(5);
      expect(rateLimitConfig.identifier).toBe('ip');
    });
  });

  describe('PasswordValidationRules', () => {
    it('should create valid PasswordValidationRules', () => {
      const rules: PasswordValidationRules = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        forbiddenPatterns: ['password', '123456'],
      };

      expect(rules.minLength).toBe(8);
      expect(rules.forbiddenPatterns).toContain('password');
    });
  });

  describe('PasswordStrength', () => {
    it('should create a valid PasswordStrength object', () => {
      const strength: PasswordStrength = {
        score: 3,
        feedback: ['Strong password'],
        isValid: true,
        requirements: {
          length: true,
          uppercase: true,
          lowercase: true,
          numbers: true,
          specialChars: false,
        },
      };

      expect(strength.score).toBe(3);
      expect(strength.isValid).toBe(true);
      expect(strength.requirements.length).toBe(true);
    });
  });

  describe('EmailValidation', () => {
    it('should create a valid EmailValidation object', () => {
      const validation: EmailValidation = {
        isValid: false,
        errors: ['Invalid email format'],
        suggestions: ['Did you mean test@gmail.com?'],
      };

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Invalid email format');
      expect(validation.suggestions).toContain('Did you mean test@gmail.com?');
    });
  });
});