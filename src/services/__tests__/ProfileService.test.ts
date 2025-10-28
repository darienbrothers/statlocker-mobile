/**
 * ProfileService Tests
 * 
 * Tests for Firestore profile creation, storage, and error handling
 */

import { ProfileService } from '../ProfileService'
import { OnboardingProfile } from '../../types/onboarding'
import { FirestoreUserProfile } from '../../types/firestore'

// Mock Firebase Firestore
jest.mock('../../lib/firebase', () => ({
  getFirebaseFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn()
  }))
}))

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  writeBatch: jest.fn(),
  serverTimestamp: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: jest.fn((date: Date) => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }))
  }
}))

describe('ProfileService', () => {
  let profileService: ProfileService
  let mockProfile: OnboardingProfile

  beforeEach(() => {
    profileService = new ProfileService()
    
    mockProfile = {
      role: 'athlete',
      sport: 'lacrosse',
      gender: 'male',
      dateOfBirth: new Date('2006-05-15'),
      graduationYear: 2025,
      position: 'midfielder',
      academicLevel: 'varsity',
      teamType: 'high_school',
      school: {
        name: 'Test High School',
        city: 'Test City',
        state: 'CA',
        type: 'public'
      },
      selectedGoals: ['improve-shooting', 'increase-speed', 'better-defense'],
      dna: {
        motivation: 'intrinsic',
        confidence: 'high',
        focusMode: 'intense',
        competitiveness: 'high',
        coachability: 'high',
        resilience: 'high',
        completedAt: new Date()
      },
      aiTone: 'hype',
      ageVerified: true,
      tosAccepted: true,
      privacyAccepted: true,
      benchmarkingConsent: true,
      onboardingStarted: new Date(),
      onboardingCompleted: new Date()
    }

    // Clear all mocks
    jest.clearAllMocks()
  })

  describe('createProfile', () => {
    it('should create a valid Firestore profile from onboarding data', async () => {
      const { setDoc } = require('firebase/firestore')
      setDoc.mockResolvedValue(undefined)

      const userId = 'test-user-id'
      const email = 'test@example.com'

      const result = await profileService.createProfile(mockProfile, userId, email)

      expect(setDoc).toHaveBeenCalledTimes(1)
      expect(result).toBeDefined()
      expect(result.id).toBe(userId)
      expect(result.email).toBe(email)
      expect(result.role).toBe('athlete')
      expect(result.sport).toBe('lacrosse')
    })

    it('should validate required fields before creation', async () => {
      const incompleteProfile = { ...mockProfile }
      delete incompleteProfile.role

      const userId = 'test-user-id'
      const email = 'test@example.com'

      await expect(
        profileService.createProfile(incompleteProfile, userId, email)
      ).rejects.toThrow('Profile validation failed')
    })

    it('should validate email format', async () => {
      const userId = 'test-user-id'
      const invalidEmail = 'invalid-email'

      await expect(
        profileService.createProfile(mockProfile, userId, invalidEmail)
      ).rejects.toThrow('Invalid email format')
    })

    it('should validate graduation year range', async () => {
      const invalidProfile = { ...mockProfile, graduationYear: 2020 }
      const userId = 'test-user-id'
      const email = 'test@example.com'

      await expect(
        profileService.createProfile(invalidProfile, userId, email)
      ).rejects.toThrow('Invalid graduation year')
    })

    it('should validate exactly 3 goals', async () => {
      const invalidProfile = { ...mockProfile, selectedGoals: ['goal1', 'goal2'] }
      const userId = 'test-user-id'
      const email = 'test@example.com'

      await expect(
        profileService.createProfile(invalidProfile, userId, email)
      ).rejects.toThrow('Must have exactly 3 goals selected')
    })

    it('should retry on retryable errors', async () => {
      const { setDoc } = require('firebase/firestore')
      
      // First call fails with retryable error, second succeeds
      setDoc
        .mockRejectedValueOnce({ code: 'unavailable', message: 'Service unavailable' })
        .mockResolvedValueOnce(undefined)

      const userId = 'test-user-id'
      const email = 'test@example.com'

      const result = await profileService.createProfile(mockProfile, userId, email)

      expect(setDoc).toHaveBeenCalledTimes(2)
      expect(result).toBeDefined()
    })

    it('should not retry on non-retryable errors', async () => {
      const { setDoc } = require('firebase/firestore')
      
      setDoc.mockRejectedValue({ code: 'permission-denied', message: 'Permission denied' })

      const userId = 'test-user-id'
      const email = 'test@example.com'

      await expect(
        profileService.createProfile(mockProfile, userId, email)
      ).rejects.toThrow()

      expect(setDoc).toHaveBeenCalledTimes(1)
    })
  })

  describe('getProfile', () => {
    it('should retrieve existing profile', async () => {
      const { getDoc } = require('firebase/firestore')
      const mockFirestoreProfile: FirestoreUserProfile = {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'athlete',
        sport: 'lacrosse',
        gender: 'male',
        dateOfBirth: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        graduationYear: 2025,
        position: 'midfielder',
        academicLevel: 'varsity',
        teamType: 'high_school',
        school: {
          name: 'Test High School',
          city: 'Test City',
          state: 'CA',
          type: 'public'
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
          responses: {}
        },
        aiTone: 'hype',
        ageVerified: true,
        tosAcceptedVersion: '1.0',
        privacyAcceptedVersion: '1.0',
        benchmarkingConsent: true,
        trialStatus: 'active',
        onboardingProgress: {
          stepNumber: 10,
          completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          startedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          completedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
          resumeCount: 0,
          version: '1.0'
        },
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        lastActiveAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
        profileVersion: '1.0',
        dataRetentionConsent: true
      }

      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockFirestoreProfile
      })

      const result = await profileService.getProfile('test-user-id')

      expect(getDoc).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockFirestoreProfile)
    })

    it('should return null for non-existent profile', async () => {
      const { getDoc } = require('firebase/firestore')
      
      getDoc.mockResolvedValue({
        exists: () => false
      })

      const result = await profileService.getProfile('non-existent-user')

      expect(result).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('should update profile with timestamp', async () => {
      const { updateDoc } = require('firebase/firestore')
      updateDoc.mockResolvedValue(undefined)

      const updates = { sport: 'basketball', position: 'guard' }
      
      await profileService.updateProfile('test-user-id', updates)

      expect(updateDoc).toHaveBeenCalledTimes(1)
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ...updates,
          updatedAt: expect.anything(),
          lastActiveAt: expect.anything()
        })
      )
    })
  })

  describe('createTrialInfo', () => {
    it('should create trial info with correct duration', async () => {
      const { setDoc } = require('firebase/firestore')
      setDoc.mockResolvedValue(undefined)

      const userId = 'test-user-id'
      const trialDurationDays = 7

      const result = await profileService.createTrialInfo(userId, trialDurationDays)

      expect(setDoc).toHaveBeenCalledTimes(1)
      expect(result.userId).toBe(userId)
      expect(result.status).toBe('active')
      expect(result.gamesLogged).toBe(0)
      expect(result.aiInsightsGenerated).toBe(0)
      expect(result.goalsCreated).toBe(0)
    })
  })

  describe('createProfileWithTrial', () => {
    it('should create both profile and trial in batch', async () => {
      const { writeBatch } = require('firebase/firestore')
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      }
      writeBatch.mockReturnValue(mockBatch)

      const userId = 'test-user-id'
      const email = 'test@example.com'

      const result = await profileService.createProfileWithTrial(
        mockProfile,
        userId,
        email,
        7
      )

      expect(writeBatch).toHaveBeenCalledTimes(1)
      expect(mockBatch.set).toHaveBeenCalledTimes(2) // Profile and trial
      expect(mockBatch.update).toHaveBeenCalledTimes(1) // Profile update with trial info
      expect(mockBatch.commit).toHaveBeenCalledTimes(1)
      expect(result.profile).toBeDefined()
      expect(result.trial).toBeDefined()
    })
  })

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({
        empty: false
      })

      const result = await profileService.emailExists('existing@example.com')

      expect(result).toBe(true)
    })

    it('should return false for non-existing email', async () => {
      const { getDocs } = require('firebase/firestore')
      
      getDocs.mockResolvedValue({
        empty: true
      })

      const result = await profileService.emailExists('new@example.com')

      expect(result).toBe(false)
    })
  })
})