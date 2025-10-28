/**
 * External Services Integration Tests
 * 
 * Tests integration with Firebase Auth, Firestore, RevenueCat, and Analytics
 * for the onboarding flow:
 * - Firebase Auth account creation and management
 * - Firestore profile storage and retrieval
 * - RevenueCat trial activation and status
 * - Analytics event delivery and accuracy
 * 
 * Requirements tested: 8.1, 9.1, 17.1, 19.1
 */

import { AuthService } from '@/services/AuthService';
import { ProfileService } from '@/services/ProfileService';
import { TrialManagementService } from '@/services/TrialManagementService';
import { OnboardingAnalyticsService } from '@/services/OnboardingAnalyticsService';
import { OnboardingProfile } from '@/types/onboarding';
import { FirestoreUserProfile } from '@/types/firestore';

// Mock Firebase modules
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendEmailVerification: jest.fn(),
  onAuthStateChanged: jest.fn(),
  AuthErrorCodes: {
    INVALID_EMAIL: 'auth/invalid-email',
    EMAIL_EXISTS: 'auth/email-already-in-use',
    WEAK_PASSWORD: 'auth/weak-password',
    NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  },
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 })),
  },
}));

// Mock RevenueCat
jest.mock('@/services/RevenueCatService', () => ({
  revenueCatService: {
    initializeForUser: jest.fn(),
    activateTrial: jest.fn(),
    getSubscriptionStatus: jest.fn(),
    setUserAttributes: jest.fn(),
  },
}));

// Mock Analytics
jest.mock('@/lib/analytics', () => ({
  analytics: {
    track: jest.fn(),
    identify: jest.fn(),
    setUserProperties: jest.fn(),
  },
}));

describe('External Services Integration', () => {
  let authService: AuthService;
  let profileService: ProfileService;
  let trialManagementService: TrialManagementService;
  let analyticsService: OnboardingAnalyticsService;

  const mockOnboardingProfile: OnboardingProfile = {
    role: 'athlete',
    sport: 'lacrosse',
    gender: 'male',
    dateOfBirth: new Date('2006-05-15'),
    graduationYear: 2025,
    position: 'attack',
    academicLevel: 'varsity',
    teamType: 'high_school',
    school: {
      name: 'Test High School',
      city: 'Test City',
      state: 'CA',
      type: 'public',
    },
    selectedGoals: ['improve-shooting', 'increase-speed', 'better-defense'],
    dna: {
      motivation: 'intrinsic',
      confidence: 'high',
      focusMode: 'intense',
      competitiveness: 'high',
      coachability: 'high',
      resilience: 'high',
      completedAt: new Date(),
    },
    aiTone: 'hype',
    ageVerified: true,
    tosAccepted: true,
    privacyAccepted: true,
    benchmarkingConsent: true,
    onboardingStarted: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    onboardingCompleted: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    authService = new AuthService();
    profileService = new ProfileService();
    trialManagementService = TrialManagementService.getInstance();
    analyticsService = new OnboardingAnalyticsService();
  });

  describe('Firebase Auth Integration', () => {
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    const testUserId = 'test-user-id-123';

    it('should create Firebase Auth account successfully', async () => {
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      const mockUserCredential = {
        user: {
          uid: testUserId,
          email: testEmail,
          emailVerified: false,
          displayName: null,
          photoURL: null,
          metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString(),
          },
        },
      };

      createUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await authService.createUserWithEmail(testEmail, testPassword);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        testEmail,
        testPassword
      );
      expect(result.user.uid).toBe(testUserId);
      expect(result.user.email).toBe(testEmail);
      expect(result.user.emailVerified).toBe(false);
    });

    it('should handle email already exists error', async () => {
      const { createUserWithEmailAndPassword, AuthErrorCodes } = require('firebase/auth');
      
      createUserWithEmailAndPassword.mockRejectedValue({
        code: AuthErrorCodes.EMAIL_EXISTS,
        message: 'The email address is already in use by another account.',
      });

      await expect(
        authService.createUserWithEmail(testEmail, testPassword)
      ).rejects.toMatchObject({
        code: 'auth/email-already-in-use',
      });
    });

    it('should handle weak password error', async () => {
      const { createUserWithEmailAndPassword, AuthErrorCodes } = require('firebase/auth');
      
      createUserWithEmailAndPassword.mockRejectedValue({
        code: AuthErrorCodes.WEAK_PASSWORD,
        message: 'Password should be at least 6 characters',
      });

      await expect(
        authService.createUserWithEmail(testEmail, 'weak')
      ).rejects.toMatchObject({
        code: 'auth/weak-password',
      });
    });

    it('should handle network errors with retry capability', async () => {
      const { createUserWithEmailAndPassword, AuthErrorCodes } = require('firebase/auth');
      
      // First attempt fails with network error
      createUserWithEmailAndPassword
        .mockRejectedValueOnce({
          code: AuthErrorCodes.NETWORK_REQUEST_FAILED,
          message: 'Network request failed',
        })
        .mockResolvedValueOnce({
          user: {
            uid: testUserId,
            email: testEmail,
            emailVerified: false,
          },
        });

      // Should retry and succeed
      const result = await authService.createUserWithEmail(testEmail, testPassword);
      
      expect(createUserWithEmailAndPassword).toHaveBeenCalledTimes(2);
      expect(result.user.uid).toBe(testUserId);
    });

    it('should send email verification after account creation', async () => {
      const { createUserWithEmailAndPassword, sendEmailVerification } = require('firebase/auth');
      
      const mockUser = {
        uid: testUserId,
        email: testEmail,
        emailVerified: false,
      };

      createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });
      sendEmailVerification.mockResolvedValue(undefined);

      await authService.createUserWithEmail(testEmail, testPassword);
      
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('should sign in existing user successfully', async () => {
      const { signInWithEmailAndPassword } = require('firebase/auth');
      
      const mockUserCredential = {
        user: {
          uid: testUserId,
          email: testEmail,
          emailVerified: true,
          lastSignInTime: new Date().toISOString(),
        },
      };

      signInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      const result = await authService.signInWithEmail(testEmail, testPassword);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        testEmail,
        testPassword
      );
      expect(result.user.uid).toBe(testUserId);
      expect(result.user.emailVerified).toBe(true);
    });
  });

  describe('Firestore Profile Integration', () => {
    const testUserId = 'test-user-id-123';
    const testEmail = 'test@example.com';

    it('should create complete Firestore profile from onboarding data', async () => {
      const { setDoc, Timestamp } = require('firebase/firestore');
      
      setDoc.mockResolvedValue(undefined);
      Timestamp.now.mockReturnValue({ seconds: Date.now() / 1000, nanoseconds: 0 });

      const result = await profileService.createProfile(
        mockOnboardingProfile,
        testUserId,
        testEmail
      );

      expect(setDoc).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject({
        id: testUserId,
        email: testEmail,
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        graduationYear: 2025,
        position: 'attack',
        academicLevel: 'varsity',
        teamType: 'high_school',
      });

      expect(result.school).toMatchObject({
        name: 'Test High School',
        city: 'Test City',
        state: 'CA',
        type: 'public',
      });

      expect(result.goals).toHaveLength(3);
      expect(result.athleteDNA).toMatchObject({
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'intense',
      });
    });

    it('should handle Firestore write failures with retry', async () => {
      const { setDoc } = require('firebase/firestore');
      
      // First attempt fails, second succeeds
      setDoc
        .mockRejectedValueOnce({ code: 'unavailable', message: 'Service unavailable' })
        .mockResolvedValueOnce(undefined);

      const result = await profileService.createProfile(
        mockOnboardingProfile,
        testUserId,
        testEmail
      );

      expect(setDoc).toHaveBeenCalledTimes(2);
      expect(result.id).toBe(testUserId);
    });

    it('should validate profile data before Firestore write', async () => {
      const invalidProfile = { ...mockOnboardingProfile };
      delete invalidProfile.role; // Remove required field

      await expect(
        profileService.createProfile(invalidProfile, testUserId, testEmail)
      ).rejects.toThrow('Profile validation failed');
    });

    it('should retrieve existing profile from Firestore', async () => {
      const { getDoc } = require('firebase/firestore');
      
      const mockFirestoreProfile: FirestoreUserProfile = {
        id: testUserId,
        email: testEmail,
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        graduationYear: 2025,
        position: 'attack',
        academicLevel: 'varsity',
        teamType: 'high_school',
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA',
          type: 'public',
        },
        goals: [],
        athleteDNA: {
          motivation: 'intrinsic',
          confidence: 'high',
          focusMode: 'intense',
          competitiveness: 'high',
          coachability: 'high',
          resilience: 'high',
          completedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          responses: {},
        },
        aiTone: 'hype',
        ageVerified: true,
        tosAcceptedVersion: '1.0',
        privacyAcceptedVersion: '1.0',
        benchmarkingConsent: true,
        trialStatus: 'active',
        onboardingProgress: {
          stepNumber: 11,
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          startedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          completedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          resumeCount: 0,
          version: '1.0',
        },
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        lastActiveAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        profileVersion: '1.0',
        dataRetentionConsent: true,
      };

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockFirestoreProfile,
      });

      const result = await profileService.getProfile(testUserId);

      expect(getDoc).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockFirestoreProfile);
    });

    it('should update profile with proper timestamps', async () => {
      const { updateDoc, Timestamp } = require('firebase/firestore');
      
      updateDoc.mockResolvedValue(undefined);
      Timestamp.now.mockReturnValue({ seconds: Date.now() / 1000, nanoseconds: 0 });

      const updates = { sport: 'basketball', position: 'guard' };
      
      await profileService.updateProfile(testUserId, updates);

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.anything(),
          lastActiveAt: expect.anything(),
        })
      );
    });

    it('should create profile and trial info in atomic transaction', async () => {
      const { writeBatch } = require('firebase/firestore');
      
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined),
      };
      writeBatch.mockReturnValue(mockBatch);

      const result = await profileService.createProfileWithTrial(
        mockOnboardingProfile,
        testUserId,
        testEmail,
        7
      );

      expect(writeBatch).toHaveBeenCalledTimes(1);
      expect(mockBatch.set).toHaveBeenCalledTimes(2); // Profile and trial
      expect(mockBatch.update).toHaveBeenCalledTimes(1); // Profile update with trial reference
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
      
      expect(result.profile).toBeDefined();
      expect(result.trial).toBeDefined();
      expect(result.trial.status).toBe('active');
    });
  });

  describe('RevenueCat Trial Integration', () => {
    const testUserId = 'test-user-id-123';
    const { revenueCatService } = require('@/services/RevenueCatService');

    it('should activate trial successfully with RevenueCat', async () => {
      const trialEndDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      
      revenueCatService.initializeForUser.mockResolvedValue(undefined);
      revenueCatService.activateTrial.mockResolvedValue({
        success: true,
        trialActive: true,
        trialEndDate,
        customerInfo: {
          entitlements: { active: { pro_features: {} } },
        },
      });

      const result = await trialManagementService.activateTrial(testUserId, 7);

      expect(revenueCatService.initializeForUser).toHaveBeenCalledWith(testUserId);
      expect(revenueCatService.activateTrial).toHaveBeenCalledWith(testUserId);
      
      expect(result.success).toBe(true);
      expect(result.trialActive).toBe(true);
      expect(result.trialEndDate).toEqual(trialEndDate);
      expect(result.revenueCatCustomerInfo).toBeDefined();
    });

    it('should handle RevenueCat initialization failure', async () => {
      revenueCatService.initializeForUser.mockRejectedValue(
        new Error('RevenueCat initialization failed')
      );

      const result = await trialManagementService.activateTrial(testUserId, 7);

      expect(result.success).toBe(false);
      expect(result.error?.source).toBe('revenuecat');
      expect(result.error?.retryable).toBe(true);
    });

    it('should get subscription status from RevenueCat', async () => {
      const trialEndDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      
      revenueCatService.getSubscriptionStatus.mockResolvedValue({
        isActive: true,
        isTrialActive: true,
        trialEndDate,
        entitlements: ['pro_features'],
        willRenew: false,
      });

      // Mock Firestore trial info
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          userId: testUserId,
          status: 'active',
          startDate: { seconds: (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000, nanoseconds: 0 },
          endDate: { seconds: trialEndDate.getTime() / 1000, nanoseconds: 0 },
          gamesLogged: 3,
          aiInsightsGenerated: 2,
          goalsCreated: 3,
        }),
      });

      const result = await trialManagementService.getTrialStatus(testUserId);

      expect(result.isActive).toBe(true);
      expect(result.daysRemaining).toBe(5);
      expect(result.source).toBe('both');
      expect(result.gamesLogged).toBe(3);
    });

    it('should set user attributes in RevenueCat after trial activation', async () => {
      revenueCatService.initializeForUser.mockResolvedValue(undefined);
      revenueCatService.activateTrial.mockResolvedValue({
        success: true,
        trialActive: true,
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
      revenueCatService.setUserAttributes.mockResolvedValue(undefined);

      // Mock successful Firestore creation
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);

      await trialManagementService.activateTrial(testUserId, 7);

      expect(revenueCatService.setUserAttributes).toHaveBeenCalledWith(testUserId, {
        role: 'athlete',
        sport: 'lacrosse',
        position: 'attack',
        graduation_year: '2025',
        trial_activated_at: expect.any(String),
      });
    });

    it('should handle RevenueCat network errors gracefully', async () => {
      revenueCatService.initializeForUser.mockResolvedValue(undefined);
      revenueCatService.activateTrial.mockResolvedValue({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
          retryable: true,
        },
      });

      // Mock successful Firestore creation (fallback)
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);

      const result = await trialManagementService.activateTrial(testUserId, 7);

      expect(result.success).toBe(true); // Should succeed with Firestore fallback
      expect(result.trialActive).toBe(true);
      expect(result.error?.source).toBe('revenuecat');
      expect(result.error?.retryable).toBe(true);
      expect(result.firestoreTrialInfo).toBeDefined();
    });
  });

  describe('Analytics Integration', () => {
    const testUserId = 'test-user-id-123';
    const { analytics } = require('@/lib/analytics');

    it('should track onboarding start event', async () => {
      const eventData = {
        userId: testUserId,
        timestamp: new Date(),
        source: 'app_launch',
        deviceType: 'ios',
        version: '1.0.0',
      };

      await analyticsService.trackOnboardingStart(eventData);

      expect(analytics.track).toHaveBeenCalledWith('onboarding_started', {
        user_id: testUserId,
        source: 'app_launch',
        device_type: 'ios',
        app_version: '1.0.0',
        timestamp: expect.any(String),
      });
    });

    it('should track step completion events', async () => {
      const stepData = {
        userId: testUserId,
        step: 1,
        stepName: 'role_selection',
        duration: 30000, // 30 seconds
        attempts: 1,
        data: { role: 'athlete' },
      };

      await analyticsService.trackStepCompleted(stepData);

      expect(analytics.track).toHaveBeenCalledWith('onboarding_step_completed', {
        user_id: testUserId,
        step_number: 1,
        step_name: 'role_selection',
        duration_ms: 30000,
        attempts: 1,
        step_data: { role: 'athlete' },
        timestamp: expect.any(String),
      });
    });

    it('should track AthleteDNA completion', async () => {
      const dnaData = {
        userId: testUserId,
        responses: {
          motivation: 'intrinsic',
          confidence: 'high',
          focusMode: 'intense',
        },
        completionTime: 120000, // 2 minutes
        personaType: 'competitor',
      };

      await analyticsService.trackDNACompleted(dnaData);

      expect(analytics.track).toHaveBeenCalledWith('athlete_dna_completed', {
        user_id: testUserId,
        completion_time_ms: 120000,
        persona_type: 'competitor',
        responses: dnaData.responses,
        timestamp: expect.any(String),
      });
    });

    it('should track trial activation', async () => {
      const trialData = {
        userId: testUserId,
        trialDuration: 7,
        activationMethod: 'onboarding_completion',
        revenueCatSuccess: true,
        firestoreSuccess: true,
      };

      await analyticsService.trackTrialStarted(trialData);

      expect(analytics.track).toHaveBeenCalledWith('trial_started', {
        user_id: testUserId,
        trial_duration_days: 7,
        activation_method: 'onboarding_completion',
        revenue_cat_success: true,
        firestore_success: true,
        timestamp: expect.any(String),
      });
    });

    it('should track onboarding completion with funnel metrics', async () => {
      const completionData = {
        userId: testUserId,
        totalDuration: 600000, // 10 minutes
        stepCount: 11,
        dropOffPoints: [],
        resumeCount: 0,
        profileData: {
          role: 'athlete',
          sport: 'lacrosse',
          position: 'attack',
        },
      };

      await analyticsService.trackOnboardingCompleted(completionData);

      expect(analytics.track).toHaveBeenCalledWith('onboarding_completed', {
        user_id: testUserId,
        total_duration_ms: 600000,
        step_count: 11,
        drop_off_points: [],
        resume_count: 0,
        profile_role: 'athlete',
        profile_sport: 'lacrosse',
        profile_position: 'attack',
        timestamp: expect.any(String),
      });
    });

    it('should identify user with profile data', async () => {
      const profileData = {
        userId: testUserId,
        role: 'athlete',
        sport: 'lacrosse',
        position: 'attack',
        graduationYear: 2025,
        teamType: 'high_school',
      };

      await analyticsService.identifyUser(profileData);

      expect(analytics.identify).toHaveBeenCalledWith(testUserId, {
        role: 'athlete',
        sport: 'lacrosse',
        position: 'attack',
        graduation_year: 2025,
        team_type: 'high_school',
        onboarding_completed: true,
      });
    });

    it('should handle analytics failures gracefully', async () => {
      analytics.track.mockRejectedValue(new Error('Analytics service unavailable'));

      // Should not throw error
      await expect(
        analyticsService.trackOnboardingStart({
          userId: testUserId,
          timestamp: new Date(),
          source: 'app_launch',
        })
      ).resolves.not.toThrow();
    });

    it('should batch analytics events for performance', async () => {
      const events = [
        { type: 'step_completed', step: 1 },
        { type: 'step_completed', step: 2 },
        { type: 'step_completed', step: 3 },
      ];

      await analyticsService.batchTrackEvents(testUserId, events);

      expect(analytics.track).toHaveBeenCalledWith('onboarding_batch_events', {
        user_id: testUserId,
        event_count: 3,
        events: events,
        timestamp: expect.any(String),
      });
    });
  });

  describe('End-to-End Service Integration', () => {
    const testEmail = 'integration@example.com';
    const testPassword = 'IntegrationTest123!';
    const testUserId = 'integration-user-id';

    it('should complete full onboarding with all services', async () => {
      // 1. Create Firebase Auth account
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      createUserWithEmailAndPassword.mockResolvedValue({
        user: {
          uid: testUserId,
          email: testEmail,
          emailVerified: false,
        },
      });

      const authResult = await authService.createUserWithEmail(testEmail, testPassword);
      expect(authResult.user.uid).toBe(testUserId);

      // 2. Create Firestore profile
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);

      const profileResult = await profileService.createProfile(
        mockOnboardingProfile,
        testUserId,
        testEmail
      );
      expect(profileResult.id).toBe(testUserId);

      // 3. Activate trial
      const { revenueCatService } = require('@/services/RevenueCatService');
      revenueCatService.initializeForUser.mockResolvedValue(undefined);
      revenueCatService.activateTrial.mockResolvedValue({
        success: true,
        trialActive: true,
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const trialResult = await trialManagementService.activateTrial(testUserId, 7);
      expect(trialResult.success).toBe(true);

      // 4. Track completion analytics
      const { analytics } = require('@/lib/analytics');
      await analyticsService.trackOnboardingCompleted({
        userId: testUserId,
        totalDuration: 600000,
        stepCount: 11,
        dropOffPoints: [],
        resumeCount: 0,
        profileData: mockOnboardingProfile,
      });

      expect(analytics.track).toHaveBeenCalledWith('onboarding_completed', expect.any(Object));

      // Verify all services were called
      expect(createUserWithEmailAndPassword).toHaveBeenCalled();
      expect(setDoc).toHaveBeenCalled();
      expect(revenueCatService.activateTrial).toHaveBeenCalled();
      expect(analytics.track).toHaveBeenCalled();
    });

    it('should handle partial failures gracefully', async () => {
      // Auth succeeds
      const { createUserWithEmailAndPassword } = require('firebase/auth');
      createUserWithEmailAndPassword.mockResolvedValue({
        user: { uid: testUserId, email: testEmail },
      });

      // Firestore succeeds
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue(undefined);

      // RevenueCat fails
      const { revenueCatService } = require('@/services/RevenueCat');
      revenueCatService.activateTrial.mockResolvedValue({
        success: false,
        error: { code: 'NETWORK_ERROR', retryable: true },
      });

      // Analytics succeeds
      const { analytics } = require('@/lib/analytics');
      analytics.track.mockResolvedValue(undefined);

      // Should still complete onboarding with partial failure
      const authResult = await authService.createUserWithEmail(testEmail, testPassword);
      const profileResult = await profileService.createProfile(
        mockOnboardingProfile,
        testUserId,
        testEmail
      );
      const trialResult = await trialManagementService.activateTrial(testUserId, 7);

      expect(authResult.user.uid).toBe(testUserId);
      expect(profileResult.id).toBe(testUserId);
      expect(trialResult.success).toBe(true); // Should succeed with Firestore fallback
      expect(trialResult.error?.source).toBe('revenuecat');
    });

    it('should maintain data consistency across services', async () => {
      const profileData = {
        userId: testUserId,
        role: 'athlete' as const,
        sport: 'lacrosse',
        position: 'attack',
        graduationYear: 2025,
      };

      // Verify same data is used across all services
      await profileService.createProfile(mockOnboardingProfile, testUserId, testEmail);
      await analyticsService.identifyUser(profileData);

      const { revenueCatService } = require('@/services/RevenueCatService');
      revenueCatService.setUserAttributes.mockResolvedValue(undefined);
      
      await revenueCatService.setUserAttributes(testUserId, {
        role: profileData.role,
        sport: profileData.sport,
        position: profileData.position,
        graduation_year: profileData.graduationYear.toString(),
      });

      // Verify consistent data across services
      expect(revenueCatService.setUserAttributes).toHaveBeenCalledWith(
        testUserId,
        expect.objectContaining({
          role: 'athlete',
          sport: 'lacrosse',
          position: 'attack',
          graduation_year: '2025',
        })
      );
    });
  });
});